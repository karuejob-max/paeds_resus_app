import { describe, expect, it } from "vitest";
import { calculateProgramJourney } from "./program-journey";

describe("calculateProgramJourney", () => {
  it("uses the approved weighting and labels the result as programme progress", () => {
    const result = calculateProgramJourney({
      blsProgress: 1,
      aclsProgress: 0.5,
      ahaEvidenceVerified: false,
      phase2Progress: 0,
      paymentProgress: 0.5,
    });
    expect(result.percentComplete).toBe(35);
    expect(result.phases[0].status).toBe("current");
    expect(result.phases[1].status).toBe("locked");
  });

  it("does not unlock Phase 2 until both cognitive work and evidence are complete", () => {
    const result = calculateProgramJourney({
      blsProgress: 1,
      aclsProgress: 1,
      ahaEvidenceVerified: false,
      phase2Progress: 0.75,
      paymentProgress: 1,
    });
    expect(result.phases[1].status).toBe("locked");
    expect(result.phases[1].lockedReason).toContain("verify both AHA evidence");
  });

  it("reports 100% only when Phase 3 is complete", () => {
    const result = calculateProgramJourney({
      blsProgress: 1,
      aclsProgress: 1,
      ahaEvidenceVerified: true,
      phase2Progress: 1,
      paymentProgress: 1,
      phase3Complete: true,
    });
    expect(result.percentComplete).toBe(100);
    expect(result.phases.every((phase) => phase.status === "complete")).toBe(true);
  });
});
