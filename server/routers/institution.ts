import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { institutionalAccounts, institutionalStaffMembers, quotations, contracts, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const institutionRouter = router({
  // Register a new institution
  register: publicProcedure
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

        // Create institutional account with userId (use 0 as placeholder for now)
        const result = await db.insert(institutionalAccounts).values({
          userId: 0, // Will be updated when admin account is created
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
          institutionId: (result as any).insertId || 1,
          message: "Institution registered successfully. Proceeding to payment...",
          nextStep: "payment",
        };
      } catch (error) {
        console.error("Institution registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register institution",
        });
      }
    }),

  // Get institution details
  getDetails: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
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

        if (!institution.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Institution not found",
          });
        }

        return institution[0];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch institution details",
        });
      }
    }),

  // Update institution details
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
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const updateData: any = { updatedAt: new Date() };
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
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update institution",
        });
      }
    }),

  // Get institution staff members
  getStaffMembers: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }
        const staff = await db
          .select()
          .from(institutionalStaffMembers)
          .where(eq(institutionalStaffMembers.institutionalAccountId, input.institutionId));

        return staff;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch staff members",
        });
      }
    }),

  // Add staff member
  addStaffMember: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffName: z.string(),
        staffEmail: z.string().email(),
        staffPhone: z.string().optional(),
        staffRole: z.enum(["doctor", "nurse", "paramedic", "midwife", "lab_tech", "respiratory_therapist", "support_staff", "other"]),
        department: z.string().optional(),
        yearsOfExperience: z.number().optional(),
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
          staffId: (result as any).insertId || 1,
          message: "Staff member added successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add staff member",
        });
      }
    }),

  // Bulk import staff from CSV
  bulkImportStaff: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staff: z.array(
          z.object({
            staffName: z.string(),
            staffEmail: z.string().email(),
            staffPhone: z.string().optional(),
            staffRole: z.enum(["doctor", "nurse", "paramedic", "midwife", "lab_tech", "respiratory_therapist", "support_staff", "other"]),
            department: z.string().optional(),
            yearsOfExperience: z.number().optional(),
          })
        ),
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

        const imported = [];
        const errors = [];

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
              staffId: (result as any).insertId || 1,
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
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk import staff",
        });
      }
    }),

  // Get institution quotations
  getQuotations: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }
        const quots = await db
          .select()
          .from(quotations)
          .where(eq(quotations.institutionalAccountId, input.institutionId));

        return quots;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch quotations",
        });
      }
    }),

  // Get institution contracts
  getContracts: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }
        const cntrcts = await db
          .select()
          .from(contracts)
          .where(eq(contracts.institutionalAccountId, input.institutionId));

        return cntrcts;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch contracts",
        });
      }
    }),

  // Get institution stats
  getStats: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

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
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch institution stats",
        });
      }
    }),

  // Verify institution exists
  verify: publicProcedure
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
        const institution = await db
          .select()
          .from(institutionalAccounts)
          .where(eq(institutionalAccounts.id, input.institutionId))
          .limit(1);

        return {
          exists: institution.length > 0,
          active: institution.length > 0 && institution[0].status === "active",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify institution",
        });
      }
    }),
});
