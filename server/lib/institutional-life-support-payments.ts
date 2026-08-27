import { and, eq } from "drizzle-orm";
import {
  enrollments,
  ilsCredentialRequests,
  institutionalTrainingOrderProviders,
  institutionalTrainingOrders,
  payments,
} from "../../drizzle/schema";
import { PAEDS_RESUS_ILS_BASE_PRICE_KES } from "@shared/institutional-life-support";

export async function applyInstitutionalLifeSupportPaymentCompletion(
  db: any,
  paymentId: number
): Promise<void> {
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  const payment = paymentRows[0];
  if (!payment) return;

  if (payment.institutionalTrainingOrderId) {
    await db
      .update(institutionalTrainingOrders)
      .set({ paymentStatus: "completed", updatedAt: new Date() })
      .where(
        eq(institutionalTrainingOrders.id, payment.institutionalTrainingOrderId)
      );

    const providerRows = await db
      .select({
        enrollmentId: institutionalTrainingOrderProviders.enrollmentId,
      })
      .from(institutionalTrainingOrderProviders)
      .where(
        eq(
          institutionalTrainingOrderProviders.orderId,
          payment.institutionalTrainingOrderId
        )
      );

    for (const provider of providerRows) {
      if (!provider.enrollmentId) continue;
      await db
        .update(enrollments)
        .set({
          paymentStatus: "completed",
          amountPaid: PAEDS_RESUS_ILS_BASE_PRICE_KES * 100,
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, provider.enrollmentId));
    }
  }

  if (payment.ilsCredentialRequestId) {
    await db
      .update(ilsCredentialRequests)
      .set({
        status: "paid_pending_review",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(ilsCredentialRequests.id, payment.ilsCredentialRequestId),
          eq(ilsCredentialRequests.status, "payment_pending")
        )
      );
  }
}
