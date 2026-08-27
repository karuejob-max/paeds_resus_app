import { and, eq, sum } from "drizzle-orm";
import { ierpPayments, ierpProgramEnrollments } from "../../drizzle/schema";
import { IERP_TOTAL_FEE_KES, type IerpDb } from "./ierp-program-state";

export type IerpMpesaCallback = {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount: number | null;
  phoneNumber: string | null;
  mpesaReceiptNumber: string | null;
};

/**
 * Reconcile only a previously-created IERP intent. Returning null means the
 * callback belongs to another payment surface and must continue through the
 * existing generic/institutional handlers.
 */
export async function reconcileIerpMpesaPayment(db: IerpDb, input: IerpMpesaCallback) {
  const [payment] = await db
    .select()
    .from(ierpPayments)
    .where(eq(ierpPayments.checkoutRequestId, input.checkoutRequestId))
    .limit(1);
  if (!payment) return null;

  if (payment.status === "completed" || payment.status === "failed") {
    return { status: payment.status, duplicate: true as const, paymentId: payment.id };
  }

  if (input.resultCode !== 0) {
    await db
      .update(ierpPayments)
      .set({
        status: "failed",
        failureReason: input.resultDesc.slice(0, 1000),
        phoneNumber: input.phoneNumber,
        idempotencyKey: input.checkoutRequestId,
        reconciledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(ierpPayments.id, payment.id), eq(ierpPayments.status, "pending")));
    return { status: "failed" as const, duplicate: false as const, paymentId: payment.id };
  }

  if (input.amount !== null && Math.round(input.amount) !== payment.amountKsh) {
    // Do not credit a mismatched callback. Leave the intent pending so an
    // operator can reconcile it instead of silently changing programme state.
    return { status: "amount_mismatch" as const, duplicate: false as const, paymentId: payment.id };
  }

  const completedAt = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(ierpPayments)
      .set({
        status: "completed",
        providerReference: input.mpesaReceiptNumber ?? input.checkoutRequestId,
        mpesaReceiptNumber: input.mpesaReceiptNumber,
        phoneNumber: input.phoneNumber,
        idempotencyKey: input.checkoutRequestId,
        reconciledAt: completedAt,
        updatedAt: completedAt,
      })
      .where(and(eq(ierpPayments.id, payment.id), eq(ierpPayments.status, "pending")));

    const paidRows = await tx
      .select({ total: sum(ierpPayments.amountKsh) })
      .from(ierpPayments)
      .where(and(eq(ierpPayments.programEnrollmentId, payment.programEnrollmentId), eq(ierpPayments.status, "completed")));
    const totalPaid = Number(paidRows[0]?.total ?? 0);
    const paymentStatus = totalPaid >= IERP_TOTAL_FEE_KES ? "paid_in_full" : totalPaid > 0 ? "partial" : "pending";
    await tx
      .update(ierpProgramEnrollments)
      .set({
        totalPaidAmount: String(totalPaid),
        paymentStatus,
        paymentLockoutAt: null,
        updatedAt: completedAt,
      })
      .where(eq(ierpProgramEnrollments.id, payment.programEnrollmentId));
  });

  return { status: "completed" as const, duplicate: false as const, paymentId: payment.id };
}
