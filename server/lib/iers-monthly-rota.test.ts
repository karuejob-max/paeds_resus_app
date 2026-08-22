import { describe, expect, it } from "vitest";
import {
  getIsoWeekKey,
  getIsoWeekRange,
  getMonthEnd,
  getMonthlyShiftRows,
  getMonthStartForDate,
  monthStartFromShiftDate,
  normalizeMonthStart,
} from "./iers-monthly-rota";

describe("IERS monthly rota calendar", () => {
  it("normalizes and validates month starts in UTC", () => {
    expect(normalizeMonthStart("2026-08-01")).toBe("2026-08-01");
    expect(getMonthEnd("2026-02-01")).toBe("2026-02-28");
    expect(() => normalizeMonthStart("2026-08-02")).toThrow(/first day/);
  });

  it("expands every calendar day into morning, evening, and night shifts", () => {
    const rows = getMonthlyShiftRows("2026-02-01");
    expect(rows).toHaveLength(28 * 3);
    expect(rows[0]).toEqual({ shiftDate: "2026-02-01", shiftType: "morning" });
    expect(rows.at(-1)).toEqual({ shiftDate: "2026-02-28", shiftType: "night" });
  });

  it("derives month and ISO week values without local timezone drift", () => {
    const date = new Date("2026-08-17T12:00:00.000Z");
    expect(getMonthStartForDate(date)).toBe("2026-08-01");
    expect(monthStartFromShiftDate("2026-08-23")).toBe("2026-08-01");
    expect(getIsoWeekKey(date)).toEqual({ weekNumber: 34, year: 2026 });
    expect(getIsoWeekRange(date)).toEqual({ startDate: "2026-08-17", endDate: "2026-08-23" });
  });
});
