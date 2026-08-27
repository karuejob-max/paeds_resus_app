import { describe, expect, it } from "vitest";
import {
  INSTITUTION_LEARNING_STEPS,
  INSTITUTION_LEARNING_TABS,
  INDIVIDUAL_LEARNING_STEPS,
  LEARNING_BOUNDARIES,
} from "./learningGuideContent";

describe("Learning guide content", () => {
  it("covers the complete individual learning journey", () => {
    expect(INDIVIDUAL_LEARNING_STEPS.map(step => step.title)).toEqual([
      "Start with Today",
      "Choose the right learning track",
      "Complete the linear course flow",
      "Connect learning to practice",
      "Review progress and records",
    ]);
  });

  it("keeps Fellowship separate from AHA certification", () => {
    const trackStep = INDIVIDUAL_LEARNING_STEPS.find(
      step => step.title === "Choose the right learning track"
    );
    expect(trackStep?.detail).toContain(
      "Fellowship and AHA certifications are distinct"
    );
    expect(trackStep?.detail).toContain(
      "BLS, ACLS, and PALS are not Fellowship requirements"
    );
  });

  it("represents every current institutional Learning tab", () => {
    expect(INSTITUTION_LEARNING_TABS.map(tab => tab.title)).toEqual([
      "Learning overview",
      "Cohorts & competency",
      "CPD Portal",
      "Intelligence & reports",
      "Coordinators & targets",
    ]);
    expect(INSTITUTION_LEARNING_STEPS.at(-1)?.title).toBe(
      "Hand off to the right portal"
    );
  });

  it("names Readiness as a separate platform boundary", () => {
    expect(LEARNING_BOUNDARIES.map(boundary => boundary.title)).toEqual([
      "Learn",
      "Practice",
      "Readiness",
      "Records",
    ]);
    expect(
      LEARNING_BOUNDARIES.find(boundary => boundary.title === "Readiness")
        ?.description
    ).toContain("Dated duties");
  });
});
