import { describe, expect, it } from "vitest";
import { buildIersEvidenceScorecard } from "./iers-criteria";

describe("IERS evidence-derived scorecard", () => {
  it("awards points only for accepted criterion evidence", () => {
    const score = buildIersEvidenceScorecard([
      { criterionCode: "EQ-01", status: "accepted" },
      { criterionCode: "EQ-01", status: "accepted" },
      { criterionCode: "WF-01", status: "submitted" },
    ]);
    expect(score.totalScore).toBe(12);
    expect(score.criteria.find((criterion) => criterion.code === "EQ-01")?.awardedPoints).toBe(12);
    expect(score.criteria.find((criterion) => criterion.code === "WF-01")?.evidenceSubmitted).toBe(true);
  });

  it("does not call a facility certification-ready until critical evidence is accepted", () => {
    const score = buildIersEvidenceScorecard([
      { criterionCode: "LG-01", status: "accepted" },
      { criterionCode: "WF-01", status: "accepted" },
      { criterionCode: "WF-02", status: "accepted" },
      { criterionCode: "ACT-01", status: "accepted" },
      { criterionCode: "ACT-02", status: "accepted" },
      { criterionCode: "EQ-01", status: "accepted" },
      { criterionCode: "QI-01", status: "accepted" },
    ]);
    expect(score.totalScore).toBe(76);
    expect(score.criticalCriteriaComplete).toBe(true);
    expect(score.eligibleForCertificationReview).toBe(true);
  });

  it("keeps high total scores from bypassing missing critical criteria", () => {
    const score = buildIersEvidenceScorecard([
      { criterionCode: "LG-01", status: "accepted" },
      { criterionCode: "CG-01", status: "accepted" },
      { criterionCode: "RG-01", status: "accepted" },
      { criterionCode: "TR-01", status: "accepted" },
      { criterionCode: "EQ-01", status: "accepted" },
      { criterionCode: "QI-01", status: "accepted" },
      { criterionCode: "WF-01", status: "accepted" },
      { criterionCode: "WF-02", status: "accepted" },
    ]);
    expect(score.totalScore).toBeGreaterThanOrEqual(70);
    expect(score.criticalCriteriaComplete).toBe(false);
    expect(score.eligibleForCertificationReview).toBe(false);
  });
});
