import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { institutionalAccounts, cpdEvents, cpdAttendees, cpdCodeRevealLogs, institutionalStaffMembers } from "../../drizzle/schema";

/** Shared cadre validator for input validation, matching the cpdAttendees.cadre column. */
const cadreEnum = z.string().trim().min(1, "Please select or specify your cadre").max(128);

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  }
  return db;
}

/** Build a CSV string from attendee rows (RFC-4180 quoting). */
export function buildAttendeeCsv(
  rows: Array<{
    fullName: string;
    email: string;
    phone: string;
    cadre: string;
    cadreOther: string | null;
    higherDiploma: string | null;
    department: string;
    eventName: string;
    eventDate: string;
    submittedAt: Date | string;
  }>
): string {
  const headers = [
    "Full Name",
    "Email",
    "Phone",
    "Cadre",
    "Cadre (Other)",
    "Higher Diploma / Specialty",
    "Department",
    "Event",
    "Event Date",
    "Submitted At",
  ];
  const escape = (value: unknown): string => {
    const s = value === null || value === undefined ? "" : String(value);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.fullName,
        r.email,
        r.phone,
        r.cadre,
        r.cadreOther ?? "",
        r.higherDiploma ?? "",
        r.department,
        r.eventName,
        r.eventDate,
        typeof r.submittedAt === "string" ? r.submittedAt : r.submittedAt.toISOString(),
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

export const cpdRouter = router({
  /** Admin: set the CPD Coordinator name that prints on certificate signature lines. */
  updateCoordinator: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        coordinatorName: z.string().trim().min(1).max(255),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await db
        .update(institutionalAccounts)
        .set({ cpdCoordinatorName: input.coordinatorName, updatedAt: new Date() })
        .where(eq(institutionalAccounts.id, input.institutionId));
      return { success: true as const, coordinatorName: input.coordinatorName };
    }),

  /** Admin: read the current CPD Coordinator name + signature for this institution. */
  getSettings: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [row] = await db
        .select({
          coordinatorName: institutionalAccounts.cpdCoordinatorName,
          coordinatorSignature: institutionalAccounts.cpdCoordinatorSignature,
          institutionName: institutionalAccounts.companyName,
        })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      return {
        coordinatorName: row?.coordinatorName ?? null,
        coordinatorSignature: row?.coordinatorSignature ?? null,
        institutionName: row?.institutionName ?? null,
      };
    }),

  /**
   * Admin: save (or clear) the CPD Coordinator's drawn signature.
   * Stored as a base64 PNG data URL on institutionalAccounts.cpdCoordinatorSignature,
   * embedded above the certificate signature line. Pass null/empty to clear it.
   */
  updateSignature: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        // ~700KB cap on the base64 data URL keeps a TEXT column comfortable and
        // rejects oversized payloads. A typical signature PNG is well under 50KB.
        signature: z
          .string()
          .trim()
          .max(700_000)
          .regex(/^data:image\/png;base64,[A-Za-z0-9+/=\s]+$/, "Signature must be a PNG data URL")
          .nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const value = input.signature && input.signature.trim().length ? input.signature.trim() : null;
      await db
        .update(institutionalAccounts)
        .set({ cpdCoordinatorSignature: value, updatedAt: new Date() })
        .where(eq(institutionalAccounts.id, input.institutionId));
      return { success: true as const, hasSignature: value !== null };
    }),

  /** Admin: open a new event. Closes any currently open event for this institution first. */
  openEvent: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        name: z.string().trim().min(1).max(256),
        eventDate: z.string().trim().min(1).max(64),
        approvingCouncil: z.string().trim().max(128).nullable().optional(),
        cpdPoints: z.union([z.number(), z.string().transform((val) => val ? Number(val) : null)]).nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const now = new Date();
      // Close any open events first (only one open event per institution).
      await db
        .update(cpdEvents)
        .set({ isOpen: false, closedAt: now })
        .where(
          and(
            eq(cpdEvents.institutionalAccountId, input.institutionId),
            eq(cpdEvents.isOpen, true)
          )
        );
      const result = await db.insert(cpdEvents).values({
        institutionalAccountId: input.institutionId,
        name: input.name,
        eventDate: input.eventDate,
        isOpen: true,
        openedAt: now,
        approvingCouncil: input.approvingCouncil ?? null,
        cpdPoints: input.cpdPoints ? String(input.cpdPoints) : null,
      });
      const eventId = (result as unknown as { insertId: number }).insertId;
      return { success: true as const, eventId };
    }),

  /** Admin: close a specific event. */
  closeEvent: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [event] = await db
        .select({ id: cpdEvents.id })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.id, input.eventId),
            eq(cpdEvents.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found for this institution" });
      }
      await db
        .update(cpdEvents)
        .set({ isOpen: false, closedAt: new Date() })
        .where(eq(cpdEvents.id, input.eventId));
      return { success: true as const };
    }),

  /** Admin: list all CPD events for this institution (newest first). */
  listEvents: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const rows = await db
        .select()
        .from(cpdEvents)
        .where(eq(cpdEvents.institutionalAccountId, input.institutionId))
        .orderBy(desc(cpdEvents.id));
      return rows;
    }),

  /** Public: the currently open event for an institution (or null). Used by the registration page. */
  currentEvent: publicProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const [event] = await db
        .select({
          id: cpdEvents.id,
          name: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
          institutionalAccountId: cpdEvents.institutionalAccountId,
        })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.institutionalAccountId, input.institutionId),
            eq(cpdEvents.isOpen, true)
          )
        )
        .orderBy(desc(cpdEvents.id))
        .limit(1);
      if (!event) return { event: null };
      // Public-facing institution name for the form header.
      const [inst] = await db
        .select({ institutionName: institutionalAccounts.companyName })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      let userDepartment: string | null = null;
      if (ctx.user?.id) {
        const staffRows = await db
          .select({
            department: institutionalStaffMembers.department,
            instId: institutionalStaffMembers.institutionalAccountId,
          })
          .from(institutionalStaffMembers)
          .where(eq(institutionalStaffMembers.userId, ctx.user.id));

        const currentStaff = staffRows.find((r) => r.instId === input.institutionId);
        if (currentStaff?.department) {
          userDepartment = currentStaff.department;
        } else {
          const fallbackStaff = staffRows.find((r) => r.department?.trim());
          if (fallbackStaff?.department) {
            userDepartment = fallbackStaff.department;
          }
        }
      }

      return {
        event: {
          id: event.id,
          name: event.name,
          eventDate: event.eventDate,
          institutionName: inst?.institutionName ?? null,
        },
        userDepartment,
      };
    }),

  /** Submit a CPD registration. Validates the event is open, matches the visitor session, and dedupes by email + event. */
  submitRegistration: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        fullName: z.string().trim().min(2).max(256),
        email: z.string().trim().email().max(320),
        phone: z.string().trim().min(5).max(32),
        cadre: cadreEnum,
        cadreOther: z.string().trim().max(128).optional(),
        department: z.string().trim().min(1).max(256),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();

      const email = (ctx.user.email ?? "").trim().toLowerCase();
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your user account does not have an email address configured. Please set one in settings.",
        });
      }

      const normalizedInputEmail = input.email.trim().toLowerCase();
      if (normalizedInputEmail !== email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only register for yourself using your signed-in account email.",
        });
      }

      // Event must be open for this institution.
      const [event] = await db
        .select({ id: cpdEvents.id })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.institutionalAccountId, input.institutionId),
            eq(cpdEvents.isOpen, true)
          )
        )
        .orderBy(desc(cpdEvents.id))
        .limit(1);
      if (!event) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration is closed. No CPD event is currently open.",
        });
      }

      const requiresOther = [
        "Other",
        "Consultant Physician",
        "MSN",
        "HND",
        "Consultant Physician Student",
        "MSN Student",
        "HND Student",
        "RCO HND",
      ].includes(input.cadre);
      if (requiresOther && !input.cadreOther?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Please specify your subspecialty or details for ${input.cadre}.`,
        });
      }

      // Duplicate guard: one registration per email per event.
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await db
        .select({ id: cpdAttendees.id })
        .from(cpdAttendees)
        .where(
          and(eq(cpdAttendees.cpdEventId, event.id), eq(cpdAttendees.email, normalizedEmail))
        )
        .limit(1);
      if (existing.length) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already registered for this event with this email.",
        });
      }

      await db.insert(cpdAttendees).values({
        cpdEventId: event.id,
        institutionalAccountId: input.institutionId,
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        cadre: input.cadre,
        cadreOther: requiresOther ? input.cadreOther?.trim() ?? null : null,
        higherDiploma: null,
        department: input.department,
      });

      return { success: true as const };
    }),

  /** Admin: list attendees, optionally filtered to one event. */
  listAttendees: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const whereClause = input.eventId
        ? and(
            eq(cpdAttendees.institutionalAccountId, input.institutionId),
            eq(cpdAttendees.cpdEventId, input.eventId)
          )
        : eq(cpdAttendees.institutionalAccountId, input.institutionId);
      const rows = await db
        .select()
        .from(cpdAttendees)
        .where(whereClause)
        .orderBy(desc(cpdAttendees.id));
      return rows;
    }),

  /** Admin: export attendees (optionally filtered to one event) as a CSV string. */
  exportCsv: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const whereClause = input.eventId
        ? and(
            eq(cpdAttendees.institutionalAccountId, input.institutionId),
            eq(cpdAttendees.cpdEventId, input.eventId)
          )
        : eq(cpdAttendees.institutionalAccountId, input.institutionId);
      const rows = await db
        .select({
          fullName: cpdAttendees.fullName,
          email: cpdAttendees.email,
          phone: cpdAttendees.phone,
          cadre: cpdAttendees.cadre,
          cadreOther: cpdAttendees.cadreOther,
          higherDiploma: cpdAttendees.higherDiploma,
          department: cpdAttendees.department,
          submittedAt: cpdAttendees.submittedAt,
          eventName: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
        })
        .from(cpdAttendees)
        .leftJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id))
        .where(whereClause)
        .orderBy(desc(cpdAttendees.id));
      const csv = buildAttendeeCsv(
        rows.map((r) => ({
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          cadre: r.cadre,
          cadreOther: r.cadreOther,
          higherDiploma: r.higherDiploma,
          department: r.department,
          eventName: r.eventName ?? "",
          eventDate: r.eventDate ?? "",
          submittedAt: r.submittedAt,
        }))
      );
      return { csv, count: rows.length };
    }),

  /** Admin: set/update the CPD secret code for a CPD event. */
  updateCpdCode: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive(),
        cpdCode: z.string().trim().max(128).nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [event] = await db
        .select({ id: cpdEvents.id })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.id, input.eventId),
            eq(cpdEvents.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found for this institution" });
      }
      await db
        .update(cpdEvents)
        .set({ cpdCode: input.cpdCode })
        .where(eq(cpdEvents.id, input.eventId));
      return { success: true as const };
    }),

  /** Self-service: log when a user reveals the CPD secret code for auditing. */
  logCpdCodeReveal: protectedProcedure
    .input(
      z.object({
        attendeeId: z.number().int().positive(),
        eventId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const email = (ctx.user.email ?? "").trim().toLowerCase();
      if (!email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User has no email address configured" });
      }
      
      // Verify attendee belongs to the user and the event
      const [attendee] = await db
        .select({ id: cpdAttendees.id })
        .from(cpdAttendees)
        .where(
          and(
            eq(cpdAttendees.id, input.attendeeId),
            eq(cpdAttendees.cpdEventId, input.eventId),
            eq(cpdAttendees.email, email)
          )
        )
        .limit(1);
      if (!attendee) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to attendee record" });
      }

      const ip = ctx.req?.ip || ctx.req?.socket?.remoteAddress || null;
      const userAgent = ctx.req?.headers?.["user-agent"] || null;

      await db.insert(cpdCodeRevealLogs).values({
        userId: ctx.user.id,
        cpdAttendeeId: input.attendeeId,
        cpdEventId: input.eventId,
        ipAddress: ip,
        userAgent: userAgent,
      });

      return { success: true as const };
    }),

  /**
   * Self-service (any authenticated user): list the logged-in user's own CPD
   * attendance records, matched by email. Returns enough data to render a list
   * and link each row to its certificate PDF (/api/cpd/certificate/:attendeeId).
   */
  myCertificates: protectedProcedure.query(async ({ ctx }) => {
    const email = (ctx.user.email ?? "").trim().toLowerCase();
    if (!email) {
      // No email on the account → nothing to match against.
      return { email: null as string | null, records: [] };
    }
    const db = await requireDb();
    const rows = await db
      .select({
        attendeeId: cpdAttendees.id,
        eventId: cpdAttendees.cpdEventId,
        fullName: cpdAttendees.fullName,
        cadre: cpdAttendees.cadre,
        cadreOther: cpdAttendees.cadreOther,
        department: cpdAttendees.department,
        submittedAt: cpdAttendees.submittedAt,
        eventName: cpdEvents.name,
        eventDate: cpdEvents.eventDate,
        institutionName: institutionalAccounts.companyName,
        cpdCode: cpdEvents.cpdCode,
        approvingCouncil: cpdEvents.approvingCouncil,
        cpdPoints: cpdEvents.cpdPoints,
      })
      .from(cpdAttendees)
      .leftJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id))
      .leftJoin(
        institutionalAccounts,
        eq(cpdAttendees.institutionalAccountId, institutionalAccounts.id)
      )
      .where(eq(cpdAttendees.email, email))
      .orderBy(desc(cpdAttendees.id));
    return {
      email,
      records: rows.map((r) => ({
        attendeeId: r.attendeeId,
        eventId: r.eventId,
        fullName: r.fullName,
        cadre: r.cadre,
        cadreOther: r.cadreOther,
        department: r.department,
        submittedAt: r.submittedAt,
        eventName: r.eventName ?? "CPD Session",
        eventDate: r.eventDate ?? "",
        institutionName: r.institutionName ?? "Healthcare Institution",
        cpdCode: r.cpdCode ?? null,
        approvingCouncil: r.approvingCouncil ?? null,
        cpdPoints: r.cpdPoints ?? null,
      })),
    };
  }),
});

export type CpdRouter = typeof cpdRouter;
