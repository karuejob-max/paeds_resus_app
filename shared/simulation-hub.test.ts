import { describe, expect, it } from "vitest";
import { getSimulationMasteryLabel, getSimulationMission, isSimulationMissionUnlocked, SIMULATION_MISSIONS } from "./simulation-hub";

describe("Simulation Hub mission model", () => {
  it("provides a progressive set of clinically meaningful missions", () => {
    expect(SIMULATION_MISSIONS.map((mission) => mission.id)).toEqual([
      "first-minutes",
      "deteriorating-child",
      "rhythm-decisions",
      "resus-room",
    ]);
    expect(getSimulationMission("deteriorating-child")?.trackId).toBe("abcde");
  });

  it("keeps missions unlocked by default and supports explicit prerequisites", () => {
    const mission = getSimulationMission("first-minutes");
    expect(mission).toBeDefined();
    expect(isSimulationMissionUnlocked(mission!, [])).toBe(true);
    expect(isSimulationMissionUnlocked({ ...mission!, unlocksAfter: "first-minutes" }, [])).toBe(false);
    expect(isSimulationMissionUnlocked({ ...mission!, unlocksAfter: "first-minutes" }, ["first-minutes"])).toBe(true);
  });

  it("uses mastery language instead of competitive ranking", () => {
    expect(getSimulationMasteryLabel(0, 0)).toBe("Not started");
    expect(getSimulationMasteryLabel(1, 65)).toBe("Needs another rehearsal");
    expect(getSimulationMasteryLabel(2, 78)).toBe("Safe with coaching");
    expect(getSimulationMasteryLabel(3, 94)).toBe("Reliable under pressure");
  });
});
