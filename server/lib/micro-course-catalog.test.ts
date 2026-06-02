import { describe, expect, it } from "vitest";
import {
  FELLOWSHIP_PILLAR_MICRO_COURSE_IDS,
  getFellowshipMicroCourseRequiredCount,
  isFellowshipPillarMicroCourse,
  MICRO_COURSE_CATALOG,
} from "./micro-course-catalog";
import { FELLOWSHIP_LAUNCH_READINESS } from "../../shared/fellowship-launch-gate";

describe("fellowship Pillar A micro-course catalog", () => {
  it("requires 29 published pillar courses (excludes sample intubation-essentials)", () => {
    expect(getFellowshipMicroCourseRequiredCount()).toBe(29);
    expect(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS).toHaveLength(29);
    expect(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS).not.toContain("intubation-essentials");
    expect(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS).toContain("seriously-ill-child-i");
    expect(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS).toContain("aki-ii");
    expect(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS).toContain("anaemia-ii");
  });

  it("marks intubation-essentials as sample and excludes it from pillar scope", () => {
    const sample = MICRO_COURSE_CATALOG.find((c) => c.courseId === "intubation-essentials");
    expect(sample?.isSample).toBe(true);
    expect(isFellowshipPillarMicroCourse(sample!)).toBe(false);
  });

  it("keeps Fellow title blocked (CEO gate unchanged)", () => {
    expect(FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled).toBe(false);
  });
});
