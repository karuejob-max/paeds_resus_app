import { describe, expect, it } from "vitest";
import {
  fellowshipSimulationHasSteps,
  fellowshipSimulationSteps,
  parseFellowshipScenarioData,
  resolveFellowshipSimulationLevel,
} from "./fellowship-simulation-scenario";

describe("fellowship-simulation-scenario", () => {
  it("resolveFellowshipSimulationLevel maps beginner to foundational", () => {
    expect(resolveFellowshipSimulationLevel("beginner")).toBe("foundational");
    expect(resolveFellowshipSimulationLevel("foundational")).toBe("foundational");
    expect(resolveFellowshipSimulationLevel("advanced")).toBe("advanced");
    expect(resolveFellowshipSimulationLevel("intermediate")).toBe("advanced");
  });

  it("parseFellowshipScenarioData accepts legacy root-level pages", () => {
    const legacy = {
      pat_assessment: { page: "pat_assessment", description: "Assess" },
      airway: { page: "airway", description: "Airway" },
    };
    const parsed = parseFellowshipScenarioData(legacy);
    expect(Object.keys(parsed.pages)).toEqual(["pat_assessment", "airway"]);
    expect(fellowshipSimulationHasSteps(legacy)).toBe(true);
    expect(fellowshipSimulationSteps(legacy)).toHaveLength(2);
  });

  it("parseFellowshipScenarioData accepts wrapped pages", () => {
    const wrapped = {
      pages: {
        pat_assessment: { page: "pat_assessment" },
      },
    };
    expect(parseFellowshipScenarioData(wrapped).pages).toEqual(wrapped.pages);
  });

  it("parseFellowshipScenarioData parses JSON strings", () => {
    const legacy = { step_a: { page: "step_a" } };
    const parsed = parseFellowshipScenarioData(JSON.stringify(legacy));
    expect(fellowshipSimulationHasSteps(parsed)).toBe(true);
  });
});
