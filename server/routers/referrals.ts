import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { clinicalReferrals } from "../../drizzle/schema";

export const referralsRouter = router({
  /**
   * Get all referrals for the current user
   */
  getReferrals: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { referrals: [], total: 0 };

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      // Get referrals created by this user
      const userReferrals = await db
        .select()
        .from(clinicalReferrals)
        .where(eq(clinicalReferrals.userId, ctx.user.id))
        .orderBy(desc(clinicalReferrals.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await db
        .select({ count: clinicalReferrals.id })
        .from(clinicalReferrals)
        .where(eq(clinicalReferrals.userId, ctx.user.id));
      const total = countResult.length;

      return { referrals: userReferrals, total };
    }),

  /**
   * Submit a new referral
   */
  submitReferral: protectedProcedure
    .input(
      z.object({
        patientName: z.string().min(1),
        patientAge: z.number().min(0).max(120),
        diagnosis: z.string().min(1),
        urgency: z.enum(["routine", "urgent", "emergency"]),
        reason: z.string().min(1),
        referralType: z.enum(["hospital", "specialist", "imaging", "lab"]),
        facilityName: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Insert referral
      const result = await db.insert(clinicalReferrals).values({
        userId: ctx.user.id,
        patientName: input.patientName,
        patientAge: input.patientAge,
        diagnosis: input.diagnosis,
        urgency: input.urgency,
        reason: input.reason,
        referralType: input.referralType,
        facilityName: input.facilityName,
        notes: input.notes || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: "Referral submitted successfully",
      };
    }),
});
