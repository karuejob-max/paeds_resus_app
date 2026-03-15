import { Request, Response } from "express";
import { getDb } from "../db";
import { payments, enrollments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { issueCertificateForEnrollmentIfEligible } from "../certificates";

/**
 * M-Pesa Webhook Handler
 * Receives payment callbacks from M-Pesa and updates payment status
 */
export async function handleMpesaWebhook(req: Request, res: Response) {
  try {
    const { Body } = req.body;
    
    if (!Body) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const stkCallback = Body.stkCallback;
    
    if (!stkCallback) {
      return res.status(400).json({ error: "Missing STK callback" });
    }

    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = stkCallback;
    const db = await getDb();

    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // We store checkoutRequestID in payments.transactionId when initiating STK push; callback sends CheckoutRequestID and (on success) MpesaReceiptNumber in metadata
    const lookupId = CheckoutRequestID || "";

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

      // Update payment status and store M-Pesa receipt number for records
      await db
        .update(payments)
        .set({
          status: "completed",
          transactionId: mpesaReceiptNumber || payment.transactionId,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Update enrollment payment status
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

          // Create certificate when payment completes
          const certResult = await issueCertificateForEnrollmentIfEligible(payment.enrollmentId);
          if (certResult.issued) {
            console.log(`Certificate issued for enrollment ${payment.enrollmentId}`);
          } else if (certResult.error) {
            console.warn(`Certificate not issued for enrollment ${payment.enrollmentId}:`, certResult.error);
          }
        }
      }

      console.log(`Payment verified: ${lookupId} -> ${mpesaReceiptNumber} for ${phoneNumber}`);
      return res.status(200).json({ success: true, message: "Payment verified" });
    }

    // Failure: ResultCode != 0
    if (ResultCode !== 0) {
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, lookupId));

      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }

      console.log(`Payment failed: ${lookupId} - ${ResultDesc}`);
      return res.status(200).json({ success: true, message: "Payment failure recorded" });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("M-Pesa webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * M-Pesa Query Webhook Handler
 * Receives query responses for payment status checks
 */
export async function handleMpesaQueryWebhook(req: Request, res: Response) {
  try {
    const { Body } = req.body;
    
    if (!Body) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const queryResponse = Body.checkoutQueryResponse;
    
    if (!queryResponse) {
      return res.status(400).json({ error: "Missing query response" });
    }

    const { ResultCode, CheckoutRequestID, MpesaReceiptNumber } = queryResponse;
    const db = await getDb();

    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Success: ResultCode 0
    if (ResultCode === 0 && MpesaReceiptNumber) {
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, CheckoutRequestID));

      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        await db
          .update(payments)
          .set({
            status: "completed",
            transactionId: MpesaReceiptNumber,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        // Update enrollment and issue certificate
        if (payment.enrollmentId) {
          await db
            .update(enrollments)
            .set({
              paymentStatus: "completed",
              updatedAt: new Date(),
            })
            .where(eq(enrollments.id, payment.enrollmentId));
          const certResult = await issueCertificateForEnrollmentIfEligible(payment.enrollmentId);
          if (certResult.issued) {
            console.log(`Certificate issued for enrollment ${payment.enrollmentId} (query webhook)`);
          } else if (certResult.error) {
            console.warn(`Certificate not issued for enrollment ${payment.enrollmentId}:`, certResult.error);
          }
        }

        console.log(`Query verified: ${CheckoutRequestID} -> ${MpesaReceiptNumber}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("M-Pesa query webhook error:", error);
    return res.status(500).json({ error: "Query webhook processing failed" });
  }
}

/**
 * M-Pesa Timeout Webhook Handler
 * Receives timeout notifications when user doesn't enter PIN
 */
export async function handleMpesaTimeoutWebhook(req: Request, res: Response) {
  try {
    const { Body } = req.body;
    
    if (!Body) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const timeoutResponse = Body.stkCallback;
    
    if (!timeoutResponse) {
      return res.status(400).json({ error: "Missing timeout response" });
    }

    const { CheckoutRequestID, ResultCode } = timeoutResponse;
    const db = await getDb();

    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Mark as failed/expired
    if (ResultCode !== 0) {
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, CheckoutRequestID));

      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        console.log(`Payment timeout: ${CheckoutRequestID}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("M-Pesa timeout webhook error:", error);
    return res.status(500).json({ error: "Timeout webhook processing failed" });
  }
}
