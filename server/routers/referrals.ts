import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { clinicalReferrals, users } from "../../drizzle/schema";
import { sendEmail } from "../email-service";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://app.paedsresus.com";

export const referralsRouter = router({
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

      const userReferrals = await db
        .select()
        .from(clinicalReferrals)
        .where(eq(clinicalReferrals.userId, ctx.user.id))
        .orderBy(desc(clinicalReferrals.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: clinicalReferrals.id })
        .from(clinicalReferrals)
        .where(eq(clinicalReferrals.userId, ctx.user.id));
      const total = countResult.length;

      return { referrals: userReferrals, total };
    }),

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
        facilityContactEmail: z.string().email().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [inserted] = await db
        .insert(clinicalReferrals)
        .values({
          userId: ctx.user.id,
          patientName: input.patientName,
          patientAge: input.patientAge,
          diagnosis: input.diagnosis,
          urgency: input.urgency,
          reason: input.reason,
          referralType: input.referralType,
          facilityName: input.facilityName,
          facilityContactEmail: input.facilityContactEmail ?? null,
          notes: input.notes || null,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .$returningId();

      const providerRows = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const providerName = providerRows[0]?.name || "A Paeds Resus provider";
      const appLink = APP_BASE;

      if (input.facilityContactEmail) {
        const patientSummary = `${input.referralType} referral — ${input.diagnosis.slice(0, 120)}${input.diagnosis.length > 120 ? "…" : ""}`;
        const emailResult = await sendEmail(input.facilityContactEmail, "referralNewFacility", {
          facilityName: input.facilityName,
          providerName,
          patientSummary,
          urgency: input.urgency,
          appLink,
        });
        if (!emailResult.success) {
          console.warn("[referrals] facility notification email failed:", emailResult.error);
        }
      }

      return {
        success: true,
        message: "Referral submitted successfully",
        referralId: inserted?.id,
      };
    }),

  /**
   * Admin: update referral status and notify referring provider (+ facility email if on file).
   */
  adminUpdateReferralStatus: adminProcedure
    .input(
      z.object({
        referralId: z.number().int().positive(),
        status: z.enum(["pending", "accepted", "rejected", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select()
        .from(clinicalReferrals)
        .where(eq(clinicalReferrals.id, input.referralId))
        .limit(1);
      if (!rows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Referral not found" });
      }
      const ref = rows[0];

      await db
        .update(clinicalReferrals)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(clinicalReferrals.id, input.referralId));

      const providerRows = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, ref.userId))
        .limit(1);
      const provider = providerRows[0];
      const referringProvider = provider?.name || "Referring clinician";
      const appLink = APP_BASE;
      const newStatus = input.status;

      if (provider?.email) {
        const r = await sendEmail(provider.email, "referralStatusProvider", {
          patientName: ref.patientName,
          facilityName: ref.facilityName,
          newStatus,
          appLink,
        });
        if (!r.success) console.warn("[referrals] provider status email failed:", r.error);
      }

      if (ref.facilityContactEmail) {
        const r = await sendEmail(ref.facilityContactEmail, "referralStatusFacility", {
          patientName: ref.patientName,
          referringProvider,
          newStatus,
          appLink,
        });
        if (!r.success) console.warn("[referrals] facility status email failed:", r.error);
      }

      return { success: true, referralId: input.referralId, status: input.status };
    }),
});
