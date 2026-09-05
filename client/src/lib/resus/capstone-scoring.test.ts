import { describe, expect, it } from "vitest";
import { BLS_CAPSTONE_SCENARIOS, calculateBLSScore } from "./bls-capstone";
import { ACLS_CAPSTONE_SCENARIOS, calculateACLSScore } from "./acls-capstone";
import { NRP_CAPSTONE_SCENARIOS, calculateNRPScore } from "./nrp-capstone";
import { HEARTSAVER_CAPSTONE_SCENARIOS, calculateHeartsaverScore } from "./heartsaver-capstone";
import { PALS_CAPSTONE_SCENARIOS, calculatePriorityScore } from "./pals-capstone-clean";

type ScoreCase = {
  name: string;
  scenario: { correctOrder: string[] };
  score: (order: string[]) => { score: number; passed: boolean };
};

const firstScenarioWithThreeOrMoreSteps = (scenarios: Record<string, { correctOrder: string[] }>) =>
  Object.values(scenarios).find((scenario) => scenario.correctOrder.length >= 3)!;

const scoreCases: ScoreCase[] = [
  {
    name: "BLS",
    scenario: BLS_CAPSTONE_SCENARIOS.adult_rescue,
    score: (order) => calculateBLSScore("adult_rescue", order),
  },
  {
    name: "ACLS",
    scenario: ACLS_CAPSTONE_SCENARIOS.initial_assessment,
    score: (order) => calculateACLSScore("initial_assessment", order),
  },
  {
    name: "NRP",
    scenario: NRP_CAPSTONE_SCENARIOS.initial_steps,
    score: (order) => calculateNRPScore("initial_steps", order),
  },
  {
    name: "Heartsaver",
    scenario: HEARTSAVER_CAPSTONE_SCENARIOS.bystander_cpr,
    score: (order) => calculateHeartsaverScore("bystander_cpr", order),
  },
  {
    name: "PALS",
    scenario: PALS_CAPSTONE_SCENARIOS.pat,
    score: (order) => calculatePriorityScore("pat", order),
  },
];

describe("ordered-response capstone scoring", () => {
  it.each(scoreCases)("$name passes only on a complete correct order", ({ scenario, score }) => {
    const result = score(scenario.correctOrder);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it.each(scoreCases)("$name does not pass a complete but materially misordered response below 70%", ({ scenario, score }) => {
    const order = [...scenario.correctOrder];
    const lastIndex = order.length - 1;
    [order[0], order[lastIndex]] = [order[lastIndex], order[0]];
    const result = score(order);

    expect(result.score).toBeLessThan(70);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.passed).toBe(false);
  });

  it("keeps the shared test fixture valid for every supported capstone", () => {
    expect(firstScenarioWithThreeOrMoreSteps(BLS_CAPSTONE_SCENARIOS)).toBeDefined();
    expect(firstScenarioWithThreeOrMoreSteps(ACLS_CAPSTONE_SCENARIOS)).toBeDefined();
    expect(firstScenarioWithThreeOrMoreSteps(NRP_CAPSTONE_SCENARIOS)).toBeDefined();
    expect(firstScenarioWithThreeOrMoreSteps(HEARTSAVER_CAPSTONE_SCENARIOS)).toBeDefined();
    expect(firstScenarioWithThreeOrMoreSteps(PALS_CAPSTONE_SCENARIOS)).toBeDefined();
  });
});
