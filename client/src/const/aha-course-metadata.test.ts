import { describe, expect, it } from "vitest";
import {
  AHA_COGNITIVE_COURSEWORK_HOURS,
  AHA_COURSE_HOURS,
  AHA_COURSE_ORDER,
  AHA_RECOMMENDED_TOTAL_HOURS,
  ahaDurationIsoHours,
  formatAhaRecommendedDuration,
  formatAhaRecommendedDurationLabel,
  formatCognitiveCourseworkDuration,
  formatCognitiveCourseworkDurationLabel,
  getAhaCourseMetadata,
} from "./aha-course-metadata";

describe("AHA course metadata (CEO durations)", () => {
  it("defines all hub programs in display order", () => {
    expect(AHA_COURSE_ORDER).toEqual(["bls", "acls", "pals", "heartsaver", "nrp"]);
  });

  it("uses CEO-standard AHA recommended total contact hours", () => {
    expect(AHA_RECOMMENDED_TOTAL_HOURS).toEqual({
      bls: 1,
      acls: 4,
      pals: 16,
      heartsaver: 2,
      nrp: 6,
    });
    expect(AHA_COURSE_HOURS).toBe(AHA_RECOMMENDED_TOTAL_HOURS);
  });

  it("defines realistic cognitive coursework hours (online subset)", () => {
    expect(AHA_COGNITIVE_COURSEWORK_HOURS).toEqual({
      bls: 1.5,
      acls: 3.5,
      pals: 10,
      heartsaver: 1,
      nrp: 3,
    });
    for (const programType of AHA_COURSE_ORDER) {
      expect(AHA_COGNITIVE_COURSEWORK_HOURS[programType]).toBeLessThanOrEqual(
        AHA_RECOMMENDED_TOTAL_HOURS[programType] + 0.5
      );
    }
  });

  it("formats recommended total duration strings consistently", () => {
    expect(formatAhaRecommendedDuration("bls")).toBe("1 hour");
    expect(formatAhaRecommendedDuration("pals")).toBe("16 hours");
    expect(formatAhaRecommendedDurationLabel("nrp")).toBe(
      "Total time (AHA recommendation): 6 hours"
    );
    expect(ahaDurationIsoHours("acls")).toBe("PT4H");
  });

  it("formats cognitive coursework duration strings consistently", () => {
    expect(formatCognitiveCourseworkDuration("bls")).toBe("~1.5 hours online");
    expect(formatCognitiveCourseworkDuration("pals")).toBe("~10 hours online");
    expect(formatCognitiveCourseworkDurationLabel("acls")).toBe(
      "Cognitive coursework: 6 modules • ~3.5 hours online"
    );
    expect(formatCognitiveCourseworkDurationLabel("pals")).toBe(
      "Cognitive coursework: 10 modules • ~10 hours online"
    );
  });

  it("provides non-empty PALS card copy", () => {
    const pals = getAhaCourseMetadata("pals");
    expect(pals.title).toMatch(/PALS/i);
    expect(pals.shortDescription.length).toBeGreaterThan(40);
  });

  it("uses dual duration label prefixes for every hub program", () => {
    for (const programType of AHA_COURSE_ORDER) {
      expect(formatAhaRecommendedDurationLabel(programType)).toMatch(
        /^Total time \(AHA recommendation\): \d/
      );
      expect(formatCognitiveCourseworkDurationLabel(programType)).toMatch(
        /^Cognitive coursework: \d+ modules • ~/
      );
    }
  });
});
