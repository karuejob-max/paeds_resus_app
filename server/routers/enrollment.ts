import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createEnrollment,
  getEnrollmentsByUserId,
  createPayment,
  getPaymentsByEnrollmentId,
  createSmsReminder,
  getDb,
} from "../db";
import { enrollments } from "../../drizzle/schema";

const enrollmentSchema = z.object({
  programType: z.enum(["bls", "acls", "pals", "fellowship"]),
  trainingDate: z.date(),
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
      const result = await createEnrollment({
        userId: ctx.user.id,
        programType: input.programType,
        trainingDate: input.trainingDate,
        paymentStatus: "pending",
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
      return rows[0] ?? null;
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

      return { success: true, paymentId: 1 };
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
});
