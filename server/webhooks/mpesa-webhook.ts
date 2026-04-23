import type { Request, Response } from "express";
import { getDb } from "../db";
import { payments, enrollments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { issueCertificateForEnrollmentIfEligible } from "../certificates";
import { runWithRetries } from "../lib/async-retry";
import { logStructured } from "../lib/structured-log";
import { trackPaymentCompletion } from "../services/analytics.service";
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

    // Constant-time compare only when lengths match (timingSafeEqual throws on mismatch — treat as invalid)
    const computedBuf = Buffer.from(computedSignature, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");
    if (computedBuf.length !== receivedBuf.length) {
      console.warn("[M-Pesa] Signature length mismatch");
      return false;
    }
    const isValid = crypto.timingSafeEqual(computedBuf, receivedBuf);

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

function isSignatureRequired(): boolean {
  const raw = process.env.MPESA_REQUIRE_CALLBACK_SIGNATURE?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/**
 * Daraja STK callbacks commonly do not send a signature header.
 * Keep verification available, but don't block callbacks unless explicitly required.
 */
function validateOptionalDarajaSignature(
  req: Request,
  res: Response,
  scope: "webhook" | "query" | "timeout" | "c2b"
): boolean {
  const signature = req.headers["x-daraja-signature"] as string | undefined;
  const required = isSignatureRequired();

  if (!signature) {
    if (required) {
      console.warn(`[M-Pesa] ${scope}: Missing X-Daraja-Signature header (required=true)`);
      res.status(401).json({ error: "Unauthorized: missing signature" });
      return false;
    }
    console.warn(
      `[M-Pesa] ${scope}: Missing X-Daraja-Signature header; continuing because MPESA_REQUIRE_CALLBACK_SIGNATURE is not enabled`
    );
    return true;
  }

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (!verifyMpesaSignature(rawBody, signature)) {
    console.error(`[M-Pesa] ${scope}: Signature verification failed`);
    res.status(401).json({ error: "Unauthorized: invalid signature" });
    return false;
  }

  return true;
}

/**
 * C2B URL Validation Handler
 * Daraja sends this when registering a C2B URL to verify it's working
 * Must respond with specific format for Daraja to accept the URL
 */
export async function handleC2BValidation(req: Request, res: Response) {
  try {
    console.log("[M-Pesa] C2B URL validation request received");
    
    // Daraja expects this specific response format for validation
    return res.status(200).json({
      ResponseCode: "00000000",
      ResponseDesc: "Accept the service request"
    });
  } catch (error) {
    console.error("[M-Pesa] C2B validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * C2B Confirmation Handler
 * Receives payment confirmations from M-Pesa after customer initiates payment via USSD/STK
 * Updates payment records with M-Pesa transaction details
 */
export async function handleC2BConfirmation(req: Request, res: Response) {
  try {
    if (!validateOptionalDarajaSignature(req, res, "c2b")) {
      return;
    }

    const body = req.body;
    console.log("[M-Pesa] C2B confirmation received:", {
      transactionId: body?.TransID,
      phoneNumber: body?.MSISDN,
      amount: body?.TransAmount,
    });

    // Extract C2B payment details
    const {
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      InvoiceNumber,
      OrgAccountBalance,
      ThirdPartyTransID,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = body;

    const db = await getDb();
    if (!db) {
      console.error("[M-Pesa] C2B confirmation: Database unavailable");
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Look up payment by reference (could be enrollmentId or custom reference)
    // BillRefNumber or InvoiceNumber might contain our reference
    const reference = BillRefNumber || InvoiceNumber || "";
    
    console.log(
      `[M-Pesa] C2B confirmation: Looking up payment with reference: ${reference}`
    );

    // For now, log the C2B confirmation
    // In production, you might want to:
    // 1. Match against your payment records using BillRefNumber
    // 2. Update payment status
    // 3. Reconcile amounts
    
    console.log(
      `[M-Pesa] C2B payment confirmed: ${TransAmount} KES from ${MSISDN} (${FirstName} ${LastName}) - Receipt: ${TransID}`
    );

    // Respond with success
    return res.status(200).json({
      ResponseCode: "00000000",
      ResponseDesc: "Accept the service request"
    });
  } catch (error) {
    console.error("[M-Pesa] C2B confirmation error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
    if (!validateOptionalDarajaSignature(req, res, "webhook")) {
      return;
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

    // MPESA-4: Require CheckoutRequestID before touching DB (validates payload; avoids 500 when DB test-mocked)
    const idempotencyKey =
      typeof CheckoutRequestID === "string" ? CheckoutRequestID.trim() : String(CheckoutRequestID ?? "").trim();

    if (!idempotencyKey) {
      console.warn("[M-Pesa] Missing CheckoutRequestID for idempotency check");
      return res.status(400).json({ error: "Missing CheckoutRequestID" });
    }

    logStructured("mpesa_stk_callback", {
      checkoutRequestId: idempotencyKey,
      resultCode: ResultCode,
      resultDesc: typeof ResultDesc === "string" ? ResultDesc.slice(0, 200) : String(ResultDesc ?? ""),
    });

    const db = await getDb();

    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
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

      await trackPaymentCompletion(
        payment.userId,
        payment.amount,
        "mpesa",
        mpesaReceiptNumber || lookupId,
        `mpesa_${lookupId}`,
      );

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
    if (!validateOptionalDarajaSignature(req, res, "query")) {
      return;
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
    if (!validateOptionalDarajaSignature(req, res, "timeout")) {
      return;
    }

    const { Body } = req.body;
    if (!Body) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    // Safaricom sends CheckoutRequestID inside Body.stkCallback, not directly on Body
    const stkCallback = Body.stkCallback;
    const CheckoutRequestID = stkCallback?.CheckoutRequestID ?? Body.CheckoutRequestID;
    const ResultCode = stkCallback?.ResultCode ?? Body.ResultCode;
    const ResultDesc = stkCallback?.ResultDesc ?? Body.ResultDesc ?? "";
    logStructured("mpesa_stk_timeout", {
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: typeof ResultDesc === "string" ? ResultDesc.slice(0, 200) : String(ResultDesc ?? ""),
    });
    console.log(
      `[M-Pesa] User timeout for CheckoutRequestID: ${CheckoutRequestID} (ResultCode: ${ResultCode})`
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
