/**
 * Unit tests for Care Signal streak (PSoT §17.3) — uses production
 * `computeCareSignalStreak` (forward EAT timeline).
 */

import { describe, it, expect } from "vitest";
import {
  computeCareSignalStreak,
  enumerateMonthsEndingAt,
} from "./fellowship-care-signal-streak";

describe("computeCareSignalStreak", () => {
  describe("Normal months (≥1 event)", () => {
    it("should count 1 event as qualifying month", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-01": 1,
          "2026-02": 1,
          "2026-03": 1,
        },
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 3,
        windowMonths: 3,
      });
      expect(streak).toBe(3);
    });

    it("should count 5 events as qualifying month", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: { "2026-04": 5 },
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 4,
        windowMonths: 1,
      });
      expect(streak).toBe(1);
    });

    it("should build 24-month streak with consistent ≥1 events", () => {
      const keys = enumerateMonthsEndingAt(2026, 12, 24);
      const events: Record<string, number> = {};
      for (const k of keys) events[k] = 1;
      const streak = computeCareSignalStreak({
        eventsByMonth: events,
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 12,
        windowMonths: 24,
      });
      expect(streak).toBe(24);
    });
  });

  describe("Grace and catch-up (≥3 after grace)", () => {
    it("should continue streak after grace if catch-up has ≥3 events", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-03": 1,
          "2026-04": 0,
          "2026-05": 3,
        },
        graceUsage: [{ year: 2026, month: 4 }],
        anchorYear: 2026,
        anchorMonth: 5,
        windowMonths: 3,
      });
      expect(streak).toBe(3);
    });

    it("should reset streak if catch-up fails (< 3 events)", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-03": 1,
          "2026-04": 0,
          "2026-05": 2,
        },
        graceUsage: [{ year: 2026, month: 4 }],
        anchorYear: 2026,
        anchorMonth: 5,
        windowMonths: 3,
      });
      expect(streak).toBe(0);
    });

    it("should allow grace after first failure (implicit grace + catch-up)", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-04": 1,
          "2026-05": 0,
          "2026-06": 3,
        },
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 6,
        windowMonths: 3,
      });
      expect(streak).toBe(3);
    });
  });

  describe("Third failure (streak reset)", () => {
    it("should reset streak on third failure", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-04": 1,
          "2026-05": 0,
          "2026-06": 3,
          "2026-07": 0,
          "2026-08": 3,
          "2026-09": 0,
        },
        graceUsage: [
          { year: 2026, month: 5 },
          { year: 2026, month: 7 },
        ],
        anchorYear: 2026,
        anchorMonth: 9,
        windowMonths: 6,
      });
      expect(streak).toBe(0);
    });

    it("should not reset if only 2 failures (with graces + catch-ups)", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-04": 1,
          "2026-05": 0,
          "2026-06": 3,
          "2026-07": 0,
          "2026-08": 3,
        },
        graceUsage: [
          { year: 2026, month: 5 },
          { year: 2026, month: 7 },
        ],
        anchorYear: 2026,
        anchorMonth: 8,
        windowMonths: 5,
      });
      expect(streak).toBe(5);
    });
  });

  describe("Edge cases", () => {
    it("should handle 0 events in all months", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-01": 0,
          "2026-02": 0,
          "2026-03": 0,
          "2026-04": 0,
        },
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 4,
        windowMonths: 4,
      });
      expect(streak).toBe(0);
    });

    it("should handle single month with 1 event", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: { "2026-04": 1 },
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 4,
        windowMonths: 1,
      });
      expect(streak).toBe(1);
    });

    it("should calculate percentage correctly (streak / 24)", () => {
      const keys = enumerateMonthsEndingAt(2026, 12, 12);
      const events: Record<string, number> = {};
      for (const k of keys) events[k] = 1;
      const streak = computeCareSignalStreak({
        eventsByMonth: events,
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 12,
        windowMonths: 12,
      });
      const percentage = Math.min(100, Math.round((streak / 24) * 100));
      expect(percentage).toBe(50);
    });
  });

  describe("PSoT §17.3 compliance", () => {
    it("should require ≥1 event for normal months (not ≥3)", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-02": 1,
          "2026-03": 2,
          "2026-04": 1,
        },
        graceUsage: [],
        anchorYear: 2026,
        anchorMonth: 4,
        windowMonths: 3,
      });
      expect(streak).toBe(3);
    });

    it("should enforce ≥3 only after grace (catch-up)", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-04": 0,
          "2026-05": 2,
        },
        graceUsage: [{ year: 2026, month: 4 }],
        anchorYear: 2026,
        anchorMonth: 5,
        windowMonths: 2,
      });
      expect(streak).toBe(0);
    });

    it("should allow up to 2 graces per year (recorded) with successful catch-ups", () => {
      const streak = computeCareSignalStreak({
        eventsByMonth: {
          "2026-03": 1,
          "2026-04": 0,
          "2026-05": 3,
          "2026-06": 0,
          "2026-07": 3,
        },
        graceUsage: [
          { year: 2026, month: 4 },
          { year: 2026, month: 6 },
        ],
        anchorYear: 2026,
        anchorMonth: 7,
        windowMonths: 5,
      });
      expect(streak).toBeGreaterThan(0);
    });
  });
});
