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
  courses,
  incidents,
  institutionalAnalytics,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { processBulkEnrollment } from "../institutional-enrollment";
import { assertInstitutionAccess } from "../lib/institution-access";
import {
  rollupInstitutionalAnalyticsForAccount,
  rollupAllInstitutionalAccounts,
} from "../institutional-analytics-rollup";

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
        .select()
        .from(trainingSchedules)
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

      return { success: true as const, scheduleId: created[0]?.id ?? null };
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
});
