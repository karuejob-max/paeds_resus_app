import { describe, expect, it } from "vitest";
import { computeTrend, FAILURE_DOWNGRADE_PATH, SUCCESS_DOWNGRADE_PATH } from "./fpkb-pattern-detector";

describe("computeTrend", () => {
  it("returns INSUFFICIENT_DATA with fewer than 4 distinct periods", () => {
    expect(computeTrend(["2026-01", "2026-02", "2026-03"])).toBe("INSUFFICIENT_DATA");
  });

  it("detects an increasing trend", () => {
    const periods = [
      "2026-01",
      "2026-02",
      "2026-03", "2026-03", "2026-03",
      "2026-04", "2026-04", "2026-04", "2026-04",
    ];
    expect(computeTrend(periods)).toBe("INCREASING");
  });

  it("detects a decreasing trend", () => {
    const periods = [
      "2026-01", "2026-01", "2026-01", "2026-01",
      "2026-02", "2026-02", "2026-02",
      "2026-03",
      "2026-04",
    ];
    expect(computeTrend(periods)).toBe("DECREASING");
  });

  it("detects a stable trend", () => {
    const periods = [
      "2026-01", "2026-01",
      "2026-02", "2026-02",
      "2026-03", "2026-03",
      "2026-04", "2026-04",
    ];
    expect(computeTrend(periods)).toBe("STABLE");
  });
});

describe("confidence downgrade paths (§7.3)", () => {
  it("steps failure-track patterns down exactly one rung", () => {
    expect(FAILURE_DOWNGRADE_PATH.ESTABLISHED).toBe("CONFIRMED");
    expect(FAILURE_DOWNGRADE_PATH.CONFIRMED).toBe("CANDIDATE");
    expect(FAILURE_DOWNGRADE_PATH.CANDIDATE).toBe("SIGNAL");
    // SIGNAL has no downgrade-path entry — it's handled separately as a
    // knowledge_status change to UNDER_REVIEW, not a confidence-level step.
    expect(FAILURE_DOWNGRADE_PATH.SIGNAL).toBeUndefined();
  });

  it("steps success-track patterns down exactly one rung", () => {
    expect(SUCCESS_DOWNGRADE_PATH.STANDARD_PRACTICE).toBe("VALIDATED_SUCCESS");
    expect(SUCCESS_DOWNGRADE_PATH.VALIDATED_SUCCESS).toBe("EMERGING_SUCCESS");
    expect(SUCCESS_DOWNGRADE_PATH.EMERGING_SUCCESS).toBe("CANDIDATE_SUCCESS");
    // CANDIDATE_SUCCESS has nowhere lower to go.
    expect(SUCCESS_DOWNGRADE_PATH.CANDIDATE_SUCCESS).toBeUndefined();
  });
});
