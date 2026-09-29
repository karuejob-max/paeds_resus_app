import {
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES,
} from "@shared/institutional-life-support";

export const COHORT_THRESHOLD = 7;
export const COHORT_LABEL = "cohorts of 7 or more";

export const BLS_PRICE = 10_000;
export const BLS_COHORT_PRICE = 7_500;
export const ACLS_PRICE = 20_000;
export const ACLS_COHORT_PRICE = 17_500;
export const IERP_FULL_PRICE = 15_000;
export const NERP_TOTAL_PRICE = 15_000;
export const NERP_INSTALLMENT = 2_500;
export const NERP_INSTALLMENT_COUNT = 6;
export const ILSP_PRICE_PER_STAFF = PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES;
export const ILSP_LIST_PRICE_PER_STAFF = PAEDS_RESUS_ILS_BASE_PRICE_KES;

export const INSTITUTIONAL_GEOGRAPHY_COPY =
  "Paeds Resus is based in Kenya, with our current institutional focus in Central Kenya. ILSP, IERS, and ICPD are built to scale to any facility in Kenya as we grow — East African Community expansion is planned, not yet active. Contact us to discuss your facility.";

export const INSTITUTIONAL_RESPONSE_PROMISE =
  "We will review your facility needs and respond with the right next step for your scope.";

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatCohortLine(base: number, cohort: number): string {
  return `${formatKes(base)} per person; ${formatKes(cohort)} per person for ${COHORT_LABEL}`;
}

export const IERP_STANDALONE_TOTAL = BLS_PRICE + ACLS_PRICE;
export const IERP_SAVINGS = IERP_STANDALONE_TOTAL - IERP_FULL_PRICE;

export function formatIerpValueLine(): string {
  return `${formatKes(IERP_FULL_PRICE)} for AHA ACLS + BLS bundled — save ${formatKes(IERP_SAVINGS)} vs booking them separately`;
}

export function formatNerpValueLine(): string {
  return `${formatKes(NERP_INSTALLMENT)} x ${NERP_INSTALLMENT_COUNT} monthly payments (${formatKes(NERP_TOTAL_PRICE)} total) — BLS coursework unlocks after your first payment`;
}

export function formatIlspPriceLine(): string {
  return `${formatKes(ILSP_LIST_PRICE_PER_STAFF)} list price; ${formatKes(ILSP_PRICE_PER_STAFF)} per provider for institution-paid cohorts`;
}
