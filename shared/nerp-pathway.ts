/** Canonical entry path for the NERP BLS-first-to-ACLS learner journey. */
export const NERP_PATHWAY_ENTRY_PATH = "/programs/nerp-acls/start";

export type NerpNextStep = "payment" | "bls_cognitive" | "acls_cognitive";

export function getNerpNextStep(input: {
  /** True after the first confirmed NERP instalment or an explicitly completed payment. */
  paymentConfirmed: boolean;
  blsCognitiveComplete: boolean;
}): NerpNextStep {
  if (!input.paymentConfirmed) return "payment";
  if (!input.blsCognitiveComplete) return "bls_cognitive";
  return "acls_cognitive";
}
