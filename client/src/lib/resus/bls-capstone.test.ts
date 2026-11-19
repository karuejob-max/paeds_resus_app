import { describe, expect, it } from "vitest";
import { BLS_CAPSTONE_SCENARIOS, calculateBLSScore } from "./bls-capstone";

describe("BLS capstone scoring", () => {
  it("passes every scenario when the learner submits the canonical order", () => {
    for (const [phase, scenario] of Object.entries(BLS_CAPSTONE_SCENARIOS)) {
      const result = calculateBLSScore(phase as keyof typeof BLS_CAPSTONE_SCENARIOS, scenario.correctOrder);
      expect(result.score, phase).toBe(100);
      expect(result.passed, phase).toBe(true);
    }
  });

  it("does not turn an incomplete order into a passing result", () => {
    const result = calculateBLSScore("adult_rescue", ["start-cpr"]);
    expect(result.score).toBeLessThan(50);
    expect(result.passed).toBe(false);
    expect(result.feedback[0]).toContain("Missing critical steps");
  });
});
