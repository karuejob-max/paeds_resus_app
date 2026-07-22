import { describe, expect, it } from "vitest";
import {
  computeTrend,
  FAILURE_DOWNGRADE_PATH,
  SUCCESS_DOWNGRADE_PATH,
  reviewWindowDaysFor,
  downgradeThresholdDaysFor,
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

describe("downgradeThresholdDaysFor (FPKB_SCHEMA_V1.md §7.2 automated-downgrade fallback, gap-analysis #12)", () => {
  it("matches §7.2's literal thresholds: ESTABLISHED 18mo, CONFIRMED 24mo, CANDIDATE 12mo, SIGNAL 6mo", () => {
    // Deliberately NOT monotonic (ESTABLISHED downgrades faster than
    // CONFIRMED) — implemented as literally written in the doc, a decision
    // considered and not flagged for amendment (see the doc comment on
    // runConfidenceDowngrade for the reasoning). This test pins the exact
    // numbers so a future edit can't quietly "fix" them back to monotonic
    // without it being a deliberate, visible change.
    expect(downgradeThresholdDaysFor("ESTABLISHED")).toBe(18 * 30);
    expect(downgradeThresholdDaysFor("CONFIRMED")).toBe(24 * 30);
    expect(downgradeThresholdDaysFor("CANDIDATE")).toBe(12 * 30);
    expect(downgradeThresholdDaysFor("SIGNAL")).toBe(6 * 30);
  });

  it("is a materially longer window than the review-task clock, for the three tiers where losing confidence status is consequential", () => {
    // The whole point of the two-clock design: for ESTABLISHED/CONFIRMED/
    // CANDIDATE, the automated fallback must never fire before the
    // review-task nudge, or Knowledge Stewardship never gets a real chance
    // to intervene before a real confidence downgrade. SIGNAL is
    // deliberately excluded here — moving from SIGNAL to Under Review is a
    // soft, reversible status flag, not a confidence loss, and §7.2 sets
    // both of SIGNAL's clocks to the same 6 months, so they're expected to
    // coincide rather than one strictly preceding the other.
    for (const level of ["ESTABLISHED", "CONFIRMED", "CANDIDATE"]) {
      expect(downgradeThresholdDaysFor(level)!).toBeGreaterThan(reviewWindowDaysFor(level));
    }
  });

  it("CANDIDATE_SUCCESS has a staleness threshold too (fixed 2026-07-19, gap-analysis #15 closure) — it's SIGNAL's success-track analogue, not a level with no rule at all", () => {
    // Previously undefined here, which meant CANDIDATE_SUCCESS patterns
    // could never be flagged stale by the automated fallback regardless of
    // how long they went unreconfirmed. It's the success track's bottom
    // rung — same structural position as SIGNAL, same 6-month window —
    // and now gets the same ACTIVE→UNDER_REVIEW treatment (not a
    // confidenceLevel downgrade, since there's nothing lower to fall to).
    expect(downgradeThresholdDaysFor("CANDIDATE_SUCCESS")).toBe(6 * 30);
  });

  it("returns undefined for a level with genuinely no automated-downgrade rule at all", () => {
    expect(downgradeThresholdDaysFor("RETIRED")).toBeUndefined();
  });
});
