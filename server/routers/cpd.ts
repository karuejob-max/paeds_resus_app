import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, or, like, sql, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { assertInstitutionProductCapability } from "../lib/institution-entitlements";
import { assertInstitutionProductRole, type InstitutionalProductRoleKey } from "../lib/institution-product-roles";
import {
  institutionalAccounts,
  cpdEvents,
  cpdAttendees,
  cpdCodeRevealLogs,
  institutionalStaffMembers,
  institutionEducationCoordinators,
  institutionMemberships,
  users,
  providerProfiles,
  facilityDepartments,
} from "../../drizzle/schema";
import { canonicalizeDepartmentLabel, departmentLabelsMatch } from "../../shared/clinical-departments";
import { isRegisteredRnProfile } from "../lib/iers-provider-eligibility";
import { applyCpdFacilityRelationship, autoLinkCpdFacilitiesForUser } from "../services/facility-registry.service";

/** Shared cadre validator for input validation, matching the cpdAttendees.cadre column. */
const cadreEnum = z.string().trim().min(1, "Please select or specify your cadre").max(128);

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  }
  return db;
}

async function loadFacilityDepartmentNames(db: any, institutionId: number) {
  const rows = await db
    .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
    .from(facilityDepartments)
    .where(eq(facilityDepartments.institutionId, institutionId));
  return new Map<number, string>(rows.map((row: { id: number; departmentName: string }) => [
    row.id,
    canonicalizeDepartmentLabel(row.departmentName),
  ]));
}

async function resolveActiveInstitutionPresenter(
  db: any,
  institutionId: number,
  userId: number
) {
  const [row] = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userCadre: users.cadre,
      userCadreOther: users.cadreOther,
      staffName: institutionalStaffMembers.staffName,
      staffEmail: institutionalStaffMembers.staffEmail,
      staffRole: institutionalStaffMembers.staffRole,
      staffDepartment: institutionalStaffMembers.department,
      facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
      profileDepartment: providerProfiles.department,
    })
    .from(institutionMemberships)
    .innerJoin(users, eq(users.id, institutionMemberships.userId))
    .leftJoin(
      institutionalStaffMembers,
      and(
        eq(institutionalStaffMembers.institutionalAccountId, institutionId),
        eq(institutionalStaffMembers.userId, userId),
        sql`${institutionalStaffMembers.removedAt} IS NULL`
      )
    )
    .leftJoin(providerProfiles, eq(providerProfiles.userId, userId))
    .where(
      and(
        eq(institutionMemberships.institutionalAccountId, institutionId),
        eq(institutionMemberships.userId, userId),
        eq(institutionMemberships.membershipStatus, "active")
      )
    )
    .limit(1);
  if (!row) return null;
  return {
    userId: row.userId,
    fullName: row.staffName?.trim() || row.userName?.trim() || row.userEmail?.trim() || "Institution member",
    email: row.staffEmail?.trim() || row.userEmail?.trim() || "",
    cadre: row.userCadre?.trim() || row.staffRole || null,
    cadreOther: row.userCadreOther?.trim() || null,
    department: row.staffDepartment?.trim() || row.profileDepartment?.trim() || null,
    facilityDepartmentId: row.facilityDepartmentId ?? null,
  };
}

export function getCanonicalAttendeeDepartment(
  attendee: { department: string; facilityDepartmentId?: number | null },
  facilityDepartmentNames: Map<number, string>,
) {
  if (attendee.facilityDepartmentId != null) {
    return facilityDepartmentNames.get(attendee.facilityDepartmentId) ?? attendee.department;
  }
  return attendee.department;
}

const CPD_MEMBER_ROLES: InstitutionalProductRoleKey[] = ["cpd_coordinator", "cpd_education_coordinator", "cpd_reviewer", "cpd_reporter", "cpd_viewer"];

async function assertCpdInstitutionAccess(
  db: any,
  user: { id: number; role?: string | null; email?: string | null },
  institutionId: number,
  requiredRoles: readonly InstitutionalProductRoleKey[] = CPD_MEMBER_ROLES,
) {
  try {
    await assertInstitutionAccess(db, user as any, institutionId);
    return { roleKey: "institution_admin" as const, departmentIds: null as number[] | null };
  } catch (error) {
    const code = error instanceof TRPCError ? error.code : undefined;
    if (code !== "FORBIDDEN") throw error;
    const role = await assertInstitutionProductRole(db, user as any, institutionId, "cpd_portal", requiredRoles);
    if (role.roleKey !== "cpd_education_coordinator") {
      return { ...role, departmentIds: null as number[] | null };
    }
    const assignments = await db
      .select({ departmentId: institutionEducationCoordinators.departmentId })
      .from(institutionEducationCoordinators)
      .where(and(
        eq(institutionEducationCoordinators.institutionalAccountId, institutionId),
        eq(institutionEducationCoordinators.userId, user.id),
        eq(institutionEducationCoordinators.assignmentStatus, "active")
      ));
    return {
      ...role,
      departmentIds: assignments
        .map((row: { departmentId: number | null }) => row.departmentId)
        .filter((departmentId: number | null): departmentId is number => departmentId != null),
    };
  }
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
    canonicalDepartmentName?: string | null;
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
    "Canonical Department",
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
        r.canonicalDepartmentName ?? "",
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.settings.govern");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.workspace.read");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId);
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.settings.govern");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
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
      const institutionId = input.institutionId;
      if (!institutionId) return [];
      let access: { departmentIds: number[] | null } = { departmentIds: null };
      if (institutionId) {
        await assertInstitutionProductCapability(db, institutionId, "cpd_portal", "cpd.workspace.read");
        access = await assertCpdInstitutionAccess(db, ctx.user, institutionId);
      }
      const q = `%${input.query.toLowerCase()}%`;

      const userMatches = await db
        .select({
          id: users.id,
          userName: users.name,
          userEmail: users.email,
          userCadre: users.cadre,
          userCadreOther: users.cadreOther,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          staffRole: institutionalStaffMembers.staffRole,
          department: institutionalStaffMembers.department,
          facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
        })
        .from(institutionMemberships)
        .innerJoin(users, eq(users.id, institutionMemberships.userId))
        .leftJoin(
          institutionalStaffMembers,
          and(
            eq(institutionalStaffMembers.institutionalAccountId, institutionId),
            eq(institutionalStaffMembers.userId, institutionMemberships.userId),
            sql`${institutionalStaffMembers.removedAt} IS NULL`
          )
        )
        .where(
          and(
            eq(institutionMemberships.institutionalAccountId, institutionId),
            eq(institutionMemberships.membershipStatus, "active"),
            or(
              like(sql`LOWER(${users.name})`, q),
              like(sql`LOWER(${users.email})`, q),
              like(sql`LOWER(${institutionalStaffMembers.staffName})`, q),
              like(sql`LOWER(${institutionalStaffMembers.staffEmail})`, q)
            ),
            access.departmentIds
              ? inArray(institutionalStaffMembers.facilityDepartmentId, access.departmentIds)
              : undefined
          )
        )
        .limit(10);

      return userMatches.map((u) => ({
        id: u.id,
        fullName: u.staffName || u.userName || u.staffEmail || u.userEmail || "Unknown Clinician",
        email: u.staffEmail || u.userEmail || "",
        cadre: u.userCadre || u.staffRole || null,
        cadreOther: u.userCadreOther || null,
        department: u.department || null,
        facilityDepartmentId: u.facilityDepartmentId ?? null,
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
        presenterUserId: z.number().int().positive(),
        /** Legacy display fields are accepted for old clients but not trusted. */
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
      const presenter = await resolveActiveInstitutionPresenter(
        db,
        input.institutionId,
        input.presenterUserId
      );
      if (!presenter) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose the lead presenter from the active institution-member list.",
        });
      }
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
        presenterUserId: presenter.userId,
        presenterName: presenter.fullName,
        presenterCadre: formatEventPresenterCadre(presenter.cadre, presenter.cadreOther),
        presenterDepartment: presenter.department,
        scheduledStartTime: input.scheduledStartTime ?? null,
        scheduledEndTime: input.scheduledEndTime ?? null,
      });
      const eventId = (result as unknown as { insertId: number }).insertId;

      if (presenter.department) {
        await syncUserProfileDepartment(db, presenter.userId, presenter.department);
      }
      if (presenter.cadre) {
        await syncUserCadre(db, presenter.userId, presenter.cadre, presenter.cadreOther);
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);

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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.workspace.read");
      const access = await assertCpdInstitutionAccess(db, ctx.user, input.institutionId);
      const rows = await db
        .select({
          id: cpdEvents.id,
          name: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
          isOpen: cpdEvents.isOpen,
          closedAt: cpdEvents.closedAt,
          openedAt: cpdEvents.openedAt,
          eventType: cpdEvents.eventType,
          facilityDepartmentId: cpdEvents.facilityDepartmentId,
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
      return access.departmentIds
        ? rows.filter(row => row.facilityDepartmentId == null || access.departmentIds?.includes(row.facilityDepartmentId))
        : rows;
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
      let userFacilityDepartmentId: number | null = null;
      const registrationDepartmentRows = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(eq(facilityDepartments.institutionId, input.institutionId), eq(facilityDepartments.isActive, true)));
      const registrationDepartments = registrationDepartmentRows.map((department) => ({
        ...department,
        departmentName: canonicalizeDepartmentLabel(department.departmentName),
      }));
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
              facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
              instId: institutionalStaffMembers.institutionalAccountId,
            })
            .from(institutionalStaffMembers)
            .where(eq(institutionalStaffMembers.userId, ctx.user.id));

          const currentStaff = staffRows.find((r) => r.instId === input.institutionId);
          if (currentStaff?.department) {
            userDepartment = currentStaff.department;
            userFacilityDepartmentId = currentStaff.facilityDepartmentId ?? null;
          } else {
            const fallbackStaff = staffRows.find((r) => r.department?.trim());
            if (fallbackStaff?.department) {
              userDepartment = fallbackStaff.department;
              userFacilityDepartmentId = fallbackStaff.facilityDepartmentId ?? null;
            }
          }
        }
      }

      if (userDepartment) {
        const matchingDepartment = registrationDepartments.find(
          (department) => departmentLabelsMatch(department.departmentName, userDepartment),
        );
        if (matchingDepartment) {
          userFacilityDepartmentId = userFacilityDepartmentId ?? matchingDepartment.id;
          userDepartment = matchingDepartment.departmentName;
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
        userFacilityDepartmentId,
        registrationDepartments,
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
        facilityDepartmentId: z.number().int().positive().nullable().optional(),
        facilityRelationship: z.enum(["permanent_facility", "locum_outreach"]).default("permanent_facility"),
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
      // Self-registration is an attendee action, not institution-workspace administration.
      // Keep the product entitlement gate and the signed-in self-email check above, but do
      // not require a CPD coordinator/reviewer role for ordinary staff, providers, or guests.
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.attendance.operate");

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

      const institutionDepartments = await db
        .select({ id: facilityDepartments.id, departmentName: facilityDepartments.departmentName })
        .from(facilityDepartments)
        .where(and(eq(facilityDepartments.institutionId, input.institutionId), eq(facilityDepartments.isActive, true)));
      let resolvedDepartment = canonicalizeDepartmentLabel(input.department.trim());
      let resolvedFacilityDepartmentId = input.facilityDepartmentId ?? null;
      if (institutionDepartments.length > 0) {
        const selectedDepartment = resolvedFacilityDepartmentId == null
          ? institutionDepartments.find((department) => departmentLabelsMatch(department.departmentName, resolvedDepartment))
          : institutionDepartments.find((department) => department.id === resolvedFacilityDepartmentId);
        if (!selectedDepartment) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose a department from this institution's IERS department list.",
          });
        }
        resolvedFacilityDepartmentId = selectedDepartment.id;
        resolvedDepartment = canonicalizeDepartmentLabel(selectedDepartment.departmentName);
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
      const attendanceType: "primary_facility" | "locum_outreach" = input.facilityRelationship === "permanent_facility"
        ? "primary_facility"
        : "locum_outreach";

      await db.insert(cpdAttendees).values({
        cpdEventId: event.id,
        institutionalAccountId: input.institutionId,
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        cadre: input.cadre,
        cadreOther: requiresOther ? input.cadreOther?.trim() ?? null : null,
        higherDiploma: null,
        department: resolvedDepartment,
        facilityDepartmentId: resolvedFacilityDepartmentId,
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
      await syncUserProfileDepartment(db, ctx.user.id, resolvedDepartment);

      const facilityLink = await applyCpdFacilityRelationship(db, {
        institutionalAccountId: input.institutionId,
        userId: ctx.user.id,
        staffName: input.fullName,
        staffEmail: normalizedEmail,
        staffPhone: input.phone,
        providerType: ctx.user.providerType,
        cadre: input.cadre,
        cadreOther: input.cadreOther ?? null,
        department: resolvedDepartment,
        facilityDepartmentId: resolvedFacilityDepartmentId,
        relationship: input.facilityRelationship,
      });

      return {
        success: true as const,
        attendanceType,
        facilityRelationship: input.facilityRelationship,
        facilityLinkStatus: facilityLink.status,
        membershipId: facilityLink.membershipId,
      };
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.workspace.read");
      const access = await assertCpdInstitutionAccess(db, ctx.user, input.institutionId);
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
      const scopedRows = access.departmentIds
        ? rows.filter(row => row.facilityDepartmentId != null && access.departmentIds?.includes(row.facilityDepartmentId))
        : rows;
      const facilityDepartmentNames = await loadFacilityDepartmentNames(db, input.institutionId);
      return scopedRows.map((row) => ({
        ...row,
        canonicalDepartmentName: row.facilityDepartmentId != null
          ? facilityDepartmentNames.get(row.facilityDepartmentId) ?? null
          : null,
      }));
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.reports.read");
      const access = await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator", "cpd_education_coordinator", "cpd_reviewer", "cpd_reporter", "cpd_viewer"]);
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
          facilityDepartmentId: cpdAttendees.facilityDepartmentId,
          submittedAt: cpdAttendees.submittedAt,
          eventName: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
        })
        .from(cpdAttendees)
        .leftJoin(cpdEvents, eq(cpdAttendees.cpdEventId, cpdEvents.id))
        .where(whereClause)
        .orderBy(desc(cpdAttendees.id));
      const scopedRows = access.departmentIds
        ? rows.filter(row => row.facilityDepartmentId != null && access.departmentIds?.includes(row.facilityDepartmentId))
        : rows;
      const facilityDepartmentNames = await loadFacilityDepartmentNames(db, input.institutionId);
      const csv = buildAttendeeCsv(
        scopedRows.map((r) => ({
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          cadre: r.cadre,
          cadreOther: r.cadreOther,
          higherDiploma: r.higherDiploma,
          department: r.department,
          canonicalDepartmentName: r.facilityDepartmentId != null
            ? facilityDepartmentNames.get(r.facilityDepartmentId) ?? null
            : null,
          eventName: r.eventName ?? "",
          eventDate: r.eventDate ?? "",
          submittedAt: r.submittedAt,
        }))
      );
      return { csv, count: scopedRows.length };
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
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
            sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`
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
      .where(sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`)
      .orderBy(desc(cpdAttendees.id));
    // Find linked institutionalAccountIds for the current user
    const userStaffLinks = await db
      .select({ instId: institutionalStaffMembers.institutionalAccountId })
      .from(institutionalStaffMembers)
      .where(eq(institutionalStaffMembers.userId, ctx.user.id));
    
    let linkedInstIds = userStaffLinks
      .map((l) => l.instId)
      .filter((id): id is number => id !== null);

    // If the user has no official links, find institutions where they have registered for any CPD event
    if (linkedInstIds.length === 0 && rows.length > 0) {
      const attendedInstIds = new Set<number>();
      for (const r of rows) {
        // Find matching cpdAttendee record to get the institutionalAccountId
        const attendee = await db
          .select({ instId: cpdAttendees.institutionalAccountId })
          .from(cpdAttendees)
          .where(eq(cpdAttendees.id, r.attendeeId))
          .limit(1);
        if (attendee[0]?.instId) {
          attendedInstIds.add(attendee[0].instId);
        }
      }
      linkedInstIds = Array.from(attendedInstIds);
    }

    let totalCnes = 0;
    let totalCmes = 0;
    let myCnes = 0;
    let myCmes = 0;

    if (linkedInstIds.length > 0) {
      // Find all cpdEvents hosted by these institutions
      const instEvents = await db
        .select({ id: cpdEvents.id, eventType: cpdEvents.eventType })
        .from(cpdEvents)
        .where(
          and(
            inArray(cpdEvents.institutionalAccountId, linkedInstIds),
            eq(cpdEvents.isOpen, false) // only count completed/closed events that could have been attended
          )
        );

      totalCnes = instEvents.filter((e) => e.eventType === "cne").length;
      totalCmes = instEvents.filter((e) => e.eventType === "cme").length;

      const instEventIds = instEvents.map((e) => e.id);
      if (instEventIds.length > 0) {
        // Count how many of these specific events the user has attended
        const myAttendedRows = await db
          .select({ eventId: cpdAttendees.cpdEventId })
          .from(cpdAttendees)
          .where(
            and(
              sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`,
              inArray(cpdAttendees.cpdEventId, instEventIds)
            )
          );

        for (const row of myAttendedRows) {
          const ev = instEvents.find((e) => e.id === row.eventId);
          if (ev?.eventType === "cne") myCnes++;
          else if (ev?.eventType === "cme") myCmes++;
        }
      }
    }

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
      attendanceStats: {
        totalCnes,
        totalCmes,
        myCnes,
        myCmes,
      },
    };
  }),

  /**
   * Provider: show institutions where this account has attended CPD and the
   * current institution-link state. A signed-in CPD attendee is automatically
   * linked as general staff unless an institution administrator has explicitly
   * suspended, ended, rejected, or removed the relationship.
   */
  getMyFacilityLinkOptions: protectedProcedure.query(async ({ ctx }) => {
    const email = (ctx.user.email ?? "").trim().toLowerCase();
    if (!email) return [];
    const db = await requireDb();
    await autoLinkCpdFacilitiesForUser(db, { userId: ctx.user.id, email });
    const attendeeRows = await db
      .select({
        attendeeId: cpdAttendees.id,
        institutionalAccountId: cpdAttendees.institutionalAccountId,
        institutionName: institutionalAccounts.companyName,
        department: cpdAttendees.department,
        facilityDepartmentId: cpdAttendees.facilityDepartmentId,
        cadre: cpdAttendees.cadre,
        cadreOther: cpdAttendees.cadreOther,
        attendanceType: cpdAttendees.attendanceType,
      })
      .from(cpdAttendees)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, cpdAttendees.institutionalAccountId))
      .where(sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`)
      .orderBy(desc(cpdAttendees.id));

    const latestByInstitution = new Map<number, (typeof attendeeRows)[number]>();
    for (const row of attendeeRows) {
      if (!latestByInstitution.has(row.institutionalAccountId)) latestByInstitution.set(row.institutionalAccountId, row);
    }
    const institutionIds = [...latestByInstitution.keys()];
    if (institutionIds.length === 0) return [];

    const staffRows = await db
      .select({
        id: institutionalStaffMembers.id,
        institutionalAccountId: institutionalStaffMembers.institutionalAccountId,
        userId: institutionalStaffMembers.userId,
        staffEmail: institutionalStaffMembers.staffEmail,
        facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
        removedAt: institutionalStaffMembers.removedAt,
      })
      .from(institutionalStaffMembers)
      .where(and(
        inArray(institutionalStaffMembers.institutionalAccountId, institutionIds),
        or(eq(institutionalStaffMembers.userId, ctx.user.id), eq(institutionalStaffMembers.staffEmail, email)),
      ));
    const memberships = await db
      .select({
        id: institutionMemberships.id,
        institutionalAccountId: institutionMemberships.institutionalAccountId,
        membershipStatus: institutionMemberships.membershipStatus,
        userId: institutionMemberships.userId,
        invitedEmail: institutionMemberships.invitedEmail,
      })
      .from(institutionMemberships)
      .where(and(
        inArray(institutionMemberships.institutionalAccountId, institutionIds),
        or(eq(institutionMemberships.userId, ctx.user.id), eq(institutionMemberships.invitedEmail, email)),
      ));

    return institutionIds.map((institutionId) => {
      const attendee = latestByInstitution.get(institutionId)!;
      const staff = staffRows
        .filter((row) => row.institutionalAccountId === institutionId)
        .sort((a, b) => Number(b.facilityLinkStatus === "linked") - Number(a.facilityLinkStatus === "linked"))[0];
      const membership = memberships
        .filter((row) => row.institutionalAccountId === institutionId)
        .sort((a, b) => Number(b.membershipStatus === "active") - Number(a.membershipStatus === "active"))[0];
      const eligibleRn = isRegisteredRnProfile({
        providerType: ctx.user.providerType,
        cadre: attendee.cadre,
        cadreOther: attendee.cadreOther,
      });
      const linked = staff?.facilityLinkStatus === "linked" && membership?.membershipStatus === "active";
      return {
        institutionId,
        institutionName: attendee.institutionName,
        department: attendee.department,
        facilityDepartmentId: attendee.facilityDepartmentId,
        latestAttendanceId: attendee.attendeeId,
        latestAttendanceType: attendee.attendanceType,
        facilityLinkStatus: staff?.facilityLinkStatus ?? null,
        membershipStatus: membership?.membershipStatus ?? null,
        eligibleRn,
        canConfirmPermanent: eligibleRn && !linked && staff?.removedAt == null && membership?.membershipStatus !== "suspended" && membership?.membershipStatus !== "ended",
      };
    });
  }),

  /** Provider: confirm a prior CPD host as the current permanent facility. */
  confirmPermanentFacilityFromCpd: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const email = (ctx.user.email ?? "").trim().toLowerCase();
      if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no email address configured." });
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.attendance.operate");

      const [attendee] = await db
        .select({
          fullName: cpdAttendees.fullName,
          email: cpdAttendees.email,
          phone: cpdAttendees.phone,
          cadre: cpdAttendees.cadre,
          cadreOther: cpdAttendees.cadreOther,
          department: cpdAttendees.department,
          facilityDepartmentId: cpdAttendees.facilityDepartmentId,
        })
        .from(cpdAttendees)
        .where(and(
          eq(cpdAttendees.institutionalAccountId, input.institutionId),
          sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`,
        ))
        .orderBy(desc(cpdAttendees.id))
        .limit(1);
      if (!attendee) throw new TRPCError({ code: "NOT_FOUND", message: "No CPD attendance record was found for this hospital and account." });

      if (!isRegisteredRnProfile({ providerType: ctx.user.providerType, cadre: attendee.cadre, cadreOther: attendee.cadreOther })) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Permanent facility self-linking is available only to registered non-student Staff/RN profiles." });
      }

      const result = await applyCpdFacilityRelationship(db, {
        institutionalAccountId: input.institutionId,
        userId: ctx.user.id,
        staffName: attendee.fullName,
        staffEmail: email,
        staffPhone: attendee.phone,
        providerType: ctx.user.providerType,
        cadre: attendee.cadre,
        cadreOther: attendee.cadreOther,
        department: attendee.department,
        facilityDepartmentId: attendee.facilityDepartmentId,
        relationship: "permanent_facility",
      });
      return {
        success: true as const,
        ...result,
      };
    }),

  /** Admin: Institutional CPD Analytics Dashboard */
  getInstitutionalCpdAnalytics: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.reports.read");
      const access = await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator", "cpd_education_coordinator", "cpd_reviewer", "cpd_reporter", "cpd_viewer"]);

      const allEvents = await db
        .select()
        .from(cpdEvents)
        .where(eq(cpdEvents.institutionalAccountId, input.institutionId))
        .orderBy(desc(cpdEvents.id));

      const allAttendees = await db
        .select()
        .from(cpdAttendees)
        .where(eq(cpdAttendees.institutionalAccountId, input.institutionId))
        .orderBy(desc(cpdAttendees.id));
      const events = access.departmentIds
        ? allEvents.filter(event => event.facilityDepartmentId == null || access.departmentIds?.includes(event.facilityDepartmentId))
        : allEvents;
      const attendees = access.departmentIds
        ? allAttendees.filter(attendee => attendee.facilityDepartmentId != null && access.departmentIds?.includes(attendee.facilityDepartmentId))
        : allAttendees;
      const facilityDepartmentNames = await loadFacilityDepartmentNames(db, input.institutionId);
      const canonicalDepartmentForAttendance = (attendee: typeof attendees[number]) =>
        getCanonicalAttendeeDepartment(attendee, facilityDepartmentNames);

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
        const dept = canonicalDepartmentForAttendance(a) || "Unassigned";
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

      // Fetch institutional staff roster
      const allStaffMembers = await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));
      const staffMembers = access.departmentIds
        ? allStaffMembers.filter(member => member.facilityDepartmentId != null && access.departmentIds?.includes(member.facilityDepartmentId))
        : allStaffMembers;

      const staffMap: Record<string, {
        fullName: string;
        email: string;
        cadre: string;
        department: string;
        cneAttended: number;
        cmeAttended: number;
        totalAttended: number;
        lastSignIn: Date | string;
        isLocum: boolean;
      }> = {};

      const getRoleDisplayName = (role: string) => {
        if (role === "doctor") return "Doctor";
        if (role === "nurse") return "Nurse";
        if (role === "paramedic") return "Paramedic";
        if (role === "midwife") return "Midwife";
        if (role === "lab_tech") return "Lab Technician";
        if (role === "respiratory_therapist") return "Respiratory Therapist";
        if (role === "support_staff") return "Support Staff";
        return "Other";
      };

      // Populate map with all roster staff (initially 0 attendance)
      for (const sm of staffMembers) {
        const key = sm.staffEmail.toLowerCase().trim();
        staffMap[key] = {
          fullName: sm.staffName,
          email: sm.staffEmail,
          cadre: getRoleDisplayName(sm.staffRole),
          department: sm.facilityDepartmentId != null
            ? facilityDepartmentNames.get(sm.facilityDepartmentId) ?? sm.department ?? "Unassigned"
            : sm.department || "Unassigned",
          cneAttended: 0,
          cmeAttended: 0,
          totalAttended: 0,
          lastSignIn: "Never",
          isLocum: false,
        };
      }

      // Populate attendance count from cpdAttendees
      for (const a of attendees) {
        const key = a.email.toLowerCase().trim();
        const ev = events.find((e) => e.id === a.cpdEventId);
        const isCne = ev?.eventType === "cne";
        const isCme = ev?.eventType === "cme";

        if (!staffMap[key]) {
          // Locum or Outreach clinician (not in roster)
          staffMap[key] = {
            fullName: a.fullName,
            email: a.email,
            cadre: a.cadre || "Clinician",
            department: canonicalDepartmentForAttendance(a) || "Unassigned",
            cneAttended: 0,
            cmeAttended: 0,
            totalAttended: 0,
            lastSignIn: a.submittedAt || "Never",
            isLocum: true,
          };
        }

        if (isCne) staffMap[key].cneAttended++;
        if (isCme) staffMap[key].cmeAttended++;
        staffMap[key].totalAttended++;
        
        // Update lastSignIn with the latest attendance timestamp
        if (a.submittedAt) {
          const currentLast = staffMap[key].lastSignIn;
          if (currentLast === "Never" || new Date(a.submittedAt) > new Date(currentLast)) {
            staffMap[key].lastSignIn = a.submittedAt;
          }
        }
      }

      // Compute Role-based Engagement Metrics (for registered staff members)
      const roleEngagementStats: Record<string, {
        label: string;
        totalStaff: number;
        cneParticipants: number;
        cmeParticipants: number;
        cpdParticipants: number;
      }> = {
        nurse: { label: "Nurses", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        doctor: { label: "Doctors", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        paramedic: { label: "Paramedics", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        midwife: { label: "Midwives", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        lab_tech: { label: "Lab Technicians", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        respiratory_therapist: { label: "Respiratory Therapists", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        support_staff: { label: "Support Staff", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
        other: { label: "Other Staff", totalStaff: 0, cneParticipants: 0, cmeParticipants: 0, cpdParticipants: 0 },
      };

      for (const sm of staffMembers) {
        const role = sm.staffRole || "other";
        const stats = roleEngagementStats[role] || roleEngagementStats.other;
        stats.totalStaff++;

        const key = sm.staffEmail.toLowerCase().trim();
        const attendance = staffMap[key];
        if (attendance) {
          if (attendance.cneAttended > 0) stats.cneParticipants++;
          if (attendance.cmeAttended > 0) stats.cmeParticipants++;
          if (attendance.totalAttended > 0) stats.cpdParticipants++;
        }
      }

      const roleEngagement = Object.entries(roleEngagementStats).map(([role, s]) => {
        const cneRate = s.totalStaff > 0 ? Math.round((s.cneParticipants / s.totalStaff) * 100) : 0;
        const cmeRate = s.totalStaff > 0 ? Math.round((s.cmeParticipants / s.totalStaff) * 100) : 0;
        const cpdRate = s.totalStaff > 0 ? Math.round((s.cpdParticipants / s.totalStaff) * 100) : 0;
        return {
          role,
          label: s.label,
          totalStaff: s.totalStaff,
          cneParticipants: s.cneParticipants,
          cmeParticipants: s.cmeParticipants,
          cpdParticipants: s.cpdParticipants,
          cneRate,
          cmeRate,
          cpdRate,
        };
      });

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
        roleEngagement,
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
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);

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
