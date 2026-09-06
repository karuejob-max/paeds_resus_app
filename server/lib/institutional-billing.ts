import {
  calculateInstitutionalPrice,
  type DataSharingStatus,
  type FacilityLevel,
  type PricingTier,
} from "@shared/institutional-pricing";

export type InstitutionalPaymentMethod = "mpesa" | "bank_transfer" | "card";
export type InstitutionalInvoiceStatus = "draft" | "issued" | "payment_pending" | "paid" | "void" | "overdue" | "cancelled";

export function buildInvoiceNumber(now = new Date(), sequence = Math.floor(Math.random() * 900000) + 100000): string {
  const year = now.getUTCFullYear();
  return `PR-${year}-${sequence}`;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

export function buildInstitutionalQuote(input: {
  product: "iers" | "cpd_portal";
  facilityLevel?: FacilityLevel;
  staffCount?: number;
  pricingTier: PricingTier;
  dataSharingStatus: DataSharingStatus;
  fxRateKesPerUsd: number;
  termYears?: number;
}) {
  const termYears = input.termYears ?? 1;
  if (!Number.isInteger(termYears) || termYears < 1 || termYears > 5) throw new Error("Term must be between one and five years");
  const annual = calculateInstitutionalPrice(input);
  const amountKes = annual.amountKes * termYears;
  return {
    annualKes: annual.amountKes,
    totalKes: amountKes,
    baseAmountUsdCents: Math.round((amountKes / input.fxRateKesPerUsd) * 100),
    amountCents: amountKes * 100,
    currency: "KES" as const,
    fxRateKesPerUsd: input.fxRateKesPerUsd,
    termYears,
    label: annual.label,
  };
}

export function paymentProviderFor(method: InstitutionalPaymentMethod): "pesapal" | "direct_mpesa" | "bank_transfer" {
  if (method === "mpesa") return "direct_mpesa";
  if (method === "card") return "pesapal";
  return "bank_transfer";
}

export function renewalPolicyFor(method: InstitutionalPaymentMethod, autoRenewRequested: boolean) {
  return {
    autoRenewEnabled: method === "card" && autoRenewRequested,
    renewalApprovalRequired: !(method === "card" && autoRenewRequested),
  };
}
