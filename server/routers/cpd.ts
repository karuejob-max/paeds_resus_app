import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, or, like, sql, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { assertInstitutionProductCapability } from "../lib/institution-entitlements";
import { assertInstitutionProductRole, type InstitutionalProductRoleKey } from "../lib/institution-product-roles";
import {
  institutionalAccounts,
  cpdEvents,
  cpdEventCoPresenters,
  cpdAttendees,
  cpdEventQuizzes,
  cpdEventQuizQuestions,
  cpdAttendeeQuizAttempts,
  cpdCodeRevealLogs,
  cpdAttendanceAuditEvents,
  cpdEventAuditEvents,
  cpdExportAuditLogs,
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
import { canRegisterForEvent, canReviewAttendanceTransition, countsAsVerifiedAttendance, isAudienceEligible } from "../lib/cpd-contract";
import { bestCpdQuizAttemptPassed, scoreCpdQuiz, type CpdQuizAnswer } from "../lib/cpd-quiz";

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
    isInstitutionMember: true,
  };
}

async function resolvePresenterForInstitution(
  db: any,
  institutionId: number,
  userId: number,
  overrides?: { name?: string | null; cadre?: string | null; cadreOther?: string | null; department?: string | null },
) {
  const member = await resolveActiveInstitutionPresenter(db, institutionId, userId);
  if (member) return member;

  const [platformUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      cadre: users.cadre,
      cadreOther: users.cadreOther,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!platformUser) return null;

  return {
    userId: platformUser.id,
    fullName: overrides?.name?.trim() || platformUser.name?.trim() || platformUser.email?.trim() || "Paeds Resus account holder",
    email: platformUser.email?.trim() || "",
    cadre: overrides?.cadre?.trim() || platformUser.cadre?.trim() || null,
    cadreOther: overrides?.cadreOther?.trim() || platformUser.cadreOther?.trim() || null,
    department: overrides?.department?.trim() || null,
    facilityDepartmentId: null,
    isInstitutionMember: false,
  };
}

export function getCpdAttendeeRole(
  presenterUserId: number | null | undefined,
  coPresenterUserIds: readonly number[],
  registeringUserId: number,
): "attendee" | "presenter" | "co_presenter" {
  if (presenterUserId === registeringUserId) return "presenter";
  return coPresenterUserIds.includes(registeringUserId) ? "co_presenter" : "attendee";
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
        query: z.string().trim().max(100).default(""),
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
      const normalizedQuery = input.query.trim().toLowerCase();
      const q = `%${normalizedQuery}%`;
      const searchCondition = normalizedQuery
        ? or(
            like(sql`LOWER(${users.name})`, q),
            like(sql`LOWER(${users.email})`, q),
            like(sql`LOWER(${institutionalStaffMembers.staffName})`, q),
            like(sql`LOWER(${institutionalStaffMembers.staffEmail})`, q),
          )
        : undefined;

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
            searchCondition,
            access.departmentIds
              ? inArray(institutionalStaffMembers.facilityDepartmentId, access.departmentIds)
              : undefined
          )
        )
        .limit(10);

      const staffMatches = await db
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
        .from(institutionalStaffMembers)
        .innerJoin(users, eq(users.id, institutionalStaffMembers.userId))
        .where(
          and(
            eq(institutionalStaffMembers.institutionalAccountId, institutionId),
            sql`${institutionalStaffMembers.removedAt} IS NULL`,
            searchCondition,
            access.departmentIds
              ? inArray(institutionalStaffMembers.facilityDepartmentId, access.departmentIds)
              : undefined,
          ),
        )
        .limit(50);

      const memberRows = Array.from(
        new Map(
          [...userMatches, ...staffMatches].map(row => [row.id, row]),
        ).values(),
      );
      const memberResults = memberRows.map((u) => ({
        id: u.id,
        fullName: u.staffName || u.userName || u.staffEmail || u.userEmail || "Unknown Clinician",
        email: u.staffEmail || u.userEmail || "",
        cadre: u.userCadre || u.staffRole || null,
        cadreOther: u.userCadreOther || null,
        department: u.department || null,
        facilityDepartmentId: u.facilityDepartmentId ?? null,
        isInstitutionMember: true as const,
      }));
      if (access.departmentIds !== null) return memberResults;

      const memberIds = new Set(memberResults.map(member => member.id));
      if (!normalizedQuery) return memberResults;

      const platformMatches = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          cadre: users.cadre,
          cadreOther: users.cadreOther,
        })
        .from(users)
        .where(or(
          like(sql`LOWER(${users.name})`, q),
          like(sql`LOWER(${users.email})`, q),
        ))
        .limit(50);
      const platformResults = platformMatches
        .filter(user => !memberIds.has(user.id))
        .map(user => ({
          id: user.id,
          fullName: user.name || user.email || "Paeds Resus account holder",
          email: user.email || "",
          cadre: user.cadre || null,
          cadreOther: user.cadreOther || null,
          department: null,
          facilityDepartmentId: null,
          isInstitutionMember: false as const,
        }));
      return [...memberResults, ...platformResults].slice(0, 50);
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
      const presenter = await resolvePresenterForInstitution(
        db,
        input.institutionId,
        input.presenterUserId,
        {
          name: input.presenterName,
          cadre: input.presenterCadre,
          cadreOther: input.presenterCadreOther,
          department: input.presenterDepartment,
        },
      );
      if (!presenter) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a valid Paeds Resus account as the presenter.",
        });
      }
      const now = new Date();
      const result = await db.insert(cpdEvents).values({
        institutionalAccountId: input.institutionId,
        name: input.name,
        eventDate: input.eventDate,
        isOpen: true,
        lifecycleStatus: "open",
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
      await db.insert(cpdEventAuditEvents).values({
        institutionalAccountId: input.institutionId,
        cpdEventId: eventId,
        action: "created",
        previousStatus: null,
        nextStatus: "open",
        reason: "CPD session created",
        changedFields: JSON.stringify(["name", "eventDate", "presenter", "audience", "cpdPoints"]),
        actorUserId: ctx.user.id,
      });

      if (presenter.isInstitutionMember) {
        if (presenter.department) {
          await syncUserProfileDepartment(db, presenter.userId, presenter.department);
        }
        if (presenter.cadre) {
          await syncUserCadre(db, presenter.userId, presenter.cadre, presenter.cadreOther);
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
      let shouldSyncPresenterAccount = false;
      if (input.eventType !== undefined) updateData.eventType = input.eventType;
      if (input.presenterUserId !== undefined) {
        updateData.presenterUserId = input.presenterUserId;
        if (input.presenterUserId != null) {
          const presenter = await resolvePresenterForInstitution(
            db,
            input.institutionId,
            input.presenterUserId,
            {
              name: input.presenterName,
              cadre: input.presenterCadre,
              cadreOther: input.presenterCadreOther,
              department: input.presenterDepartment,
            },
          );
          if (!presenter) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Choose a valid Paeds Resus account as the presenter.",
            });
          }
          shouldSyncPresenterAccount = presenter.isInstitutionMember;
          updateData.presenterName = presenter.fullName;
          updateData.presenterCadre = presenter.cadre
            ? formatEventPresenterCadre(presenter.cadre, presenter.cadreOther)
            : null;
          updateData.presenterDepartment = presenter.department;
        } else {
          updateData.presenterName = null;
          updateData.presenterCadre = null;
          updateData.presenterDepartment = null;
        }
      } else {
        // Metadata-only edits remain available for historical sessions whose original
        // presenter was recorded before member IDs existed.
        if (input.presenterName !== undefined) updateData.presenterName = input.presenterName;
        if (input.presenterCadre !== undefined) {
          updateData.presenterCadre = formatEventPresenterCadre(input.presenterCadre, input.presenterCadreOther ?? null);
        }
        if (input.presenterDepartment !== undefined) updateData.presenterDepartment = input.presenterDepartment;
      }
      if (input.cpdPoints !== undefined) updateData.cpdPoints = input.cpdPoints ? String(input.cpdPoints) : null;
      if (input.approvingCouncil !== undefined) updateData.approvingCouncil = input.approvingCouncil;

      await db.update(cpdEvents).set(updateData).where(eq(cpdEvents.id, input.eventId));
      if (Object.keys(updateData).length > 0) {
        await db.insert(cpdEventAuditEvents).values({
          institutionalAccountId: input.institutionId,
          cpdEventId: input.eventId,
          action: input.presenterUserId !== undefined ? "presenter_changed" : "updated",
          previousStatus: null,
          nextStatus: null,
          reason: "CPD session details updated",
          changedFields: JSON.stringify(Object.keys(updateData)),
          actorUserId: ctx.user.id,
        });
      }

      // Resolve final presenterUserId, presenterDepartment to sync
      const [finalEvent] = await db
        .select({
          presenterUserId: cpdEvents.presenterUserId,
          presenterDepartment: cpdEvents.presenterDepartment,
        })
        .from(cpdEvents)
        .where(eq(cpdEvents.id, input.eventId))
        .limit(1);

      if (shouldSyncPresenterAccount && finalEvent?.presenterUserId) {
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
        .select({ id: cpdEvents.id, lifecycleStatus: cpdEvents.lifecycleStatus })
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
      const attendeeRows = await db
        .select({ attendanceStatus: cpdAttendees.attendanceStatus })
        .from(cpdAttendees)
        .where(eq(cpdAttendees.cpdEventId, input.eventId));
      const hasUnresolvedAttendance = attendeeRows.some(row => !["attendance_verified", "excused", "cancelled"].includes(row.attendanceStatus));
      const nextStatus = hasUnresolvedAttendance ? "attendance_review" : "closed";
      await db
        .update(cpdEvents)
        .set({ isOpen: false, lifecycleStatus: nextStatus, closedAt: new Date() })
        .where(eq(cpdEvents.id, input.eventId));
      await db.insert(cpdEventAuditEvents).values({
        institutionalAccountId: input.institutionId,
        cpdEventId: input.eventId,
        action: hasUnresolvedAttendance ? "attendance_review" : "closed",
        previousStatus: event.lifecycleStatus,
        nextStatus,
        reason: hasUnresolvedAttendance ? "Session closed for attendance review" : "Session closed after attendance resolution",
        actorUserId: ctx.user.id,
      });
      return { success: true as const, lifecycleStatus: nextStatus };
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
          lifecycleStatus: cpdEvents.lifecycleStatus,
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
          verifiedAttendanceCount: sql<number>`SUM(CASE WHEN ${cpdAttendees.attendanceStatus} = 'attendance_verified' THEN 1 ELSE 0 END)`.mapWith(Number),
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
    .input(z.object({ institutionId: z.number().int().positive(), eventId: z.number().int().positive().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const [event] = await db
        .select({
          id: cpdEvents.id,
          name: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
          institutionalAccountId: cpdEvents.institutionalAccountId,
          lifecycleStatus: cpdEvents.lifecycleStatus,
          isOpen: cpdEvents.isOpen,
          audienceScope: cpdEvents.audienceScope,
          audienceLabel: cpdEvents.audienceLabel,
          facilityDepartmentId: cpdEvents.facilityDepartmentId,
        })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.institutionalAccountId, input.institutionId),
            input.eventId ? eq(cpdEvents.id, input.eventId) : eq(cpdEvents.isOpen, true),
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

      let myAttendee: {
        attendeeId: number;
        attendanceStatus: string;
        checkedInAt: Date | null;
        attendanceVerifiedAt: Date | null;
      } | null = null;
      if (ctx.user?.id) {
        const signedInEmail = (ctx.user.email ?? "").trim().toLowerCase();
        const [attendee] = await db
          .select({
            attendeeId: cpdAttendees.id,
            attendanceStatus: cpdAttendees.attendanceStatus,
            checkedInAt: cpdAttendees.checkedInAt,
            attendanceVerifiedAt: cpdAttendees.attendanceVerifiedAt,
          })
          .from(cpdAttendees)
          .where(and(
            eq(cpdAttendees.cpdEventId, event.id),
            or(
              eq(cpdAttendees.userId, ctx.user.id),
              sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${signedInEmail}))`,
            ),
          ))
          .orderBy(desc(cpdAttendees.id))
          .limit(1);
        if (attendee) myAttendee = attendee;
      }

      const [eventQuiz] = await db
        .select({
          id: cpdEventQuizzes.id,
          passingScore: cpdEventQuizzes.passingScore,
          isRequired: cpdEventQuizzes.isRequired,
        })
        .from(cpdEventQuizzes)
        .where(eq(cpdEventQuizzes.cpdEventId, event.id))
        .limit(1);
      let quiz: {
        id: number;
        passingScore: number;
        isRequired: boolean;
        questions: Array<{ id: number; question: string; questionType: "multiple_choice" | "true_false"; options: string[] }>;
        bestAttempt: { score: number; passed: boolean } | null;
      } | null = null;
      if (eventQuiz) {
        const questionRows = await db
          .select({
            id: cpdEventQuizQuestions.id,
            question: cpdEventQuizQuestions.question,
            questionType: cpdEventQuizQuestions.questionType,
            options: cpdEventQuizQuestions.options,
          })
          .from(cpdEventQuizQuestions)
          .where(eq(cpdEventQuizQuestions.cpdEventQuizId, eventQuiz.id))
          .orderBy(asc(cpdEventQuizQuestions.order), asc(cpdEventQuizQuestions.id));
        const attemptRows = myAttendee
          ? await db
              .select({ score: cpdAttendeeQuizAttempts.score, passed: cpdAttendeeQuizAttempts.passed })
              .from(cpdAttendeeQuizAttempts)
              .where(and(
                eq(cpdAttendeeQuizAttempts.cpdAttendeeId, myAttendee.attendeeId),
                eq(cpdAttendeeQuizAttempts.cpdEventQuizId, eventQuiz.id),
              ))
              .orderBy(desc(cpdAttendeeQuizAttempts.score), desc(cpdAttendeeQuizAttempts.id))
          : [];
        quiz = {
          id: eventQuiz.id,
          passingScore: eventQuiz.passingScore,
          isRequired: eventQuiz.isRequired,
          questions: questionRows.map(row => {
            let options: string[] = [];
            try {
              const parsed = row.options ? JSON.parse(row.options) : [];
              if (Array.isArray(parsed)) options = parsed.map(value => String(value));
            } catch {
              options = [];
            }
            return { id: row.id, question: row.question, questionType: row.questionType, options };
          }),
          bestAttempt: attemptRows[0] ?? null,
        };
      }

      return {
        event: {
          id: event.id,
          name: event.name,
          eventDate: event.eventDate,
          lifecycleStatus: event.lifecycleStatus,
          isOpen: event.isOpen,
          audienceScope: event.audienceScope,
          audienceLabel: event.audienceLabel,
          facilityDepartmentId: event.facilityDepartmentId,
          institutionName: inst?.institutionName ?? null,
        },
        userDepartment,
        userFacilityDepartmentId,
        registrationDepartments,
        myAttendee,
        quiz,
      };
    }),

  createEventQuiz: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      eventId: z.number().int().positive(),
      passingScore: z.number().int().min(1).max(100).default(80),
      isRequired: z.boolean().default(true),
      questions: z.array(z.object({
        question: z.string().trim().min(3).max(2000),
        questionType: z.enum(["multiple_choice", "true_false"]),
        options: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
        correctAnswer: z.string().trim().min(1).max(500),
      })).min(1).max(50),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      const access = await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
      const [event] = await db
        .select({ id: cpdEvents.id, facilityDepartmentId: cpdEvents.facilityDepartmentId })
        .from(cpdEvents)
        .where(and(eq(cpdEvents.id, input.eventId), eq(cpdEvents.institutionalAccountId, input.institutionId)))
        .limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "CPD event not found." });
      if (access.departmentIds && (event.facilityDepartmentId == null || !access.departmentIds.includes(event.facilityDepartmentId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can author quizzes only for your assigned department(s)." });
      }
      const normalizedQuestions = input.questions.map((question, index) => {
        const options = question.questionType === "true_false" ? ["true", "false"] : Array.from(new Set(question.options));
        if (question.questionType === "multiple_choice" && options.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Question ${index + 1} needs at least two answer options.` });
        }
        if (!options.some(option => option.toLowerCase() === question.correctAnswer.toLowerCase())) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Question ${index + 1} must include its correct answer in the options.` });
        }
        return { ...question, options, correctAnswer: question.correctAnswer.trim() };
      });
      const [existingQuiz] = await db
        .select({ id: cpdEventQuizzes.id })
        .from(cpdEventQuizzes)
        .where(eq(cpdEventQuizzes.cpdEventId, input.eventId))
        .limit(1);
      let quizId = existingQuiz?.id;
      if (quizId) {
        await db.update(cpdEventQuizzes).set({ passingScore: input.passingScore, isRequired: input.isRequired, updatedAt: new Date() }).where(eq(cpdEventQuizzes.id, quizId));
        await db.delete(cpdEventQuizQuestions).where(eq(cpdEventQuizQuestions.cpdEventQuizId, quizId));
      } else {
        const result = await db.insert(cpdEventQuizzes).values({ cpdEventId: input.eventId, passingScore: input.passingScore, isRequired: input.isRequired });
        quizId = Number((result as unknown as { insertId: number }).insertId);
      }
      await db.insert(cpdEventQuizQuestions).values(normalizedQuestions.map((question, index) => ({
        cpdEventQuizId: quizId as number,
        question: question.question,
        questionType: question.questionType,
        options: JSON.stringify(question.options),
        correctAnswer: question.correctAnswer,
        order: index,
      })));
      return { success: true as const, quizId };
    }),

  submitQuizAttempt: protectedProcedure
    .input(z.object({
      attendeeId: z.number().int().positive(),
      cpdEventQuizId: z.number().int().positive(),
      answers: z.record(z.string(), z.union([z.string(), z.number()])),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [row] = await db
        .select({
          attendeeId: cpdAttendees.id,
          eventId: cpdAttendees.cpdEventId,
          userId: cpdAttendees.userId,
          email: cpdAttendees.email,
          quizId: cpdEventQuizzes.id,
          passingScore: cpdEventQuizzes.passingScore,
        })
        .from(cpdAttendees)
        .innerJoin(cpdEventQuizzes, eq(cpdEventQuizzes.cpdEventId, cpdAttendees.cpdEventId))
        .where(and(
          eq(cpdAttendees.id, input.attendeeId),
          eq(cpdEventQuizzes.id, input.cpdEventQuizId),
        ))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz or attendance registration not found." });
      const signedInEmail = (ctx.user.email ?? "").trim().toLowerCase();
      if (row.userId !== ctx.user.id && (!signedInEmail || row.email.trim().toLowerCase() !== signedInEmail)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can submit only your own CPD quiz attempt." });
      }
      const questions = await db
        .select({ id: cpdEventQuizQuestions.id, questionType: cpdEventQuizQuestions.questionType, correctAnswer: cpdEventQuizQuestions.correctAnswer })
        .from(cpdEventQuizQuestions)
        .where(eq(cpdEventQuizQuestions.cpdEventQuizId, row.quizId))
        .orderBy(asc(cpdEventQuizQuestions.order), asc(cpdEventQuizQuestions.id));
      const result = scoreCpdQuiz(questions, input.answers as Record<string, CpdQuizAnswer>, row.passingScore);
      await db.insert(cpdAttendeeQuizAttempts).values({
        cpdAttendeeId: row.attendeeId,
        cpdEventQuizId: row.quizId,
        score: result.score,
        passed: result.passed,
        answers: JSON.stringify(input.answers),
      });
      return result;
    }),

  /** Submit a CPD registration. Validates the event is open, matches the visitor session, and dedupes by email + event. */
  submitRegistration: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive().optional(),
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

      // Resolve one exact event. Legacy links remain compatible only while exactly one event is open.
      const openEvents = await db
        .select({
          id: cpdEvents.id,
          presenterUserId: cpdEvents.presenterUserId,
          isOpen: cpdEvents.isOpen,
          lifecycleStatus: cpdEvents.lifecycleStatus,
          audienceScope: cpdEvents.audienceScope,
          audienceLabel: cpdEvents.audienceLabel,
          facilityDepartmentId: cpdEvents.facilityDepartmentId,
        })
        .from(cpdEvents)
        .where(and(
          eq(cpdEvents.institutionalAccountId, input.institutionId),
          input.eventId ? eq(cpdEvents.id, input.eventId) : eq(cpdEvents.isOpen, true),
        ))
        .orderBy(desc(cpdEvents.id))
        .limit(20);
      if (!openEvents.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Registration is closed. No CPD event is currently open." });
      }
      if (!input.eventId && openEvents.length > 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This institution has multiple open CPD sessions. Use the event-specific QR code or link." });
      }
      const event = openEvents[0];
      if (!canRegisterForEvent(event.lifecycleStatus, event.isOpen ?? true)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This CPD event is not open for registration." });
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

      if (!isAudienceEligible({
        audienceScope: event.audienceScope,
        audienceLabel: event.audienceLabel,
        attendeeCadre: input.cadre,
        attendeeDepartmentId: resolvedFacilityDepartmentId,
        eventDepartmentId: event.facilityDepartmentId,
      })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This CPD session is not open to the selected department or cadre.",
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
      const attendanceType: "primary_facility" | "locum_outreach" = input.facilityRelationship === "permanent_facility"
        ? "primary_facility"
        : "locum_outreach";
      const coPresenterRows = await db
        .select({ userId: cpdEventCoPresenters.userId })
        .from(cpdEventCoPresenters)
        .where(eq(cpdEventCoPresenters.cpdEventId, event.id));
      const roleInEvent = getCpdAttendeeRole(
        event.presenterUserId,
        coPresenterRows.map(row => row.userId).filter((userId): userId is number => userId != null),
        ctx.user.id,
      );

      const registrationResult = await db.insert(cpdAttendees).values({
        cpdEventId: event.id,
        institutionalAccountId: input.institutionId,
        userId: ctx.user.id,
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        cadre: input.cadre,
        cadreOther: requiresOther ? input.cadreOther?.trim() ?? null : null,
        higherDiploma: null,
        department: resolvedDepartment,
        facilityDepartmentId: resolvedFacilityDepartmentId,
        attendanceType,
        roleInEvent,
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

      // A locum/outreach registration belongs in facility history only; it must not
      // overwrite the user's permanent profile department.
      if (input.facilityRelationship === "permanent_facility") {
        await syncUserProfileDepartment(db, ctx.user.id, resolvedDepartment);
      }

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
        attendeeId: Number((registrationResult as unknown as { insertId: number }).insertId),
        eventId: event.id,
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
      await db.insert(cpdExportAuditLogs).values({
        institutionalAccountId: input.institutionId,
        eventId: input.eventId ?? null,
        exportType: "attendance_csv",
        includesContactData: true,
        rowCount: scopedRows.length,
        actorUserId: ctx.user.id,
      });
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
        .select({ id: cpdEvents.id, lifecycleStatus: cpdEvents.lifecycleStatus, isOpen: cpdEvents.isOpen })
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
      if (["closed", "certificates_issued", "archived", "cancelled", "voided"].includes(event.lifecycleStatus ?? "")) {
        throw new TRPCError({ code: "CONFLICT", message: "Check-in codes cannot be changed after a CPD session is closed." });
      }
      await db
        .update(cpdEvents)
        .set({ cpdCode: input.cpdCode })
        .where(eq(cpdEvents.id, input.eventId));
      await db.insert(cpdEventAuditEvents).values({
        institutionalAccountId: input.institutionId,
        cpdEventId: input.eventId,
        action: "updated",
        previousStatus: event.lifecycleStatus,
        nextStatus: event.lifecycleStatus,
        reason: input.cpdCode ? "CPD check-in code rotated" : "CPD check-in code cleared",
        changedFields: "cpdCode",
        actorUserId: ctx.user.id,
      });
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
            or(
              eq(cpdAttendees.userId, ctx.user.id),
              sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`
            )
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
        institutionalAccountId: cpdAttendees.institutionalAccountId,
        fullName: cpdAttendees.fullName,
        cadre: cpdAttendees.cadre,
        cadreOther: cpdAttendees.cadreOther,
        department: cpdAttendees.department,
        submittedAt: cpdAttendees.submittedAt,
        attendanceStatus: cpdAttendees.attendanceStatus,
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
      .where(or(
        eq(cpdAttendees.userId, ctx.user.id),
        sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`
      ))
      .orderBy(desc(cpdAttendees.id));
    // Find linked institutionalAccountIds for the current user from both
    // legacy roster links and active membership records.
    const userStaffLinks = await db
      .select({ instId: institutionalStaffMembers.institutionalAccountId })
      .from(institutionalStaffMembers)
      .where(eq(institutionalStaffMembers.userId, ctx.user.id));
    const membershipResult = await db
      .select({ instId: institutionMemberships.institutionalAccountId })
      .from(institutionMemberships)
      .where(and(
        eq(institutionMemberships.userId, ctx.user.id),
        eq(institutionMemberships.membershipStatus, "active")
      ));
    const userMembershipLinks = Array.isArray(membershipResult) ? membershipResult : [];
    
    let linkedInstIds = [...(Array.isArray(userStaffLinks) ? userStaffLinks : []), ...userMembershipLinks]
      .map((l) => l.instId)
      .filter((id): id is number => id !== null)
      .filter((id, index, ids) => ids.indexOf(id) === index);

    // If the user has no official links, find institutions where they have registered for any CPD event
    if (linkedInstIds.length === 0 && rows.length > 0) {
      linkedInstIds = Array.from(new Set(
        rows
          .map(row => row.institutionalAccountId)
          .filter((id): id is number => id != null)
      ));
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
              or(
                eq(cpdAttendees.userId, ctx.user.id),
                sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`
              ),
              eq(cpdAttendees.attendanceStatus, "attendance_verified"),
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
          attendanceStatus: r.attendanceStatus,
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
      .where(or(
        eq(cpdAttendees.userId, ctx.user.id),
        sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`
      ))
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
      const attendees = (access.departmentIds
        ? allAttendees.filter(attendee => attendee.facilityDepartmentId != null && access.departmentIds?.includes(attendee.facilityDepartmentId))
        : allAttendees).filter(attendee => countsAsVerifiedAttendance(attendee.attendanceStatus));
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
        const count = attendees.filter((a) => a.cpdEventId === ev.id && countsAsVerifiedAttendance(a.attendanceStatus)).length;
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

  /** Self-service: check in the signed-in user for one exact open event. */
  checkInSelf: protectedProcedure
    .input(z.object({ attendeeId: z.number().int().positive(), eventId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const email = (ctx.user.email ?? "").trim().toLowerCase();
      if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no email address configured." });
      const [row] = await db
        .select({
          attendeeId: cpdAttendees.id,
          eventId: cpdAttendees.cpdEventId,
          institutionalAccountId: cpdAttendees.institutionalAccountId,
          attendanceStatus: cpdAttendees.attendanceStatus,
          isOpen: cpdEvents.isOpen,
          lifecycleStatus: cpdEvents.lifecycleStatus,
        })
        .from(cpdAttendees)
        .innerJoin(cpdEvents, eq(cpdEvents.id, cpdAttendees.cpdEventId))
        .where(and(
          eq(cpdAttendees.id, input.attendeeId),
          eq(cpdAttendees.cpdEventId, input.eventId),
          or(
            eq(cpdAttendees.userId, ctx.user.id),
            sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${email}))`
          ),
          eq(cpdEvents.isOpen, true),
        ))
        .limit(1);
      if (!row || !canRegisterForEvent(row.lifecycleStatus, row.isOpen)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This CPD event is no longer open for check-in." });
      }
      if (row.attendanceStatus === "attendance_verified") return { success: true as const, attendanceStatus: row.attendanceStatus };
      await db.update(cpdAttendees).set({
        attendanceStatus: "checked_in",
        checkedInAt: new Date(),
      }).where(eq(cpdAttendees.id, input.attendeeId));
      await db.insert(cpdAttendanceAuditEvents).values({
        institutionalAccountId: row.institutionalAccountId,
        cpdEventId: row.eventId,
        cpdAttendeeId: row.attendeeId,
        previousStatus: row.attendanceStatus,
        nextStatus: "checked_in",
        reason: "Self-service event check-in",
        actorUserId: ctx.user.id,
      });
      return { success: true as const, attendanceStatus: "checked_in" as const };
    }),

  /** Admin/reviewer: review one attendance record; verified is the only countable state. */
  reviewAttendance: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      attendeeId: z.number().int().positive(),
      attendanceStatus: z.enum(["registered", "checked_in", "attendance_verified", "excused", "cancelled"]),
      reason: z.string().trim().min(3).max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.attendance.operate");
      const access = await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator", "cpd_education_coordinator", "cpd_reviewer"]);
      const [row] = await db
        .select({
          attendeeId: cpdAttendees.id,
          eventId: cpdAttendees.cpdEventId,
          institutionalAccountId: cpdAttendees.institutionalAccountId,
          facilityDepartmentId: cpdAttendees.facilityDepartmentId,
          previousStatus: cpdAttendees.attendanceStatus,
        })
        .from(cpdAttendees)
        .innerJoin(cpdEvents, eq(cpdEvents.id, cpdAttendees.cpdEventId))
        .where(and(
          eq(cpdAttendees.id, input.attendeeId),
          eq(cpdAttendees.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Attendance record not found." });
      if (access.departmentIds && (row.facilityDepartmentId == null || !access.departmentIds.includes(row.facilityDepartmentId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can review attendance only within your assigned departments." });
      }
      if (!canReviewAttendanceTransition(row.previousStatus, input.attendanceStatus)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This attendance record is already in a terminal state and cannot be reversed.",
        });
      }
      if (input.attendanceStatus === "attendance_verified") {
        const [requiredQuiz] = await db
          .select({ id: cpdEventQuizzes.id, passingScore: cpdEventQuizzes.passingScore })
          .from(cpdEventQuizzes)
          .where(and(eq(cpdEventQuizzes.cpdEventId, row.eventId), eq(cpdEventQuizzes.isRequired, true)))
          .limit(1);
        if (requiredQuiz) {
          const attempts = await db
            .select({ score: cpdAttendeeQuizAttempts.score, passed: cpdAttendeeQuizAttempts.passed })
            .from(cpdAttendeeQuizAttempts)
            .where(and(
              eq(cpdAttendeeQuizAttempts.cpdAttendeeId, input.attendeeId),
              eq(cpdAttendeeQuizAttempts.cpdEventQuizId, requiredQuiz.id),
            ));
          if (!bestCpdQuizAttemptPassed(attempts, requiredQuiz.passingScore)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `This session requires a passing quiz score (${requiredQuiz.passingScore}%) before attendance can be verified.`,
            });
          }
        }
      }
      const now = new Date();
      const updateData: Record<string, unknown> = {
        attendanceStatus: input.attendanceStatus,
        attendanceReviewReason: input.reason,
      };
      if (input.attendanceStatus === "checked_in") updateData.checkedInAt = now;
      if (input.attendanceStatus === "attendance_verified") {
        updateData.attendanceVerifiedAt = now;
        updateData.attendanceVerifiedByUserId = ctx.user.id;
      }
      await db.update(cpdAttendees).set(updateData).where(eq(cpdAttendees.id, input.attendeeId));
      await db.insert(cpdAttendanceAuditEvents).values({
        institutionalAccountId: row.institutionalAccountId,
        cpdEventId: row.eventId,
        cpdAttendeeId: row.attendeeId,
        previousStatus: row.previousStatus,
        nextStatus: input.attendanceStatus,
        reason: input.reason,
        actorUserId: ctx.user.id,
      });

      let eventClosed = false;
      if (["attendance_verified", "excused", "cancelled"].includes(input.attendanceStatus)) {
        const remaining = await db
          .select({ attendanceStatus: cpdAttendees.attendanceStatus })
          .from(cpdAttendees)
          .where(and(
            eq(cpdAttendees.cpdEventId, row.eventId),
            eq(cpdAttendees.institutionalAccountId, input.institutionId),
          ));
        const unresolved = remaining.some(attendee =>
          !["attendance_verified", "excused", "cancelled"].includes(attendee.attendanceStatus)
        );
        if (!unresolved) {
          await db.update(cpdEvents).set({
            lifecycleStatus: "closed",
            isOpen: false,
            closedAt: new Date(),
          }).where(and(
            eq(cpdEvents.id, row.eventId),
            eq(cpdEvents.institutionalAccountId, input.institutionId),
          ));
          await db.insert(cpdEventAuditEvents).values({
            institutionalAccountId: input.institutionId,
            cpdEventId: row.eventId,
            action: "closed",
            previousStatus: "attendance_review",
            nextStatus: "closed",
            reason: "All attendance records resolved",
            actorUserId: ctx.user.id,
          });
          eventClosed = true;
        }
      }
      return { success: true as const, attendanceStatus: input.attendanceStatus, eventClosed };
    }),

  /** Admin: archive a session without deleting registrations, attendance, or certificates. */
  archiveEvent: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), eventId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
      const [event] = await db.select({ id: cpdEvents.id, lifecycleStatus: cpdEvents.lifecycleStatus }).from(cpdEvents).where(and(eq(cpdEvents.id, input.eventId), eq(cpdEvents.institutionalAccountId, input.institutionId))).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "CPD event not found." });
      await db.update(cpdEvents).set({ isOpen: false, lifecycleStatus: "archived", closedAt: new Date() }).where(eq(cpdEvents.id, input.eventId));
      await db.insert(cpdEventAuditEvents).values({ institutionalAccountId: input.institutionId, cpdEventId: input.eventId, action: "archived", previousStatus: event.lifecycleStatus, nextStatus: "archived", reason: input.reason, actorUserId: ctx.user.id });
      return { success: true as const };
    }),

  /** Admin: void a session while preserving its full audit trail. */
  voidEvent: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), eventId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);
      const [event] = await db.select({ id: cpdEvents.id, lifecycleStatus: cpdEvents.lifecycleStatus }).from(cpdEvents).where(and(eq(cpdEvents.id, input.eventId), eq(cpdEvents.institutionalAccountId, input.institutionId))).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "CPD event not found." });
      const attendeeRows = await db
        .select({ id: cpdAttendees.id, attendanceStatus: cpdAttendees.attendanceStatus })
        .from(cpdAttendees)
        .where(and(
          eq(cpdAttendees.cpdEventId, input.eventId),
          eq(cpdAttendees.institutionalAccountId, input.institutionId),
        ));
      await db.update(cpdEvents).set({ isOpen: false, lifecycleStatus: "voided", closedAt: new Date() }).where(eq(cpdEvents.id, input.eventId));
      await db.update(cpdAttendees).set({ attendanceStatus: "cancelled", attendanceReviewReason: input.reason }).where(eq(cpdAttendees.cpdEventId, input.eventId));
      if (attendeeRows.length > 0) {
        await db.insert(cpdAttendanceAuditEvents).values(attendeeRows.map(attendee => ({
          institutionalAccountId: input.institutionId,
          cpdEventId: input.eventId,
          cpdAttendeeId: attendee.id,
          previousStatus: attendee.attendanceStatus,
          nextStatus: "cancelled",
          reason: `Session voided: ${input.reason}`,
          actorUserId: ctx.user.id,
        })));
      }
      await db.insert(cpdEventAuditEvents).values({ institutionalAccountId: input.institutionId, cpdEventId: input.eventId, action: "voided", previousStatus: event.lifecycleStatus, nextStatus: "voided", reason: input.reason, actorUserId: ctx.user.id });
      return { success: true as const };
    }),

  /**
   * Compatibility adapter: the former irreversible delete action now archives the event.
   * Registrations, attendance, certificates, and audit records are preserved.
   */
  deleteEvent: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive(),
        /** Must exactly match the event's name (trimmed, case-insensitive). */
        confirmName: z.string().trim().min(1).max(256),
        /** Kept for old clients; it is no longer used to permit data deletion. */
        confirmAttendeesPhrase: z.string().trim().optional(),
        reason: z.string().trim().min(3).max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.sessions.operate");
      await assertCpdInstitutionAccess(db, ctx.user, input.institutionId, ["cpd_coordinator"]);

      // 1. Verify the event belongs to this institution.
      const [event] = await db
        .select({ id: cpdEvents.id, name: cpdEvents.name, lifecycleStatus: cpdEvents.lifecycleStatus })
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

      // Confirm the typed name still matches to prevent acting on the wrong row.
      // The historical attendee phrase is intentionally ignored: deletion is no longer possible.
      if (input.confirmName.trim().toLowerCase() !== event.name.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event name confirmation did not match. Please type the exact event name to confirm deletion.",
        });
      }

      const reason = input.reason?.trim() || "Legacy delete action converted to archive";
      await db.update(cpdEvents).set({ isOpen: false, lifecycleStatus: "archived", closedAt: new Date() }).where(eq(cpdEvents.id, input.eventId));
      await db.insert(cpdEventAuditEvents).values({
        institutionalAccountId: input.institutionId,
        cpdEventId: input.eventId,
        action: "archived",
        previousStatus: event.lifecycleStatus,
        nextStatus: "archived",
        reason,
        actorUserId: ctx.user.id,
      });

      return { success: true as const, archived: true as const };
    }),
});

export type CpdRouter = typeof cpdRouter;
