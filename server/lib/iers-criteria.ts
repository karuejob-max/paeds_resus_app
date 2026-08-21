export const IERS_CRITERIA = [
  { code: "LG-01", domain: "leadership", label: "Leadership and governance", points: 10, critical: true },
  { code: "WF-01", domain: "workforce", label: "ERT roster and role coverage", points: 10, critical: true },
  { code: "WF-02", domain: "workforce", label: "Shift readiness sign-off", points: 10, critical: true },
  { code: "ACT-01", domain: "activation", label: "Activation pathway tested", points: 12, critical: true },
  { code: "ACT-02", domain: "activation", label: "Acknowledgement and response evidence", points: 12, critical: true },
  { code: "EQ-01", domain: "equipment", label: "Paediatric equipment and cart readiness", points: 12, critical: true },
  { code: "CG-01", domain: "clinical_governance", label: "Policies, guidelines, and review", points: 10, critical: false },
  { code: "QI-01", domain: "quality_improvement", label: "QI actions closed with verification", points: 10, critical: true },
  { code: "RG-01", domain: "resusgps", label: "ResusGPS adoption and safe use", points: 7, critical: false },
  { code: "TR-01", domain: "training", label: "Training and competency coverage", points: 7, critical: false },
] as const;

export type IersCriterionCode = (typeof IERS_CRITERIA)[number]["code"];

export function buildIersEvidenceScorecard(evidence: Array<{ criterionCode: string; status: string }>) {
  const acceptedCodes = new Set(evidence.filter((item) => item.status === "accepted").map((item) => item.criterionCode));
  const submittedCodes = new Set(evidence.filter((item) => ["submitted", "accepted"].includes(item.status)).map((item) => item.criterionCode));
  const criteria = IERS_CRITERIA.map((criterion) => ({
    ...criterion,
    evidenceAccepted: acceptedCodes.has(criterion.code),
    evidenceSubmitted: submittedCodes.has(criterion.code),
    awardedPoints: acceptedCodes.has(criterion.code) ? criterion.points : 0,
  }));
  const totalScore = criteria.reduce((sum, criterion) => sum + criterion.awardedPoints, 0);
  const criticalCriteriaComplete = criteria.filter((criterion) => criterion.critical).every((criterion) => criterion.evidenceAccepted);
  const accreditationLevel = totalScore >= 90 ? "level_4_exemplar" : totalScore >= 70 ? "level_3_certification_review" : totalScore >= 50 ? "level_2_baseline" : "level_1_unprepared";
  return {
    totalScore,
    maxScore: 100,
    accreditationLevel,
    criticalCriteriaComplete,
    eligibleForCertificationReview: totalScore >= 70 && criticalCriteriaComplete,
    criteria,
  };
}
