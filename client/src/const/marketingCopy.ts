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
export const ILSP_PRICE_PER_STAFF = 10_000;
export const ILSP_RENEWAL_YEARS = 2;
export const IERS_ANNUAL_PRICE = 200_000;
export const ICPD_ANNUAL_PRICE = 200_000;

export const SERVICE_REGION_TOWNS =
  "Nyeri, Embu, Murang'a, Kerugoya, Nyahururu, Karatina, Naromoru, Nanyuki, Meru, Nkubu, Chuka, Isiolo, and Marsabit";

export const INSTITUTIONAL_GEOGRAPHY_COPY = `Paeds Resus institutional deployments today are concentrated in ${SERVICE_REGION_TOWNS} and surrounding referral facilities — real facilities, real rollouts, not a pilot on paper. The same IERS, ILSP, and ICPD architecture is built to onboard any facility in Kenya or the East African Community; contact us to scope your facility regardless of location.`;

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
  return `${formatKes(ILSP_PRICE_PER_STAFF)} per staff member, renewable every ${ILSP_RENEWAL_YEARS} years`;
}
