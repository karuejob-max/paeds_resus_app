import { describe, expect, it } from "vitest";
import { evaluateIersPilotReadiness } from "./iers-pilot-readiness";

const readyInput = {
  activeProviderCount: 1,
  activeProviderRoleCount: 1,
  independentReviewerCount: 1,
  completedDrillWithProviderCount: 1,
  acceptedEvidenceCount: 1,
  verifiedActionCount: 1,
  simulationSafetyEnforced: true,
};

describe("evaluateIersPilotReadiness", () => {
  it("requires every clinical-operational gate before declaring pilot readiness", () => {
    const result = evaluateIersPilotReadiness(readyInput);
    expect(result.readyForPilotAcceptance).toBe(true);
    expect(result.gates.every((gate) => gate.passed)).toBe(true);
  });

  it("blocks an unlabelled or unverified pilot", () => {
    const result = evaluateIersPilotReadiness({
      ...readyInput,
      simulationSafetyEnforced: false,
      independentReviewerCount: 0,
      verifiedActionCount: 0,
    });
    expect(result.readyForPilotAcceptance).toBe(false);
    expect(result.gates.filter((gate) => !gate.passed).map((gate) => gate.key)).toEqual([
      "independent_reviewer",
      "simulation_safety",
      "verified_action",
    ]);
  });

  it("does not treat an attended drill as provider evidence unless it is completed", () => {
    const result = evaluateIersPilotReadiness({
      ...readyInput,
      completedDrillWithProviderCount: 0,
    });
    expect(result.readyForPilotAcceptance).toBe(false);
    expect(result.gates.find((gate) => gate.key === "provider_participation")?.passed).toBe(false);
  });
});
