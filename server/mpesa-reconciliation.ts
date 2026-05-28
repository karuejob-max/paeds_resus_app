/**
 * MPESA-8: Align DB with Daraja STK Query when webhooks were missed (admin-triggered).
 */
import { and, eq, lt } from "drizzle-orm";
import { getDb } from "./db";
import { payments, enrollments } from "../drizzle/schema";
import { queryStk } from "./mpesa";
import { issueCertificateForEnrollmentIfEligible } from "./certificates";
import { trackPaymentCompletion } from "./services/analytics.service";

export const STALE_PAYMENT_MS = 24 * 60 * 60 * 1000;

export type ReconcilePaymentAction = "completed" | "failed" | "unchanged" | "skipped";

export type ReconcilePaymentResult = {
  ok: boolean;
  action: ReconcilePaymentAction;
  previousStatus: string;
  currentStatus: string;
  checkoutRequestID?: string;
  stkResultCode?: string;
  stkResultDesc?: string;
  error?: string;
  skipped?: string;
};

function stkResultIsSuccess(resultCode: unknown): boolean {
  const c = String(resultCode ?? "");
  return c === "0";
}

/**
 * Daraja STK Query often returns non-zero before the customer sees the PIN prompt
 * (e.g. 1037, 2031, 500.*). Only persist `failed` when we are confident the attempt
 * ended in a real user-side failure — otherwise leave `pending` for webhook / later poll.
 *
 * Payments older than 24h: any non-success STK response is treated as terminal (abandoned
 * or unqueryable checkout) so admin reconcile and cron can clear ops backlog.
 */
export function shouldMarkPaymentAsFailedFromStkQuery(
  stk: {
    resultCode: unknown;
    resultDesc?: unknown;
  },
  opts?: { paymentAgeMs?: number }
): boolean {
  const code = String(stk.resultCode ?? "");
  const desc = String(stk.resultDesc ?? "");
  const paymentAgeMs = opts?.paymentAgeMs ?? 0;
  const isStale = paymentAgeMs >= STALE_PAYMENT_MS;

  if (code === "0") return false;

  if (isStale) return true;

  if (code === "QUERY_TRANSPORT_ERROR") return false;

  if (code === "2031") return false;
  if (code === "1037") return false;
  if (code === "1032") return false;
  if (/still processing|pending|being processed|try again|system busy/i.test(desc)) return false;

  if (code === "1") {
    if (/axios|ECONN|ETIMEDOUT|ENOTFOUND|network|socket|Query failed|fetch|certificate|404|timeout/i.test(desc)) {
      return false;
    }
    return true;
  }

  return false;
}

async function markPaymentFailed(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  paymentId: number,
  idempotencyKey?: string
): Promise<void> {
  await db
    .update(payments)
    .set({
      status: "failed",
      ...(idempotencyKey ? { idempotencyKey } : {}),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
}

export async function reconcilePaymentRowByStkQuery(
  paymentId: number
): Promise<ReconcilePaymentResult> {
  const db = await getDb();
  if (!db) {
    return {
      ok: false,
      action: "unchanged",
      previousStatus: "unknown",
      currentStatus: "unknown",
      error: "Database unavailable",
    };
  }

  const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!rows.length) {
    return {
      ok: false,
      action: "unchanged",
      previousStatus: "unknown",
      currentStatus: "unknown",
      error: "Payment not found",
    };
  }
  const payment = rows[0];
  const previousStatus = payment.status ?? "pending";

  if (payment.paymentMethod !== "mpesa") {
    return {
      ok: false,
      action: "skipped",
      previousStatus,
      currentStatus: previousStatus,
      skipped: "not_mpesa",
    };
  }
  if (payment.status === "completed") {
    return {
      ok: true,
      action: "skipped",
      previousStatus,
      currentStatus: "completed",
      skipped: "already_completed",
    };
  }
  if (payment.status === "failed") {
    return {
      ok: true,
      action: "skipped",
      previousStatus,
      currentStatus: "failed",
      skipped: "already_failed",
    };
  }

  const checkoutId = payment.transactionId?.trim();
  const paymentAgeMs = Date.now() - new Date(payment.createdAt).getTime();

  if (!checkoutId) {
    if (payment.status === "pending" && paymentAgeMs >= STALE_PAYMENT_MS) {
      await markPaymentFailed(db, payment.id);
      return {
        ok: false,
        action: "failed",
        previousStatus,
        currentStatus: "failed",
        error: "Missing CheckoutRequestID; marked failed as stale",
      };
    }
    return {
      ok: false,
      action: "unchanged",
      previousStatus,
      currentStatus: previousStatus,
      error: "Missing transactionId (CheckoutRequestID)",
    };
  }

  const stk = await queryStk(checkoutId);
  const stkCode = String(stk.resultCode ?? "");
  const stkDesc = stk.resultDesc || undefined;

  if (!stkResultIsSuccess(stk.resultCode)) {
    const shouldFail =
      payment.status === "pending" &&
      shouldMarkPaymentAsFailedFromStkQuery(stk, { paymentAgeMs });

    if (shouldFail) {
      await markPaymentFailed(db, payment.id, checkoutId);
      return {
        ok: false,
        action: "failed",
        previousStatus,
        currentStatus: "failed",
        checkoutRequestID: checkoutId,
        stkResultCode: stkCode,
        stkResultDesc: stkDesc,
        error: stkDesc || `STK query not successful (code ${stkCode})`,
      };
    }

    return {
      ok: false,
      action: "unchanged",
      previousStatus,
      currentStatus: previousStatus,
      checkoutRequestID: checkoutId,
      stkResultCode: stkCode,
      stkResultDesc: stkDesc,
      error: stkDesc || `STK query not successful (code ${stkCode}); still pending`,
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
    `mpesa_${checkoutId}`
  );

  return {
    ok: true,
    action: "completed",
    previousStatus,
    currentStatus: "completed",
    checkoutRequestID: checkoutId,
    stkResultCode: stkCode,
    stkResultDesc: stkDesc,
  };
}

/** Hourly cron: STK-query stale pending rows so ops alerts do not repeat for abandoned attempts. */
export async function reconcileStaleMpesaPendingBatch(opts?: {
  olderThanHours?: number;
  limit?: number;
}): Promise<{ processed: number; completed: number; failed: number; unchanged: number }> {
  const db = await getDb();
  if (!db) return { processed: 0, completed: 0, failed: 0, unchanged: 0 };

  const olderThanHours = opts?.olderThanHours ?? 24;
  const limit = opts?.limit ?? 30;
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  const rows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.status, "pending"),
        eq(payments.paymentMethod, "mpesa"),
        lt(payments.createdAt, cutoff)
      )
    )
    .limit(limit);

  let completed = 0;
  let failed = 0;
  let unchanged = 0;

  for (const row of rows) {
    const result = await reconcilePaymentRowByStkQuery(row.id);
    if (result.action === "completed") completed++;
    else if (result.action === "failed") failed++;
    else unchanged++;
  }

  return { processed: rows.length, completed, failed, unchanged };
}
