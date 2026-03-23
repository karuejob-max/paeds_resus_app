/**
 * MPESA-8: Align DB with Daraja STK Query when webhooks were missed (admin-triggered).
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { payments, enrollments } from "../drizzle/schema";
import { queryStk } from "./mpesa";
import { issueCertificateForEnrollmentIfEligible } from "./certificates";

function stkResultIsSuccess(resultCode: unknown): boolean {
  const c = String(resultCode ?? "");
  return c === "0";
}

export async function reconcilePaymentRowByStkQuery(paymentId: number): Promise<{
  ok: boolean;
  skipped?: string;
  error?: string;
  checkoutRequestID?: string;
}> {
  const db = await getDb();
  if (!db) return { ok: false, error: "Database unavailable" };

  const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!rows.length) return { ok: false, error: "Payment not found" };
  const payment = rows[0];

  if (payment.paymentMethod !== "mpesa") {
    return { ok: false, skipped: "not_mpesa" };
  }
  if (payment.status === "completed") {
    return { ok: true, skipped: "already_completed" };
  }

  const checkoutId = payment.transactionId?.trim();
  if (!checkoutId) {
    return { ok: false, error: "Missing transactionId (CheckoutRequestID)" };
  }

  const stk = await queryStk(checkoutId);
  if (!stkResultIsSuccess(stk.resultCode)) {
    return {
      ok: false,
      error: stk.resultDesc || `STK query not successful (code ${stk.resultCode})`,
      checkoutRequestID: checkoutId,
    };
  }

  await db
    .update(payments)
    .set({
      status: "completed",
      idempotencyKey: checkoutId,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  if (payment.enrollmentId) {
    const enrRows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, payment.enrollmentId))
      .limit(1);
    if (enrRows.length) {
      await db
        .update(enrollments)
        .set({
          paymentStatus: "completed",
          amountPaid: payment.amount,
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, payment.enrollmentId));

      const certResult = await issueCertificateForEnrollmentIfEligible(payment.enrollmentId);
      if (certResult.issued) {
        console.log(`[M-Pesa reconcile] Certificate issued for enrollment ${payment.enrollmentId}`);
      } else if (certResult.error) {
        console.warn(`[M-Pesa reconcile] Certificate not issued:`, certResult.error);
      }
    }
  }

  return { ok: true, checkoutRequestID: checkoutId };
}
