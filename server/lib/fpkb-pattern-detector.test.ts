import { describe, expect, it } from "vitest";
import {
  computeTrend,
  FAILURE_DOWNGRADE_PATH,
  SUCCESS_DOWNGRADE_PATH,
  reviewWindowDaysFor,
} from "./fpkb-pattern-detector";

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

describe("reviewWindowDaysFor (§6.6 review_schedule field, item #15)", () => {
  it("gives CANDIDATE the same 6-month window as SIGNAL, per §6.6's field table", () => {
    // Regression test for the bug caught while resolving item #15: §7.3's
    // prose alone never states CANDIDATE's window, and this code used to
    // guess 12 months (matching CONFIRMED/ESTABLISHED) instead of the 6
    // months §6.6 actually specifies. Locking this in so it can't
    // silently regress if someone edits the downgrade path in isolation.
    expect(reviewWindowDaysFor("SIGNAL")).toBe(182);
    expect(reviewWindowDaysFor("CANDIDATE")).toBe(182);
    expect(reviewWindowDaysFor("CANDIDATE")).toBe(reviewWindowDaysFor("SIGNAL"));
  });

  it("gives CONFIRMED and ESTABLISHED the 12-month window §6.6 states explicitly", () => {
    expect(reviewWindowDaysFor("CONFIRMED")).toBe(365);
    expect(reviewWindowDaysFor("ESTABLISHED")).toBe(365);
  });

  it("mirrors success-track windows to the equivalent failure-track rank (inferred, not documented)", () => {
    // Neither §6.6 nor §7.3 actually states success-track durations — this
    // just confirms the rank-analogy this file uses is applied consistently,
    // not that the specific numbers are spec'd anywhere.
    expect(reviewWindowDaysFor("CANDIDATE_SUCCESS")).toBe(reviewWindowDaysFor("SIGNAL"));
    expect(reviewWindowDaysFor("EMERGING_SUCCESS")).toBe(reviewWindowDaysFor("CANDIDATE"));
    expect(reviewWindowDaysFor("VALIDATED_SUCCESS")).toBe(reviewWindowDaysFor("CONFIRMED"));
    expect(reviewWindowDaysFor("STANDARD_PRACTICE")).toBe(reviewWindowDaysFor("ESTABLISHED"));
  });
});
