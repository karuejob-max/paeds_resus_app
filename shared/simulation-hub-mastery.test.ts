import { describe, expect, it } from "vitest";
import { getMissionJourneyStep, getNextRehearsal, getRecommendedPhase2Scenario, getRecommendedSimulationMission, getSimulationPracticePoints, getSimulationPracticeRank, summarizeSimulationDomains } from "./simulation-hub-mastery";
import { getSimulationMission } from "./simulation-hub";

describe("Simulation Hub adaptive mastery", () => {
  it("turns event evidence into domain scores", () => {
    const summary = summarizeSimulationDomains([
      { timestamp: 1, type: "rhythm", description: "Recognised VF rhythm", correct: true },
      { timestamp: 2, type: "action", description: "CPR compressions", correct: false },
      { timestamp: 3, type: "team", description: "Closed-loop team order", correct: true },
    ]);
    expect(summary.find((domain) => domain.id === "recognition")?.score).toBe(100);
    expect(summary.find((domain) => domain.id === "technical-action")?.score).toBe(0);
  });

  it("selects the weakest evidenced domain for the next rehearsal", () => {
    const summary = summarizeSimulationDomains([
      { timestamp: 1, type: "rhythm", description: "Recognised rhythm", correct: true },
      { timestamp: 2, type: "cpr", description: "CPR action", correct: false },
    ]);
    expect(getNextRehearsal(summary)?.id).toBe("technical-action");
  });
});

describe("Simulation Hub mastery loop", () => {
  it("rewards persistence without turning practice points into a score or credential", () => {
    expect(getSimulationPracticePoints(0, 0, true)).toBe(0);
    expect(getSimulationPracticePoints(2, 0, true)).toBe(50);
    expect(getSimulationPracticePoints(1, 80, false)).toBe(80);
    expect(getSimulationPracticeRank(0)).toEqual({ title: "First responder in training", nextThreshold: 100 });
    expect(getSimulationPracticeRank(260).title).toBe("Reliable responder");
  });

  it("makes the journey state obvious", () => {
    expect(getMissionJourneyStep("map")).toEqual({ label: "Choose mission", index: 1 });
    expect(getMissionJourneyStep("briefing")).toEqual({ label: "Brief", index: 2 });
    expect(getMissionJourneyStep("playing")).toEqual({ label: "Act and reassess", index: 3 });
  });


  it("turns the server next requirement into one required scenario", () => {
    const recommendation = getRecommendedPhase2Scenario(
      {
        programType: "acls", phase2Ready: false, authority: "automated_simulation_mastery",
        attempts: 0, passedAttempts: 0, bestScore: 0, completedRequirements: 0, totalRequirements: 3,
        requirements: [
          { id: "rhythm-action", label: "Adult rhythm and stability decisions", trackIds: ["adult_acls_world"], minimumScore: 70, requiredAttempts: 2, attempts: 0, bestScore: 0, complete: false },
        ],
        nextAction: "Complete Adult rhythm and stability decisions", governanceBoundary: "does_not_issue_credential",
      },
      [
        { id: "unstable-bradycardia", title: "Adult unstable bradycardia", clinicalFocus: "", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
        { id: "vf-pulseless-vt", title: "Adult VF / pulseless VT", clinicalFocus: "", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
      ],
      [],
    );
    expect(recommendation?.scenarioId).toBe("unstable-bradycardia");
    expect(recommendation?.reason).toContain("2 qualifying rehearsals remaining");
  });

  it("prioritises an unpassed scenario for remediation", () => {
    const recommendation = getRecommendedPhase2Scenario(
      {
        programType: "nrp", phase2Ready: false, authority: "automated_simulation_mastery",
        attempts: 1, passedAttempts: 0, bestScore: 45, completedRequirements: 0, totalRequirements: 2,
        requirements: [
          { id: "bradycardia", label: "Persistent newborn bradycardia escalation", trackIds: ["nrp_world"], scenarioIds: ["newborn-persistent-bradycardia"], minimumScore: 70, requiredAttempts: 1, attempts: 0, bestScore: 0, complete: false },
        ],
        nextAction: "Complete Persistent newborn bradycardia escalation", governanceBoundary: "does_not_issue_credential",
      },
      [{ id: "newborn-persistent-bradycardia", title: "Persistent newborn bradycardia", clinicalFocus: "", missionId: "nrp-newborn-not-breathing", trackId: "nrp_world", supportedPrograms: ["nrp"] }],
      [{ trackId: "nrp_world", scenarioId: "newborn-persistent-bradycardia", score: 45, passed: false }],
    );
    expect(recommendation?.scenarioId).toBe("newborn-persistent-bradycardia");
    expect(recommendation?.reason).toContain("Repeat this scenario");
  });

  it("recommends the least-started foundation mission before pressure missions", () => {
    const missions = [getSimulationMission("resus-room")!, getSimulationMission("first-minutes")!];
    const recommended = getRecommendedSimulationMission(missions, [], { "resus-room": 0, "first-minutes": 0 });
    expect(recommended?.id).toBe("first-minutes");
  });

  it("moves a learner toward an unfinished mission rather than repeating completed content", () => {
    const missions = [getSimulationMission("first-minutes")!, getSimulationMission("cardiac-arrest-scenarios")!];
    const recommended = getRecommendedSimulationMission(missions, ["first-minutes"], { "first-minutes": 3 });
    expect(recommended?.id).toBe("cardiac-arrest-scenarios");
  });
});
