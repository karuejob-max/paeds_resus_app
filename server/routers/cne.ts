import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { institutionalAccounts, cneEvents, cneAttendees, cpdCodeRevealLogs } from "../../drizzle/schema";

/** Shared cadre enum for input validation, matching the cneAttendees.cadre column. */
const cadreEnum = z.enum(["BSN", "MSN", "KRCHN", "KRN", "KRNM", "ERN", "HND", "Student Nurse", "Other"]);

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

export const cneRouter = router({
  /** Admin: set the CNE Coordinator name that prints on certificate signature lines. */
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
        .set({ cneCoordinatorName: input.coordinatorName, updatedAt: new Date() })
        .where(eq(institutionalAccounts.id, input.institutionId));
      return { success: true as const, coordinatorName: input.coordinatorName };
    }),

  /** Admin: read the current CNE Coordinator name + signature for this institution. */
  getSettings: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [row] = await db
        .select({
          coordinatorName: institutionalAccounts.cneCoordinatorName,
          coordinatorSignature: institutionalAccounts.cneCoordinatorSignature,
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
   * Admin: save (or clear) the CNE Coordinator's drawn signature.
   * Stored as a base64 PNG data URL on institutionalAccounts.cneCoordinatorSignature,
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
        .set({ cneCoordinatorSignature: value, updatedAt: new Date() })
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const now = new Date();
      // Close any open events first (only one open event per institution).
      await db
        .update(cneEvents)
        .set({ isOpen: false, closedAt: now })
        .where(
          and(
            eq(cneEvents.institutionalAccountId, input.institutionId),
            eq(cneEvents.isOpen, true)
          )
        );
      const result = await db.insert(cneEvents).values({
        institutionalAccountId: input.institutionId,
        name: input.name,
        eventDate: input.eventDate,
        isOpen: true,
        openedAt: now,
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
        .select({ id: cneEvents.id })
        .from(cneEvents)
        .where(
          and(
            eq(cneEvents.id, input.eventId),
            eq(cneEvents.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found for this institution" });
      }
      await db
        .update(cneEvents)
        .set({ isOpen: false, closedAt: new Date() })
        .where(eq(cneEvents.id, input.eventId));
      return { success: true as const };
    }),

  /** Admin: list all events for this institution (newest first). */
  listEvents: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const rows = await db
        .select()
        .from(cneEvents)
        .where(eq(cneEvents.institutionalAccountId, input.institutionId))
        .orderBy(desc(cneEvents.id));
      return rows;
    }),

  /** Public: the currently open event for an institution (or null). Used by the registration page. */
  currentEvent: publicProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [event] = await db
        .select({
          id: cneEvents.id,
          name: cneEvents.name,
          eventDate: cneEvents.eventDate,
          institutionalAccountId: cneEvents.institutionalAccountId,
        })
        .from(cneEvents)
        .where(
          and(
            eq(cneEvents.institutionalAccountId, input.institutionId),
            eq(cneEvents.isOpen, true)
          )
        )
        .orderBy(desc(cneEvents.id))
        .limit(1);
      if (!event) return { event: null };
      // Public-facing institution name for the form header.
      const [inst] = await db
        .select({ institutionName: institutionalAccounts.companyName })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      return {
        event: {
          id: event.id,
          name: event.name,
          eventDate: event.eventDate,
          institutionName: inst?.institutionName ?? null,
        },
      };
    }),

  /** Public: submit a CNE registration. Validates the event is open and dedupes by email + event. */
  submitRegistration: publicProcedure
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
    .mutation(async ({ input }) => {
      const db = await requireDb();

      // Event must be open for this institution.
      const [event] = await db
        .select({ id: cneEvents.id })
        .from(cneEvents)
        .where(
          and(
            eq(cneEvents.institutionalAccountId, input.institutionId),
            eq(cneEvents.isOpen, true)
          )
        )
        .orderBy(desc(cneEvents.id))
        .limit(1);
      if (!event) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration is closed. No CNE event is currently open.",
        });
      }

      if (input.cadre === "Other" && !input.cadreOther?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please specify your cadre when selecting 'Other'.",
        });
      }

      if (input.cadre === "HND" && !input.cadreOther?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please specify your subspecialty (e.g. KRPCCN) when selecting HND.",
        });
      }

      // Duplicate guard: one registration per email per event.
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await db
        .select({ id: cneAttendees.id })
        .from(cneAttendees)
        .where(
          and(eq(cneAttendees.cneEventId, event.id), eq(cneAttendees.email, normalizedEmail))
        )
        .limit(1);
      if (existing.length) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already registered for this event with this email.",
        });
      }

      await db.insert(cneAttendees).values({
        cneEventId: event.id,
        institutionalAccountId: input.institutionId,
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        cadre: input.cadre,
        cadreOther: (input.cadre === "Other" || input.cadre === "HND") ? input.cadreOther?.trim() ?? null : null,
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
            eq(cneAttendees.institutionalAccountId, input.institutionId),
            eq(cneAttendees.cneEventId, input.eventId)
          )
        : eq(cneAttendees.institutionalAccountId, input.institutionId);
      const rows = await db
        .select()
        .from(cneAttendees)
        .where(whereClause)
        .orderBy(desc(cneAttendees.id));
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
            eq(cneAttendees.institutionalAccountId, input.institutionId),
            eq(cneAttendees.cneEventId, input.eventId)
          )
        : eq(cneAttendees.institutionalAccountId, input.institutionId);
      const rows = await db
        .select({
          fullName: cneAttendees.fullName,
          email: cneAttendees.email,
          phone: cneAttendees.phone,
          cadre: cneAttendees.cadre,
          cadreOther: cneAttendees.cadreOther,
          higherDiploma: cneAttendees.higherDiploma,
          department: cneAttendees.department,
          submittedAt: cneAttendees.submittedAt,
          eventName: cneEvents.name,
          eventDate: cneEvents.eventDate,
        })
        .from(cneAttendees)
        .leftJoin(cneEvents, eq(cneAttendees.cneEventId, cneEvents.id))
        .where(whereClause)
        .orderBy(desc(cneAttendees.id));
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

  /** Admin: set/update the NCK CPD secret code for a CNE event. */
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
        .select({ id: cneEvents.id })
        .from(cneEvents)
        .where(
          and(
            eq(cneEvents.id, input.eventId),
            eq(cneEvents.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found for this institution" });
      }
      await db
        .update(cneEvents)
        .set({ cpdCode: input.cpdCode })
        .where(eq(cneEvents.id, input.eventId));
      return { success: true as const };
    }),

  /** Self-service: log when a nurse reveals the CPD secret code for auditing. */
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
        .select({ id: cneAttendees.id })
        .from(cneAttendees)
        .where(
          and(
            eq(cneAttendees.id, input.attendeeId),
            eq(cneAttendees.cneEventId, input.eventId),
            eq(cneAttendees.email, email)
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
        cneAttendeeId: input.attendeeId,
        cneEventId: input.eventId,
        ipAddress: ip,
        userAgent: userAgent,
      });

      return { success: true as const };
    }),

  /**
   * Self-service (any authenticated user): list the logged-in nurse's own CNE
   * attendance records, matched by email. Returns enough data to render a list
   * and link each row to its certificate PDF (/api/cne/certificate/:attendeeId).
   *
   * Email is normalized to lowercase for matching, consistent with how
   * registrations are stored (submitRegistration lowercases on insert) and how
   * the rest of the codebase looks up users by email.
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
        attendeeId: cneAttendees.id,
        eventId: cneAttendees.cneEventId,
        fullName: cneAttendees.fullName,
        cadre: cneAttendees.cadre,
        cadreOther: cneAttendees.cadreOther,
        department: cneAttendees.department,
        submittedAt: cneAttendees.submittedAt,
        eventName: cneEvents.name,
        eventDate: cneEvents.eventDate,
        institutionName: institutionalAccounts.companyName,
        cpdCode: cneEvents.cpdCode,
      })
      .from(cneAttendees)
      .leftJoin(cneEvents, eq(cneAttendees.cneEventId, cneEvents.id))
      .leftJoin(
        institutionalAccounts,
        eq(cneAttendees.institutionalAccountId, institutionalAccounts.id)
      )
      .where(eq(cneAttendees.email, email))
      .orderBy(desc(cneAttendees.id));
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
        eventName: r.eventName ?? "CNE Session",
        eventDate: r.eventDate ?? "",
        institutionName: r.institutionName ?? "Healthcare Institution",
        cpdCode: r.cpdCode ?? null,
      })),
    };
  }),
});

export type CneRouter = typeof cneRouter;
