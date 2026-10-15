import { describe, expect, it } from "vitest";
import { getPhase2Requirements } from "./phase2-automation";
import { getLifeSupportRequiredPhases } from "./life-support-pathways";
import { getSimulationScenarioCatalog } from "./simulation-scenario-catalog";
import type { PracticeLabProgramType } from "./practice-lab-types";

const QUALIFYING_PROGRAMS: readonly PracticeLabProgramType[] = ["acls", "pals", "nrp", "heartsaver"];
const ALL_SIMULATION_PROGRAMS: readonly PracticeLabProgramType[] = ["bls", ...QUALIFYING_PROGRAMS];

describe("Simulation Hub public-release policy", () => {
  it("keeps the Phase 2 course matrix explicit and complete", () => {
    expect(QUALIFYING_PROGRAMS.every((course) => getLifeSupportRequiredPhases(course).includes("phase2"))).toBe(true);
    expect(getLifeSupportRequiredPhases("bls")).not.toContain("phase2");

    for (const course of QUALIFYING_PROGRAMS) {
      const requirements = getPhase2Requirements(course);
      expect(requirements.length, `${course} must define at least one Phase 2 requirement`).toBeGreaterThan(0);
      for (const requirement of requirements) {
        expect(requirement.minimumScore, `${course}/${requirement.id} threshold`).toBeGreaterThanOrEqual(70);
        expect(requirement.requiredAttempts, `${course}/${requirement.id} attempts`).toBeGreaterThan(0);
        expect(requirement.trackIds?.length ?? 0, `${course}/${requirement.id} track scope`).toBeGreaterThan(0);
      }
    }
    expect(getPhase2Requirements("bls")).toEqual([]);
  });

  it("ensures every qualifying requirement is reachable from the learner scenario catalog", () => {
    for (const course of QUALIFYING_PROGRAMS) {
      const scenarios = getSimulationScenarioCatalog(course);
      const requirements = getPhase2Requirements(course);
      for (const requirement of requirements) {
        const matching = scenarios.filter((scenario) =>
          (!requirement.trackIds || requirement.trackIds.includes(scenario.trackId)) &&
          (!requirement.scenarioIds || requirement.scenarioIds.includes(scenario.id)),
        );
        expect(matching.length, `${course}/${requirement.id} must have a catalog scenario`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps all five course lanes discoverable without making BLS a false Phase 2 lane", () => {
    for (const course of ALL_SIMULATION_PROGRAMS) {
      expect(getSimulationScenarioCatalog(course).length, `${course} scenario catalog`).toBeGreaterThan(0);
    }
    expect(getSimulationScenarioCatalog("bls").every((scenario) => scenario.supportedPrograms.includes("bls"))).toBe(true);
  });
});
