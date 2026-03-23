import type { Request, Response } from "express";
import { getDb } from "../db";
import { payments, enrollments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { issueCertificateForEnrollmentIfEligible } from "../certificates";
import { runWithRetries } from "../lib/async-retry";
import crypto from "crypto";

/**
 * Verify M-Pesa webhook signature using Daraja API's Passkey
 * Daraja signs callbacks with SHA-256 HMAC using the Initiator Password (Passkey)
 */
function verifyMpesaSignature(body: string, signature: string): boolean {
  try {
    // Get the Initiator Password (Passkey) from environment
    const passkey = process.env.MPESA_PASSKEY || "";

    if (!passkey) {
      console.warn(
        "[M-Pesa] MPESA_PASSKEY not set; skipping signature verification (development mode)"
      );
      return true; // Allow if passkey not configured (for development)
    }

    // Compute HMAC-SHA256 of the body using the passkey
    const computedSignature = crypto
      .createHmac("sha256", passkey)
      .update(body)
      .digest("base64");

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );

    if (!isValid) {
      console.warn(
        `[M-Pesa] Signature verification failed. Expected: ${computedSignature}, Got: ${signature}`
      );
    }

    return isValid;
  } catch (error) {
    console.error("[M-Pesa] Signature verification error:", error);
    return false;
  }
}

/**
 * M-Pesa Webhook Handler
 * Receives payment callbacks from M-Pesa and updates payment status
 * Validates webhook signature before processing
 * MPESA-4: Implements idempotency to prevent duplicate webhook processing
 */
export async function handleMpesaWebhook(req: Request, res: Response) {
  try {
    // Extract signature from headers
    const signature = req.headers["x-daraja-signature"] as string | undefined;

    if (!signature) {
      console.warn("[M-Pesa] Missing X-Daraja-Signature header");
      return res.status(401).json({ error: "Unauthorized: missing signature" });
    }

    // Get raw body for signature verification
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // Verify signature
    if (!verifyMpesaSignature(rawBody, signature)) {
      console.error("[M-Pesa] Webhook signature verification failed");
      return res
        .status(401)
        .json({ error: "Unauthorized: invalid signature" });
    }

    const { Body } = req.body;

    if (!Body) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const stkCallback = Body.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({ error: "Missing STK callback" });
    }

    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } =
      stkCallback;
    const db = await getDb();

    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // MPESA-4: Idempotency check - prevent duplicate webhook processing
    // Use CheckoutRequestID as the idempotency key
    const idempotencyKey = CheckoutRequestID || "";
    
    if (!idempotencyKey) {
      console.warn("[M-Pesa] Missing CheckoutRequestID for idempotency check");
      return res.status(400).json({ error: "Missing CheckoutRequestID" });
    }

    // Check if this webhook has already been processed
    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingPayment.length > 0) {
      console.info(`[M-Pesa] Webhook already processed for CheckoutRequestID: ${idempotencyKey}. Skipping duplicate.`);
      return res.status(200).json({ success: true, message: "Webhook already processed" });
    }

    // We store checkoutRequestID in payments.transactionId when initiating STK push; callback sends CheckoutRequestID and (on success) MpesaReceiptNumber in metadata
    const lookupId = idempotencyKey;

    const metadata = CallbackMetadata?.Item || [];
    let phoneNumber = "";
    let amount = 0;
    let mpesaReceiptNumber = "";

    for (const item of metadata) {
      if (item.Name === "PhoneNumber") phoneNumber = item.Value;
      if (item.Name === "Amount") amount = item.Value;
      if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
    }

    // Success: ResultCode 0
    if (ResultCode === 0) {
      // Find payment by CheckoutRequestID (stored in transactionId at initiation)
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, lookupId));

      if (paymentRecords.length === 0) {
        console.warn(`Payment not found for CheckoutRequestID: ${lookupId}`);
        return res.status(200).json({ success: true }); // Still return 200 to acknowledge
      }

      const payment = paymentRecords[0];

      // Idempotent: row-level + MPESA-4 global key (above)
      if (payment.status === "completed" || payment.idempotencyKey === idempotencyKey) {
        console.log(`[M-Pesa] Already completed for checkout ${lookupId}; acknowledging`);
        return res.status(200).json({ success: true, message: "Already processed" });
      }

      if (mpesaReceiptNumber) {
        console.log(`[M-Pesa] Receipt: ${mpesaReceiptNumber} for checkout ${lookupId}`);
      }

      try {
        await runWithRetries(
          async () => {
            await db
              .update(payments)
              .set({
                status: "completed",
                // Keep transactionId = CheckoutRequestID so clients can poll by checkout id; receipt logged above
                idempotencyKey: idempotencyKey,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id));

            if (payment.enrollmentId) {
              const enrollmentRecords = await db
                .select()
                .from(enrollments)
                .where(eq(enrollments.id, payment.enrollmentId));

              if (enrollmentRecords.length > 0) {
                const enrollment = enrollmentRecords[0];
                await db
                  .update(enrollments)
                  .set({
                    paymentStatus: "completed",
                    amountPaid: amount,
                    updatedAt: new Date(),
                  })
                  .where(eq(enrollments.id, enrollment.id));

                const certResult = await issueCertificateForEnrollmentIfEligible(
                  payment.enrollmentId
                );
                if (certResult.issued) {
                  console.log(
                    `Certificate issued for enrollment ${payment.enrollmentId}`
                  );
                } else if (certResult.error) {
                  console.warn(
                    `Certificate not issued for enrollment ${payment.enrollmentId}:`,
                    certResult.error
                  );
                }
              }
            }
          },
          { retries: 3, delayMs: 300, label: "mpesa-webhook-payment-complete" }
        );
      } catch (persistError) {
        console.error(
          "[M-Pesa] Persist failed after retries (returning 500 for Daraja retry):",
          persistError
        );
        return res.status(500).json({
          error: "Transient persistence failure; callback may be retried",
        });
      }

      console.log(
        `[M-Pesa] Payment verified: ${lookupId} -> ${mpesaReceiptNumber} for ${phoneNumber}`
      );
      return res
        .status(200)
        .json({ success: true, message: "Payment verified" });
    } else if (ResultCode === 1) {
      // Failure: ResultCode 1
      console.warn(`Payment failed for CheckoutRequestID: ${lookupId}`);
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, lookupId));

      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        if (payment.status === "failed" || payment.status === "completed") {
          return res.status(200).json({ success: true, message: "Already finalized" });
        }
        await db
          .update(payments)
          .set({
            status: "failed",
            idempotencyKey: idempotencyKey,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }
      return res
        .status(200)
        .json({ success: true, message: "Payment failure recorded" });
    }

    console.log(
      `[M-Pesa] Non-success callback ResultCode=${ResultCode} for ${lookupId}: ${ResultDesc}`
    );
    return res.status(200).json({ success: true, message: "Callback acknowledged" });
  } catch (error) {
    console.error("[M-Pesa] Webhook handler error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * M-Pesa Query Webhook Handler
 * Handles responses from payment status queries
 */
export async function handleMpesaQueryWebhook(
  req: Request,
  res: Response
) {
  try {
    // Verify signature
    const signature = req.headers["x-daraja-signature"] as string | undefined;
    if (!signature) {
      return res.status(401).json({ error: "Unauthorized: missing signature" });
    }

    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!verifyMpesaSignature(rawBody, signature)) {
      return res
        .status(401)
        .json({ error: "Unauthorized: invalid signature" });
    }

    console.log("[M-Pesa] Query webhook received (not yet implemented)");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[M-Pesa] Query webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * M-Pesa Timeout Webhook Handler
 * Handles user timeout (no PIN entry) callbacks
 */
export async function handleMpesaTimeoutWebhook(
  req: Request,
  res: Response
) {
  try {
    // Verify signature
    const signature = req.headers["x-daraja-signature"] as string | undefined;
    if (!signature) {
      return res.status(401).json({ error: "Unauthorized: missing signature" });
    }

    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!verifyMpesaSignature(rawBody, signature)) {
      return res
        .status(401)
        .json({ error: "Unauthorized: invalid signature" });
    }

    const { Body } = req.body;
    if (!Body) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const { CheckoutRequestID } = Body;
    console.log(
      `[M-Pesa] User timeout for CheckoutRequestID: ${CheckoutRequestID}`
    );

    // Update payment status to timeout
    const db = await getDb();
    if (db) {
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, CheckoutRequestID));

      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        if (payment.status === "completed" || payment.status === "failed") {
          return res.status(200).json({ success: true });
        }
        await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[M-Pesa] Timeout webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
