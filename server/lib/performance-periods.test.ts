import { describe, expect, it } from "vitest";
import {
  calculateChange,
  getPerformancePeriodWindow,
} from "./performance-periods";

describe("performance period windows", () => {
  const now = new Date("2026-08-27T09:30:00.000Z"); // 12:30 EAT, Thursday

  it("uses Monday-Sunday EAT weeks and compares the same elapsed time", () => {
    const window = getPerformancePeriodWindow("week", now);

    expect(window.currentStart.toISOString()).toBe("2026-08-23T21:00:00.000Z");
    expect(window.currentEnd.toISOString()).toBe("2026-08-30T21:00:00.000Z");
    expect(window.previousStart.toISOString()).toBe("2026-08-16T21:00:00.000Z");
    expect(window.previousToDateEnd.toISOString()).toBe(
      "2026-08-20T09:30:00.000Z"
    );
    expect(window.isPartial).toBe(true);
  });

  it("uses EAT calendar month boundaries", () => {
    const window = getPerformancePeriodWindow("month", now);

    expect(window.currentStart.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(window.currentEnd.toISOString()).toBe("2026-08-31T21:00:00.000Z");
    expect(window.previousStart.toISOString()).toBe("2026-06-30T21:00:00.000Z");
  });

  it("uses calendar quarters", () => {
    const window = getPerformancePeriodWindow("quarter", now);

    expect(window.currentStart.toISOString()).toBe("2026-06-30T21:00:00.000Z");
    expect(window.currentEnd.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(window.previousStart.toISOString()).toBe("2026-03-31T21:00:00.000Z");
  });

  it("uses calendar years", () => {
    const window = getPerformancePeriodWindow("year", now);

    expect(window.currentStart.toISOString()).toBe("2025-12-31T21:00:00.000Z");
    expect(window.currentEnd.toISOString()).toBe("2026-12-31T21:00:00.000Z");
    expect(window.previousStart.toISOString()).toBe("2024-12-31T21:00:00.000Z");
  });
});

describe("performance change calculations", () => {
  it("returns absolute and percentage growth", () => {
    expect(calculateChange(12, 8)).toEqual({
      delta: 4,
      percentage: 50,
      direction: "up",
    });
  });

  it("does not invent a percentage when the previous period is zero", () => {
    expect(calculateChange(4, 0)).toEqual({
      delta: 4,
      percentage: null,
      direction: "up",
    });
  });

  it("returns stable for equal periods", () => {
    expect(calculateChange(4, 4)).toEqual({
      delta: 0,
      percentage: 0,
      direction: "stable",
    });
  });
});
