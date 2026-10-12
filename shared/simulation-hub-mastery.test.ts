import { describe, expect, it } from "vitest";
import { getMissionJourneyStep, getNextRehearsal, getRecommendedSimulationMission, getSimulationPracticePoints, getSimulationPracticeRank, summarizeSimulationDomains } from "./simulation-hub-mastery";
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
