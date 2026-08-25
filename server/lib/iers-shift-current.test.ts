import { describe, expect, it } from "vitest";
import { classifyShiftInterval, currentShiftSortWeight } from "./iers-shift-current";

const base = { shiftDate: "2026-08-24", shiftStartTime: "07:30:00", shiftEndTime: "17:30:00", shiftEndDayOffset: 0 };

describe("exact current IERS shift classification", () => {
  it("marks a dated day shift current only inside its interval", () => {
    expect(classifyShiftInterval(base, new Date("2026-08-24T10:00:00Z"), "UTC")).toBe("current");
    expect(classifyShiftInterval(base, new Date("2026-08-24T18:00:00Z"), "UTC")).toBe("past");
  });

  it("handles an overnight interval without treating the next day as a separate team", () => {
    const overnight = { ...base, shiftStartTime: "21:30:00", shiftEndTime: "05:30:00", shiftEndDayOffset: 1 };
    expect(classifyShiftInterval(overnight, new Date("2026-08-24T23:00:00Z"), "UTC")).toBe("current");
    expect(classifyShiftInterval(overnight, new Date("2026-08-25T04:59:00Z"), "UTC")).toBe("current");
    expect(classifyShiftInterval(overnight, new Date("2026-08-25T06:00:00Z"), "UTC")).toBe("past");
  });

  it("orders current before upcoming before past", () => {
    expect(currentShiftSortWeight("current")).toBeLessThan(currentShiftSortWeight("upcoming"));
    expect(currentShiftSortWeight("upcoming")).toBeLessThan(currentShiftSortWeight("past"));
  });
});
