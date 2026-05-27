import { describe, expect, it } from "vitest";
import {
  computeCareSignalStreak,
  enumerateMonthsEndingAt,
  monthKeyEAT,
} from "./fellowship-care-signal-streak";

describe("fellowship-care-signal-streak", () => {
  it("monthKeyEAT zero-pads months", () => {
    expect(monthKeyEAT(2026, 3)).toBe("2026-03");
    expect(monthKeyEAT(2026, 12)).toBe("2026-12");
  });

  it("enumerateMonthsEndingAt returns oldest-first keys", () => {
    const keys = enumerateMonthsEndingAt(2026, 3, 3);
    expect(keys).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("computeCareSignalStreak counts consecutive qualifying months", () => {
    const streak = computeCareSignalStreak({
      eventsByMonth: {
        "2026-01": 1,
        "2026-02": 1,
        "2026-03": 1,
      },
      graceUsage: [],
      anchorYear: 2026,
      anchorMonth: 3,
      timelineKeys: ["2026-01", "2026-02", "2026-03"],
    });
    expect(streak).toBe(3);
  });

  it("computeCareSignalStreak requires catch-up after recorded grace month", () => {
    const streak = computeCareSignalStreak({
      eventsByMonth: {
        "2026-01": 1,
        "2026-02": 0,
        "2026-03": 3,
      },
      graceUsage: [{ year: 2026, month: 2 }],
      anchorYear: 2026,
      anchorMonth: 3,
      timelineKeys: ["2026-01", "2026-02", "2026-03"],
    });
    expect(streak).toBe(3);
  });
});
