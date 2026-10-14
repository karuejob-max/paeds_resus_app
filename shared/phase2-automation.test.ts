import { describe, expect, it } from "vitest";
import { calculatePhase2AutomationStatus, getPhase2Requirements, scoreCardiacArrestEventLog, scoreDedicatedSimulation } from "./phase2-automation";
import { getLifeSupportRequiredPhases } from "./life-support-pathways";

describe("automated Phase 2 mastery", () => {
  it("requires multiple distinct ACLS competencies before readiness", () => {
    const requirements = getPhase2Requirements("acls");
    const attempts = requirements.flatMap((requirement) => Array.from({ length: requirement.requiredAttempts }, (_, index) => ({
      trackId: requirement.trackIds?.[0] ?? "adult_acls_world",
      scenarioId: requirement.scenarioIds?.[0] ?? `${requirement.id}-${index}`,
      score: 80,
      passed: true,
    })));
    const status = calculatePhase2AutomationStatus("acls", attempts);
    expect(status.phase2Ready).toBe(true);
    expect(status.completedRequirements).toBe(3);
    expect(status.authority).toBe("automated_simulation_mastery");
    expect(status.governanceBoundary).toBe("does_not_issue_credential");
  });

  it("does not count a failed or below-threshold rehearsal", () => {
    const status = calculatePhase2AutomationStatus("nrp", [
      { trackId: "nrp_world", scenarioId: "newborn-persistent-bradycardia", score: 69, passed: true },
      { trackId: "nrp_world", scenarioId: "newborn-not-breathing", score: 95, passed: false },
    ]);
    expect(status.phase2Ready).toBe(false);
    expect(status.completedRequirements).toBe(0);
    expect(status.nextAction).toContain("Initial newborn steps");
  });

  it("scores dedicated evidence conservatively and caps the result", () => {
    expect(scoreDedicatedSimulation({ recognition: 90, interventionSelection: 85, sequencing: 80, execution: 75, reassessment: 90, teamPerformance: 80 }, 0)).toBe(83);
    expect(scoreDedicatedSimulation({ recognition: 100 }, 4)).toBe(60);
    expect(scoreDedicatedSimulation({}, 0)).toBe(0);
  });

  it("defines Heartsaver as a simulation-qualified pathway", () => {
    expect(getLifeSupportRequiredPhases("heartsaver")).toContain("phase2");
    expect(getPhase2Requirements("heartsaver")).toEqual([
      expect.objectContaining({ id: "first-minutes", minimumScore: 70, requiredAttempts: 1 }),
      expect.objectContaining({ id: "arrest-sequence", minimumScore: 70, requiredAttempts: 1 }),
    ]);
  });

  it("scores a complete CPR-GPS arrest sequence without trusting client scores", () => {
    const result = scoreCardiacArrestEventLog([
      { type: "cpr_gps_action", description: "Cardiac arrest recognized — CPR started" },
      { type: "cpr_gps_action", description: "VF/pVT detected" },
      { type: "cpr_gps_action", description: "Shock delivered" },
      { type: "cpr_gps_action", description: "ROSC ACHIEVED" },
    ]);
    expect(result).toEqual({ score: 100, passed: true });
  });
});
