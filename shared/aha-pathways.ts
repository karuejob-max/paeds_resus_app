export const AHA_PROGRAM_TYPES = [
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "nrp",
  "instructor",
] as const;

export type AhaProgramType = (typeof AHA_PROGRAM_TYPES)[number];

/** Individual self-pay prices in Kenyan shillings. */
export const INDEPENDENT_AHA_PRICES_KES: Record<AhaProgramType, number> = {
  bls: 10_000,
  acls: 20_000,
  pals: 20_000,
  heartsaver: 5_000,
  nrp: 10_000,
  instructor: 25_000,
};

export const INDEPENDENT_AHA_PATHWAY_LABEL = "Independent AHA Pathway" as const;

export const AHA_PROGRAM_LABELS: Record<AhaProgramType, string> = {
  bls: "BLS",
  acls: "ACLS",
  pals: "PALS",
  heartsaver: "Heartsaver",
  nrp: "NRP",
  instructor: "Instructor",
};

export function isAhaProgramType(value: string | null | undefined): value is AhaProgramType {
  return value != null && (AHA_PROGRAM_TYPES as readonly string[]).includes(value);
}

export function getIndependentAhaPriceKes(programType: string): number | null {
  return isAhaProgramType(programType) ? INDEPENDENT_AHA_PRICES_KES[programType] : null;
}

export type AhaPathwayKind = "nerp" | "ierp" | "ilsp" | "independent" | "admin_grant" | "blocked";

