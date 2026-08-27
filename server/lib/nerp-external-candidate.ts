export const EXTERNAL_NERP_CANDIDATE_TYPES = ["nerp_nurse", "non_nurse_external"] as const;

export type ExternalNerpCandidateType = (typeof EXTERNAL_NERP_CANDIDATE_TYPES)[number];

export function isNerpNurseCandidate(candidateType: ExternalNerpCandidateType) {
  return candidateType === "nerp_nurse";
}

export function requiresExternalCandidateCadre(candidateType: ExternalNerpCandidateType) {
  return candidateType === "non_nurse_external";
}

export function canEnterNerpNurseCampaign(candidateType: ExternalNerpCandidateType) {
  return isNerpNurseCandidate(candidateType);
}
