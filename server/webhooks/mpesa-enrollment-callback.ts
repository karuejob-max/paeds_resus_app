/**
 * M-Pesa Enrollment Callback Handler
 * Handles M-Pesa webhook callbacks for enrollment payments
 * Updates payment status and issues certificates on completion
 */

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { payments, enrollments } from "../../drizzle/schema";
import { issueCertificateForEnrollmentIfEligible } from "../certificates";
import { trackPaymentCompletion } from "../services/analytics.service";
import { notifyOwner } from "../_core/notification";

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

interface CallbackMetadata {
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

/**
 * Parse M-Pesa callback metadata
 */
function parseCallbackMetadata(items?: Array<{ Name: string; Value: string | number }>): CallbackMetadata {
  if (!items) return {};

  const metadata: CallbackMetadata = {};
  for (const item of items) {
    switch (item.Name) {
      case "Amount":
        metadata.amount = Number(item.Value);
        break;
      case "MpesaReceiptNumber":
        metadata.mpesaReceiptNumber = String(item.Value);
        break;
      case "TransactionDate":
        metadata.transactionDate = String(item.Value);
        break;
      case "PhoneNumber":
        metadata.phoneNumber = String(item.Value);
        break;
    }
  }
  return metadata;
}

/**
 * Handle M-Pesa STK callback for enrollment payment
 * Called by M-Pesa API when user completes/cancels STK push
 */
export async function handleMpesaEnrollmentCallback(body: MpesaCallbackBody): Promise<{
  success: boolean;
  message: string;
  paymentId?: number;
  enrollmentId?: number;
}> {
  try {
    const { stkCallback } = body.Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log("[M-Pesa Enrollment Callback]", {
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
    });

    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database unavailable" };
    }

    // Find payment by checkout request ID
    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, CheckoutRequestID))
      .limit(1);

    if (!paymentRows.length) {
      console.warn("[M-Pesa Enrollment Callback] Payment not found for checkout ID:", CheckoutRequestID);
      return { success: false, message: "Payment not found" };
    }

    const payment = paymentRows[0];
    const metadata = parseCallbackMetadata(CallbackMetadata?.Item);

    // Check result code
    if (ResultCode === 0) {
      // Payment successful
      console.log("[M-Pesa Enrollment Callback] Payment successful:", {
        paymentId: payment.id,
        amount: metadata.amount,
        mpesaReceiptNumber: metadata.mpesaReceiptNumber,
      });

      // Update payment status
      await db
        .update(payments)
        .set({
          status: "completed",
          transactionId: metadata.mpesaReceiptNumber || CheckoutRequestID,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Find associated enrollment
      const enrollmentRows = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, payment.enrollmentId))
        .limit(1);

      if (enrollmentRows.length) {
        const enrollment = enrollmentRows[0];

        // Issue certificate if eligible
        try {
          const certificateResult = await issueCertificateForEnrollmentIfEligible(enrollment.id);
          console.log("[M-Pesa Enrollment Callback] Certificate issued:", certificateResult);
        } catch (error) {
          console.error("[M-Pesa Enrollment Callback] Certificate issuance error:", error);
          // Don't fail the callback if certificate issuance fails
        }

        // Track payment completion analytics
        try {
          await trackPaymentCompletion(
            enrollment.userId,
            metadata.amount || payment.amount,
            "mpesa",
            metadata.mpesaReceiptNumber || CheckoutRequestID,
            `enrollment_${enrollment.id}`
          );
        } catch (error) {
          console.error("[M-Pesa Enrollment Callback] Analytics tracking error:", error);
          // Don't fail if analytics fails
        }

        // Notify owner of successful payment
        try {
          await notifyOwner({
            title: "M-Pesa Payment Completed",
            content: `Enrollment payment successful: KES ${(metadata.amount || payment.amount) / 100} from ${metadata.phoneNumber || "unknown"}. Receipt: ${metadata.mpesaReceiptNumber || "N/A"}`,
          });
        } catch (error) {
          console.error("[M-Pesa Enrollment Callback] Owner notification error:", error);
        }
      }

      return {
        success: true,
        message: "Payment processed successfully",
        paymentId: payment.id,
        enrollmentId: payment.enrollmentId,
      };
    } else if (ResultCode === 1) {
      // User cancelled
      console.log("[M-Pesa Enrollment Callback] Payment cancelled by user");

      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return {
        success: true,
        message: "Payment cancelled by user",
        paymentId: payment.id,
        enrollmentId: payment.enrollmentId,
      };
    } else {
      // Other failure codes
      console.log("[M-Pesa Enrollment Callback] Payment failed:", {
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      });

      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return {
        success: true,
        message: "Payment failed",
        paymentId: payment.id,
        enrollmentId: payment.enrollmentId,
      };
    }
  } catch (error) {
    console.error("[M-Pesa Enrollment Callback] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Callback processing failed",
    };
  }
}

/**
 * Check if callback was already processed (idempotency)
 * Prevents duplicate processing of M-Pesa callbacks
 */
export async function checkCallbackIdempotency(checkoutRequestId: string, db: any): Promise<boolean> {
  try {
    // Check if this callback was already processed
    const existing = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, checkoutRequestId))
      .limit(1);

    // If already processed with completed/failed status, this is a duplicate
    if (existing.length && existing[0].status !== "pending") {
      console.log("[M-Pesa Callback] Duplicate callback detected, skipping");
      return false;
    }
    return true;
  } catch (error) {
    console.error("[M-Pesa Callback] Idempotency check failed:", error);
    return true; // Allow processing if check fails
  }
}
