export const PAEDS_RESUS_ILS_PROGRAM_TYPE = "paeds_resus_ils" as const;
export const PAEDS_RESUS_ILS_COURSE_SLUG = "paeds-resus-competency" as const;
export const PAEDS_RESUS_ILS_DELIVERY_MODEL =
  "institution_paid_cohort" as const;
export const PAEDS_RESUS_ILS_DELIVERY_LABEL =
  "Institution-paid provider cohort" as const;
/** Public/list price before the automatic institutional cohort discount. */
export const PAEDS_RESUS_ILS_BASE_PRICE_KES = 10_000;
/** CEO-approved automatic discount for every institution-paid ILSP order. */
export const PAEDS_RESUS_ILS_AUTOMATIC_DISCOUNT_PERCENT = 30;
/** Effective published ILSP institutional rate: KES 10,000 less 30%. */
export const PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES =
  Math.round(
    (PAEDS_RESUS_ILS_BASE_PRICE_KES *
      (100 - PAEDS_RESUS_ILS_AUTOMATIC_DISCOUNT_PERCENT)) /
      100
  );
export const PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS = 90;

export const PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES = {
  bls: 7_500,
  acls: 10_000,
} as const;

export const PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES = {
  bls: 10_000,
  acls: 20_000,
} as const;

export type PaedsResusIlsAhaCredential =
  keyof typeof PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES;

export const PAEDS_RESUS_ILS_CREDENTIAL_REQUEST_STATUSES = [
  "payment_pending",
  "paid_pending_review",
  "approved",
  "rejected",
  "expired",
] as const;

export type PaedsResusIlsCredentialRequestStatus =
  (typeof PAEDS_RESUS_ILS_CREDENTIAL_REQUEST_STATUSES)[number];

export type IlsManualEntitlementBenefit = "free" | "percentage_discount" | null | undefined;

export function getIlsInstitutionalPriceKes(providerCount: number): number {
  const count = Math.max(0, Math.floor(Number(providerCount) || 0));
  return count * PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES;
}

/**
 * Automatic ILSP pricing applies to every order. Only a full-waiver entitlement
 * can override the automatic total; percentage entitlements are intentionally
 * ignored here so the 30% automatic discount cannot be double-applied.
 */
export function getIlsCheckoutPriceKes(
  providerCount: number,
  manualBenefitType?: IlsManualEntitlementBenefit
): number {
  return manualBenefitType === "free" ? 0 : getIlsInstitutionalPriceKes(providerCount);
}

export function getCredentialingDeadline(completedAt: Date): Date {
  const deadline = new Date(completedAt);
  deadline.setUTCDate(
    deadline.getUTCDate() + PAEDS_RESUS_ILS_CREDENTIALING_WINDOW_DAYS
  );
  return deadline;
}

export function isCredentialingWindowOpen(
  completedAt: Date,
  now: Date = new Date()
): boolean {
  return now.getTime() < getCredentialingDeadline(completedAt).getTime();
}

export function getAhaCredentialingPriceKes(
  credential: PaedsResusIlsAhaCredential,
  completedAt: Date,
  now: Date = new Date()
): number | null {
  return isCredentialingWindowOpen(completedAt, now)
    ? PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES[credential]
    : null;
}

export function getAhaFullTrainingPriceKes(
  credential: PaedsResusIlsAhaCredential
): number {
  return PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES[credential];
}

export function formatIlsCredentialLabel(
  credential: PaedsResusIlsAhaCredential
): string {
  return credential.toUpperCase();
}

export interface IlsEnrollmentCancellationState {
  enrollmentStatus: "active" | "cancelled";
  paymentStatus: "pending" | "partial" | "completed" | null;
  amountPaid: number | null;
  cognitiveModulesComplete: boolean | null;
  practicalSkillsSignedOff: boolean | null;
}

export function canCancelPendingIlsEnrollment(
  enrollment: IlsEnrollmentCancellationState
): boolean {
  return (
    enrollment.enrollmentStatus === "active" &&
    enrollment.paymentStatus === "pending" &&
    (enrollment.amountPaid ?? 0) === 0 &&
    !enrollment.cognitiveModulesComplete &&
    !enrollment.practicalSkillsSignedOff
  );
}
