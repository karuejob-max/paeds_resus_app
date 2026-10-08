import { describe, expect, it } from "vitest";
import { getSimulationMasteryLabel, getSimulationMission, isFormativeSimulationMission, isSimulationMissionUnlocked, SIMULATION_MISSIONS } from "./simulation-hub";

describe("Simulation Hub mission model", () => {
	  it("provides a progressive set of clinically meaningful missions", () => {
	    expect(SIMULATION_MISSIONS.map((mission) => mission.id)).toEqual([
	      "adult-acls-world",
	      "simulation-world",
      "first-minutes",
      "deteriorating-child",
      "rhythm-decisions",
      "resus-room",
      "pals-capstone",
    ]);
	    expect(getSimulationMission("deteriorating-child")?.trackId).toBe("abcde");
	    expect(getSimulationMission("adult-acls-world")?.supportedPrograms).toEqual(["acls"]);
    expect(getSimulationMission("pals-capstone")?.unlocksAfter).toBe("deteriorating-child");
    expect(getSimulationMission("pals-capstone")?.masteryThreshold).toBe(80);
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

  it("keeps CPR and AI room missions formative rather than assessed", () => {
    expect(isFormativeSimulationMission(getSimulationMission("first-minutes")!)).toBe(true);
    expect(isFormativeSimulationMission(getSimulationMission("resus-room")!)).toBe(true);
    expect(isFormativeSimulationMission(getSimulationMission("pals-capstone")!)).toBe(false);
  });

  it("does not expose paediatric Simulation World missions to ACLS or NRP", () => {
    expect(getSimulationMission("simulation-world")?.supportedPrograms).toEqual(["pals"]);
    expect(getSimulationMission("deteriorating-child")?.supportedPrograms).toEqual(["pals"]);
    expect(getSimulationMission("first-minutes")?.supportedPrograms).not.toContain("acls");
    expect(getSimulationMission("first-minutes")?.supportedPrograms).not.toContain("nrp");
  });
});
