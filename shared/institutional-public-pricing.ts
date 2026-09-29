import {
  ICPD_STANDARD_KES_PER_STAFF,
  IERS_STANDARD_KES_BY_LEVEL,
  type FacilityLevel,
} from "./institutional-pricing";
import {
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES,
} from "./institutional-life-support";

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export const IERS_PUBLIC_PRICES = [
  { level: "Level 4", facilityLevel: "level_4" as FacilityLevel, amountKes: IERS_STANDARD_KES_BY_LEVEL.level_4 },
  { level: "Level 5", facilityLevel: "level_5" as FacilityLevel, amountKes: IERS_STANDARD_KES_BY_LEVEL.level_5 },
  { level: "Level 6", facilityLevel: "level_6" as FacilityLevel, amountKes: IERS_STANDARD_KES_BY_LEVEL.level_6 },
] as const;

export const ICPD_PUBLIC_TIERS = ICPD_STANDARD_KES_PER_STAFF.map(tier => ({
  label: `${tier.min.toLocaleString()}–${tier.max.toLocaleString()} staff`,
  min: tier.min,
  max: tier.max,
  amountKesPerStaff: tier.kes,
}));

export function formatIersPublicPriceLine(): string {
  return IERS_PUBLIC_PRICES.map(item => `${item.level}: ${formatKes(item.amountKes)}`).join("; ");
}

export function formatIcpdPublicPriceLine(): string {
  return ICPD_PUBLIC_TIERS.map(tier => `${tier.label}: ${formatKes(tier.amountKesPerStaff)}/staff`).join("; ");
}

export function formatIlspPublicPriceLine(): string {
  return `${formatKes(PAEDS_RESUS_ILS_BASE_PRICE_KES)} list price; ${formatKes(PAEDS_RESUS_ILS_INSTITUTIONAL_PRICE_KES)} per provider for institution-paid cohorts`;
}
