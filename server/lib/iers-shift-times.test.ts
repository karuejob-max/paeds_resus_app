import { describe, expect, it } from "vitest";
import { DEFAULT_SHIFT_TEMPLATES, formatShiftInterval, shiftTemplateForType, validateShiftInterval } from "./iers-shift-times";

describe("IERS shift-time helpers", () => {
  it("provides practical facility presets", () => {
    expect(DEFAULT_SHIFT_TEMPLATES.map((template) => template.startTime)).toEqual(["07:30", "17:30", "21:30"]);
    expect(shiftTemplateForType("night")).toMatchObject({ endTime: "05:30", endDayOffset: 1 });
  });

  it("accepts exact same-day intervals", () => {
    expect(validateShiftInterval({ startTime: "07:30", endTime: "17:30", endDayOffset: 0 })).toMatchObject({
      startTime: "07:30:00",
      endTime: "17:30:00",
      durationMinutes: 600,
    });
  });

  it("accepts overnight intervals and explains the next-day end", () => {
    const interval = validateShiftInterval({ startTime: "21:30", endTime: "05:30", endDayOffset: 1 });
    expect(interval.durationMinutes).toBe(480);
    expect(formatShiftInterval(interval)).toBe("21:30–05:30 (+1 day)");
  });

  it("rejects zero, backwards, invalid, and longer-than-one-day intervals", () => {
    expect(() => validateShiftInterval({ startTime: "07:30", endTime: "07:30", endDayOffset: 0 })).toThrow();
    expect(() => validateShiftInterval({ startTime: "17:30", endTime: "07:30", endDayOffset: 0 })).toThrow();
    expect(() => validateShiftInterval({ startTime: "17:30", endTime: "07:30", endDayOffset: 1 })).not.toThrow();
    expect(() => validateShiftInterval({ startTime: "17:30", endTime: "17:31", endDayOffset: 1 })).toThrow();
    expect(() => validateShiftInterval({ startTime: "07:30", endTime: "17:30", endDayOffset: 2 })).toThrow();
  });
});
