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

/**
 * Daraja STK Query often returns non-zero before the customer sees the PIN prompt
 * (e.g. 1037, 2031, 500.*). Only persist `failed` when we are confident the attempt
 * ended in a real user-side failure — otherwise leave `pending` for webhook / later poll.
 */
export function shouldMarkPaymentAsFailedFromStkQuery(stk: {
  resultCode: unknown;
  resultDesc?: unknown;
}): boolean {
  const code = String(stk.resultCode ?? "");
  const desc = String(stk.resultDesc ?? "");

  if (code === "0") return false;

  if (code === "QUERY_TRANSPORT_ERROR") return false;

  // In-flight / try again later — never mark failed from reconcile
  if (code === "2031") return false;
  if (code === "1037") return false;
  if (/still processing|pending|being processed|try again|system busy/i.test(desc)) return false;

  // User cancelled (real Daraja) — not a query-layer error (legacy catch used code 1 for those)
  if (code === "1") {
    if (/axios|ECONN|ETIMEDOUT|ENOTFOUND|network|socket|Query failed|fetch|certificate|404|timeout/i.test(desc)) {
      return false;
    }
    return true;
  }

  // 1032 / other codes: rely on callback for terminal failure — avoids false "failed" before PIN prompt
  return false;
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
    if (payment.status === "pending" && shouldMarkPaymentAsFailedFromStkQuery(stk)) {
      await db
        .update(payments)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(payments.id, payment.id));
    }
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

  await trackPaymentCompletion(
    payment.userId,
    payment.amount,
    "mpesa",
    checkoutId,
    `mpesa_${checkoutId}`,
  );

  return { ok: true, checkoutRequestID: checkoutId };
}
