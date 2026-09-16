export const PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE = "paeds_resus_phase2" as const;

export const PAEDS_RESUS_PROVIDER_CERTIFICATE_TYPES = [
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
] as const;

export type PaedsResusProviderCertificateType =
  (typeof PAEDS_RESUS_PROVIDER_CERTIFICATE_TYPES)[number];

export const PAEDS_RESUS_PHASE2_CERTIFICATE_TYPES = [
  "paeds_resus_acls_phase2",
  "paeds_resus_pals_phase2",
  "paeds_resus_nrp_phase2",
  "paeds_resus_instructor_phase2",
] as const;

export const PAEDS_RESUS_PHASE3_CERTIFICATE_TYPES = [
  "paeds_resus_bls_phase3",
  "paeds_resus_acls_phase3",
  "paeds_resus_pals_phase3",
  "paeds_resus_nrp_phase3",
  "paeds_resus_heartsaver_phase3",
  "paeds_resus_instructor_phase3",
] as const;

export const PAEDS_RESUS_COMPLETION_CERTIFICATE_TYPES = [
  PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE,
  ...PAEDS_RESUS_PHASE2_CERTIFICATE_TYPES,
  ...PAEDS_RESUS_PHASE3_CERTIFICATE_TYPES,
  "paeds_resus_ils",
  ...PAEDS_RESUS_PROVIDER_CERTIFICATE_TYPES,
] as const;

export type PaedsResusCompletionCertificateType =
  (typeof PAEDS_RESUS_COMPLETION_CERTIFICATE_TYPES)[number];

export const CERTIFICATE_DISPLAY_LABELS: Record<string, string> = {
  paeds_resus_phase2: "Paeds Resus Phase 2 — Simulation Training and Evaluation",
  paeds_resus_acls_phase2: "ACLS Phase 2 — Simulation Training and Evaluation Gatepass",
  paeds_resus_pals_phase2: "PALS Phase 2 — Simulation Training and Evaluation Gatepass",
  paeds_resus_nrp_phase2: "NRP Phase 2 — Simulation Training and Evaluation Gatepass",
  paeds_resus_instructor_phase2: "Instructor Phase 2 — Simulation Training and Evaluation Gatepass",
  paeds_resus_bls_phase3: "BLS Phase 3 — Practical Skills Evaluation",
  paeds_resus_acls_phase3: "ACLS Phase 3 — Practical Skills Evaluation",
  paeds_resus_pals_phase3: "PALS Phase 3 — Practical Skills Evaluation",
  paeds_resus_nrp_phase3: "NRP Phase 3 — Practical Skills Evaluation",
  paeds_resus_heartsaver_phase3: "Heartsaver Phase 3 — Practical Skills Evaluation",
  paeds_resus_instructor_phase3: "Instructor Phase 3 — Practical Skills Evaluation",
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
