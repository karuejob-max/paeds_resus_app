export type FacilityLevel = "level_4" | "level_5" | "level_6";
export type PricingTier = "founding_partner" | "standard";
export type DataSharingStatus = "consented" | "consented_anonymous" | "private_mode" | "lapsed";

export const FOUNDING_PARTNER_TERM_YEARS = 5;
export const FOUNDING_PARTNER_STANDARD_RATIO = 0.5;
export const PRIVATE_MODE_PREMIUM_RATIO = 0.3;
export const DEFAULT_KES_PER_USD = 129.45;

export const IERS_STANDARD_KES_BY_LEVEL: Record<FacilityLevel, number> = {
  level_4: 80_000,
  level_5: 150_000,
  level_6: 250_000,
};

export const ICPD_STANDARD_KES_PER_STAFF = [
  { min: 1, max: 100, kes: 1_000 },
  { min: 101, max: 300, kes: 900 },
  { min: 301, max: 500, kes: 800 },
  { min: 501, max: 1_000, kes: 700 },
  { min: 1_001, max: 2_000, kes: 600 },
] as const;

export const QI_REQUIRED_CLOSED_EFFECTIVE_REPORTS: Record<FacilityLevel, number> = {
  level_4: 1,
  level_5: 2,
  level_6: 3,
};

export function standardIersKes(level: FacilityLevel): number {
  return IERS_STANDARD_KES_BY_LEVEL[level];
}

export function foundingPartnerIersKes(level: FacilityLevel): number {
  return Math.round(standardIersKes(level) * FOUNDING_PARTNER_STANDARD_RATIO);
}

export function cpdKesPerStaff(staffCount: number): number {
  if (!Number.isInteger(staffCount) || staffCount < 1) throw new Error("Staff count must be a positive integer");
  const tier = ICPD_STANDARD_KES_PER_STAFF.find(({ min, max }) => staffCount >= min && staffCount <= max);
  return tier?.kes ?? 0;
}

export function privateModeKes(kes: number): number {
  return Math.round(kes * (1 + PRIVATE_MODE_PREMIUM_RATIO));
}

export function usdToKes(usdCents: number, kesPerUsd = DEFAULT_KES_PER_USD): number {
  if (!Number.isInteger(usdCents) || usdCents < 0) throw new Error("USD cents must be a non-negative integer");
  if (!Number.isFinite(kesPerUsd) || kesPerUsd <= 0) throw new Error("FX rate must be positive");
  return Math.round((usdCents / 100) * kesPerUsd * 100);
}

export function kesToUsdCents(kes: number, kesPerUsd = DEFAULT_KES_PER_USD): number {
  if (!Number.isFinite(kes) || kes < 0) throw new Error("KES must be non-negative");
  if (!Number.isFinite(kesPerUsd) || kesPerUsd <= 0) throw new Error("FX rate must be positive");
  return Math.round((kes / kesPerUsd) * 100);
}

export function participationRequirement(level: FacilityLevel | null | undefined): number {
  return level ? QI_REQUIRED_CLOSED_EFFECTIVE_REPORTS[level] : 1;
}

export function foundingPartnerEligibility(input: {
  pricingTier: PricingTier;
  dataSharingStatus: DataSharingStatus;
  foundingPartnerEndsAt: Date | null | undefined;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  return input.pricingTier === "founding_partner"
    && (input.dataSharingStatus === "consented" || input.dataSharingStatus === "consented_anonymous")
    && Boolean(input.foundingPartnerEndsAt && input.foundingPartnerEndsAt > now);
}

export function calculateInstitutionalPrice(input: {
  product: "iers" | "cpd_portal";
  facilityLevel?: FacilityLevel;
  staffCount?: number;
  pricingTier: PricingTier;
  dataSharingStatus: DataSharingStatus;
}): { amountKes: number; amountUsdCents: number; currency: "KES"; label: string } {
  let standardKes: number;
  if (input.product === "iers") {
    if (!input.facilityLevel) throw new Error("Facility level is required for IERS pricing");
    standardKes = standardIersKes(input.facilityLevel);
  } else {
    if (!input.staffCount) throw new Error("Staff count is required for CPD Portal pricing");
    const perStaff = cpdKesPerStaff(input.staffCount);
    standardKes = perStaff * input.staffCount;
  }

  const founding = input.pricingTier === "founding_partner"
    && input.dataSharingStatus !== "private_mode"
    && input.dataSharingStatus !== "lapsed";
  const baseKes = founding ? Math.round(standardKes * FOUNDING_PARTNER_STANDARD_RATIO) : standardKes;
  const amountKes = input.dataSharingStatus === "private_mode" || input.dataSharingStatus === "lapsed"
    ? privateModeKes(baseKes)
    : baseKes;

  return {
    amountKes,
    amountUsdCents: kesToUsdCents(amountKes),
    currency: "KES",
    label: founding ? "Founding Partner" : input.dataSharingStatus === "private_mode" || input.dataSharingStatus === "lapsed" ? "Standard + private-mode premium" : "Standard",
  };
}
