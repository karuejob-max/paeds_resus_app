export const PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE = "paeds_resus_phase2" as const;

export const PAEDS_RESUS_PROVIDER_CERTIFICATE_TYPES = [
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
] as const;

export type PaedsResusProviderCertificateType =
  (typeof PAEDS_RESUS_PROVIDER_CERTIFICATE_TYPES)[number];

export const PAEDS_RESUS_COMPLETION_CERTIFICATE_TYPES = [
  PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE,
  "paeds_resus_ils",
  ...PAEDS_RESUS_PROVIDER_CERTIFICATE_TYPES,
] as const;

export type PaedsResusCompletionCertificateType =
  (typeof PAEDS_RESUS_COMPLETION_CERTIFICATE_TYPES)[number];

export const CERTIFICATE_DISPLAY_LABELS: Record<string, string> = {
  paeds_resus_phase2: "Paeds Resus Phase 2 — Online Simulations",
  paeds_resus_ils: "Paeds Resus Institutional Life Support Competency Certificate",
  paeds_resus_bls_provider: "Paeds Resus Certified BLS Provider",
  paeds_resus_acls_provider: "Paeds Resus Certified ACLS Provider",
  paeds_resus_pals_provider: "Paeds Resus Certified PALS Provider",
  paeds_resus_nrp_provider: "Paeds Resus Certified NRP Provider",
};

export function getCertificateDisplayLabel(
  programType: string,
  courseTitle?: string | null
): string {
  return (
    CERTIFICATE_DISPLAY_LABELS[programType] ||
    courseTitle?.trim() ||
    programType.replace(/_/g, " ").toUpperCase()
  );
}

export const READINESS_PATHWAY_LABELS = {
  ierp: "IERP — Intern Emergency Readiness Program",
  nerp: "NERP — Nurses Emergency Readiness Program",
  open_enrolment: "Paeds Resus Open Enrolment Pathway",
} as const;

export type ReadinessPathway = keyof typeof READINESS_PATHWAY_LABELS;
