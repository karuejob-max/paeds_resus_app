import { describe, expect, it } from "vitest";
import {
  AHA_COURSE_HOURS,
  AHA_COURSE_ORDER,
  ahaDurationIsoHours,
  formatAhaDuration,
  formatAhaDurationLabel,
  getAhaCourseMetadata,
} from "./aha-course-metadata";

describe("AHA course metadata (CEO durations)", () => {
  it("defines all hub programs in display order", () => {
    expect(AHA_COURSE_ORDER).toEqual(["bls", "acls", "pals", "heartsaver", "nrp"]);
  });

  it("uses CEO-standard contact hours", () => {
    expect(AHA_COURSE_HOURS).toEqual({
      bls: 1,
      acls: 4,
      pals: 16,
      heartsaver: 2,
      nrp: 6,
    });
  });

  it("formats duration strings consistently", () => {
    expect(formatAhaDuration("bls")).toBe("1 hour");
    expect(formatAhaDuration("pals")).toBe("16 hours");
    expect(formatAhaDurationLabel("nrp")).toBe("Duration: 6 hours");
    expect(ahaDurationIsoHours("acls")).toBe("PT4H");
  });

  it("provides non-empty PALS card copy", () => {
    const pals = getAhaCourseMetadata("pals");
    expect(pals.title).toMatch(/PALS/i);
    expect(pals.shortDescription.length).toBeGreaterThan(40);
  });

  it("uses consistent Duration label prefix for every hub program", () => {
    for (const programType of AHA_COURSE_ORDER) {
      expect(formatAhaDurationLabel(programType)).toMatch(/^Duration: \d+ hour/);
    }
  });
});
