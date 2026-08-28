/**
 * M-Pesa Daraja Webhook Callback Handler
 * Receives payment confirmation from Daraja API
 * 
 * Endpoint: POST /api/webhooks/mpesa/callback
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { microCourseEnrollments, payments } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { parseCallbackResponse } from '../_core/mpesa';

const router = Router();

/**
 * M-Pesa STK Push Callback
 * Daraja sends callback when user completes/cancels M-Pesa prompt
 */
router.post('/mpesa/callback', async (req: Request, res: Response) => {
  try {
    console.log('[M-Pesa Webhook] Received callback:', JSON.stringify(req.body, null, 2));

    // Parse callback data
    const callbackData = parseCallbackResponse(req.body);

    const {
      checkoutRequestId,
      resultCode,
      resultDescription,
      mpesaReceiptNumber,
      amount,
      phoneNumber,
    } = callbackData;

    // Find payment by transaction ID
    const paymentRecord = await db
      ?.select()
      .from(payments)
      .where(eq(payments.transactionId, checkoutRequestId))
      .limit(1);

    if (!paymentRecord || paymentRecord.length === 0) {
      console.error('[M-Pesa Webhook] Payment not found:', checkoutRequestId);
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    const payment = paymentRecord[0];

    // Find enrollment
    const enrollmentRecord = await db
      ?.select()
      .from(microCourseEnrollments)
      .where(eq(microCourseEnrollments.id, payment.enrollmentId))
      .limit(1);

    if (!enrollmentRecord || enrollmentRecord.length === 0) {
      console.error('[M-Pesa Webhook] Enrollment not found for payment:', payment.enrollmentId);
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const enrollment = enrollmentRecord[0];

    // Check result code (0 = success) and reconcile the amount before activation.
    if (resultCode === '0') {
      const expectedAmountKes = Math.ceil(Number(enrollment.amountPaid ?? 0) / 100);
      const receivedAmountKes = Number(amount);
      if (expectedAmountKes > 0 && (!Number.isFinite(receivedAmountKes) || Math.round(receivedAmountKes) !== expectedAmountKes)) {
        await db?.update(microCourseEnrollments).set({ enrollmentStatus: 'pending', paymentStatus: 'pending' }).where(eq(microCourseEnrollments.id, enrollment.id));
        await db?.update(payments).set({ status: 'failed', phoneNumber: phoneNumber ? String(phoneNumber).trim() : null }).where(eq(payments.id, payment.id));
        console.error('[M-Pesa Webhook] Amount mismatch; access was not activated:', { enrollmentId: enrollment.id, expectedAmountKes, receivedAmountKes });
        return res.status(200).json({ success: false, message: 'Payment amount mismatch; enrollment remains pending review.', enrollmentId: enrollment.id });
      }

      // Payment successful - activate enrollment
      console.log('[M-Pesa Webhook] Payment successful for enrollment:', enrollment.id);

      await db
        ?.update(microCourseEnrollments)
        .set({
          enrollmentStatus: 'active',
          paymentStatus: 'completed',
        })
        .where(eq(microCourseEnrollments.id, enrollment.id));

      // Update payment record
      // Migration 0088 (CEO decision 2026-08-05): previously this overwrote
      // transactionId with the receipt number on success, discarding the
      // CheckoutRequestID -- inconsistent with mpesa-webhook.ts, which keeps
      // transactionId as the CheckoutRequestID throughout so callers can
      // keep polling by it. Standardized to match: transactionId untouched,
      // receipt and phone go in their own columns.
      await db
        ?.update(payments)
        .set({
          status: 'completed',
          mpesaReceiptNumber: mpesaReceiptNumber ? String(mpesaReceiptNumber).trim() : null,
          phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
        })
        .where(eq(payments.id, payment.id));

      // Log successful payment
      console.log('[M-Pesa Webhook] Enrollment activated:', {
        enrollmentId: enrollment.id,
        mpesaReceiptNumber,
        amount,
        phoneNumber,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed. Enrollment activated.',
        enrollmentId: enrollment.id,
        mpesaReceiptNumber,
      });
    } else {
      // Payment failed or cancelled
      console.log('[M-Pesa Webhook] Payment failed:', {
        enrollmentId: enrollment.id,
        resultCode,
        resultDescription,
      });

      await db
        ?.update(microCourseEnrollments)
        .set({
          enrollmentStatus: 'pending',
          paymentStatus: 'pending',
        })
        .where(eq(microCourseEnrollments.id, enrollment.id));

      await db
        ?.update(payments)
        .set({
          status: 'failed',
          phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
        })
        .where(eq(payments.id, payment.id));

      return res.status(200).json({
        success: false,
        message: `Payment failed: ${resultDescription}`,
        enrollmentId: enrollment.id,
        resultCode,
      });
    }
  } catch (error) {
    console.error('[M-Pesa Webhook] Error processing callback:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/mpesa/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'M-Pesa Webhook Handler',
    timestamp: new Date().toISOString(),
  });
});

export default router;
