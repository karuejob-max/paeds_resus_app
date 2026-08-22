import { and, eq, or } from "drizzle-orm";
import {
  institutionProductEntitlements,
  institutionProductSubscriptions,
  institutionSubscriptionEvents,
  institutionSubscriptionPaymentIntents,
  institutionSubscriptionPayments,
  institutionalProductCapabilities,
  institutionalProducts,
} from "../../drizzle/schema";
import type { AppDb } from "./institution-access";

export type InstitutionMpesaCallbackInput = {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount: number | null;
  phoneNumber: string | null;
  mpesaReceiptNumber: string | null;
};

export function validateInstitutionMpesaAmount(expectedCents: number, receivedAmount: number | null): { valid: true; receivedCents: number | null } | { valid: false; reason: string } {
  if (receivedAmount === null || !Number.isFinite(receivedAmount)) return { valid: true, receivedCents: null };
  const receivedCents = Math.round(receivedAmount * 100);
  if (receivedCents !== expectedCents) {
    return { valid: false, reason: `M-Pesa amount mismatch: expected ${expectedCents} cents, received ${receivedCents} cents.` };
  }
  return { valid: true, receivedCents };
}

export type InstitutionMpesaReconciliationResult = {
  handled: true;
  duplicate: boolean;
  intentId: number;
  status: "pending" | "completed" | "failed";
  subscriptionId?: number | null;
  paymentId?: number | null;
  reason?: string;
};

/**
 * Reconcile one Daraja callback against an institutional checkout intent.
 * The course-enrollment payment ledger is deliberately not touched here.
 */
export async function reconcileInstitutionMpesaIntent(
  db: AppDb,
  input: InstitutionMpesaCallbackInput,
): Promise<InstitutionMpesaReconciliationResult | null> {
  const [intent] = await db
    .select()
    .from(institutionSubscriptionPaymentIntents)
    .where(eq(institutionSubscriptionPaymentIntents.checkoutRequestId, input.checkoutRequestId))
    .limit(1);
  if (!intent) return null;

  if (intent.status === "completed") {
    return { handled: true, duplicate: true, intentId: intent.id, status: "completed" };
  }

  const amountCheck = validateInstitutionMpesaAmount(intent.amountCents, input.amount);
  if (input.resultCode === 0 && !amountCheck.valid) {
    const reason = amountCheck.reason;
    await db
      .update(institutionSubscriptionPaymentIntents)
      .set({ status: "failed", resultCode: input.resultCode, failureReason: reason, updatedAt: new Date() })
      .where(eq(institutionSubscriptionPaymentIntents.id, intent.id));
    return { handled: true, duplicate: false, intentId: intent.id, status: "failed", reason };
  }

  if (input.resultCode !== 0) {
    const failed = input.resultCode === 1;
    await db
      .update(institutionSubscriptionPaymentIntents)
      .set({
        status: failed ? "failed" : "pending",
        resultCode: input.resultCode,
        failureReason: failed ? input.resultDesc || "M-Pesa payment failed." : null,
        updatedAt: new Date(),
      })
      .where(eq(institutionSubscriptionPaymentIntents.id, intent.id));
    return { handled: true, duplicate: false, intentId: intent.id, status: failed ? "failed" : "pending", reason: input.resultDesc };
  }

  const [product] = await db
    .select({ id: institutionalProducts.id, productKey: institutionalProducts.productKey })
    .from(institutionalProducts)
    .where(eq(institutionalProducts.id, intent.productId))
    .limit(1);
  if (!product) throw new Error(`Institutional product ${intent.productId} is missing for payment intent ${intent.id}.`);

  const now = new Date();
  const receipt = input.mpesaReceiptNumber?.trim() || null;
  const paymentReference = receipt || intent.checkoutRequestId;

  return db.transaction(async (tx) => {
    const [currentIntent] = await tx
      .select({ status: institutionSubscriptionPaymentIntents.status })
      .from(institutionSubscriptionPaymentIntents)
      .where(eq(institutionSubscriptionPaymentIntents.id, intent.id))
      .limit(1);
    if (currentIntent?.status === "completed") {
      return { handled: true, duplicate: true, intentId: intent.id, status: "completed" as const };
    }

    const [previous] = await tx
      .select({ id: institutionProductSubscriptions.id, subscriptionStatus: institutionProductSubscriptions.subscriptionStatus, startsAt: institutionProductSubscriptions.startsAt })
      .from(institutionProductSubscriptions)
      .where(and(
        eq(institutionProductSubscriptions.institutionalAccountId, intent.institutionalAccountId),
        eq(institutionProductSubscriptions.productId, intent.productId),
      ))
      .limit(1);

    await tx
      .insert(institutionProductSubscriptions)
      .values({
        institutionalAccountId: intent.institutionalAccountId,
        productId: intent.productId,
        planId: intent.planId,
        subscriptionStatus: "active",
        startsAt: previous?.startsAt ?? now,
        renewsAt: intent.renewsAt,
        expiresAt: intent.expiresAt ?? intent.renewsAt,
        graceEndsAt: null,
        cancelledAt: null,
        source: "payment",
        externalReference: paymentReference,
        notes: "Activated by verified M-Pesa callback.",
      })
      .onDuplicateKeyUpdate({
        set: {
          planId: intent.planId,
          subscriptionStatus: "active",
          renewsAt: intent.renewsAt,
          expiresAt: intent.expiresAt ?? intent.renewsAt,
          graceEndsAt: null,
          cancelledAt: null,
          source: "payment",
          externalReference: paymentReference,
          notes: "Renewed by verified M-Pesa callback.",
          updatedAt: now,
        },
      });

    const [subscription] = await tx
      .select({ id: institutionProductSubscriptions.id })
      .from(institutionProductSubscriptions)
      .where(and(
        eq(institutionProductSubscriptions.institutionalAccountId, intent.institutionalAccountId),
        eq(institutionProductSubscriptions.productId, intent.productId),
      ))
      .limit(1);

    const capabilityRows = await tx
      .select({ capabilityKey: institutionalProductCapabilities.capabilityKey })
      .from(institutionalProductCapabilities)
      .where(and(
        eq(institutionalProductCapabilities.productId, intent.productId),
        eq(institutionalProductCapabilities.status, "active"),
      ));
    for (const capability of capabilityRows) {
      await tx
        .insert(institutionProductEntitlements)
        .values({
          institutionalAccountId: intent.institutionalAccountId,
          productId: intent.productId,
          subscriptionId: subscription?.id ?? null,
          capabilityKey: capability.capabilityKey,
          entitlementStatus: "active",
          startsAt: now,
          endsAt: intent.expiresAt ?? intent.renewsAt,
        })
        .onDuplicateKeyUpdate({
          set: {
            subscriptionId: subscription?.id ?? null,
            entitlementStatus: "active",
            startsAt: now,
            endsAt: intent.expiresAt ?? intent.renewsAt,
            updatedAt: now,
          },
        });
    }

    const [existingPayment] = await tx
      .select({ id: institutionSubscriptionPayments.id })
      .from(institutionSubscriptionPayments)
      .where(or(
        eq(institutionSubscriptionPayments.idempotencyKey, intent.idempotencyKey),
        eq(institutionSubscriptionPayments.paymentReference, paymentReference),
      ))
      .limit(1);
    let paymentId: number | null = existingPayment?.id ?? null;
    if (!existingPayment) {
      const paymentInsert = await tx
        .insert(institutionSubscriptionPayments)
        .values({
          institutionalAccountId: intent.institutionalAccountId,
          productId: intent.productId,
          subscriptionId: subscription?.id ?? null,
          paymentMethod: "mpesa",
          amountCents: intent.amountCents,
          paymentReference,
          idempotencyKey: intent.idempotencyKey,
          status: "completed",
          receivedAt: now,
          metadata: JSON.stringify({ checkoutRequestId: intent.checkoutRequestId, phoneNumber: input.phoneNumber, receipt }),
        });
      paymentId = (paymentInsert as unknown as { insertId: number }).insertId;
    }

    await tx
      .update(institutionSubscriptionPaymentIntents)
      .set({ status: "completed", resultCode: input.resultCode, mpesaReceiptNumber: receipt, receivedAt: now, failureReason: null, updatedAt: now })
      .where(eq(institutionSubscriptionPaymentIntents.id, intent.id));
    await tx.insert(institutionSubscriptionEvents).values({
      institutionalAccountId: intent.institutionalAccountId,
      productId: intent.productId,
      subscriptionId: subscription?.id ?? null,
      eventType: previous ? "renewed" : "payment_succeeded",
      previousStatus: previous?.subscriptionStatus ?? null,
      currentStatus: "active",
      actorUserId: intent.createdByUserId,
      reason: "Verified M-Pesa callback reconciled.",
      reference: paymentReference,
      occurredAt: now,
    });

    return { handled: true, duplicate: false, intentId: intent.id, status: "completed" as const, subscriptionId: subscription?.id ?? null, paymentId };
  });
}
