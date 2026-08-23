import { describe, expect, it } from "vitest";
import { derivePoleRotationDepartmentId, isoWeekMonday, mondayForDate } from "./iers-pole-rotation";

const departments = [
  { id: 10, poleSequence: 1, createdAt: new Date("2026-08-03T08:00:00Z") },
  { id: 20, poleSequence: 2, createdAt: new Date("2026-08-04T08:00:00Z") },
  { id: 30, poleSequence: 3, createdAt: new Date("2026-08-05T08:00:00Z") },
];

describe("deterministic IERS pole ERTL rotation", () => {
  it("starts with the first department on the anchor week", () => {
    expect(derivePoleRotationDepartmentId(departments, "2026-08-03", "2026-08-03")).toBe(10);
  });

  it("moves to the next department each week and wraps to the first", () => {
    expect(derivePoleRotationDepartmentId(departments, "2026-08-03", "2026-08-10")).toBe(20);
    expect(derivePoleRotationDepartmentId(departments, "2026-08-03", "2026-08-17")).toBe(30);
    expect(derivePoleRotationDepartmentId(departments, "2026-08-03", "2026-08-24")).toBe(10);
  });

  it("uses sequence order rather than alphabetical department names", () => {
    const nonAlphabetical = [
      { id: 30, poleSequence: 2, createdAt: new Date("2026-08-05T08:00:00Z") },
      { id: 10, poleSequence: 1, createdAt: new Date("2026-08-03T08:00:00Z") },
    ];
    expect(derivePoleRotationDepartmentId(nonAlphabetical, "2026-08-03", "2026-08-03")).toBe(30);
  });

  it("normalizes ISO week dates to Monday", () => {
    expect(mondayForDate("2026-08-06").toISOString().slice(0, 10)).toBe("2026-08-03");
    expect(isoWeekMonday(2026, 34).toISOString().slice(0, 10)).toBe("2026-08-17");
  });
});
