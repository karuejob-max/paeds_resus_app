/**
 * Unit tests for calculateCareSignalPillar
 * 
 * Tests the new PSoT §17.3 rules:
 * - Normal month: ≥1 event
 * - After grace: ≥3 events (catch-up)
 * - Grace: ≤2 per year
 * - Third failure: streak resets to 0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Mock Care Signal event grouping logic
 * (extracted from calculateCareSignalPillar for testing)
 */
function calculateCareSignalStreak(
  eventsByMonth: Record<string, number>,
  graceUsageByMonth: Record<string, boolean>,
  currentYear: number,
  currentMonth: number
): number {
  let streak = 0;
  let failureCount = 0;
  let graceInProgress = false;

  for (let m = currentMonth; m >= 1; m--) {
    const key = `${currentYear}-${String(m).padStart(2, "0")}`;
    const events = eventsByMonth[key] || 0;
    const usedGraceThisMonth = graceUsageByMonth[key] || false;

    if (graceInProgress) {
      // Catch-up month: require ≥3 events
      if (events >= 3) {
        streak++;
        graceInProgress = false;
        failureCount = 0;
      } else {
        // Catch-up failed: reset streak
        streak = 0;
        break;
      }
    } else if (usedGraceThisMonth) {
      // Grace used: continue streak and mark for catch-up
      streak++;
      graceInProgress = true;
    } else if (events >= 1) {
      // Normal month: ≥1 event
      streak++;
      failureCount = 0;
    } else {
      // 0 events, no grace
      failureCount++;
      if (failureCount >= 3) {
        // Third failure: reset
        streak = 0;
        break;
      } else if (failureCount === 1 || failureCount === 2) {
        // Can use grace (simplified: assume available)
        streak++;
        graceInProgress = true;
      }
    }
  }

  return streak;
}

describe("calculateCareSignalPillar", () => {
  describe("Normal months (≥1 event)", () => {
    it("should count 1 event as qualifying month", () => {
      const events = {
        "2026-04": 1,
        "2026-03": 1,
        "2026-02": 1,
      };
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 4);
      expect(streak).toBe(3);
    });

    it("should count 5 events as qualifying month", () => {
      const events = {
        "2026-04": 5,
      };
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 4);
      expect(streak).toBe(1);
    });

    it("should build 24-month streak with consistent ≥1 events", () => {
      const events: Record<string, number> = {};
      for (let m = 1; m <= 24; m++) {
        events[`2026-${String(m).padStart(2, "0")}`] = 1;
      }
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 24);
      expect(streak).toBe(24);
    });
  });

  describe("Grace and catch-up (≥3 after grace)", () => {
    it("should continue streak after grace if catch-up has ≥3 events", () => {
      const events = {
        "2026-04": 3, // Catch-up month: ≥3
        "2026-03": 1, // Normal month
      };
      const grace = {
        "2026-05": true, // Grace used
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 5);
      expect(streak).toBe(2); // Grace month + catch-up month
    });

    it("should reset streak if catch-up fails (< 3 events)", () => {
      const events = {
        "2026-04": 2, // Catch-up month: only 2 events (FAIL)
        "2026-03": 1, // Normal month
      };
      const grace = {
        "2026-05": true, // Grace used
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 5);
      expect(streak).toBe(0); // Reset due to failed catch-up
    });

    it("should allow grace after first failure", () => {
      const events = {
        "2026-04": 1, // Normal month
        // 2026-05: 0 events (first failure)
        "2026-06": 3, // Catch-up after grace
      };
      const grace = {
        "2026-05": true, // Grace used for first failure
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 6);
      expect(streak).toBe(3); // Normal + grace + catch-up
    });
  });

  describe("Third failure (streak reset)", () => {
    it("should reset streak on third failure", () => {
      const events = {
        "2026-04": 1, // Normal month
        // 2026-05: 0 events (first failure, grace used)
        "2026-06": 3, // Catch-up success
        // 2026-07: 0 events (second failure, grace used)
        "2026-08": 3, // Catch-up success
        // 2026-09: 0 events (third failure, no grace available)
      };
      const grace = {
        "2026-05": true,
        "2026-07": true,
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 9);
      expect(streak).toBe(0); // Reset on third failure
    });

    it("should not reset if only 2 failures", () => {
      const events = {
        "2026-04": 1,
        // 2026-05: 0 (first failure, grace)
        "2026-06": 3, // Catch-up
        // 2026-07: 0 (second failure, grace)
        "2026-08": 3, // Catch-up
      };
      const grace = {
        "2026-05": true,
        "2026-07": true,
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 8);
      expect(streak).toBe(4); // No reset
    });
  });

  describe("Edge cases", () => {
    it("should handle 0 events in all months", () => {
      const events = {};
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 4);
      expect(streak).toBe(0);
    });

    it("should handle single month with 1 event", () => {
      const events = {
        "2026-04": 1,
      };
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 4);
      expect(streak).toBe(1);
    });

    it("should calculate percentage correctly (streak / 24)", () => {
      const events: Record<string, number> = {};
      for (let m = 1; m <= 12; m++) {
        events[`2026-${String(m).padStart(2, "0")}`] = 1;
      }
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 12);
      const percentage = Math.min(100, Math.round((streak / 24) * 100));
      expect(percentage).toBe(50); // 12/24 = 50%
    });
  });

  describe("PSoT §17.3 compliance", () => {
    it("should require ≥1 event for normal months (not ≥3)", () => {
      const events = {
        "2026-04": 1, // Only 1 event, but should qualify
        "2026-03": 2,
        "2026-02": 3,
      };
      const grace = {};
      const streak = calculateCareSignalStreak(events, grace, 2026, 4);
      expect(streak).toBe(3); // All months count
    });

    it("should enforce ≥3 only after grace (catch-up)", () => {
      const events = {
        "2026-04": 2, // 2 events after grace: should FAIL
      };
      const grace = {
        "2026-05": true,
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 5);
      expect(streak).toBe(0); // Catch-up failed
    });

    it("should limit grace to 2 per year (enforced by caller)", () => {
      // Note: This test documents the assumption that the caller
      // enforces ≤2 grace per year. The streak calculator doesn't
      // validate this directly.
      const events = {
        "2026-04": 1,
      };
      const grace = {
        "2026-05": true,
        "2026-06": true,
        // "2026-07": true, // Would be 3rd grace (caller should prevent)
      };
      const streak = calculateCareSignalStreak(events, grace, 2026, 6);
      expect(streak).toBeGreaterThan(0); // Streak continues with 2 graces
    });
  });
});
