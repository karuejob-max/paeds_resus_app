import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { paymentService } from "../payments";
import { getMpesaService } from "../services/mpesa";

export const paymentsRouter = router({
  /**
   * Create payment intent
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        currency: z.enum(["KES", "USD", "EUR", "GBP", "ZAR", "NGN"]),
        method: z.enum(["mpesa", "stripe", "paypal", "bank_transfer"]),
        description: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const payment = paymentService.createPaymentIntent(
        ctx.user.id,
        input.amount,
        input.currency as "KES" | "USD" | "EUR" | "GBP" | "ZAR" | "NGN",
        input.method as "mpesa" | "stripe" | "paypal" | "bank_transfer",
        input.description,
        input.metadata || {}
      );

      return {
        success: true,
        payment,
      };
    }),

  /**
   * Process M-Pesa payment
   */
  processMPesaPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        phoneNumber: z.string(),
        mpesaTransactionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await paymentService.processMPesaPayment(
        input.paymentId,
        input.phoneNumber,
        input.mpesaTransactionId
      );

      return result;
    }),

  /**
   * Process Stripe payment
   */
  processStripePayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        stripePaymentIntentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await paymentService.processStripePayment(
        input.paymentId,
        input.stripePaymentIntentId
      );

      return result;
    }),

  /**
   * Process PayPal payment
   */
  processPayPalPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        paypalOrderId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await paymentService.processPayPalPayment(
        input.paymentId,
        input.paypalOrderId
      );

      return result;
    }),

  /**
   * Record bank transfer
   */
  recordBankTransfer: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        bankName: z.string(),
        accountNumber: z.string(),
        referenceNumber: z.string(),
      })
    )
    .mutation(({ input }) => {
      const result = paymentService.recordBankTransfer(
        input.paymentId,
        input.bankName,
        input.accountNumber,
        input.referenceNumber
      );

      return result;
    }),

  /**
   * Confirm bank transfer
   */
  confirmBankTransfer: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const result = paymentService.confirmBankTransfer(input.paymentId);
      return result;
    }),

  /**
   * Refund payment
   */
  refundPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(({ input }) => {
      const result = paymentService.refundPayment(input.paymentId, input.reason);
      return result;
    }),

  /**
   * Get payment details
   */
  getPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .query(({ input }) => {
      const payment = paymentService.getPayment(input.paymentId);
      return {
        success: !!payment,
        payment,
      };
    }),

  /**
   * Get user payments
   */
  getUserPayments: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ ctx, input }) => {
      const payments = paymentService.getUserPayments(ctx.user.id, input.limit);
      return {
        success: true,
        payments,
        total: payments.length,
      };
    }),

  /**
   * Convert currency
   */
  convertCurrency: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        from: z.enum(["KES", "USD", "EUR", "GBP", "ZAR", "NGN"]),
        to: z.enum(["KES", "USD", "EUR", "GBP", "ZAR", "NGN"]),
      })
    )
    .query(({ input }) => {
      const conversion = paymentService.convertCurrency(input.amount, input.from, input.to);
      const convertedAmount = input.amount * conversion.rate;

      return {
        success: true,
        originalAmount: input.amount,
        originalCurrency: input.from,
        convertedAmount,
        convertedCurrency: input.to,
        rate: conversion.rate,
      };
    }),

  /**
   * Initiate M-Pesa STK Push
   */
  initiateSTKPush: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().regex(/^254\d{9}$/, "Invalid phone number"),
        amount: z.number().min(1).max(150000),
        courseId: z.string(),
        courseName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const stkResponse = await getMpesaService().initiateSTKPush(
          input.phoneNumber,
          input.amount,
          `${ctx.user.id}-${input.courseId}`,
          `Payment for ${input.courseName}`
        );

        return {
          success: true,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
          message: stkResponse.CustomerMessage,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Payment initiation failed";
        throw new Error(message);
      }
    }),

  /**
   * Get payment status by CheckoutRequestID
   * Used for polling payment completion after STK Push
   */
  getPaymentStatus: protectedProcedure
    .input(
      z.object({
        checkoutRequestId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("../db");
        const { payments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          return {
            status: "pending",
            message: "Database unavailable",
          };
        }

        // Look up payment by CheckoutRequestID (stored in transactionId)
        const paymentRecords = await db
          .select()
          .from(payments)
          .where(eq(payments.transactionId, input.checkoutRequestId));

        if (paymentRecords.length === 0) {
          return {
            status: "not_found",
            message: "Payment not found",
          };
        }

        const payment = paymentRecords[0];

        return {
          status: payment.status,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId,
          updatedAt: payment.updatedAt,
          message:
            payment.status === "completed"
              ? "Payment successful"
              : payment.status === "failed"
                ? "Payment failed"
                : "Payment pending",
        };
      } catch (error) {
        console.error("Error getting payment status:", error);
        return {
          status: "error",
          message: "Failed to get payment status",
        };
      }
    }),

  /**
   * Store CheckoutRequestID for polling
   * Called after initiating STK Push to create a payment record
   */
  storeCheckoutRequest: protectedProcedure
    .input(
      z.object({
        checkoutRequestId: z.string(),
        merchantRequestId: z.string(),
        phoneNumber: z.string(),
        amount: z.number(),
        courseId: z.string(),
        courseName: z.string(),
        enrollmentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { getDb } = await import("../db");
        const { payments } = await import("../../drizzle/schema");

        const db = await getDb();
        if (!db) {
          throw new Error("Database unavailable");
        }

        // Create payment record with pending status
        // enrollmentId is required by schema; use 0 as placeholder if not provided
        const result = await db.insert(payments).values({
          enrollmentId: input.enrollmentId || 0,
          userId: ctx.user.id,
          amount: input.amount,
          paymentMethod: "mpesa",
          status: "pending",
          transactionId: input.checkoutRequestId,
          idempotencyKey: input.checkoutRequestId,
        });

        return {
          success: true,
          paymentId: (result as any).insertId,
          checkoutRequestId: input.checkoutRequestId,
          message: "Payment request stored",
        };
      } catch (error) {
        console.error("Error storing checkout request:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to store payment request"
        );
      }
    }),

  getIndividualBalance: protectedProcedure
    .input(z.object({ enrollmentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        const { getDb } = await import("../db");
        const { payments, enrollments, courses, institutionalStaffMembers, providerProfiles } = await import("../../drizzle/schema");
        const { eq, and, sum } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database unavailable");
        }

        const enrollmentRows = await db
          .select({
            id: enrollments.id,
            courseId: enrollments.courseId,
            userId: enrollments.userId,
            programType: enrollments.programType,
          })
          .from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);

        if (enrollmentRows.length === 0) {
          throw new Error("Enrollment not found");
        }

        const enrollment = enrollmentRows[0];

        // Security fix (2026-08-04): this procedure had no ownership check
        // at all -- any authenticated user could pass an arbitrary
        // enrollmentId and read someone else's payment balance. Found while
        // investigating why LearnerInstallmentPaymentsCard was showing
        // wrong data (it was being fed a micro-course enrollment ID, a
        // separate bug fixed by removing that call site) -- this is the
        // deeper issue underneath it: the endpoint itself was never
        // actually scoped to the caller.
        if (enrollment.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("You do not have access to this enrollment's payment balance.");
        }

        const paymentsSum = await db
          .select({ total: sum(payments.amount) })
          .from(payments)
          .where(and(
            eq(payments.enrollmentId, input.enrollmentId),
            eq(payments.status, "completed")
          ));

        const totalPaid = Number(paymentsSum[0]?.total ?? 0) / 100;

        let basePrice = 20000.00;

        // Subsidy eligibility (CEO decision, 2026-07-19): "Any nurse, or intern" —
        // not just anyone linked to a subsidised-program facility. A permanent_doctor
        // or undeclared "other" pays standard price even if their facility runs the
        // program. Nurses must have a licence number on file (providerProfiles) to
        // qualify — that's the verification step; interns just need to have declared
        // themselves as an intern designation, no licence required.
        const NURSE_DESIGNATION = "permanent_nurse" as const;
        const INTERN_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"] as const;

        const staffRows = await db
          .select({
            id: institutionalStaffMembers.id,
            institutionalAccountId: institutionalStaffMembers.institutionalAccountId,
            designation: institutionalStaffMembers.designation,
          })
          .from(institutionalStaffMembers)
          .where(and(
            eq(institutionalStaffMembers.userId, enrollment.userId),
            eq(institutionalStaffMembers.facilityLinkStatus, "linked")
          ))
          .limit(1);

        if (staffRows.length > 0) {
          const { designation } = staffRows[0];
          let eligible = false;
          if (designation === NURSE_DESIGNATION) {
            const [profile] = await db
              .select({ licenseNumber: providerProfiles.licenseNumber })
              .from(providerProfiles)
              .where(eq(providerProfiles.userId, enrollment.userId))
              .limit(1);
            eligible = !!profile?.licenseNumber && profile.licenseNumber.trim().length > 0;
          } else if (designation && (INTERN_DESIGNATIONS as readonly string[]).includes(designation)) {
            eligible = true;
          }

          if (eligible) {
            basePrice = 15000.00;
          }

          await db
            .update(institutionalStaffMembers)
            .set({
              totalPaidAmount: String(totalPaid),
              phaseStatus: totalPaid >= basePrice ? "phase_3" : undefined,
              updatedAt: new Date()
            })
            .where(eq(institutionalStaffMembers.id, staffRows[0].id));
        }

        const balance = Math.max(0, basePrice - totalPaid);
        const isPaidInFull = balance <= 0;

        return {
          totalPaid,
          basePrice,
          balance,
          isPaidInFull,
        };
      } catch (error) {
        console.error("Error getting balance:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to get payment balance"
        );
      }
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // Self-service payment ledger (docs/IERP_NERP_PROGRAM_V2_SPEC.md §6.2):
  // getIndividualBalance above needs an enrollmentId the learner has no
  // natural way to know. This finds their priced enrollment automatically
  // (BLS is free per §6.3, so the first non-BLS enrollment -- acls/pals/nrp
  // -- is the one with a real balance) and returns everything the frontend
  // needs to show "paid so far / remaining" plus fire initiateSTKPush
  // directly, without a second round-trip to look up the enrollment.
  // ─────────────────────────────────────────────────────────────────────────
  getMyPaymentLedger: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const { payments, enrollments, courses, institutionalStaffMembers, providerProfiles } = await import("../../drizzle/schema");
    const { eq, and, sum, ne } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [pricedEnrollment] = await db
      .select({ id: enrollments.id, programType: enrollments.programType, courseId: enrollments.courseId, courseTitle: courses.title })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(and(eq(enrollments.userId, ctx.user.id), ne(enrollments.programType, "bls")))
      .limit(1);

    if (!pricedEnrollment) {
      return { hasPricedEnrollment: false as const };
    }

    const paymentsSum = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(eq(payments.enrollmentId, pricedEnrollment.id), eq(payments.status, "completed")));
    const totalPaid = Number(paymentsSum[0]?.total ?? 0) / 100;

    let basePrice = 20000.0;
    const [staffRow] = await db
      .select({ designation: institutionalStaffMembers.designation })
      .from(institutionalStaffMembers)
      .where(and(eq(institutionalStaffMembers.userId, ctx.user.id), eq(institutionalStaffMembers.facilityLinkStatus, "linked")))
      .limit(1);
    if (staffRow) {
      const INTERN_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"] as const;
      let eligible = false;
      if (staffRow.designation === "permanent_nurse") {
        const [profile] = await db
          .select({ licenseNumber: providerProfiles.licenseNumber })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, ctx.user.id))
          .limit(1);
        eligible = !!profile?.licenseNumber && profile.licenseNumber.trim().length > 0;
      } else if (staffRow.designation && (INTERN_DESIGNATIONS as readonly string[]).includes(staffRow.designation)) {
        eligible = true;
      }
      if (eligible) basePrice = 15000.0;
    }

    const balance = Math.max(0, basePrice - totalPaid);
    return {
      hasPricedEnrollment: true as const,
      enrollmentId: pricedEnrollment.id,
      courseId: pricedEnrollment.courseId,
      courseTitle: pricedEnrollment.courseTitle,
      totalPaid,
      basePrice,
      balance,
      isPaidInFull: balance <= 0,
    };
  }),
});
