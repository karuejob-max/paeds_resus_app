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
});
