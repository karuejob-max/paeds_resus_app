import { protectedProcedure, publicProcedure, adminProcedure, router } from "../_core/trpc";
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
  institutionalAnalytics,
} from "../../drizzle/schema";
import { eq, desc, and, inArray, count, asc } from "drizzle-orm";
import { processBulkEnrollment } from "../institutional-enrollment";
import { assertInstitutionAccess } from "../lib/institution-access";
import { ensureCourseCatalogForSchedule } from "../lib/ensure-course-catalog-for-schedule";
import {
  rollupInstitutionalAnalyticsForAccount,
  rollupAllInstitutionalAccounts,
} from "../institutional-analytics-rollup";
import { trackEvent } from "../services/analytics.service";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

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
        registrationNumber: z.string().min(1),
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
        department: input.department || null,
        yearsOfExperience: input.yearsOfExperience || 0,
        enrollmentStatus: "pending",
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
            department: staff.department || null,
            yearsOfExperience: staff.yearsOfExperience || 0,
            enrollmentStatus: "pending",
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
          maxCapacity: trainingSchedules.maxCapacity,
          enrolledCount: trainingSchedules.enrolledCount,
          status: trainingSchedules.status,
          createdAt: trainingSchedules.createdAt,
          updatedAt: trainingSchedules.updatedAt,
          programType: courses.programType,
        })
        .from(trainingSchedules)
        .leftJoin(courses, eq(trainingSchedules.courseId, courses.id))
        .where(eq(trainingSchedules.institutionalAccountId, input.institutionId))
        .orderBy(desc(trainingSchedules.scheduledDate));
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

      await db.insert(trainingSchedules).values({
        institutionalAccountId: input.institutionId,
        courseId,
        trainingType: input.trainingType,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime?.trim() || undefined,
        endTime: input.endTime?.trim() || undefined,
        location: input.location?.trim() || undefined,
        instructorName: input.instructorName?.trim() || undefined,
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

      const setPayload: {
        courseId: number;
        updatedAt: Date;
        trainingType?: (typeof trainingSchedules.$inferSelect)["trainingType"];
        scheduledDate?: Date;
        startTime?: string | null;
        endTime?: string | null;
        location?: string | null;
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
});
