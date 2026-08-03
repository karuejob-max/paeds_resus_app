import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, or, like, sql } from "drizzle-orm";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { institutionalAccounts, cpdEvents, cpdAttendees, cpdCodeRevealLogs, institutionalStaffMembers, users, providerProfiles } from "../../drizzle/schema";

/** Shared cadre validator for input validation, matching the cpdAttendees.cadre column. */
const cadreEnum = z.string().trim().min(1, "Please select or specify your cadre").max(128);

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  }
  return db;
}

async function syncUserProfileDepartment(db: any, userId: number, department: string) {
  if (!userId || !department) return;

  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);

  if (profile) {
    await db
      .update(providerProfiles)
      .set({ department, updatedAt: new Date() })
      .where(eq(providerProfiles.userId, userId));
  } else {
    await db.insert(providerProfiles).values({
      userId,
      department,
      profileCompleted: false,
      profileCompletionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

function formatEventPresenterCadre(cadre: string | null, cadreOther: string | null): string | null {
  if (!cadre) return null;
  const otherTrimmed = cadreOther?.trim();
  if (!otherTrimmed) return cadre;

  const isOther = [
    "Other", "Other Staff", "Other Student", "Other Intern", "Other RN", "Other RCO",
    "Other Diploma RN", "Other Certificate RN", "Other Diploma Student", "Other Certificate Student"
  ].includes(cadre);

  if (isOther || cadre === otherTrimmed) {
    return otherTrimmed;
  }
  return `${cadre} - ${otherTrimmed}`;
}

async function syncUserCadre(db: any, userId: number, cadre: string | null, cadreOther: string | null) {
  if (!userId || !cadre) return;
  await db
    .update(users)
    .set({
      cadre,
      cadreOther: cadreOther?.trim() || null,
    })
    .where(eq(users.id, userId));
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

  /** Admin: search platform users / staff for presenter autocomplete. */
  searchPresenters: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(1).max(100),
        institutionId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      if (input.institutionId) {
        await assertInstitutionAccess(db, ctx.user, input.institutionId);
      }
      const q = `%${input.query.toLowerCase()}%`;

      const userMatches = await db
        .select({
          id: users.id,
          fullName: users.name,
          email: users.email,
          cadre: users.cadre,
          cadreOther: users.cadreOther,
          department: institutionalStaffMembers.department,
        })
        .from(users)
        .leftJoin(
          institutionalStaffMembers,
          eq(users.id, institutionalStaffMembers.userId)
        )
        .where(
          or(
            like(sql`LOWER(${users.name})`, q),
            like(sql`LOWER(${users.email})`, q)
          )
        )
        .limit(10);

      return userMatches.map((u) => ({
        id: u.id,
        fullName: u.fullName || u.email || "Unknown Clinician",
        email: u.email || "",
        cadre: u.cadre || null,
        cadreOther: u.cadreOther || null,
        department: u.department || null,
      }));
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
        eventType: z.enum(["cne", "cme", "cpd_general", "grand_rounds", "journal_club", "workshop"]).default("cpd_general"),
        presenterUserId: z.number().int().positive().nullable().optional(),
        presenterName: z.string().trim().max(255).nullable().optional(),
        presenterCadre: z.string().trim().max(128).nullable().optional(),
        presenterCadreOther: z.string().trim().max(128).nullable().optional(),
        presenterDepartment: z.string().trim().max(128).nullable().optional(),
        scheduledStartTime: z.string().trim().max(10).nullable().optional(),
        scheduledEndTime: z.string().trim().max(10).nullable().optional(),
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
        eventType: input.eventType || "cpd_general",
        presenterUserId: input.presenterUserId ?? null,
        presenterName: input.presenterName ?? null,
        presenterCadre: formatEventPresenterCadre(input.presenterCadre ?? null, input.presenterCadreOther ?? null),
        presenterDepartment: input.presenterDepartment ?? null,
        scheduledStartTime: input.scheduledStartTime ?? null,
        scheduledEndTime: input.scheduledEndTime ?? null,
      });
      const eventId = (result as unknown as { insertId: number }).insertId;

      if (input.presenterUserId) {
        if (input.presenterDepartment) {
          await syncUserProfileDepartment(db, input.presenterUserId, input.presenterDepartment);
        }
        if (input.presenterCadre) {
          await syncUserCadre(db, input.presenterUserId, input.presenterCadre, input.presenterCadreOther ?? null);
        }
      }

      return { success: true as const, eventId };
    }),

  /** Admin: update event details or backfill presenter for past/current CPDs. */
  updateEventPresenter: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive(),
        eventType: z.enum(["cne", "cme", "cpd_general", "grand_rounds", "journal_club", "workshop"]).optional(),
        presenterUserId: z.number().int().positive().nullable().optional(),
        presenterName: z.string().trim().max(255).nullable().optional(),
        presenterCadre: z.string().trim().max(128).nullable().optional(),
        presenterCadreOther: z.string().trim().max(128).nullable().optional(),
        presenterDepartment: z.string().trim().max(128).nullable().optional(),
        cpdPoints: z.union([z.number(), z.string().transform((val) => val ? Number(val) : null)]).nullable().optional(),
        approvingCouncil: z.string().trim().max(128).nullable().optional(),
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

      const updateData: Record<string, unknown> = {};
      if (input.eventType !== undefined) updateData.eventType = input.eventType;
      if (input.presenterUserId !== undefined) updateData.presenterUserId = input.presenterUserId;
      if (input.presenterName !== undefined) updateData.presenterName = input.presenterName;
      if (input.presenterCadre !== undefined) {
        updateData.presenterCadre = formatEventPresenterCadre(input.presenterCadre, input.presenterCadreOther ?? null);
      }
      if (input.presenterDepartment !== undefined) updateData.presenterDepartment = input.presenterDepartment;
      if (input.cpdPoints !== undefined) updateData.cpdPoints = input.cpdPoints ? String(input.cpdPoints) : null;
      if (input.approvingCouncil !== undefined) updateData.approvingCouncil = input.approvingCouncil;

      await db.update(cpdEvents).set(updateData).where(eq(cpdEvents.id, input.eventId));

      // Resolve final presenterUserId, presenterDepartment to sync
      const [finalEvent] = await db
        .select({
          presenterUserId: cpdEvents.presenterUserId,
          presenterDepartment: cpdEvents.presenterDepartment,
        })
        .from(cpdEvents)
        .where(eq(cpdEvents.id, input.eventId))
        .limit(1);

      if (finalEvent?.presenterUserId) {
        if (finalEvent.presenterDepartment) {
          await syncUserProfileDepartment(db, finalEvent.presenterUserId, finalEvent.presenterDepartment);
        }
        if (input.presenterCadre !== undefined) {
          await syncUserCadre(db, finalEvent.presenterUserId, input.presenterCadre, input.presenterCadreOther ?? null);
        }
      }

      return { success: true as const };
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
        .select({
          id: cpdEvents.id,
          name: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
          isOpen: cpdEvents.isOpen,
          closedAt: cpdEvents.closedAt,
          openedAt: cpdEvents.openedAt,
          eventType: cpdEvents.eventType,
          presenterUserId: cpdEvents.presenterUserId,
          presenterName: cpdEvents.presenterName,
          presenterCadre: cpdEvents.presenterCadre,
          presenterDepartment: cpdEvents.presenterDepartment,
          cpdPoints: cpdEvents.cpdPoints,
          approvingCouncil: cpdEvents.approvingCouncil,
          cpdCode: cpdEvents.cpdCode,
          attendeeCount: sql<number>`COUNT(${cpdAttendees.id})`.mapWith(Number),
        })
        .from(cpdEvents)
        .leftJoin(cpdAttendees, eq(cpdEvents.id, cpdAttendees.cpdEventId))
        .where(eq(cpdEvents.institutionalAccountId, input.institutionId))
        .groupBy(cpdEvents.id)
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
        // 1. Try to fetch from providerProfiles
        const [profile] = await db
          .select({ department: providerProfiles.department })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, ctx.user.id))
          .limit(1);

        if (profile?.department) {
          userDepartment = profile.department;
        } else {
          // 2. Fallback to institutionalStaffMembers
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
      // Determine attendance type (primary_facility vs locum_outreach)
      let attendanceType: "primary_facility" | "locum_outreach" | "guest_external" = "primary_facility";
      const userStaffRows = await db
        .select({
          instId: institutionalStaffMembers.institutionalAccountId,
        })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.userId, ctx.user.id));

      if (userStaffRows.length > 0) {
        const matchesCurrent = userStaffRows.some((r) => r.instId === input.institutionId);
        if (!matchesCurrent) {
          attendanceType = "locum_outreach";
        }
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
        attendanceType,
        roleInEvent: "attendee",
        checkInPunctuality: "on_time",
      });

      // 1. Auto-Profile Prefill: Update user cadre if currently empty
      if (!ctx.user.cadre) {
        await db
          .update(users)
          .set({
            cadre: input.cadre,
            cadreOther: requiresOther ? input.cadreOther?.trim() ?? null : null,
          })
          .where(eq(users.id, ctx.user.id));
      }

      // Auto-populate user's profile department from registration
      await syncUserProfileDepartment(db, ctx.user.id, input.department);

      // 2. Auto-Staff Population: Auto-create institutional staff member record if not yet linked
      const [existingStaff] = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            eq(institutionalStaffMembers.staffEmail, normalizedEmail)
          )
        )
        .limit(1);

      if (!existingStaff) {
        let staffRole: "doctor" | "nurse" | "paramedic" | "midwife" | "lab_tech" | "respiratory_therapist" | "support_staff" | "other" = "other";
        const cLower = input.cadre.toLowerCase();
        if (cLower.includes("nurse") || cLower.includes("nursing") || cLower.includes("msn") || cLower.includes("hnd")) {
          staffRole = "nurse";
        } else if (cLower.includes("doctor") || cLower.includes("mo") || cLower.includes("medical officer") || cLower.includes("physician") || cLower.includes("consultant")) {
          staffRole = "doctor";
        } else if (cLower.includes("clinical officer") || cLower.includes("rco")) {
          staffRole = "paramedic";
        }

        await db.insert(institutionalStaffMembers).values({
          institutionalAccountId: input.institutionId,
          userId: ctx.user.id,
          staffName: input.fullName,
          staffEmail: normalizedEmail,
          staffPhone: input.phone,
          staffRole,
          department: input.department,
          enrollmentStatus: "enrolled",
          facilityLinkStatus: "linked",
        });
      }

      return { success: true as const, attendanceType };
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

  /** Admin: Institutional CPD Analytics Dashboard */
  getInstitutionalCpdAnalytics: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const events = await db
        .select()
        .from(cpdEvents)
        .where(eq(cpdEvents.institutionalAccountId, input.institutionId))
        .orderBy(desc(cpdEvents.id));

      const attendees = await db
        .select()
        .from(cpdAttendees)
        .where(eq(cpdAttendees.institutionalAccountId, input.institutionId))
        .orderBy(desc(cpdAttendees.id));

      let totalPointsIssued = 0;
      let cneCount = 0;
      let cmeCount = 0;
      let generalCount = 0;
      let workshopCount = 0;

      for (const ev of events) {
        if (ev.eventType === "cne") cneCount++;
        else if (ev.eventType === "cme") cmeCount++;
        else if (ev.eventType === "workshop") workshopCount++;
        else generalCount++;

        const pts = Number(ev.cpdPoints ?? 0);
        const count = attendees.filter((a) => a.cpdEventId === ev.id).length;
        totalPointsIssued += pts * count;
      }

      // Department Heatmap & Leaderboard
      const deptStats: Record<string, { department: string; attendedCount: number; presentedCount: number }> = {};
      
      for (const a of attendees) {
        const dept = a.department || "Unassigned";
        if (!deptStats[dept]) {
          deptStats[dept] = { department: dept, attendedCount: 0, presentedCount: 0 };
        }
        deptStats[dept].attendedCount++;
      }

      for (const ev of events) {
        if (ev.presenterDepartment) {
          const dept = ev.presenterDepartment;
          if (!deptStats[dept]) {
            deptStats[dept] = { department: dept, attendedCount: 0, presentedCount: 0 };
          }
          deptStats[dept].presentedCount++;
        }
      }

      // Presenter Leaderboard
      const presenterStats: Record<string, { presenterName: string; department: string; cadre: string; sessionCount: number }> = {};
      for (const ev of events) {
        if (ev.presenterName) {
          const name = ev.presenterName;
          if (!presenterStats[name]) {
            presenterStats[name] = {
              presenterName: name,
              department: ev.presenterDepartment || "General",
              cadre: ev.presenterCadre || "Clinician",
              sessionCount: 0,
            };
          }
          presenterStats[name].sessionCount++;
        }
      }

      // Staff Attendance Matrix
      const staffMap: Record<string, { fullName: string; email: string; cadre: string; department: string; cneAttended: number; cmeAttended: number; totalAttended: number; lastSignIn: Date | string; isLocum: boolean }> = {};
      for (const a of attendees) {
        const key = a.email.toLowerCase();
        const ev = events.find((e) => e.id === a.cpdEventId);
        const isCne = ev?.eventType === "cne";
        const isCme = ev?.eventType === "cme";

        if (!staffMap[key]) {
          staffMap[key] = {
            fullName: a.fullName,
            email: a.email,
            cadre: a.cadre,
            department: a.department,
            cneAttended: 0,
            cmeAttended: 0,
            totalAttended: 0,
            lastSignIn: a.submittedAt,
            isLocum: a.attendanceType === "locum_outreach",
          };
        }

        if (isCne) staffMap[key].cneAttended++;
        if (isCme) staffMap[key].cmeAttended++;
        staffMap[key].totalAttended++;
      }

      return {
        summary: {
          totalEvents: events.length,
          totalAttendees: attendees.length,
          totalPointsIssued: Math.round(totalPointsIssued * 10) / 10,
          cneCount,
          cmeCount,
          generalCount,
          workshopCount,
        },
        departmentHeatmap: Object.values(deptStats).sort((a, b) => b.attendedCount - a.attendedCount),
        presenterLeaderboard: Object.values(presenterStats).sort((a, b) => b.sessionCount - a.sessionCount),
        staffMatrix: Object.values(staffMap).sort((a, b) => b.totalAttended - a.totalAttended),
      };
    }),

  /** Platform Admin: Global CPD Analytics Radar */
  getPlatformCpdAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    const db = await requireDb();

    const allEvents = await db.select().from(cpdEvents);
    const allAttendees = await db.select().from(cpdAttendees);
    const allInstitutions = await db.select({ id: institutionalAccounts.id, name: institutionalAccounts.companyName }).from(institutionalAccounts);

    const hospitalStats: Record<number, { id: number; name: string; eventCount: number; attendeeCount: number }> = {};
    for (const inst of allInstitutions) {
      hospitalStats[inst.id] = { id: inst.id, name: inst.name, eventCount: 0, attendeeCount: 0 };
    }

    for (const ev of allEvents) {
      if (hospitalStats[ev.institutionalAccountId]) {
        hospitalStats[ev.institutionalAccountId].eventCount++;
      }
    }

    for (const a of allAttendees) {
      if (hospitalStats[a.institutionalAccountId]) {
        hospitalStats[a.institutionalAccountId].attendeeCount++;
      }
    }

    const cadreBreakdown: Record<string, number> = {};
    for (const a of allAttendees) {
      const c = a.cadre || "Other";
      cadreBreakdown[c] = (cadreBreakdown[c] || 0) + 1;
    }

    return {
      totalPlatformEvents: allEvents.length,
      totalPlatformAttendees: allAttendees.length,
      hospitalLeaderboard: Object.values(hospitalStats).sort((a, b) => b.attendeeCount - a.attendeeCount),
      cadreDistribution: Object.entries(cadreBreakdown).map(([cadre, count]) => ({ cadre, count })),
    };
  }),

  /**
   * Admin: permanently delete a CPD event (intended for test/dummy sessions only).
   *
   * Premortem Defences:
   * 1. If any cpdAttendees rows exist, requires a strict super-confirmation phrase.
   * 2. Requires caller to type the exact event name as irreversibility confirmation.
   * 3. Cascades in order: cpdCodeRevealLogs → cpdAttendees → cpdEvents.
   */
  deleteEvent: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive(),
        /** Must exactly match the event's name (trimmed, case-insensitive). */
        confirmName: z.string().trim().min(1).max(256),
        /** Required super-confirm phrase if the event has registered attendees. */
        confirmAttendeesPhrase: z.string().trim().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      // 1. Verify the event belongs to this institution.
      const [event] = await db
        .select({ id: cpdEvents.id, name: cpdEvents.name })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.id, input.eventId),
            eq(cpdEvents.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found for this institution." });
      }

      // 2. Super-confirm check if any attendees are registered.
      const attendeeRows = await db
        .select({ id: cpdAttendees.id })
        .from(cpdAttendees)
        .where(eq(cpdAttendees.cpdEventId, input.eventId))
        .limit(1);

      if (attendeeRows.length > 0) {
        // Count them fully for validation.
        const [countRow] = await db
          .select({ n: sql<number>`COUNT(*)` })
          .from(cpdAttendees)
          .where(eq(cpdAttendees.cpdEventId, input.eventId));
        const n = Number(countRow?.n ?? 1);
        const expectedPhrase = `DELETE SESSION WITH ${n} ATTENDEES`;

        if (
          !input.confirmAttendeesPhrase ||
          input.confirmAttendeesPhrase.trim().toLowerCase() !== expectedPhrase.toLowerCase()
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `This event has ${n} registered attendee${n === 1 ? "" : "s"}. To delete it anyway, you must provide the super-confirmation phrase: "${expectedPhrase}".`,
          });
        }
      }

      // 3. Confirm the typed name matches (case-insensitive, trimmed).
      if (input.confirmName.trim().toLowerCase() !== event.name.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event name confirmation did not match. Please type the exact event name to confirm deletion.",
        });
      }

      // 4. Cascade delete in dependency order.
      //    cpdCodeRevealLogs → cpdAttendees → cpdEvents
      await db.delete(cpdCodeRevealLogs).where(eq(cpdCodeRevealLogs.cpdEventId, input.eventId));
      await db.delete(cpdAttendees).where(eq(cpdAttendees.cpdEventId, input.eventId));
      await db.delete(cpdEvents).where(eq(cpdEvents.id, input.eventId));

      return { success: true as const };
    }),
});

/**
 * Admin: permanently delete a CPD event (intended for test/dummy sessions only).
 * Guards against accidental deletion — see the deleteEvent procedure inside the router.
 */

export type CpdRouter = typeof cpdRouter;
