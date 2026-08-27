export const PAEDS_RESUS_ILS_PROGRAM_TYPE = "paeds_resus_ils" as const;
export const PAEDS_RESUS_ILS_COURSE_SLUG = "paeds-resus-competency" as const;
export const PAEDS_RESUS_ILS_DELIVERY_MODEL = "institution_paid_cohort" as const;
export const PAEDS_RESUS_ILS_DELIVERY_LABEL = "Institution-paid provider cohort" as const;
export const PAEDS_RESUS_ILS_BASE_PRICE_KES = 10_000;
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
