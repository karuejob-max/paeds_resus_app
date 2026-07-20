import { protectedProcedure, publicProcedure, adminProcedure, router } from "../_core/trpc";
import { searchKmhflFacilities } from "./institution-kmhfl-search";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  institutionalAccounts,
  institutionalInquiries,
  institutionalStaffMembers,
  quotations,
  contracts,
  trainingSchedules,
  trainingAttendance,
  courses,
  incidents,
  institutionalActionLogs,
  institutionalAnalytics,
  users,
  payments,
  enrollments,
  careFacilities,
  kmhflFacilities,
  careSignalEvents,
  individualInstallmentPayments,
  providerProfiles,
} from "../../drizzle/schema";
import { runResusGpsAuditForInstitution } from "../lib/resusgps-auditor";
import {
  daysBackForTimeframe,
  gapCountsToArray,
  buildRecommendations,
  type GapCategoryStat,
  type GapRecommendation,
} from "./care-signal-events";
import { alias } from "drizzle-orm/mysql-core";
import { eq, desc, and, inArray, count, asc, isNotNull, isNull, like, gte, sql } from "drizzle-orm";
import { processBulkEnrollment, getInstitutionalPricing } from "../institutional-enrollment";
import { initiateSTKPush, validatePhoneNumber, isMpesaConfigured } from "../_core/mpesa";
import { assertInstitutionAccess } from "../lib/institution-access";
import { ensureCourseCatalogForSchedule } from "../lib/ensure-course-catalog-for-schedule";
import {
  rollupInstitutionalAnalyticsForAccount,
  rollupAllInstitutionalAccounts,
} from "../institutional-analytics-rollup";
import { trackEvent } from "../services/analytics.service";
import { getFacilityCareSignalDashboard } from "../services/facility-care-signal.service";
import { notifyInstructorSessionAssigned } from "../lib/instructor-session-notification";
import { ENV } from "../_core/env";
import { isInstitutionInPilotProgram } from "@shared/pilot-program";
import {
  isValidActionLogStatusTransition,
  requiresSystemChangeOnResolve,
  type ActionLogStatus,
} from "../lib/institutional-action-log-status";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function assertApprovedInstructorUser(db: DbClient, userId: number) {
  const [row] = await db
    .select({
      id: users.id,
      instructorApprovedAt: users.instructorApprovedAt,
      instructorCertifiedAt: users.instructorCertifiedAt,
      instructorNumber: users.instructorNumber,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
  }
  if (!row.instructorCertifiedAt || !row.instructorNumber) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "That account has not completed the Paeds Resus Instructor Course and certification yet. They must enroll, complete modules, and receive their instructor number before assignment.",
    });
  }
  if (!row.instructorApprovedAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "That account is not approved as an instructor. Ask a platform admin to approve them under Admin → Reports.",
    });
  }
  return row;
}

async function assertTrainingScheduleForInstitution(
  db: DbClient,
  institutionId: number,
  trainingScheduleId: number
) {
  const rows = await db
    .select({ id: trainingSchedules.id })
    .from(trainingSchedules)
    .where(
      and(
        eq(trainingSchedules.id, trainingScheduleId),
        eq(trainingSchedules.institutionalAccountId, institutionId)
      )
    )
    .limit(1);
  if (!rows.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Training session not found for this institution.",
    });
  }
}

async function syncTrainingScheduleEnrolledCount(db: DbClient, trainingScheduleId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(trainingAttendance)
    .where(
      and(
        eq(trainingAttendance.trainingScheduleId, trainingScheduleId),
        inArray(trainingAttendance.attendanceStatus, ["registered", "attended", "absent"])
      )
    );
  const n = Number(row?.n ?? 0);
  await db
    .update(trainingSchedules)
    .set({ enrolledCount: n, updatedAt: new Date() })
    .where(eq(trainingSchedules.id, trainingScheduleId));
}

/**
 * Keep institutional staff roster fields loosely aligned with the latest session attendance.
 * Roster rows use a single enrollment/certification pair (not per-program); see product docs for multi-program roadmap.
 */
async function syncStaffRosterFromSessionAttendance(
  db: DbClient,
  staffMemberId: number,
  attendanceStatus: "registered" | "attended" | "absent" | "cancelled"
) {
  const [row] = await db
    .select()
    .from(institutionalStaffMembers)
    .where(eq(institutionalStaffMembers.id, staffMemberId))
    .limit(1);
  if (!row) return;

  const patch: {
    updatedAt: Date;
    enrollmentStatus?: (typeof institutionalStaffMembers.$inferSelect)["enrollmentStatus"];
    enrollmentDate?: Date;
    completionDate?: Date;
    certificationStatus?: (typeof institutionalStaffMembers.$inferSelect)["certificationStatus"];
  } = { updatedAt: new Date() };

  if (attendanceStatus === "registered" && row.enrollmentStatus === "pending") {
    patch.enrollmentStatus = "enrolled";
    patch.enrollmentDate = row.enrollmentDate ?? new Date();
  }
  if (attendanceStatus === "attended") {
    patch.enrollmentStatus = "completed";
    patch.completionDate = new Date();
    if (row.certificationStatus === "not_started") {
      patch.certificationStatus = "in_progress";
    }
  }

  if (Object.keys(patch).length > 1) {
    await db.update(institutionalStaffMembers).set(patch).where(eq(institutionalStaffMembers.id, staffMemberId));
  }
}

export const institutionRouter = router({
  /** Primary institution for the signed-in user (most recently created if multiple). */
  getMyInstitution: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const rows = await db
      .select()
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.userId, ctx.user.id))
      .orderBy(desc(institutionalAccounts.id));

    return {
      institution: rows[0] ?? null,
      institutions: rows,
    };
  }),

  searchKmhflFacilities,

  /** Hospital admin: Care Signal QI dashboard for this institution's facility name. */

  /** Whether this institution is in the CEO-gated clinical outcomes pilot. */
  getPilotProgramStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        pilotFlagEnabled: ENV.clinicalOutcomesPilotEnabled,
        institutionInPilotList: false,
        showPilotBadge: false,
      };
    }
    const rows = await db
      .select({ id: institutionalAccounts.id })
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.userId, ctx.user.id))
      .orderBy(desc(institutionalAccounts.id))
      .limit(1);
    const institutionId = rows[0]?.id ?? null;
    const institutionInPilotList = isInstitutionInPilotProgram(
      institutionId,
      ENV.pilotFacilityIds
    );
    return {
      pilotFlagEnabled: ENV.clinicalOutcomesPilotEnabled,
      institutionId,
      institutionInPilotList,
      showPilotBadge: ENV.clinicalOutcomesPilotEnabled && institutionInPilotList,
    };
  }),

  getCareSignalFacilityDashboard: protectedProcedure
    .input(z.object({ lastDays: z.number().int().min(7).max(365).default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const rows = await db
        .select({
          id: institutionalAccounts.id,
          companyName: institutionalAccounts.companyName,
        })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.userId, ctx.user.id))
        .orderBy(desc(institutionalAccounts.id))
        .limit(1);
      const inst = rows[0];
      if (!inst?.companyName?.trim()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No institution linked to this account" });
      }

      const [linkedFacility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(
          and(
            eq(careFacilities.institutionalAccountId, inst.id),
            isNull(careFacilities.mergedIntoId)
          )
        )
        .limit(1);

      return getFacilityCareSignalDashboard({
        facilityId: linkedFacility?.id,
        facilityName: inst.companyName.trim(),
        lastDays: input?.lastDays ?? 90,
      });
    }),

  /** Public lead capture from /institutional quote form (stored for sales follow-up). */
  submitLeadInquiry: publicProcedure
    .input(
      z.object({
        institutionName: z.string().min(2),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().min(5),
        staffCount: z.number().int().nonnegative(),
        preferredCourse: z.string().min(1),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await db.insert(institutionalInquiries).values({
        companyName: input.institutionName,
        staffCount: Math.max(1, input.staffCount),
        specificNeeds: JSON.stringify({
          preferredCourse: input.preferredCourse,
          message: input.message ?? "",
        }),
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: "new",
      });
      return { success: true as const };
    }),

  /**
   * Register an institution (authenticated). Links account to ctx.user.id.
   * If this user already has an institutional account, returns that id (idempotent).
   */
  register: protectedProcedure
    .input(
      z.object({
        hospitalName: z.string().min(3),
        hospitalType: z.string(),
        county: z.string().optional(),
        phone: z.string(),
        email: z.string().email(),
        website: z.string().optional(),
        adminFirstName: z.string(),
        adminLastName: z.string(),
        adminEmail: z.string().email(),
        adminPhone: z.string(),
        adminTitle: z.string(),
        planId: z.string(),
        planPrice: z.number(),
        maxStaff: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const existing = await db
          .select({ id: institutionalAccounts.id })
          .from(institutionalAccounts)
          .where(eq(institutionalAccounts.userId, ctx.user.id))
          .orderBy(desc(institutionalAccounts.id))
          .limit(1);

        if (existing.length) {
          return {
            success: true,
            institutionId: existing[0].id,
            message: "You already have an institutional account.",
            nextStep: "portal" as const,
            alreadyRegistered: true as const,
          };
        }

        const result = await db.insert(institutionalAccounts).values({
          userId: ctx.user.id,
          companyName: input.hospitalName,
          industry: input.hospitalType,
          staffCount: input.maxStaff,
          contactName: `${input.adminFirstName} ${input.adminLastName}`,
          contactEmail: input.adminEmail,
          contactPhone: input.adminPhone,
          status: "active",
        });

        return {
          success: true,
          institutionId: (result as unknown as { insertId: number }).insertId || 1,
          message: "Institution registered successfully. Proceeding to payment...",
          nextStep: "payment" as const,
          alreadyRegistered: false as const,
        };
      } catch (error) {
        console.error("Institution registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register institution",
        });
      }
    }),

  /**
   * Persist multi-step institutional onboarding for the signed-in user.
   * Creates institutionalAccounts + institutionalInquiries (detail). Idempotent if user already has an account.
   */
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        institutionName: z.string().min(3),
        institutionType: z.string().min(1),
        registrationNumber: z.string().min(1).optional(),
        healthcareStaffCount: z.coerce.number().int().positive(),
        country: z.string().min(1),
        city: z.string().min(1),
        address: z.string().min(1),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().min(1),
        contactDesignation: z.string().min(1),
        programInterest: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const existing = await db
        .select()
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.userId, ctx.user.id))
        .orderBy(desc(institutionalAccounts.id))
        .limit(1);

      if (existing.length) {
        return {
          success: true,
          institutionId: existing[0].id,
          alreadyRegistered: true as const,
        };
      }

      const accountResult = await db.insert(institutionalAccounts).values({
        userId: ctx.user.id,
        companyName: input.institutionName,
        industry: input.institutionType,
        staffCount: input.healthcareStaffCount,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: "prospect",
      });

      const institutionId = (accountResult as unknown as { insertId: number }).insertId;

      await db.insert(institutionalInquiries).values({
        companyName: input.institutionName,
        staffCount: input.healthcareStaffCount,
        specificNeeds: JSON.stringify({
          registrationNumber: input.registrationNumber,
          address: input.address,
          city: input.city,
          country: input.country,
          contactDesignation: input.contactDesignation,
          programInterest: input.programInterest,
        }),
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: "new",
      });

      return {
        success: true,
        institutionId: institutionId || 1,
        alreadyRegistered: false as const,
      };
    }),

  getDetails: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const institution = await db
        .select()
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      if (!institution.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      return institution[0];
    }),

  updateDetails: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        companyName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().email().optional(),
        staffCount: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.companyName) updateData.companyName = input.companyName;
      if (input.contactPhone) updateData.contactPhone = input.contactPhone;
      if (input.contactEmail) updateData.contactEmail = input.contactEmail;
      if (input.staffCount) updateData.staffCount = input.staffCount;

      await db
        .update(institutionalAccounts)
        .set(updateData)
        .where(eq(institutionalAccounts.id, input.institutionId));

      return {
        success: true,
        message: "Institution updated successfully",
      };
    }),

  getStaffMembers: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));
    }),

  addStaffMember: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffName: z.string(),
        staffEmail: z.string().email(),
        staffPhone: z.string().optional(),
        staffRole: z.enum([
          "doctor",
          "nurse",
          "paramedic",
          "midwife",
          "lab_tech",
          "respiratory_therapist",
          "support_staff",
          "other",
        ]),
        designation: z.enum([
          "bsn_intern",
          "coi_bsc",
          "coi_diploma",
          "moi",
          "permanent_nurse",
          "permanent_doctor",
          "other",
        ]).optional(),
        department: z.string().optional(),
        yearsOfExperience: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const result = await db.insert(institutionalStaffMembers).values({
        institutionalAccountId: input.institutionId,
        staffName: input.staffName,
        staffEmail: input.staffEmail,
        staffPhone: input.staffPhone || null,
        staffRole: input.staffRole,
        designation: input.designation || "other",
        department: input.department || null,
        yearsOfExperience: input.yearsOfExperience || 0,
        enrollmentStatus: "pending",
        facilityLinkStatus: "linked", // manual add by admin is auto-approved
      });

      return {
        success: true,
        staffId: (result as unknown as { insertId: number }).insertId || 1,
        message: "Staff member added successfully",
      };
    }),

  bulkImportStaff: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staff: z.array(
          z.object({
            staffName: z.string(),
            staffEmail: z.string().email(),
            staffPhone: z.string().optional(),
            staffRole: z.enum([
              "doctor",
              "nurse",
              "paramedic",
              "midwife",
              "lab_tech",
              "respiratory_therapist",
              "support_staff",
              "other",
            ]),
            designation: z.enum([
              "bsn_intern",
              "coi_bsc",
              "coi_diploma",
              "moi",
              "permanent_nurse",
              "permanent_doctor",
              "other",
            ]).optional(),
            department: z.string().optional(),
            yearsOfExperience: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const imported: { staffEmail: string; staffId: number }[] = [];
      const errors: { staffEmail: string; error: string }[] = [];

      for (const staff of input.staff) {
        try {
          const result = await db.insert(institutionalStaffMembers).values({
            institutionalAccountId: input.institutionId,
            staffName: staff.staffName,
            staffEmail: staff.staffEmail,
            staffPhone: staff.staffPhone || null,
            staffRole: staff.staffRole,
            designation: staff.designation || "other",
            department: staff.department || null,
            yearsOfExperience: staff.yearsOfExperience || 0,
            enrollmentStatus: "pending",
            facilityLinkStatus: "linked", // manual bulk import is auto-approved
          });

          imported.push({
            staffEmail: staff.staffEmail,
            staffId: (result as unknown as { insertId: number }).insertId || 1,
          });
        } catch (error) {
          errors.push({
            staffEmail: staff.staffEmail,
            error: (error as Error).message,
          });
        }
      }

      return {
        success: true,
        imported: imported.length,
        errors: errors.length,
        message: `Successfully imported ${imported.length} staff members`,
        data: { imported, errors },
      };
    }),

  getQuotations: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return await db
        .select()
        .from(quotations)
        .where(eq(quotations.institutionalAccountId, input.institutionId));
    }),

  getContracts: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return await db
        .select()
        .from(contracts)
        .where(eq(contracts.institutionalAccountId, input.institutionId));
    }),

  /** INST-12: Training schedules for this institution (tenant-scoped). */
  getTrainingSchedules: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const instructorUser = alias(users, "instructorUser");
      return await db
        .select({
          id: trainingSchedules.id,
          institutionalAccountId: trainingSchedules.institutionalAccountId,
          courseId: trainingSchedules.courseId,
          trainingType: trainingSchedules.trainingType,
          scheduledDate: trainingSchedules.scheduledDate,
          startTime: trainingSchedules.startTime,
          endTime: trainingSchedules.endTime,
          location: trainingSchedules.location,
          instructorId: trainingSchedules.instructorId,
          instructorName: trainingSchedules.instructorName,
          instructorUserName: instructorUser.name,
          maxCapacity: trainingSchedules.maxCapacity,
          enrolledCount: trainingSchedules.enrolledCount,
          status: trainingSchedules.status,
          createdAt: trainingSchedules.createdAt,
          updatedAt: trainingSchedules.updatedAt,
          programType: courses.programType,
        })
        .from(trainingSchedules)
        .leftJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .leftJoin(instructorUser, eq(trainingSchedules.instructorId, instructorUser.id))
        .where(eq(trainingSchedules.institutionalAccountId, input.institutionId))
        .orderBy(desc(trainingSchedules.scheduledDate));
    }),

  /** Approved platform instructors (admin-assigned) for session assignment. */
  listAssignableInstructors: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          instructorNumber: users.instructorNumber,
        })
        .from(users)
        .where(
          and(
            isNotNull(users.instructorApprovedAt),
            isNotNull(users.instructorCertifiedAt),
            isNotNull(users.instructorNumber)
          )
        )
        .orderBy(asc(users.name));
    }),

  /**
   * HI-B2B-1: Create a training schedule row (tenant-scoped). Resolves catalog `courseId` from program type.
   */
  createTrainingSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        programType: z.enum(["bls", "acls", "pals", "fellowship"]),
        trainingType: z.enum(["online", "hands_on", "hybrid"]),
        scheduledDate: z.coerce.date(),
        startTime: z.string().max(10).optional(),
        endTime: z.string().max(10).optional(),
        location: z.string().max(255).optional(),
        instructorName: z.string().max(255).optional(),
        /** Must be admin-approved (`users.instructorApprovedAt`); sets `instructorId` + display name. */
        instructorUserId: z.number().int().positive().optional(),
        maxCapacity: z.number().int().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      await ensureCourseCatalogForSchedule(db, input.programType);

      const courseRows = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.programType, input.programType))
        .orderBy(courses.id)
        .limit(1);

      if (!courseRows.length) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "No course catalog entry for this program type. Add rows to the `courses` table or contact support.",
        });
      }

      const courseId = courseRows[0].id;

      let instructorId: number | undefined;
      let instructorNameVal = input.instructorName?.trim() || undefined;
      if (input.instructorUserId != null) {
        const u = await assertApprovedInstructorUser(db, input.instructorUserId);
        instructorId = u.id;
        if (!instructorNameVal && u.name) instructorNameVal = u.name.trim();
      }

      await db.insert(trainingSchedules).values({
        institutionalAccountId: input.institutionId,
        courseId,
        trainingType: input.trainingType,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime?.trim() || undefined,
        endTime: input.endTime?.trim() || undefined,
        location: input.location?.trim() || undefined,
        instructorId,
        instructorName: instructorNameVal,
        maxCapacity: input.maxCapacity,
        enrolledCount: 0,
        status: "scheduled",
      });

      const created = await db
        .select({ id: trainingSchedules.id })
        .from(trainingSchedules)
        .where(eq(trainingSchedules.institutionalAccountId, input.institutionId))
        .orderBy(desc(trainingSchedules.id))
        .limit(1);

      const scheduleId = created[0]?.id ?? null;
      if (scheduleId != null) {
        await trackEvent({
          userId: ctx.user.id,
          eventType: "institution_training_schedule_created",
          eventName: "Institutional training session scheduled",
          eventData: {
            institutionId: input.institutionId,
            scheduleId,
            programType: input.programType,
            trainingType: input.trainingType,
          },
          sessionId: `inst_schedule_${scheduleId}`,
        });
        if (instructorId != null) {
          void notifyInstructorSessionAssigned(db, scheduleId);
        }
      }

      return { success: true as const, scheduleId };
    }),

  /**
   * HI-B2B-1: Update an existing training session (tenant-scoped). Optional fields only; omitted = unchanged.
   */
  updateTrainingSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
        programType: z.enum(["bls", "acls", "pals", "fellowship"]).optional(),
        trainingType: z.enum(["online", "hands_on", "hybrid"]).optional(),
        scheduledDate: z.coerce.date().optional(),
        startTime: z.union([z.string().max(10), z.null()]).optional(),
        endTime: z.union([z.string().max(10), z.null()]).optional(),
        location: z.union([z.string().max(255), z.null()]).optional(),
        instructorName: z.union([z.string().max(255), z.null()]).optional(),
        instructorUserId: z.union([z.number().int().positive(), z.null()]).optional(),
        maxCapacity: z.number().int().min(1).max(2000).optional(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const [current] = await db
        .select()
        .from(trainingSchedules)
        .where(eq(trainingSchedules.id, input.trainingScheduleId))
        .limit(1);
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Training session not found." });
      }

      let courseId = current.courseId;
      if (input.programType !== undefined) {
        await ensureCourseCatalogForSchedule(db, input.programType);
        const courseRows = await db
          .select({ id: courses.id })
          .from(courses)
          .where(eq(courses.programType, input.programType))
          .orderBy(courses.id)
          .limit(1);
        if (!courseRows.length) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "No course catalog entry for this program type. Add rows to the `courses` table or contact support.",
          });
        }
        courseId = courseRows[0].id;
      }

      if (input.maxCapacity !== undefined) {
        const enrolled = current.enrolledCount ?? 0;
        if (input.maxCapacity < enrolled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Max capacity cannot be less than current enrolled count (${enrolled}).`,
          });
        }
      }

      const prevInstructorId = current.instructorId ?? null;
      let nextInstructorId = prevInstructorId;
      if (input.instructorUserId !== undefined) {
        nextInstructorId = input.instructorUserId === null ? null : input.instructorUserId;
      }

      const setPayload: {
        courseId: number;
        updatedAt: Date;
        trainingType?: (typeof trainingSchedules.$inferSelect)["trainingType"];
        scheduledDate?: Date;
        startTime?: string | null;
        endTime?: string | null;
        location?: string | null;
        instructorId?: number | null;
        instructorName?: string | null;
        maxCapacity?: number;
        status?: (typeof trainingSchedules.$inferSelect)["status"];
      } = { courseId, updatedAt: new Date() };
      if (input.trainingType !== undefined) setPayload.trainingType = input.trainingType;
      if (input.scheduledDate !== undefined) setPayload.scheduledDate = input.scheduledDate;
      if (input.startTime !== undefined) {
        setPayload.startTime =
          input.startTime === null ? null : input.startTime.trim() === "" ? null : input.startTime.trim();
      }
      if (input.endTime !== undefined) {
        setPayload.endTime =
          input.endTime === null ? null : input.endTime.trim() === "" ? null : input.endTime.trim();
      }
      if (input.location !== undefined) {
        setPayload.location =
          input.location === null ? null : input.location.trim() === "" ? null : input.location.trim();
      }
      if (input.instructorUserId !== undefined) {
        if (input.instructorUserId === null) {
          setPayload.instructorId = null;
        } else {
          const u = await assertApprovedInstructorUser(db, input.instructorUserId);
          setPayload.instructorId = u.id;
          if (input.instructorName === undefined) {
            setPayload.instructorName = u.name?.trim() || null;
          }
        }
      }
      if (input.instructorName !== undefined) {
        setPayload.instructorName =
          input.instructorName === null
            ? null
            : input.instructorName.trim() === ""
              ? null
              : input.instructorName.trim();
      }
      if (input.maxCapacity !== undefined) setPayload.maxCapacity = input.maxCapacity;
      if (input.status !== undefined) setPayload.status = input.status;

      await db.update(trainingSchedules).set(setPayload).where(eq(trainingSchedules.id, input.trainingScheduleId));

      if (nextInstructorId != null && nextInstructorId !== prevInstructorId) {
        void notifyInstructorSessionAssigned(db, input.trainingScheduleId);
      }

      return { success: true as const };
    }),

  /**
   * HI-B2B-1: Remove a training session and its attendance rows (tenant-scoped).
   */
  deleteTrainingSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      await db
        .delete(trainingAttendance)
        .where(eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId));
      await db.delete(trainingSchedules).where(eq(trainingSchedules.id, input.trainingScheduleId));

      return { success: true as const };
    }),

  /**
   * HI-B2B-2: Roster + attendance rows for one training session (tenant-scoped).
   */
  getTrainingAttendanceForSchedule: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const rows = await db
        .select({
          staffMemberId: institutionalStaffMembers.id,
          staffName: institutionalStaffMembers.staffName,
          staffEmail: institutionalStaffMembers.staffEmail,
          staffRole: institutionalStaffMembers.staffRole,
          department: institutionalStaffMembers.department,
          attendanceId: trainingAttendance.id,
          attendanceStatus: trainingAttendance.attendanceStatus,
        })
        .from(institutionalStaffMembers)
        .leftJoin(
          trainingAttendance,
          and(
            eq(trainingAttendance.staffMemberId, institutionalStaffMembers.id),
            eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId)
          )
        )
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId))
        .orderBy(asc(institutionalStaffMembers.staffName));

      return { rows };
    }),

  /** HI-B2B-2: Create or update one staff member’s attendance for a session. */
  upsertTrainingAttendance: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
        staffMemberId: z.number().int().positive(),
        attendanceStatus: z.enum(["registered", "attended", "absent", "cancelled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const staffOk = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);
      if (!staffOk.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found for this institution." });
      }

      const existing = await db
        .select()
        .from(trainingAttendance)
        .where(
          and(
            eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId),
            eq(trainingAttendance.staffMemberId, input.staffMemberId)
          )
        )
        .limit(1);

      if (existing.length) {
        await db
          .update(trainingAttendance)
          .set({ attendanceStatus: input.attendanceStatus, updatedAt: new Date() })
          .where(eq(trainingAttendance.id, existing[0].id));
      } else {
        await db.insert(trainingAttendance).values({
          trainingScheduleId: input.trainingScheduleId,
          staffMemberId: input.staffMemberId,
          attendanceStatus: input.attendanceStatus,
        });
      }

      await syncTrainingScheduleEnrolledCount(db, input.trainingScheduleId);
      await syncStaffRosterFromSessionAttendance(db, input.staffMemberId, input.attendanceStatus);
      return { success: true as const };
    }),

  /** HI-B2B-2: Register all roster staff as `registered` when they have no row yet. */
  registerAllStaffForTrainingSession: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        trainingScheduleId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertTrainingScheduleForInstitution(db, input.institutionId, input.trainingScheduleId);

      const staff = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      let added = 0;
      for (const s of staff) {
        const ex = await db
          .select({ id: trainingAttendance.id })
          .from(trainingAttendance)
          .where(
            and(
              eq(trainingAttendance.trainingScheduleId, input.trainingScheduleId),
              eq(trainingAttendance.staffMemberId, s.id)
            )
          )
          .limit(1);
        if (ex.length) continue;
        await db.insert(trainingAttendance).values({
          trainingScheduleId: input.trainingScheduleId,
          staffMemberId: s.id,
          attendanceStatus: "registered",
        });
        added += 1;
      }

      await syncTrainingScheduleEnrolledCount(db, input.trainingScheduleId);

      await db
        .update(institutionalStaffMembers)
        .set({
          enrollmentStatus: "enrolled",
          enrollmentDate: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
            eq(institutionalStaffMembers.enrollmentStatus, "pending")
          )
        );

      return { success: true as const, added };
    }),

  getStats: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const staff = await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      const totalStaff = staff.length;
      const enrolledStaff = staff.filter((s) => s.enrollmentStatus === "enrolled").length;
      const completedStaff = staff.filter((s) => s.enrollmentStatus === "completed").length;
      const certifiedStaff = staff.filter((s) => s.certificationStatus === "certified").length;

      return {
        totalStaff,
        enrolledStaff,
        completedStaff,
        certifiedStaff,
        completionRate: totalStaff > 0 ? Math.round((completedStaff / totalStaff) * 100) : 0,
        certificationRate: totalStaff > 0 ? Math.round((certifiedStaff / totalStaff) * 100) : 0,
      };
    }),

  /**
   * Create enrollments + pending payment rows for all staff in the institutional roster (bulk path).
   */
  bulkEnrollFromStaffRoster: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
        trainingDate: z.coerce.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const staff = await db
        .select()
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      if (staff.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add staff to your roster before running bulk enrollment.",
        });
      }

      const staffList = staff.map((s) => ({
        name: s.staffName,
        email: s.staffEmail,
        phone: s.staffPhone?.trim() || "0000000000",
        department: s.department ?? undefined,
        role: s.staffRole ?? undefined,
      }));

      try {
        const result = await processBulkEnrollment({
          institutionId: input.institutionId,
          courseType: input.courseType,
          staffList,
          trainingDate: input.trainingDate,
        });
        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Bulk enrollment failed";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),

  /** INST-13: List incidents for tenant. */
  getIncidents: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return await db
        .select()
        .from(incidents)
        .where(eq(incidents.institutionalAccountId, input.institutionId))
        .orderBy(desc(incidents.incidentDate))
        .limit(input.limit);
    }),

  /** INST-13: Log a new incident (tenant-scoped). */
  createIncident: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        incidentDate: z.coerce.date(),
        incidentType: z.enum([
          "cardiac_arrest",
          "respiratory_failure",
          "severe_sepsis",
          "shock",
          "trauma",
          "other",
        ]),
        patientAge: z.number().int().min(0).max(600).optional(),
        responseTime: z.number().int().min(0).optional(),
        staffInvolved: z.array(z.number().int()).optional(),
        protocolsUsed: z.array(z.string()).optional(),
        outcome: z.enum(["pCOSCA", "ROSC", "mortality", "ongoing_resuscitation", "unknown"]),
        neurologicalStatus: z
          .enum(["intact", "mild_impairment", "moderate_impairment", "severe_impairment", "unknown"])
          .optional(),
        systemGapsIdentified: z.array(z.string()).optional(),
        improvementsImplemented: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const { institutionId, staffInvolved, protocolsUsed, systemGapsIdentified, ...rest } = input;

      await db.insert(incidents).values({
        institutionalAccountId: institutionId,
        incidentDate: rest.incidentDate,
        incidentType: rest.incidentType,
        patientAge: rest.patientAge ?? null,
        responseTime: rest.responseTime ?? null,
        staffInvolved: staffInvolved?.length ? JSON.stringify(staffInvolved) : null,
        protocolsUsed: protocolsUsed?.length ? JSON.stringify(protocolsUsed) : null,
        outcome: rest.outcome,
        neurologicalStatus: rest.neurologicalStatus ?? null,
        systemGapsIdentified: systemGapsIdentified?.length ? JSON.stringify(systemGapsIdentified) : null,
        improvementsImplemented: rest.improvementsImplemented ?? null,
        notes: rest.notes ?? null,
      });

      try {
        await rollupInstitutionalAnalyticsForAccount(institutionId);
      } catch (e) {
        console.warn("[institution] createIncident rollup skipped:", e);
      }

      return { success: true };
    }),

  /** INST-14: Rolled-up metrics for charts / KPIs. */
  getInstitutionalAnalytics: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const row = await db
        .select()
        .from(institutionalAnalytics)
        .where(eq(institutionalAnalytics.institutionalAccountId, input.institutionId))
        .limit(1);
      return row[0] ?? null;
    }),

  /** INST-14: Recompute rollup for one institution (tenant). */
  refreshInstitutionalAnalytics: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await rollupInstitutionalAnalyticsForAccount(input.institutionId);
      return { success: true };
    }),

  /** INST-14: Recompute rollups for all institutions (platform admin). */
  adminRunInstitutionalAnalyticsRollupAll: adminProcedure.mutation(async () => {
    return rollupAllInstitutionalAccounts();
  }),

  verify: publicProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      const institution = await db
        .select()
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);

      return {
        exists: institution.length > 0,
        active: institution.length > 0 && institution[0].status === "active",
      };
    }),

  // Update staff member role (RBAC)
  updateStaffRole: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffMemberId: z.number(),
        newRole: z.enum(["director", "coordinator", "finance_officer", "department_head", "staff_member"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Verify staff member exists
        const staffMember = await db
          .select()
          .from(institutionalStaffMembers)
          .where(
            and(
              eq(institutionalStaffMembers.id, input.staffMemberId),
              eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
            )
          )
          .limit(1);

        if (staffMember.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Staff member not found",
          });
        }

        // Update the role
        await db
          .update(institutionalStaffMembers)
          .set({ institutionalRole: input.newRole })
          .where(eq(institutionalStaffMembers.id, input.staffMemberId));

        return {
          success: true,
          message: `Role updated to ${input.newRole}`,
        };
      } catch (error) {
        console.error("Error updating staff role:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update staff role",
        });
      }
    }),

  // Get staff roles for an institution
  getStaffRoles: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const staffMembers = await db
          .select({
            id: institutionalStaffMembers.id,
            staffName: institutionalStaffMembers.staffName,
            staffEmail: institutionalStaffMembers.staffEmail,
            department: institutionalStaffMembers.department,
            institutionalRole: institutionalStaffMembers.institutionalRole,
            staffRole: institutionalStaffMembers.staffRole,
          })
          .from(institutionalStaffMembers)
          .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

        return staffMembers;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch staff roles",
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // INST-BULK-PAY-1: Get a live bulk enrollment quote (staff count + course type).
  // Used by the portal to show a real-time price breakdown before payment.
  // ─────────────────────────────────────────────────────────────────────────
  getBulkEnrollmentQuote: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const staffRows = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

      const staffCount = staffRows.length;
      if (staffCount === 0) {
        return { staffCount: 0, basePrice: 0, pricePerStaff: 0, totalPrice: 0, discountPercentage: 0, totalDiscount: 0 };
      }

      const pricing = getInstitutionalPricing(input.courseType, staffCount);
      return { staffCount, ...pricing };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // INST-BULK-PAY-2: Initiate M-Pesa STK push for bulk enrollment payment.
  // Creates all enrollment rows (pending), then triggers a single STK push
  // for the total amount to the institution admin's phone.
  // On M-Pesa callback, the webhook marks the payment completed and the
  // existing certificate flow handles individual cert issuance.
  // ─────────────────────────────────────────────────────────────────────────
  initiateBulkEnrollmentPayment: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
        trainingDate: z.coerce.date(),
        phoneNumber: z.string().min(9).max(15),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      if (!isMpesaConfigured()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "M-Pesa is not configured on this server" });
      }

      if (!validatePhoneNumber(input.phoneNumber)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid M-Pesa phone number" });
      }

      // Step 1: Create all enrollment rows (paymentStatus = 'pending')
      const enrollmentResult = await processBulkEnrollment({
        institutionId: input.institutionId,
        courseType: input.courseType,
        staffList: await (async () => {
          const staffRows = await db
            .select()
            .from(institutionalStaffMembers)
            .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));
          return staffRows.map((s) => ({
            name: s.staffName,
            email: s.staffEmail ?? `staff-${s.id}@institution.local`,
            phone: s.staffPhone?.trim() || "0000000000",
            department: s.department ?? undefined,
            role: s.staffRole ?? undefined,
          }));
        })(),
        trainingDate: input.trainingDate,
      });

      if (!enrollmentResult.success || enrollmentResult.enrolledCount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Bulk enrollment failed: ${enrollmentResult.failedEmails.length} staff could not be enrolled. Ensure all staff have valid email addresses.`,
        });
      }

      // Step 2: Initiate a single STK push for the total amount
      const totalAmountKes = Math.round(enrollmentResult.finalCost);
      const description = `${input.courseType.toUpperCase()} bulk training — ${enrollmentResult.enrolledCount} staff`;

      const stkResult = await initiateSTKPush(
        input.phoneNumber,
        totalAmountKes,
        `BULK-${input.institutionId}-${input.courseType.toUpperCase()}`,
        description,
        0
      );

      if (!stkResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: stkResult.message || "M-Pesa STK push failed",
        });
      }

      // Step 3: Record a single consolidated payment row for the bulk transaction
      // enrollmentId = first enrollment in the batch (used for webhook lookup)
      const firstEnrollmentId = enrollmentResult.enrollmentIds[0] ?? 0;
      await db.insert(payments).values({
        enrollmentId: firstEnrollmentId,
        userId: ctx.user.id,
        amount: totalAmountKes * 100, // stored in cents
        paymentMethod: "mpesa",
        status: "pending",
        transactionId: stkResult.checkoutRequestId || `BULK-${Date.now()}`,
        idempotencyKey: stkResult.checkoutRequestId || undefined,
      });

      return {
        success: true,
        checkoutRequestId: stkResult.checkoutRequestId,
        enrolledCount: enrollmentResult.enrolledCount,
        failedCount: enrollmentResult.failedCount,
        totalAmountKes,
        message: `STK push sent to ${input.phoneNumber}. Enter your M-Pesa PIN to confirm payment for ${enrollmentResult.enrolledCount} staff.`,
      };
    }),

  /** Phase 4 pilot: facility action log — gap identified → documented system change. */
  getActionLogs: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return await db
        .select()
        .from(institutionalActionLogs)
        .where(eq(institutionalActionLogs.institutionalAccountId, input.institutionId))
        .orderBy(desc(institutionalActionLogs.createdAt))
        .limit(input.limit);
    }),

  createActionLog: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        gapIdentified: z.string().min(3).max(2000),
        systemChange: z.string().min(3).max(4000),
        status: z.enum(["open", "in_progress", "completed"]).default("open"),
        careSignalEventId: z.number().int().positive().optional(),
        notes: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const result = await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user.id,
        gapIdentified: input.gapIdentified.trim(),
        systemChange: input.systemChange.trim(),
        status: input.status,
        careSignalEventId: input.careSignalEventId ?? null,
        notes: input.notes?.trim() ?? null,
      });

      const insertId = (result as unknown as { insertId: number }).insertId;

      return { success: true, id: insertId };
    }),

  /** Update status on an existing action log entry (Care Signal closure workflow). */
  updateActionLogStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        institutionId: z.number(),
        status: z.enum(["open", "in_progress", "completed"]),
        systemChange: z.string().min(3).max(4000).optional(),
        notes: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const [existing] = await db
        .select()
        .from(institutionalActionLogs)
        .where(
          and(
            eq(institutionalActionLogs.id, input.id),
            eq(institutionalActionLogs.institutionalAccountId, input.institutionId)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Action log entry not found" });
      }

      const fromStatus = existing.status as ActionLogStatus;
      const toStatus = input.status;

      if (!isValidActionLogStatusTransition(fromStatus, toStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition action log from "${fromStatus}" to "${toStatus}"`,
        });
      }

      if (
        requiresSystemChangeOnResolve(existing.systemChange, toStatus, input.systemChange)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Document the system change your hospital committed to before marking this action completed.",
        });
      }

      const nextSystemChange = input.systemChange?.trim() ?? existing.systemChange;
      const nextNotes =
        input.notes !== undefined ? input.notes.trim() || null : existing.notes;

      await db
        .update(institutionalActionLogs)
        .set({
          status: toStatus,
          systemChange: nextSystemChange,
          notes: nextNotes,
        })
        .where(eq(institutionalActionLogs.id, input.id));

      if (fromStatus !== "completed" && toStatus === "completed") {
        await trackEvent({
          userId: ctx.user.id,
          eventType: "institutional_action_log_resolved",
          eventName: "Institutional action log resolved",
          eventData: {
            actionLogId: input.id,
            institutionId: input.institutionId,
            careSignalEventId: existing.careSignalEventId,
            previousStatus: fromStatus,
          },
          sessionId: `action_log_${input.id}`,
        });
      }

      return { success: true, id: input.id, status: toStatus };
    }),

  /**
   * Facility-level Care Signal gap rollup (gap-analysis #5). Same aggregation
   * logic as an individual provider's getGapAnalysis, but scoped to every
   * facility this institution owns — this is the "institutional action"
   * stage of North Star's holistic loop (Stage 5), which until now only had
   * a manual "type in a gap you noticed" flow (createActionLog below), not
   * anything actually driven by the Care Signal data itself.
   *
   * Privacy: mirrors the ≥5-event anonymisation threshold already used for
   * platform-wide aggregates elsewhere in care-signal-events.ts. Below that,
   * a facility-level breakdown risks identifying which individual provider
   * filed a report, so the detailed breakdown is suppressed (total count and
   * reporter count still shown — that much is already visible to an
   * institutional admin by definition of running the query).
   */
  getFacilityGapAnalysis: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const ANONYMIZATION_THRESHOLD = 5;

      const facilityRows = await db
        .select({ id: careFacilities.id, name: careFacilities.name })
        .from(careFacilities)
        .where(
          and(
            eq(careFacilities.institutionalAccountId, input.institutionId),
            isNull(careFacilities.mergedIntoId)
          )
        );

      const facilityIds = facilityRows.map((f) => f.id);
      if (facilityIds.length === 0) {
        return {
          success: true,
          timeframe: input.timeframe,
          totalEvents: 0,
          uniqueReporters: 0,
          suppressed: false,
          gaps: [] as GapCategoryStat[],
          recommendations: [] as GapRecommendation[],
          byFacility: [] as { facilityId: number; facilityName: string; eventCount: number }[],
        };
      }

      const since = new Date(Date.now() - daysBackForTimeframe(input.timeframe) * 86_400_000);

      const events = await db
        .select({
          systemGaps: careSignalEvents.systemGaps,
          outcome: careSignalEvents.outcome,
          eventType: careSignalEvents.eventType,
          conditionCategory: careSignalEvents.conditionCategory,
          facilityId: careSignalEvents.facilityId,
          userId: careSignalEvents.userId,
        })
        .from(careSignalEvents)
        .where(and(inArray(careSignalEvents.facilityId, facilityIds), gte(careSignalEvents.createdAt, since)));

      const totalEvents = events.length;
      const uniqueReporters = new Set(events.map((e) => e.userId)).size;

      if (totalEvents < ANONYMIZATION_THRESHOLD) {
        return {
          success: true,
          timeframe: input.timeframe,
          totalEvents,
          uniqueReporters,
          suppressed: true,
          suppressionReason: `Fewer than ${ANONYMIZATION_THRESHOLD} Care Signal events across your facility/facilities in this timeframe — a detailed breakdown would risk identifying an individual provider's report. Try a longer timeframe.`,
          gaps: [] as GapCategoryStat[],
          recommendations: [] as GapRecommendation[],
          byFacility: [] as { facilityId: number; facilityName: string; eventCount: number }[],
        };
      }

      const gapCounts: Record<string, number> = {};
      const outcomes: string[] = [];
      const eventTypes: string[] = [];
      const conditionCategories: string[] = [];
      const perFacilityCounts: Record<number, number> = {};

      for (const e of events) {
        outcomes.push(e.outcome);
        eventTypes.push(e.eventType);
        if (e.conditionCategory) conditionCategories.push(e.conditionCategory);
        if (e.facilityId) perFacilityCounts[e.facilityId] = (perFacilityCounts[e.facilityId] ?? 0) + 1;
        try {
          const gaps = JSON.parse(e.systemGaps) as string[];
          for (const g of gaps) gapCounts[g] = (gapCounts[g] ?? 0) + 1;
        } catch { /* skip */ }
      }

      const gaps = gapCountsToArray(gapCounts);

      const worstOutcome = outcomes.includes("died")
        ? "died"
        : outcomes.includes("poor_outcome")
        ? "poor_outcome"
        : outcomes[0] ?? "unknown";

      const etCounts: Record<string, number> = {};
      for (const et of eventTypes) etCounts[et] = (etCounts[et] ?? 0) + 1;
      const mostCommonEventType = Object.entries(etCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

      const ccCounts: Record<string, number> = {};
      for (const cc of conditionCategories) ccCounts[cc] = (ccCounts[cc] ?? 0) + 1;
      const mostCommonConditionCategory = Object.entries(ccCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      const topGaps = gaps.slice(0, 5).map((g) => g.category);
      const recommendations = await buildRecommendations(topGaps, worstOutcome, mostCommonEventType, mostCommonConditionCategory);

      const byFacility = facilityRows
        .map((f) => ({ facilityId: f.id, facilityName: f.name, eventCount: perFacilityCounts[f.id] ?? 0 }))
        .filter((f) => facilityRows.length === 1 || f.eventCount >= ANONYMIZATION_THRESHOLD)
        .sort((a, b) => b.eventCount - a.eventCount);

      return {
        success: true,
        timeframe: input.timeframe,
        totalEvents,
        uniqueReporters,
        suppressed: false,
        gaps,
        recommendations,
        byFacility,
      };
    }),

  /** Open action log entries auto-created from Care Signal submissions — for dashboard alerts. */
  getPendingCareSignalActions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const rows = await db
      .select({ id: institutionalAccounts.id })
      .from(institutionalAccounts)
      .where(eq(institutionalAccounts.userId, ctx.user.id))
      .orderBy(desc(institutionalAccounts.id))
      .limit(1);

    const institutionId = rows[0]?.id;
    if (!institutionId) {
      return { count: 0, items: [] as { id: number; gapIdentified: string; careSignalEventId: number | null; createdAt: Date }[] };
    }

    const pending = await db
      .select({
        id: institutionalActionLogs.id,
        gapIdentified: institutionalActionLogs.gapIdentified,
        careSignalEventId: institutionalActionLogs.careSignalEventId,
        createdAt: institutionalActionLogs.createdAt,
      })
      .from(institutionalActionLogs)
      .where(
        and(
          eq(institutionalActionLogs.institutionalAccountId, institutionId),
          eq(institutionalActionLogs.status, "open")
        )
      )
      .orderBy(desc(institutionalActionLogs.createdAt))
      .limit(20);

    const fromCareSignal = pending.filter((p) => p.careSignalEventId != null);

    return {
      count: fromCareSignal.length,
      items: fromCareSignal,
    };
  }),

  runResusGpsAudit: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }
      return await runResusGpsAuditForInstitution(db, input.institutionId);
    }),

  importResusGpsAuditAction: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        gapIdentified: z.string().min(1),
        systemChange: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await db.insert(institutionalActionLogs).values({
        institutionalAccountId: input.institutionId,
        createdByUserId: ctx.user ? ctx.user.id : null,
        gapIdentified: input.gapIdentified,
        systemChange: input.systemChange,
        status: "open",
        notes: "Imported from Automated ResusGPS Quality Audit.",
      });

      return { success: true };
    }),

  getCohortProgress: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const cohortStats = await db
        .select({
          designation: institutionalStaffMembers.designation,
          totalCount: sql<number>`count(${institutionalStaffMembers.id})`,
          blsCompleteCount: sql<number>`sum(case when ${institutionalStaffMembers.certificationStatus} = 'certified' and ${institutionalStaffMembers.assignedCourses} like '%bls%' then 1 else 0 end)`,
          aclsCompleteCount: sql<number>`sum(case when ${institutionalStaffMembers.certificationStatus} = 'certified' and ${institutionalStaffMembers.assignedCourses} like '%acls%' then 1 else 0 end)`,
          phase2CompleteCount: sql<number>`sum(case when ${institutionalStaffMembers.phaseStatus} in ('phase_3', 'completed') then 1 else 0 end)`
        })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId))
        .groupBy(institutionalStaffMembers.designation);

      return cohortStats;
    }),

  getPendingLinkRequests: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      return await db
        .select()
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
          eq(institutionalStaffMembers.facilityLinkStatus, "pending")
        ));
    }),

  approveStaffFacilityLink: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffMemberId: z.number(),
        approve: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      const status = input.approve ? "linked" : "rejected";
      const enrollmentStatus = input.approve ? "enrolled" : "dropped";

      await db
        .update(institutionalStaffMembers)
        .set({
          facilityLinkStatus: status,
          enrollmentStatus: enrollmentStatus,
          updatedAt: new Date()
        })
        .where(and(
          eq(institutionalStaffMembers.id, input.staffMemberId),
          eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
        ));

      return { success: true, status };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-PROOF-1: Learner uploads their AHA elearning.heart.org proof URL.
  // Sets phase1ProofUrl on their institutionalStaffMember row.
  // Does NOT advance phaseStatus — that requires admin approval below.
  // ─────────────────────────────────────────────────────────────────────────
  uploadPhase1Proof: protectedProcedure
    .input(
      z.object({
        staffMemberId: z.number().int().positive(),
        proofUrl: z.string().url("Must be a valid URL"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Learner can only update their own row
      const [row] = await db
        .select({ id: institutionalStaffMembers.id, userId: institutionalStaffMembers.userId })
        .from(institutionalStaffMembers)
        .where(eq(institutionalStaffMembers.id, input.staffMemberId))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Staff record not found" });
      if (row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only upload proof for your own record" });
      }

      await db
        .update(institutionalStaffMembers)
        .set({
          phase1ProofUrl: input.proofUrl,
          updatedAt: new Date(),
        })
        .where(eq(institutionalStaffMembers.id, input.staffMemberId));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-PROOF-2: Institutional coordinator approves or rejects a learner's
  // Phase 1 proof. Approval advances phaseStatus to "phase_2".
  // ─────────────────────────────────────────────────────────────────────────
  approvePhase1Proof: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        staffMemberId: z.number().int().positive(),
        approve: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      if (input.approve) {
        await db
          .update(institutionalStaffMembers)
          .set({
            phase1ProofApprovedAt: new Date(),
            phaseStatus: "phase_2",
            updatedAt: new Date(),
          })
          .where(and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
          ));
      } else {
        // Rejection: clear the proof URL so learner must re-upload
        await db
          .update(institutionalStaffMembers)
          .set({
            phase1ProofUrl: null,
            phase1ProofApprovedAt: null,
            updatedAt: new Date(),
          })
          .where(and(
            eq(institutionalStaffMembers.id, input.staffMemberId),
            eq(institutionalStaffMembers.institutionalAccountId, input.institutionId)
          ));
      }

      return { success: true, approved: input.approve };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // COHORT-SELF-SERVICE: Subsidised ACLS/BLS Cohort Program (CEO decision,
  // 2026-07-19). A learner who was auto-linked to their facility via
  // `syncProviderProfileFacility` lands with `designation: "other"` and no
  // subsidised-eligibility signal. This lets them declare it themselves:
  // nurses provide a licence number (verification step, stored on their
  // existing `providerProfiles` row — no duplicate column), interns just
  // declare which intern designation they are. Eligibility itself is
  // evaluated in `payments.getIndividualBalance`, not here — this only
  // records the declaration.
  // ─────────────────────────────────────────────────────────────────────────
  declareMyDesignation: protectedProcedure
    .input(z.object({
      designation: z.enum(["bsn_intern", "coi_bsc", "coi_diploma", "moi", "permanent_nurse", "permanent_doctor", "other"]),
      licenseNumber: z.string().trim().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.designation === "permanent_nurse" && !input.licenseNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A licence number is required to register as a nurse." });
      }

      const staffRow = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(and(
          eq(institutionalStaffMembers.userId, ctx.user.id),
          inArray(institutionalStaffMembers.facilityLinkStatus, ["linked", "pending"])
        ))
        .limit(1);

      if (staffRow.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No institutional facility link found for your account yet." });
      }

      await db
        .update(institutionalStaffMembers)
        .set({ designation: input.designation, updatedAt: new Date() })
        .where(eq(institutionalStaffMembers.id, staffRow[0].id));

      if (input.designation === "permanent_nurse" && input.licenseNumber) {
        const existingProfile = await db
          .select({ id: providerProfiles.id })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, ctx.user.id))
          .limit(1);

        if (existingProfile.length > 0) {
          await db
            .update(providerProfiles)
            .set({ licenseNumber: input.licenseNumber, updatedAt: new Date() })
            .where(eq(providerProfiles.userId, ctx.user.id));
        } else {
          await db.insert(providerProfiles).values({
            userId: ctx.user.id,
            licenseNumber: input.licenseNumber,
          });
        }
      }

      return { success: true, designation: input.designation };
    }),
});
