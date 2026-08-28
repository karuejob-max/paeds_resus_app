import { and, eq, isNull } from "drizzle-orm";
import {
  enrollments,
  nerpOfferAuditEvents,
  nerpOfferCourses,
  nerpOfferEnrollments,
  payments,
} from "../../drizzle/schema";

export const NERP_ACLS_OFFER_KEY = "nerp-acls-2026" as const;
export const NERP_ACLS_OFFER = {
  offerKey: NERP_ACLS_OFFER_KEY,
  title: "NERP ACLS pathway",
  totalAmountKes: 15_000,
  monthlyInstallmentKes: 2_500,
  installmentCount: 6,
  includedCourses: ["bls", "acls"] as const,
};

export type NerpPhase = "phase_2" | "phase_3";
export type NerpPromotionStatus = "eligible" | "suppressed" | "needs_review";

export function calculateNerpPaymentState(input: {
  amountPaidKes: number;
  totalAmountKes?: number;
  monthlyInstallmentKes?: number;
  installmentCount?: number;
}) {
  const total = input.totalAmountKes ?? NERP_ACLS_OFFER.totalAmountKes;
  const monthly =
    input.monthlyInstallmentKes ?? NERP_ACLS_OFFER.monthlyInstallmentKes;
  const count = input.installmentCount ?? NERP_ACLS_OFFER.installmentCount;
  const paid = Math.max(0, Math.min(total, Number(input.amountPaidKes) || 0));
  const completed = paid >= total;
  const completedInstallments = Math.min(count, Math.floor(paid / monthly));
  return {
    amountPaidKes: paid,
    balanceKes: Math.max(0, total - paid),
    completedInstallments,
    nextInstallmentNumber: completed ? count + 1 : completedInstallments + 1,
    nextInstallmentAmountKes: completed ? 0 : Math.min(monthly, total - paid),
    status: completed ? ("completed" as const) : ("active" as const),
  };
}

export function hasConfirmedNerpPayment(input: {
  status?: string | null;
  amountPaidKes?: number | string | null;
  entitlementId?: number | null;
}) {
  return input.status === "completed" || input.entitlementId != null || Number(input.amountPaidKes ?? 0) > 0;
}

export function deriveNerpPromotionStatus(input: {
  hasValidEmail: boolean;
  hasCompletedOffer: boolean;
  phase2Verified: boolean;
  phase3Verified: boolean;
  hasVerifiedBlsAndAcls: boolean;
  explicitlyExcluded: boolean;
}): { status: NerpPromotionStatus; reason: string | null } {
  if (!input.hasValidEmail)
    return { status: "needs_review", reason: "missing_or_invalid_email" };
  if (input.explicitlyExcluded)
    return { status: "suppressed", reason: "manual_exclusion" };
  if (input.hasCompletedOffer)
    return { status: "suppressed", reason: "nerp_offer_completed" };
  if (input.phase2Verified && input.phase3Verified) {
    return { status: "suppressed", reason: "external_nerp_phases_verified" };
  }
  if (input.hasVerifiedBlsAndAcls) {
    return { status: "suppressed", reason: "external_bls_and_acls_verified" };
  }
  return { status: "eligible", reason: null };
}

/**
 * Applies one completed M-Pesa payment to the NERP offer ledger. The caller
 * must have already changed the payment row from pending to completed; the
 * webhook's idempotency key prevents the same callback being applied twice.
 */
export async function syncNerpChildEnrollmentPaymentStatus(
  db: any,
  offerEnrollmentId: number,
  completed: boolean
) {
  const links = await db
    .select({ enrollmentId: nerpOfferCourses.enrollmentId })
    .from(nerpOfferCourses)
    .where(eq(nerpOfferCourses.nerpOfferEnrollmentId, offerEnrollmentId));
  for (const link of links) {
    await db
      .update(enrollments)
      .set({
        paymentStatus: completed ? "completed" : "partial",
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, link.enrollmentId));
  }
}

export async function applyNerpPaymentCompletion(db: any, paymentId: number) {
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  const payment = paymentRows[0];
  if (!payment?.nerpOfferEnrollmentId) return null;
  if (payment.nerpLedgerAppliedAt) {
    const existingOfferRows = await db
      .select()
      .from(nerpOfferEnrollments)
      .where(eq(nerpOfferEnrollments.id, payment.nerpOfferEnrollmentId))
      .limit(1);
    const existingOffer = existingOfferRows[0];
    return existingOffer
      ? {
          offerEnrollmentId: existingOffer.id,
          userId: existingOffer.userId,
          amountPaidKes: Number(existingOffer.amountPaidKes ?? 0),
          balanceKes: Math.max(
            0,
            Number(existingOffer.totalAmountKes) -
              Number(existingOffer.amountPaidKes ?? 0)
          ),
          completed: existingOffer.status === "completed",
        }
      : null;
  }

  const claim = await db
    .update(payments)
    .set({ nerpLedgerAppliedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(payments.id, payment.id),
        eq(payments.status, "completed"),
        isNull(payments.nerpLedgerAppliedAt)
      )
    );
  const claimResult = Array.isArray(claim) ? claim[0] : claim;
  if (Number(claimResult?.affectedRows ?? 0) !== 1) {
    const existingOfferRows = await db
      .select()
      .from(nerpOfferEnrollments)
      .where(eq(nerpOfferEnrollments.id, payment.nerpOfferEnrollmentId))
      .limit(1);
    const existingOffer = existingOfferRows[0];
    return existingOffer
      ? {
          offerEnrollmentId: existingOffer.id,
          userId: existingOffer.userId,
          amountPaidKes: Number(existingOffer.amountPaidKes ?? 0),
          balanceKes: Math.max(0, Number(existingOffer.totalAmountKes) - Number(existingOffer.amountPaidKes ?? 0)),
          completed: existingOffer.status === "completed",
        }
      : null;
  }

  const offerRows = await db
    .select()
    .from(nerpOfferEnrollments)
    .where(
      and(
        eq(nerpOfferEnrollments.id, payment.nerpOfferEnrollmentId),
        eq(nerpOfferEnrollments.userId, payment.userId)
      )
    )
    .limit(1);
  const offer = offerRows[0];
  if (!offer) throw new Error("NERP offer enrollment not found for payment");

  const current = Number(offer.amountPaidKes ?? 0);
  const amount = Math.max(0, Number(payment.amount ?? 0));
  const state = calculateNerpPaymentState({
    amountPaidKes: current + amount,
    totalAmountKes: Number(offer.totalAmountKes),
    monthlyInstallmentKes: Number(offer.monthlyInstallmentKes),
    installmentCount: offer.installmentCount,
  });

  await db
    .update(nerpOfferEnrollments)
    .set({
      amountPaidKes: state.amountPaidKes.toFixed(2),
      nextInstallmentNumber: state.nextInstallmentNumber,
      status: state.status,
      completedAt: state.status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(nerpOfferEnrollments.id, offer.id));

  await syncNerpChildEnrollmentPaymentStatus(
    db,
    offer.id,
    state.status === "completed"
  );

  await db.insert(nerpOfferAuditEvents).values({
    nerpOfferEnrollmentId: offer.id,
    action: "payment_completed",
    actorUserId: payment.userId,
    details: JSON.stringify({
      paymentId: payment.id,
      installmentNumber: payment.installmentNumber,
      amountKes: amount,
      amountPaidKes: state.amountPaidKes,
      balanceKes: state.balanceKes,
    }),
  });

  return {
    offerEnrollmentId: offer.id,
    userId: offer.userId,
    amountPaidKes: state.amountPaidKes,
    balanceKes: state.balanceKes,
    completed: state.status === "completed",
  };
}
