import { describe, expect, it } from "vitest";
import {
  formatMicroCourseCatalogTitle,
  formatPrerequisiteHint,
  hasLegacyCourseNumberTitle,
  microCourseTrackLabel,
} from "./micro-course-display";

describe("micro-course-display", () => {
  it("formats catalog titles", () => {
    expect(formatMicroCourseCatalogTitle("DKA", "foundational")).toBe("DKA: Foundational");
    expect(formatMicroCourseCatalogTitle("DKA", "advanced")).toBe("DKA: Advanced");
  });

  it("labels tracks", () => {
    expect(microCourseTrackLabel("foundational")).toBe("Foundational");
    expect(microCourseTrackLabel("advanced")).toBe("Advanced");
  });

  it("formats prerequisite hints", () => {
    expect(
      formatPrerequisiteHint("dka-i", { "dka-i": "DKA: Foundational" })
    ).toBe("Complete DKA: Foundational first");
  });

  it("detects legacy number titles", () => {
    expect(hasLegacyCourseNumberTitle("DKA 1: Fluids")).toBe(true);
    expect(hasLegacyCourseNumberTitle("DKA: Foundational")).toBe(false);
  });
});
