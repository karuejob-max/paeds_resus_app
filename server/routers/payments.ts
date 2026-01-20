import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { paymentService } from "../payments";

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
        timestamp: conversion.timestamp,
      };
    }),

  /**
   * Get payment statistics (admin only)
   */
  getStatistics: adminProcedure.query(() => {
    const stats = paymentService.getPaymentStatistics();
    return {
      success: true,
      ...stats,
    };
  }),

  /**
   * Get webhook logs (admin only)
   */
  getWebhookLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).optional().default(100),
      })
    )
    .query(({ input }) => {
      const logs = paymentService.getWebhookLogs(input.limit);
      return {
        success: true,
        logs,
        total: logs.length,
      };
    }),
});
