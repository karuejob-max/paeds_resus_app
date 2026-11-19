import { and, asc, eq, isNull } from "drizzle-orm";
import { ierpProgramEnrollments } from "../../drizzle/schema";
import { consumeGlobalEntitlementInTransaction } from "./global-entitlements";
import { IERP_TOTAL_FEE_KES } from "./ierp-program-state";

/**
 * Apply a named IERP entitlement to the learner's pending enrollment inside the
 * caller's transaction. The enrollment row is the serialization key: the
 * unique (userId, programKey) row lock prevents competing grants from both
 * being consumed for one enrollment.
 */
export async function applyIerpEntitlementToPendingEnrollmentInTransaction(
  tx: any,
  input: {
    entitlementId: number;
    targetUserId: number;
    redeemedByUserId: number;
    requireFree?: boolean;
    clearPaymentLockoutAt?: boolean;
  }
) {
  const [enrollment] = await tx
    .select()
    .from(ierpProgramEnrollments)
    .where(
      and(
        eq(ierpProgramEnrollments.userId, input.targetUserId),
        eq(ierpProgramEnrollments.programKey, "ierp"),
        eq(ierpProgramEnrollments.paymentStatus, "pending"),
        eq(ierpProgramEnrollments.totalPaidAmount, "0.00"),
        isNull(ierpProgramEnrollments.entitlementId)
      )
    )
    .orderBy(asc(ierpProgramEnrollments.id))
    .limit(1)
    .for("update");

  if (!enrollment) return null;

  const applied = await consumeGlobalEntitlementInTransaction(tx, {
    entitlementId: input.entitlementId,
    targetUserId: input.targetUserId,
    programType: "ierp",
    resourceReference: `ierp-enrollment-${enrollment.id}`,
    originalAmountKes: IERP_TOTAL_FEE_KES,
    redeemedByUserId: input.redeemedByUserId,
  });
  if (!applied) return null;
  if (input.requireFree && applied.effectiveAmountKes !== 0) {
    throw new Error("A free IERP entitlement must have a zero effective fee.");
  }

  // Keep the eligibility predicate on the write as a second guard. If it ever
  // misses after the row lock, throw so the caller rolls back the redemption.
  const updateResult = await tx
    .update(ierpProgramEnrollments)
    .set({
      entitlementId: input.entitlementId,
      effectiveFeeKes: applied.effectiveAmountKes,
      paymentStatus: applied.effectiveAmountKes === 0 ? "not_required" : "pending",
      ...(input.clearPaymentLockoutAt && applied.effectiveAmountKes === 0
        ? { paymentLockoutAt: null }
        : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(ierpProgramEnrollments.id, enrollment.id),
        eq(ierpProgramEnrollments.paymentStatus, "pending"),
        eq(ierpProgramEnrollments.totalPaidAmount, "0.00"),
        isNull(ierpProgramEnrollments.entitlementId)
      )
    );
  const affectedRows = Number(
    (updateResult as any)?.[0]?.affectedRows ??
      (updateResult as any)?.affectedRows ??
      0
  );
  if (affectedRows !== 1) {
    throw new Error("IERP entitlement reconciliation did not update one pending enrollment.");
  }

  return applied;
}
