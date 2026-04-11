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
// NEW: Enrollment system imports
// @ts-ignore - dynamic imports
import type { validatePromoCode, getCourseDetails, calculateFinalPrice, isUserEnrolled, createEnrollment as createEnrollmentDb, incrementPromoCodeUsage, isUserAdmin } from "../db-enrollment";

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

      let result: { id: number } | null;
      try {
        result = await createEnrollment({
          userId: ctx.user.id,
          programType: input.programType,
          trainingDate: input.trainingDate,
          paymentStatus: "pending",
          courseId: input.programType === "pals" ? courseId : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/courseId|Unknown column/i.test(msg)) {
          console.error("[enrollment.create] schema missing enrollments.courseId — run db:apply-0029", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Enrollment is temporarily unavailable (database update required). If you run the platform: apply migration enrollments.courseId (pnpm run db:apply-0029). Otherwise contact support.",
          });
        }
        throw e;
      }

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

  // NEW: Enroll with payment (M-Pesa, admin free, or promo code)
  enrollWithPayment: protectedProcedure
    .input(
      z.object({
        courseId: z.string(), // e.g., "asthma-i"
        phoneNumber: z.string().optional(), // Required for M-Pesa
        promoCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { validatePromoCode, getCourseDetails, calculateFinalPrice, isUserEnrolled, createEnrollment: createEnrollmentDb, incrementPromoCodeUsage, isUserAdmin } = await import("../db-enrollment");
        
        const userId = ctx.user.id;

        // 1. Get course details
        const course = await getCourseDetails(input.courseId);
        if (!course) {
          throw new Error("Course not found");
        }

        // 2. Check if already enrolled
        const alreadyEnrolled = await isUserEnrolled(userId, course.id);
        if (alreadyEnrolled) {
          return {
            success: false,
            error: "Already enrolled in this course",
          };
        }

        // 3. Check if user is admin (free enrollment)
        const isAdmin = await isUserAdmin(userId);
        if (isAdmin) {
          const enrollment = await createEnrollmentDb({
            userId,
            microCourseId: course.id,
            paymentMethod: "admin-free",
            amountPaid: 0,
          });

          return {
            success: true,
            enrollmentId: enrollment.insertId,
            message: "Admin enrollment successful",
            paymentMethod: "admin-free",
          };
        }

        // 4. Handle promo code if provided
        if (input.promoCode) {
          const promoValidation = await validatePromoCode(input.promoCode);
          if (!promoValidation.valid) {
            return {
              success: false,
              error: promoValidation.error,
            };
          }

          const finalPrice = calculateFinalPrice(
            course.price,
            promoValidation.discountPercent
          );

          const enrollment = await createEnrollmentDb({
            userId,
            microCourseId: course.id,
            paymentMethod: "promo-code",
            promoCodeId: promoValidation.id,
            amountPaid: finalPrice,
          });

          // Increment promo code usage
          await incrementPromoCodeUsage(promoValidation.id);

          return {
            success: true,
            enrollmentId: enrollment.insertId,
            message:
              finalPrice === 0
                ? "Enrollment successful - Free course via promo code"
                : `Enrollment successful - ${promoValidation.discountPercent}% discount applied`,
            paymentMethod: "promo-code",
            amountPaid: finalPrice,
          };
        }

        // 5. M-Pesa payment flow
        if (!input.phoneNumber) {
          return {
            success: false,
            error: "Phone number required for M-Pesa payment",
          };
        }

        // Create pending enrollment record
        console.log("[Enrollment] Creating enrollment with:", { userId, microCourseId: course.id, paymentMethod: "m-pesa", amountPaid: course.price });
        console.log("[Enrollment] createEnrollmentDb function:", createEnrollmentDb.toString().substring(0, 100));
        const enrollment = await createEnrollmentDb({
          userId,
          microCourseId: course.id,
          paymentMethod: "m-pesa",
          amountPaid: course.price,
        });
        console.log("[Enrollment] Created enrollment:", enrollment);

        // Initiate M-Pesa STK Push using existing M-Pesa integration
        const { initiateStkPush } = await import("../mpesa");
        const { buildStkAccountReference } = await import("../lib/daraja-account-reference");
        
        const accountReference = buildStkAccountReference({
          enrollmentId: enrollment.insertId,
          learnerName: ctx.user.name,
          userId: ctx.user.id,
        });
        
        const mpesaResult = await initiateStkPush({
          phoneNumber: input.phoneNumber,
          amount: Math.ceil(course.price / 100), // Convert cents to KES
          accountReference,
          transactionDesc: `${course.title} - Paeds Resus Fellowship`,
          orderId: `ENROLL-${enrollment.insertId}`,
        });

        if (!mpesaResult.success) {
          return {
            success: false,
            error: mpesaResult.error || "Failed to initiate M-Pesa payment",
          };
        }

        return {
          success: true,
          enrollmentId: enrollment.insertId,
          message: "M-Pesa STK Push initiated - Check your phone",
          paymentMethod: "m-pesa",
          checkoutRequestId: mpesaResult.checkoutRequestID,
          amountPaid: course.price,
        };
      } catch (error) {
        console.error("[Enrollment] Error in enrollWithPayment:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Enrollment failed",
        };
      }
    }),

  // NEW: Validate promo code before enrollment
  validatePromo: protectedProcedure
    .input(z.object({ code: z.string(), coursePrice: z.number() }))
    .query(async ({ input }) => {
      try {
        const { validatePromoCode, calculateFinalPrice } = await import("../db-enrollment");
        const validation = await validatePromoCode(input.code);
        if (!validation.valid) {
          return { valid: false, error: validation.error };
        }

        const finalPrice = calculateFinalPrice(
          input.coursePrice,
          validation.discountPercent
        );
        const savings = input.coursePrice - finalPrice;

        return {
          valid: true,
          discountPercent: validation.discountPercent,
          originalPrice: input.coursePrice,
          finalPrice,
          savings,
          description: validation.description,
        };
      } catch (error) {
        console.error("[Enrollment] Error validating promo:", error);
        return { valid: false, error: "Error validating promo code" };
      }
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
