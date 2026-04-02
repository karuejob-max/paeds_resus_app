import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createEnrollment,
  getEnrollmentsByUserId,
  createPayment,
  getPaymentsByEnrollmentId,
  createSmsReminder,
  getDb,
} from "../db";
import { enrollments, payments, courses } from "../../drizzle/schema";
import { issueCertificateForEnrollmentIfEligible } from "../certificates";
import { trackEvent } from "../services/analytics.service";
import { ensurePalsSeriouslyIllCatalog, getSeriouslyIllChildCourseId } from "../lib/ensure-pals-seriously-ill-catalog";
import {
  ensurePaediatricSepticShockCatalog,
  getPaediatricSepticShockCourseId,
} from "../lib/ensure-paediatric-septic-shock-catalog";

const enrollmentSchema = z.object({
  programType: z.enum(["bls", "acls", "pals", "fellowship", "instructor"]),
  trainingDate: z.date(),
  /** PALS only: which micro-course SKU (sets enrollments.courseId). */
  pricingSku: z.enum(["pals", "pals_septic"]).optional(),
});

const paymentSchema = z.object({
  enrollmentId: z.number(),
  amount: z.number(), // in cents (KES)
  paymentMethod: z.enum(["mpesa", "bank_transfer", "card"]),
  transactionId: z.string().optional(),
});

export const enrollmentRouter = router({
  // Create a new enrollment
  create: protectedProcedure
    .input(enrollmentSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      let courseId: number | null = null;

      if (input.programType === "pals" && db) {
        await ensurePaediatricSepticShockCatalog(db);
        await ensurePalsSeriouslyIllCatalog(db);
        if (input.pricingSku === "pals_septic") {
          const id = await getPaediatricSepticShockCourseId(db);
          courseId = id;
        } else {
          courseId = await getSeriouslyIllChildCourseId(db);
        }
        if (courseId == null) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not resolve PALS course catalog. Try again or contact support.",
          });
        }
      }

      const result = await createEnrollment({
        userId: ctx.user.id,
        programType: input.programType,
        trainingDate: input.trainingDate,
        paymentStatus: "pending",
        courseId: input.programType === "pals" ? courseId : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const enrollmentId = result?.id ?? 0;
      if (!enrollmentId) throw new Error("Failed to create enrollment");

      // Create SMS reminder for enrollment confirmation
      if (ctx.user.phone) {
        await createSmsReminder({
          enrollmentId,
          userId: ctx.user.id,
          phoneNumber: ctx.user.phone,
          reminderType: "enrollment_confirmation",
          status: "pending",
          createdAt: new Date(),
        });
      }

      await trackEvent({
        userId: ctx.user.id,
        eventType: "course_enrollment",
        eventName: `Enroll ${input.programType}`,
        eventData: {
          courseType: input.programType,
          pricingSku: input.pricingSku ?? null,
          enrollmentId,
          coursePrice: 0,
          source: "enrollment_create",
        },
        sessionId: `enrollment_${enrollmentId}`,
      });

      return { success: true, enrollmentId };
    }),

  // Get user's enrollments
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return await getEnrollmentsByUserId(ctx.user.id);
  }),

  // Get enrollment details (current user only — used to lock Payment to the same enrollment as Enroll)
  getById: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      const rows = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      let courseTitle: string | null = null;
      if (row.courseId != null) {
        const ct = await db
          .select({ title: courses.title })
          .from(courses)
          .where(eq(courses.id, row.courseId))
          .limit(1);
        courseTitle = ct[0]?.title ?? null;
      }
      return { ...row, courseTitle };
    }),

  // Record a payment
  recordPayment: protectedProcedure
    .input(paymentSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await createPayment({
        enrollmentId: input.enrollmentId,
        userId: ctx.user.id,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId,
        status: "pending",
        smsConfirmationSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const paymentId = result?.id ?? 0;
      if (!paymentId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to record payment" });
      }

      // Create SMS reminder for payment confirmation
      if (ctx.user.phone) {
        await createSmsReminder({
          enrollmentId: input.enrollmentId,
          userId: ctx.user.id,
          phoneNumber: ctx.user.phone,
          reminderType: "payment_reminder",
          status: "pending",
          createdAt: new Date(),
        });
      }

      return { success: true, paymentId };
    }),

  // Get payments for an enrollment (only if it belongs to the current user)
  getPaymentsByEnrollmentId: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      const own = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);
      if (!own.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }
      return await getPaymentsByEnrollmentId(input.enrollmentId);
    }),

  // Verify M-Pesa payment (simulated)
  verifyMpesaPayment: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      amount: z.number(),
      phoneNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Integrate with M-Pesa API for actual verification
      // For now, return a simulated success response
      return {
        success: true,
        transactionId: input.transactionId,
        amount: input.amount,
        status: "completed",
        message: "Payment verified successfully",
      };
    }),

  /**
   * After bank/wire proof is verified offline, mark enrollment paid and issue certificate (admin).
   * Use when STK/C2B is unavailable or for institutional settlements.
   */
  adminConfirmOfflinePayment: adminProcedure
    .input(
      z.object({
        enrollmentId: z.number().int().positive(),
        amountPaid: z.number().int().min(0).optional(),
        internalNote: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      const enrRows = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))
        .limit(1);
      if (!enrRows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }
      const enrollment = enrRows[0];

      if (input.internalNote?.trim()) {
        console.info(
          `[adminConfirmOfflinePayment] enrollment=${input.enrollmentId} note=${input.internalNote.trim().slice(0, 200)}`
        );
      }

      const pendingList = await db
        .select()
        .from(payments)
        .where(and(eq(payments.enrollmentId, input.enrollmentId), eq(payments.status, "pending")));

      const pendingSum = pendingList.reduce((s, p) => s + (p.amount ?? 0), 0);
      // Parentheses required: cannot mix ?? and || without disambiguation (esbuild / TS5076).
      let amount =
        (input.amountPaid ?? pendingSum) || enrollment.amountPaid || 0;

      for (const p of pendingList) {
        await db
          .update(payments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(payments.id, p.id));
      }

      if (pendingList.length === 0) {
        await db.insert(payments).values({
          enrollmentId: input.enrollmentId,
          userId: enrollment.userId,
          amount: amount || 0,
          paymentMethod: "bank_transfer",
          transactionId: `admin-offline-${Date.now()}`,
          status: "completed",
          smsConfirmationSent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as typeof payments.$inferInsert);
      }

      await db
        .update(enrollments)
        .set({
          paymentStatus: "completed",
          amountPaid: amount,
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, input.enrollmentId));

      const cert = await issueCertificateForEnrollmentIfEligible(input.enrollmentId);
      return {
        success: true as const,
        certificateIssued: cert.issued,
        certificateError: cert.error ?? null,
        amountApplied: amount,
      };
    }),
});
