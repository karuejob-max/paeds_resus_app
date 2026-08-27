import { and, eq, gte, inArray, sql } from "drizzle-orm";
import {
  enrollments,
  ilsCredentialRequests,
  institutionalTrainingOrderProviders,
  institutionalTrainingOrders,
  ilsDeliverySessions,
  ilsReminderEvents,
  ilsOperationalCases,
  payments,
} from "../../drizzle/schema";
import { PAEDS_RESUS_ILS_BASE_PRICE_KES } from "@shared/institutional-life-support";
import {
  getIlsSupportSlaHours,
  shouldReleaseIlsCapacityOnPaymentFailure,
} from "@shared/ils-operations";

export function validateIlsInstitutionalPaymentAmount(input: {
  orderTotalAmountKes: number;
  ledgerAmountCents: number;
  receivedAmountKes: number | null;
}):
  | { valid: true; expectedCents: number; receivedCents: number }
  | { valid: false; reason: string } {
  const expectedCents = input.orderTotalAmountKes * 100;
  const receivedCents =
    input.receivedAmountKes != null && Number.isFinite(input.receivedAmountKes)
      ? Math.round(input.receivedAmountKes * 100)
      : null;
  if (input.ledgerAmountCents !== expectedCents) {
    return {
      valid: false,
      reason: `ILS payment ledger mismatch: expected ${expectedCents} cents, ledger ${input.ledgerAmountCents} cents.`,
    };
  }
  if (receivedCents !== expectedCents) {
    return {
      valid: false,
      reason: `ILS payment amount mismatch: expected ${expectedCents} cents, received ${receivedCents ?? "missing"} cents.`,
    };
  }
  return { valid: true, expectedCents, receivedCents };
}

export async function applyInstitutionalLifeSupportPaymentFailure(
  db: any,
  paymentId: number,
  reason: string
): Promise<void> {
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  const payment = paymentRows[0];
  if (
    !payment ||
    payment.status !== "failed" ||
    !payment.institutionalTrainingOrderId
  )
    return;

  const now = new Date();
  await db.transaction(async (tx: any) => {
    const orderRows = await tx
      .select()
      .from(institutionalTrainingOrders)
      .where(
        eq(institutionalTrainingOrders.id, payment.institutionalTrainingOrderId)
      )
      .limit(1);
    const order = orderRows[0];
    if (
      !order ||
      !shouldReleaseIlsCapacityOnPaymentFailure({
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      })
    )
      return;

    const updated = await tx
      .update(institutionalTrainingOrders)
      .set({
        paymentStatus: "failed",
        orderStatus: "blocked",
        blockedReason: reason || "M-Pesa payment failed.",
        updatedAt: now,
      })
      .where(
        and(
          eq(institutionalTrainingOrders.id, order.id),
          inArray(institutionalTrainingOrders.orderStatus, [
            "draft",
            "ready_for_payment",
            "payment_pending",
          ]),
          eq(institutionalTrainingOrders.paymentStatus, "pending")
        )
      );
    const affected = Number(
      (updated as any)?.[0]?.affectedRows ?? (updated as any)?.affectedRows ?? 0
    );
    if (!affected) return;

    await tx
      .update(ilsReminderEvents)
      .set({ status: "cancelled", updatedAt: now })
      .where(
        and(
          eq(ilsReminderEvents.orderId, order.id),
          eq(ilsReminderEvents.reminderType, "payment"),
          eq(ilsReminderEvents.status, "queued")
        )
      );

    const assignmentRows = await tx
      .select({
        enrollmentId: institutionalTrainingOrderProviders.enrollmentId,
      })
      .from(institutionalTrainingOrderProviders)
      .where(eq(institutionalTrainingOrderProviders.orderId, order.id));
    const enrollmentIds = assignmentRows
      .map((row: { enrollmentId: number | null }) => row.enrollmentId)
      .filter((id: number | null): id is number => id != null);
    if (enrollmentIds.length) {
      await tx
        .update(enrollments)
        .set({
          enrollmentStatus: "cancelled",
          cancelledAt: now,
          cancelledByUserId: payment.userId,
          cancellationReason: `ILS payment failed: ${reason || "M-Pesa payment failed."}`,
          updatedAt: now,
        })
        .where(
          and(
            inArray(enrollments.id, enrollmentIds),
            eq(enrollments.enrollmentStatus, "active")
          )
        );
    }
    await tx
      .update(institutionalTrainingOrderProviders)
      .set({
        assignmentStatus: "removed",
        replacedAt: now,
        replacedByUserId: payment.userId,
        replacementReason: `Payment failed: ${reason || "M-Pesa payment failed."}`,
      })
      .where(
        and(
          eq(institutionalTrainingOrderProviders.orderId, order.id),
          eq(institutionalTrainingOrderProviders.assignmentStatus, "active")
        )
      );
    if (order.deliverySessionId) {
      await tx
        .update(ilsDeliverySessions)
        .set({
          reservedCount: sql`${ilsDeliverySessions.reservedCount} - ${order.providerCount}`,
          updatedAt: now,
        })
        .where(
          and(
            eq(ilsDeliverySessions.id, order.deliverySessionId),
            gte(ilsDeliverySessions.reservedCount, order.providerCount)
          )
        );
    }

    const existingCase = await tx
      .select({ id: ilsOperationalCases.id })
      .from(ilsOperationalCases)
      .where(
        and(
          eq(ilsOperationalCases.orderId, order.id),
          eq(ilsOperationalCases.category, "payment"),
          inArray(ilsOperationalCases.status, ["open", "in_progress"])
        )
      )
      .limit(1);
    if (!existingCase[0]) {
      await tx.insert(ilsOperationalCases).values({
        institutionalAccountId: order.institutionalAccountId,
        orderId: order.id,
        category: "payment",
        priority: "high",
        summary: "ILS cohort payment failed",
        details:
          reason ||
          "M-Pesa payment failed; capacity was released and the order was blocked.",
        slaDueAt: new Date(
          now.getTime() + getIlsSupportSlaHours("high") * 60 * 60 * 1000
        ),
        createdByUserId: payment.userId,
      });
    }
  });
}

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
  if (!payment || payment.status === "cancelled") return;

  const now = new Date();
  if (payment.institutionalTrainingOrderId) {
    const orderRows = await db
      .select()
      .from(institutionalTrainingOrders)
      .where(
        eq(institutionalTrainingOrders.id, payment.institutionalTrainingOrderId)
      )
      .limit(1);
    const order = orderRows[0];
    if (!order) return;
    const receiptReference = payment.transactionId || `PAYMENT-${payment.id}`;
    await db
      .update(institutionalTrainingOrders)
      .set({
        paymentStatus: "completed",
        orderStatus: "paid",
        paymentConfirmedAt: order.paymentConfirmedAt ?? now,
        paymentReceiptReference:
          order.paymentReceiptReference ?? receiptReference,
        updatedAt: now,
      })
      .where(
        eq(institutionalTrainingOrders.id, payment.institutionalTrainingOrderId)
      );
    if (order.deliverySessionId) {
      await db
        .update(ilsDeliverySessions)
        .set({ sessionStatus: "confirmed", updatedAt: now })
        .where(
          and(
            eq(ilsDeliverySessions.id, order.deliverySessionId),
            eq(ilsDeliverySessions.sessionStatus, "proposed")
          )
        );
    }

    const providerRows = await db
      .select({
        enrollmentId: institutionalTrainingOrderProviders.enrollmentId,
      })
      .from(institutionalTrainingOrderProviders)
      .where(
        and(
          eq(
            institutionalTrainingOrderProviders.orderId,
            payment.institutionalTrainingOrderId
          ),
          eq(institutionalTrainingOrderProviders.assignmentStatus, "active")
        )
      );

    for (const provider of providerRows) {
      if (!provider.enrollmentId) continue;
      const enrollmentRows = await db
        .select({
          userId: enrollments.userId,
          activatedAt: enrollments.activatedAt,
        })
        .from(enrollments)
        .where(eq(enrollments.id, provider.enrollmentId))
        .limit(1);
      const enrollment = enrollmentRows[0];
      if (!enrollment) continue;
      await db
        .update(enrollments)
        .set({
          paymentStatus: "completed",
          amountPaid: PAEDS_RESUS_ILS_BASE_PRICE_KES * 100,
          activatedAt: enrollment.activatedAt ?? now,
          lastActivityAt: now,
          updatedAt: now,
        })
        .where(eq(enrollments.id, provider.enrollmentId));
      const reminderRows = await db
        .select({ id: ilsReminderEvents.id })
        .from(ilsReminderEvents)
        .where(
          and(
            eq(ilsReminderEvents.orderId, payment.institutionalTrainingOrderId),
            eq(ilsReminderEvents.enrollmentId, provider.enrollmentId),
            eq(ilsReminderEvents.userId, enrollment.userId),
            eq(ilsReminderEvents.reminderType, "activation"),
            eq(ilsReminderEvents.channel, "email")
          )
        )
        .limit(1);
      if (!reminderRows[0]) {
        await db.insert(ilsReminderEvents).values({
          enrollmentId: provider.enrollmentId,
          orderId: payment.institutionalTrainingOrderId,
          userId: enrollment.userId,
          reminderType: "activation",
          channel: "email",
          dueAt: now,
          status: "queued",
        });
      }
      const practicalReminderRows = await db
        .select({ id: ilsReminderEvents.id })
        .from(ilsReminderEvents)
        .where(
          and(
            eq(ilsReminderEvents.orderId, payment.institutionalTrainingOrderId),
            eq(ilsReminderEvents.enrollmentId, provider.enrollmentId),
            eq(ilsReminderEvents.userId, enrollment.userId),
            eq(ilsReminderEvents.reminderType, "practical"),
            eq(ilsReminderEvents.channel, "email")
          )
        )
        .limit(1);
      if (!practicalReminderRows[0] && order.trainingDate) {
        const practicalDueAt = new Date(
          order.trainingDate.getTime() - 3 * 24 * 60 * 60 * 1000
        );
        await db.insert(ilsReminderEvents).values({
          enrollmentId: provider.enrollmentId,
          orderId: payment.institutionalTrainingOrderId,
          userId: enrollment.userId,
          reminderType: "practical",
          channel: "email",
          dueAt: practicalDueAt > now ? practicalDueAt : now,
          status: "queued",
        });
      }
    }
  }

  if (payment.ilsCredentialRequestId) {
    const credentialRequestRows = await db
      .select()
      .from(ilsCredentialRequests)
      .where(eq(ilsCredentialRequests.id, payment.ilsCredentialRequestId))
      .limit(1);
    const credentialRequest = credentialRequestRows[0];
    if (credentialRequest) {
      const windowClosed =
        credentialRequest.credentialingDeadline.getTime() <= now.getTime();
      const requiresManualReconciliation =
        windowClosed || credentialRequest.status === "expired";
      if (requiresManualReconciliation) {
        await db
          .update(ilsCredentialRequests)
          .set({
            status: "expired",
            paidAt: credentialRequest.paidAt ?? now,
            updatedAt: now,
          })
          .where(
            and(
              eq(ilsCredentialRequests.id, credentialRequest.id),
              inArray(ilsCredentialRequests.status, [
                "payment_pending",
                "paid_pending_review",
                "expired",
              ])
            )
          );
        await db
          .update(ilsReminderEvents)
          .set({ status: "cancelled", updatedAt: now })
          .where(
            and(
              eq(
                ilsReminderEvents.enrollmentId,
                credentialRequest.enrollmentId
              ),
              eq(ilsReminderEvents.reminderType, "credentialing"),
              eq(ilsReminderEvents.status, "queued")
            )
          );
        const existingCase = await db
          .select({ id: ilsOperationalCases.id })
          .from(ilsOperationalCases)
          .where(
            and(
              eq(
                ilsOperationalCases.enrollmentId,
                credentialRequest.enrollmentId
              ),
              eq(ilsOperationalCases.category, "aha_credentialing"),
              inArray(ilsOperationalCases.status, ["open", "in_progress"])
            )
          )
          .limit(1);
        if (!existingCase[0]) {
          await db
            .insert(ilsOperationalCases)
            .values({
              enrollmentId: credentialRequest.enrollmentId,
              category: "aha_credentialing",
              priority: "high",
              summary: "Payment received for expired AHA credentialing window",
              details: `Credentialing request #${credentialRequest.id} reached the 90-day boundary before payment settlement. Do not issue an AHA credential; complete the documented manual reconciliation or refund process.`,
              slaDueAt: new Date(
                now.getTime() + getIlsSupportSlaHours("high") * 60 * 60 * 1000
              ),
              createdByUserId: credentialRequest.userId,
            });
        }
      } else {
        await db
          .update(ilsCredentialRequests)
          .set({
            status: "paid_pending_review",
            paidAt: credentialRequest.paidAt ?? now,
            updatedAt: now,
          })
          .where(
            and(
              eq(ilsCredentialRequests.id, credentialRequest.id),
              eq(ilsCredentialRequests.status, "payment_pending")
            )
          );
        await db
          .update(ilsReminderEvents)
          .set({ status: "cancelled", updatedAt: now })
          .where(
            and(
              eq(
                ilsReminderEvents.enrollmentId,
                credentialRequest.enrollmentId
              ),
              eq(ilsReminderEvents.reminderType, "credentialing"),
              eq(ilsReminderEvents.status, "queued")
            )
          );
        const existingCase = await db
          .select({ id: ilsOperationalCases.id })
          .from(ilsOperationalCases)
          .where(
            and(
              eq(
                ilsOperationalCases.enrollmentId,
                credentialRequest.enrollmentId
              ),
              eq(ilsOperationalCases.category, "aha_credentialing"),
              inArray(ilsOperationalCases.status, ["open", "in_progress"])
            )
          )
          .limit(1);
        if (!existingCase[0]) {
          await db
            .insert(ilsOperationalCases)
            .values({
              enrollmentId: credentialRequest.enrollmentId,
              category: "aha_credentialing",
              priority: "normal",
              summary: "Paid AHA credentialing request awaiting review",
              details: `Credentialing request #${credentialRequest.id} is payment-confirmed and requires authorized review.`,
              slaDueAt: new Date(
                now.getTime() + getIlsSupportSlaHours("normal") * 60 * 60 * 1000
              ),
              createdByUserId: credentialRequest.userId,
            });
        }
      }
    }
  }
}
