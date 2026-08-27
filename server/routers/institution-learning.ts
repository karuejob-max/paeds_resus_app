import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  cpdAttendees,
  cpdEventCoPresenters,
  cpdEvents,
  enrollments,
  facilityDepartments,
  institutionEducationCoordinators,
  institutionDepartmentHeads,
  institutionLearningTargets,
  institutionalAccounts,
  institutionalStaffMembers,
  institutionMemberships,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { assertInstitutionAccess } from "../lib/institution-access";
import { assertInstitutionProductCapability } from "../lib/institution-entitlements";
import {
  assertInstitutionProductRole,
  type InstitutionalProductRoleKey,
} from "../lib/institution-product-roles";
import {
  buildLearningReportCsv,
  LEARNING_METRIC_KEYS,
  LEARNING_PHASES,
  LEARNING_PROGRAM_TYPES,
} from "../lib/institution-learning-analytics";
import { loadInstitutionLearningDashboard } from "../lib/institution-learning-dashboard";

const sessionEventTypes = [
  "cne",
  "cme",
  "cpd_general",
  "grand_rounds",
  "journal_club",
  "workshop",
  "m_and_m",
  "other_cadre",
] as const;
const audienceScopes = [
  "facility_wide",
  "nursing_wide",
  "clinical",
  "m_and_m",
  "other_cadre",
] as const;
const periodTypes = ["monthly", "quarterly", "annual"] as const;

async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection failed",
    });
  return db;
}

function periodFor(input: {
  periodType: "monthly" | "quarterly" | "annual";
  periodStart?: string;
  periodEnd?: string;
}) {
  if (input.periodStart && input.periodEnd)
    return {
      periodType: input.periodType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    };
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startMonth =
    input.periodType === "annual"
      ? 0
      : input.periodType === "quarterly"
        ? Math.floor(month / 3) * 3
        : month;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end =
    input.periodType === "annual"
      ? new Date(Date.UTC(year + 1, 0, 0))
      : input.periodType === "quarterly"
        ? new Date(Date.UTC(year, startMonth + 3, 0))
        : new Date(Date.UTC(year, startMonth + 1, 0));
  return {
    periodType: input.periodType,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

function parseDateOnly(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use a date in YYYY-MM-DD format.",
    });
  return value;
}

function dateOnlyAsDate(value: string): Date {
  return new Date(`${parseDateOnly(value)}T00:00:00.000Z`);
}

async function isInstitutionAdmin(db: any, user: any, institutionId: number) {
  try {
    await assertInstitutionAccess(db, user, institutionId);
    return true;
  } catch (error) {
    if (error instanceof TRPCError && error.code === "FORBIDDEN") return false;
    throw error;
  }
}

async function assertLearningAccess(
  db: any,
  user: any,
  institutionId: number,
  requiredRoles: readonly InstitutionalProductRoleKey[],
  options?: { allowDepartmentHead?: boolean }
) {
  if (await isInstitutionAdmin(db, user, institutionId))
    return {
      roleKey: "institution_admin" as const,
      departmentIds: null as number[] | null,
    };
  try {
    const role = await assertInstitutionProductRole(
      db,
      user,
      institutionId,
      "cpd_portal",
      requiredRoles
    );
    if (role.roleKey !== "cpd_education_coordinator")
      return { ...role, departmentIds: null as number[] | null };
  } catch (error) {
    if (!(error instanceof TRPCError) || error.code !== "FORBIDDEN")
      throw error;
  }
  if (options?.allowDepartmentHead) {
    const headRows = await db
      .select({ departmentId: institutionDepartmentHeads.departmentId })
      .from(institutionDepartmentHeads)
      .where(
        and(
          eq(institutionDepartmentHeads.institutionalAccountId, institutionId),
          eq(institutionDepartmentHeads.userId, user.id),
          eq(institutionDepartmentHeads.assignmentStatus, "active")
        )
      );
    if (headRows.length > 0) {
      return {
        roleKey: "cpd_department_head" as const,
        departmentIds: headRows.map((row: { departmentId: number }) => row.departmentId),
      };
    }
  }

  const coordinatorRows = await db
    .select({ departmentId: institutionEducationCoordinators.departmentId })
    .from(institutionEducationCoordinators)
    .where(
      and(
        eq(
          institutionEducationCoordinators.institutionalAccountId,
          institutionId
        ),
        eq(institutionEducationCoordinators.userId, user.id),
        eq(institutionEducationCoordinators.assignmentStatus, "active")
      )
    );
  if (
    coordinatorRows.length > 0 &&
    requiredRoles.includes("cpd_education_coordinator")
  ) {
    return {
      roleKey: "cpd_education_coordinator" as const,
      departmentIds: coordinatorRows.map(
        (row: { departmentId: number }) => row.departmentId
      ),
    };
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message:
      "You do not have an active learning responsibility for this institution.",
  });
}

async function assertInstitutionOnly(
  db: any,
  user: any,
  institutionId: number
) {
  if (!(await isInstitutionAdmin(db, user, institutionId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Institution administrator access is required for this action.",
    });
  }
}

function assertCoordinatorDepartment(
  access: { roleKey: string; departmentIds: number[] | null },
  departmentId: number | null | undefined
) {
  if (access.roleKey !== "cpd_education_coordinator" && access.roleKey !== "cpd_department_head") return;
  if (departmentId == null || !access.departmentIds?.includes(departmentId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Department Education Coordinators can operate only in their assigned department(s).",
    });
  }
}

const targetInput = z.object({
  institutionId: z.number().int().positive(),
  targetScope: z.enum(["facility", "department", "individual"]),
  departmentId: z.number().int().positive().nullable().optional(),
  userId: z.number().int().positive().nullable().optional(),
  metricKey: z.enum(LEARNING_METRIC_KEYS),
  periodType: z.enum(periodTypes),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetValue: z.number().min(0),
  courseProgramType: z.enum(LEARNING_PROGRAM_TYPES).nullable().optional(),
  coursePhase: z.enum(LEARNING_PHASES).nullable().optional(),
});

export const institutionLearningRouter = router({
  listDepartments: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        [
          "cpd_coordinator",
          "cpd_education_coordinator",
          "cpd_reviewer",
          "cpd_reporter",
          "cpd_viewer",
        ],
        { allowDepartmentHead: true }
      );
      const rows = await db
        .select({
          id: facilityDepartments.id,
          departmentName: facilityDepartments.departmentName,
        })
        .from(facilityDepartments)
        .where(
          and(
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.isActive, true)
          )
        )
        .orderBy(asc(facilityDepartments.departmentName));
      return access.departmentIds
        ? rows.filter(row => access.departmentIds?.includes(row.id))
        : rows;
    }),

  listEducationCoordinators: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        [
          "cpd_coordinator",
          "cpd_education_coordinator",
          "cpd_reviewer",
          "cpd_reporter",
          "cpd_viewer",
        ],
        { allowDepartmentHead: true }
      );
      const rows = await db
        .select({
          id: institutionEducationCoordinators.id,
          departmentId: institutionEducationCoordinators.departmentId,
          departmentName: facilityDepartments.departmentName,
          userId: institutionEducationCoordinators.userId,
          fullName: users.name,
          email: users.email,
          assignmentStatus: institutionEducationCoordinators.assignmentStatus,
          assignedAt: institutionEducationCoordinators.assignedAt,
        })
        .from(institutionEducationCoordinators)
        .leftJoin(
          facilityDepartments,
          eq(
            facilityDepartments.id,
            institutionEducationCoordinators.departmentId
          )
        )
        .leftJoin(users, eq(users.id, institutionEducationCoordinators.userId))
        .where(
          eq(
            institutionEducationCoordinators.institutionalAccountId,
            input.institutionId
          )
        )
        .orderBy(desc(institutionEducationCoordinators.assignedAt));
      return access.departmentIds
        ? rows.filter(row => access.departmentIds?.includes(row.departmentId))
        : rows;
    }),

  assignEducationCoordinator: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        departmentId: z.number().int().positive(),
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionOnly(db, ctx.user, input.institutionId);
      const [department] = await db
        .select({ id: facilityDepartments.id })
        .from(facilityDepartments)
        .where(
          and(
            eq(facilityDepartments.id, input.departmentId),
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.isActive, true)
          )
        )
        .limit(1);
      if (!department)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active department not found in this institution.",
        });
      const [staff] = await db
        .select({ userId: institutionalStaffMembers.userId })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionalStaffMembers.userId, input.userId),
            sql`${institutionalStaffMembers.removedAt} IS NULL`
          )
        )
        .limit(1);
      if (!staff?.userId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Education Coordinators must be active institution staff with a linked account.",
        });
      const [existing] = await db
        .select({ id: institutionEducationCoordinators.id })
        .from(institutionEducationCoordinators)
        .where(
          and(
            eq(
              institutionEducationCoordinators.institutionalAccountId,
              input.institutionId
            ),
            eq(
              institutionEducationCoordinators.departmentId,
              input.departmentId
            ),
            eq(institutionEducationCoordinators.userId, input.userId)
          )
        )
        .limit(1);
      if (existing) {
        await db
          .update(institutionEducationCoordinators)
          .set({
            assignmentStatus: "active",
            assignedByUserId: ctx.user.id,
            endedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(institutionEducationCoordinators.id, existing.id));
      } else {
        await db.insert(institutionEducationCoordinators).values({
          institutionalAccountId: input.institutionId,
          departmentId: input.departmentId,
          userId: input.userId,
          assignmentStatus: "active",
          assignedByUserId: ctx.user.id,
        });
      }
      return { success: true as const };
    }),

  endEducationCoordinator: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        assignmentId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionOnly(db, ctx.user, input.institutionId);
      await db
        .update(institutionEducationCoordinators)
        .set({
          assignmentStatus: "ended",
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(institutionEducationCoordinators.id, input.assignmentId),
            eq(
              institutionEducationCoordinators.institutionalAccountId,
              input.institutionId
            )
          )
        );
      return { success: true as const };
    }),

  createSession: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        name: z.string().trim().min(1).max(256),
        eventDate: z.string().trim().min(1).max(64),
        eventDateAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
        eventType: z.enum(sessionEventTypes),
        audienceScope: z.enum(audienceScopes),
        audienceLabel: z.string().trim().max(128).nullable().optional(),
        facilityDepartmentId: z.number().int().positive().nullable().optional(),
        presenterUserId: z.number().int().positive().nullable().optional(),
        presenterName: z.string().trim().max(255).nullable().optional(),
        presenterCadre: z.string().trim().max(128).nullable().optional(),
        presenterDepartment: z.string().trim().max(128).nullable().optional(),
        cpdPoints: z.number().min(0).nullable().optional(),
        approvingCouncil: z.string().trim().max(128).nullable().optional(),
        coPresenters: z
          .array(
            z.object({
              userId: z.number().int().positive().nullable().optional(),
              fullName: z.string().trim().min(1).max(255),
              email: z.string().email().nullable().optional(),
              cadre: z.string().trim().max(128).nullable().optional(),
              department: z.string().trim().max(128).nullable().optional(),
            })
          )
          .max(6)
          .default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(
        db,
        input.institutionId,
        "cpd_portal",
        "cpd.sessions.operate"
      );
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        ["cpd_coordinator", "cpd_education_coordinator"]
      );
      assertCoordinatorDepartment(access, input.facilityDepartmentId);
      if (
        access.roleKey === "cpd_education_coordinator" &&
        input.audienceScope === "facility_wide"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Department Education Coordinators must create department-scoped learning sessions.",
        });
      }
      if (input.facilityDepartmentId != null) {
        const [department] = await db
          .select({ id: facilityDepartments.id })
          .from(facilityDepartments)
          .where(
            and(
              eq(facilityDepartments.id, input.facilityDepartmentId),
              eq(facilityDepartments.institutionId, input.institutionId),
              eq(facilityDepartments.isActive, true)
            )
          )
          .limit(1);
        if (!department)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose an active department from this institution.",
          });
      }
      const now = new Date();
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
        eventDateAt: input.eventDateAt
          ? (parseDateOnly(input.eventDateAt) as any)
          : null,
        isOpen: true,
        openedAt: now,
        eventType: input.eventType,
        audienceScope: input.audienceScope,
        audienceLabel: input.audienceLabel ?? null,
        facilityDepartmentId: input.facilityDepartmentId ?? null,
        presenterUserId: input.presenterUserId ?? null,
        presenterName: input.presenterName ?? null,
        presenterCadre: input.presenterCadre ?? null,
        presenterDepartment: input.presenterDepartment ?? null,
        cpdPoints: input.cpdPoints == null ? null : String(input.cpdPoints),
        approvingCouncil: input.approvingCouncil ?? null,
      });
      const eventId = (result as unknown as { insertId: number }).insertId;
      if (input.coPresenters.length) {
        await db.insert(cpdEventCoPresenters).values(
          input.coPresenters.map(presenter => ({
            cpdEventId: eventId,
            institutionalAccountId: input.institutionId,
            userId: presenter.userId ?? null,
            fullName: presenter.fullName,
            email: presenter.email ?? null,
            cadre: presenter.cadre ?? null,
            department: presenter.department ?? null,
            addedByUserId: ctx.user.id,
          }))
        );
      }
      return { success: true as const, eventId };
    }),

  listSessionPeople: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        [
          "cpd_coordinator",
          "cpd_education_coordinator",
          "cpd_reviewer",
          "cpd_reporter",
          "cpd_viewer",
        ],
        { allowDepartmentHead: true }
      );
      const eventRows = await db
        .select({
          id: cpdEvents.id,
          name: cpdEvents.name,
          eventDate: cpdEvents.eventDate,
          audienceScope: cpdEvents.audienceScope,
          audienceLabel: cpdEvents.audienceLabel,
          facilityDepartmentId: cpdEvents.facilityDepartmentId,
          presenterName: cpdEvents.presenterName,
          presenterUserId: cpdEvents.presenterUserId,
        })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.institutionalAccountId, input.institutionId),
            input.eventId ? eq(cpdEvents.id, input.eventId) : sql`1=1`
          )
        )
        .orderBy(desc(cpdEvents.id));
      const visibleEvents = access.departmentIds
        ? eventRows.filter(
            event =>
              event.facilityDepartmentId == null ||
              access.departmentIds?.includes(event.facilityDepartmentId)
          )
        : eventRows;
      const visibleEventIds = new Set(visibleEvents.map(event => event.id));
      const presenterRows = await db
        .select()
        .from(cpdEventCoPresenters)
        .where(
          and(
            eq(
              cpdEventCoPresenters.institutionalAccountId,
              input.institutionId
            ),
            input.eventId
              ? eq(cpdEventCoPresenters.cpdEventId, input.eventId)
              : sql`1=1`
          )
        )
        .orderBy(asc(cpdEventCoPresenters.id));
      return visibleEvents.map(event => ({
        ...event,
        coPresenters: presenterRows.filter(
          presenter =>
            visibleEventIds.has(presenter.cpdEventId) &&
            presenter.cpdEventId === event.id
        ),
      }));
    }),

  addCoPresenter: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        eventId: z.number().int().positive(),
        userId: z.number().int().positive().nullable().optional(),
        fullName: z.string().trim().min(1).max(255),
        email: z.string().email().nullable().optional(),
        cadre: z.string().trim().max(128).nullable().optional(),
        department: z.string().trim().max(128).nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(
        db,
        input.institutionId,
        "cpd_portal",
        "cpd.sessions.operate"
      );
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        ["cpd_coordinator", "cpd_education_coordinator"]
      );
      const [event] = await db
        .select({ facilityDepartmentId: cpdEvents.facilityDepartmentId })
        .from(cpdEvents)
        .where(
          and(
            eq(cpdEvents.id, input.eventId),
            eq(cpdEvents.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!event)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "CPD session not found.",
        });
      assertCoordinatorDepartment(access, event.facilityDepartmentId);
      await db.insert(cpdEventCoPresenters).values({
        cpdEventId: input.eventId,
        institutionalAccountId: input.institutionId,
        userId: input.userId ?? null,
        fullName: input.fullName,
        email: input.email ?? null,
        cadre: input.cadre ?? null,
        department: input.department ?? null,
        addedByUserId: ctx.user.id,
      });
      return { success: true as const };
    }),

  removeCoPresenter: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        coPresenterId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionProductCapability(
        db,
        input.institutionId,
        "cpd_portal",
        "cpd.sessions.operate"
      );
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        ["cpd_coordinator", "cpd_education_coordinator"]
      );
      const [row] = await db
        .select({
          eventId: cpdEventCoPresenters.cpdEventId,
          facilityDepartmentId: cpdEvents.facilityDepartmentId,
        })
        .from(cpdEventCoPresenters)
        .innerJoin(cpdEvents, eq(cpdEvents.id, cpdEventCoPresenters.cpdEventId))
        .where(
          and(
            eq(cpdEventCoPresenters.id, input.coPresenterId),
            eq(cpdEventCoPresenters.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!row)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Co-presenter not found.",
        });
      assertCoordinatorDepartment(access, row.facilityDepartmentId);
      await db
        .delete(cpdEventCoPresenters)
        .where(
          and(
            eq(cpdEventCoPresenters.id, input.coPresenterId),
            eq(cpdEventCoPresenters.institutionalAccountId, input.institutionId)
          )
        );
      return { success: true as const };
    }),

  listTargets: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        periodType: z.enum(periodTypes).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        [
          "cpd_coordinator",
          "cpd_education_coordinator",
          "cpd_reviewer",
          "cpd_reporter",
          "cpd_viewer",
        ],
        { allowDepartmentHead: true }
      );
      const period = input.periodType
        ? periodFor({ periodType: input.periodType })
        : null;
      const predicates = [
        eq(
          institutionLearningTargets.institutionalAccountId,
          input.institutionId
        ),
        eq(institutionLearningTargets.status, "active"),
      ];
      if (period)
        predicates.push(
          lte(
            institutionLearningTargets.periodStart,
            dateOnlyAsDate(period.periodEnd)
          ),
          gte(
            institutionLearningTargets.periodEnd,
            dateOnlyAsDate(period.periodStart)
          )
        );
      const rows = await db
        .select()
        .from(institutionLearningTargets)
        .where(and(...predicates))
        .orderBy(
          desc(institutionLearningTargets.periodStart),
          asc(institutionLearningTargets.id)
        );
      if (!access.departmentIds) return rows;
      const scopedUserIds = new Set(
        (
          await db
            .select({ userId: institutionalStaffMembers.userId })
            .from(institutionalStaffMembers)
            .where(
              and(
                eq(
                  institutionalStaffMembers.institutionalAccountId,
                  input.institutionId
                ),
                inArray(
                  institutionalStaffMembers.facilityDepartmentId,
                  access.departmentIds
                )
              )
            )
        )
          .map(row => row.userId)
          .filter((id): id is number => id != null)
      );
      return rows.filter(
        row =>
          row.targetScope === "facility" ||
          (row.departmentId != null &&
            access.departmentIds?.includes(row.departmentId)) ||
          (row.userId != null && scopedUserIds.has(row.userId))
      );
    }),

  saveTarget: protectedProcedure
    .input(targetInput)
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionOnly(db, ctx.user, input.institutionId);
      if (input.periodEnd < input.periodStart)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target period end must be on or after its start.",
        });
      if (
        input.targetScope === "facility" &&
        (input.departmentId != null || input.userId != null)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Facility targets cannot include a department or individual.",
        });
      if (
        input.targetScope === "department" &&
        (input.departmentId == null || input.userId != null)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Department targets require exactly one department.",
        });
      if (
        input.targetScope === "individual" &&
        (input.userId == null || input.departmentId != null)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Individual targets require exactly one staff account.",
        });
      if (input.metricKey === "course_phase_completion" && !input.coursePhase)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a course phase for course-phase targets.",
        });
      await db.insert(institutionLearningTargets).values({
        institutionalAccountId: input.institutionId,
        targetScope: input.targetScope,
        departmentId: input.departmentId ?? null,
        userId: input.userId ?? null,
        metricKey: input.metricKey,
        periodType: input.periodType,
        periodStart: dateOnlyAsDate(input.periodStart),
        periodEnd: dateOnlyAsDate(input.periodEnd),
        targetValue: String(input.targetValue),
        courseProgramType: input.courseProgramType ?? null,
        coursePhase: input.coursePhase ?? null,
        createdByUserId: ctx.user.id,
        status: "active",
      });
      return { success: true as const };
    }),

  archiveTarget: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        targetId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await assertInstitutionOnly(db, ctx.user, input.institutionId);
      await db
        .update(institutionLearningTargets)
        .set({ status: "archived", updatedAt: new Date() })
        .where(
          and(
            eq(institutionLearningTargets.id, input.targetId),
            eq(
              institutionLearningTargets.institutionalAccountId,
              input.institutionId
            )
          )
        );
      return { success: true as const };
    }),

  getDashboard: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        periodType: z.enum(periodTypes).default("quarterly"),
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        [
          "cpd_coordinator",
          "cpd_education_coordinator",
          "cpd_reviewer",
          "cpd_reporter",
          "cpd_viewer",
        ],
        { allowDepartmentHead: true }
      );
      return loadInstitutionLearningDashboard(
        db,
        input.institutionId,
        input,
        access.departmentIds
      );
    }),

  getShareableReport: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        periodType: z.enum(periodTypes).default("quarterly"),
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const access = await assertLearningAccess(
        db,
        ctx.user,
        input.institutionId,
        [
          "cpd_coordinator",
          "cpd_education_coordinator",
          "cpd_reviewer",
          "cpd_reporter",
          "cpd_viewer",
        ],
        { allowDepartmentHead: true }
      );
      const dashboard = await loadInstitutionLearningDashboard(
        db,
        input.institutionId,
        input,
        access.departmentIds
      );
      return { ...dashboard, csv: buildLearningReportCsv(dashboard) };
    }),
});
