import { describe, expect, it } from "vitest";
import { calculatePhase2AutomationStatus, getPhase2Requirements, scoreCardiacArrestEventLog, scoreDedicatedSimulation } from "./phase2-automation";
import { getLifeSupportRequiredPhases } from "./life-support-pathways";

describe("automated Phase 2 mastery", () => {
  it("requires multiple distinct ACLS competencies before readiness", () => {
    const requirements = getPhase2Requirements("acls");
    const attempts = requirements.flatMap((requirement) => Array.from({ length: requirement.requiredAttempts }, (_, index) => ({
      trackId: requirement.trackIds?.[0] ?? "adult_acls_world",
      scenarioId: requirement.scenarioIds?.[index] ?? `${requirement.id}-${index}`,
      score: 80,
      passed: true,
    })));
    const status = calculatePhase2AutomationStatus("acls", attempts);
    expect(status.phase2Ready).toBe(true);
    expect(status.completedRequirements).toBe(3);
    expect(status.authority).toBe("automated_simulation_mastery");
    expect(status.requirementSetVersion).toBe("phase2-v2-2026-10-19");
    expect(status.governanceBoundary).toBe("does_not_issue_credential");
  });

  it("requires distinct scenarios rather than repeated passes of one scenario", () => {
    const repeated = calculatePhase2AutomationStatus("acls", [
      { trackId: "adult_acls_world", scenarioId: "vf-pulseless-vt", score: 100, passed: true },
      { trackId: "adult_acls_world", scenarioId: "vf-pulseless-vt", score: 100, passed: true },
    ]);
    expect(repeated.requirements.find((requirement) => requirement.id === "arrest-sequence")?.complete).toBe(false);
  });

  it("fails a requirement when any attempt is marked as a critical failure", () => {
    const status = calculatePhase2AutomationStatus("pals", [{
      trackId: "abcde",
      scenarioId: "unstable_brady_infant",
      score: 100,
      passed: true,
      criticalFailure: true,
    }]);
    expect(status.completedRequirements).toBe(0);
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

  it("excludes rejected evidence but counts review-required evidence", () => {
    const requirement = getPhase2Requirements("pals")[0];
    const rejected = calculatePhase2AutomationStatus("pals", [{
      trackId: requirement.trackIds?.[0] ?? "abcde",
      scenarioId: "unstable_brady_infant",
      score: 100,
      passed: true,
      evidenceStatus: "rejected",
    }]);
    expect(rejected.completedRequirements).toBe(0);

    const reviewRequired = calculatePhase2AutomationStatus("pals", [{
      trackId: requirement.trackIds?.[0] ?? "abcde",
      scenarioId: "unstable_brady_infant",
      score: 100,
      passed: true,
      evidenceStatus: "review_required",
    }]);
    expect(reviewRequired.completedRequirements).toBe(1);
  });

  it("scores dedicated evidence conservatively and caps the result", () => {
    expect(scoreDedicatedSimulation({ recognition: 90, interventionSelection: 85, sequencing: 80, execution: 75, reassessment: 90, teamPerformance: 80 }, 0)).toBe(83);
    expect(scoreDedicatedSimulation({ recognition: 100 }, 4)).toBe(60);
    expect(scoreDedicatedSimulation({}, 0)).toBe(0);
  });

  it("keeps Heartsaver fail-closed until its counted scenario has server replay authority", () => {
    expect(getLifeSupportRequiredPhases("heartsaver")).toContain("phase2");
    expect(getPhase2Requirements("heartsaver")).toEqual([]);
    expect(calculatePhase2AutomationStatus("heartsaver", []).nextAction).toContain("not available");
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

  it("keeps BLS simulations formative without inventing a Phase 2 gate", () => {
    expect(getLifeSupportRequiredPhases("bls")).not.toContain("phase2");
    expect(getPhase2Requirements("bls")).toEqual([]);
    const status = calculatePhase2AutomationStatus("bls", [
      { trackId: "cardiac_arrest", scenarioId: "first-minutes-instructor-loop", score: 100, passed: true },
    ]);
    expect(status.phase2Ready).toBe(false);
    expect(status.totalRequirements).toBe(0);
    expect(status.governanceBoundary).toBe("does_not_issue_credential");
  });
});
