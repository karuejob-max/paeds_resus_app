import { describe, expect, it } from "vitest";
import { FELLOWSHIP_ID_MAPPING } from "../scripts/fellowship-seed-lib";
import { FELLOWSHIP_SIMULATIONS } from "../server/lib/fellowship-simulations-data";
import { FELLOWSHIP_PILLAR_MICRO_COURSE_IDS } from "./micro-course-catalog";
import { resolveFellowshipSimulationLevel, fellowshipSimulationSteps } from "./fellowship-simulation-scenario";
import {
  FELLOWSHIP_SIM_MIN_STEPS,
  fellowshipSimHasLevelKeywords,
  fellowshipSimStepText,
  type FellowshipSimStep,
} from "./fellowship-simulation-types";

function simulationCatalogSlug(courseId: string): string {
  return FELLOWSHIP_ID_MAPPING[courseId] ?? courseId;
}

describe("fellowship simulation catalog coverage", () => {
  it("every pillar micro-course has authored simulation data", () => {
    const missing: string[] = [];
    for (const catalogSlug of FELLOWSHIP_PILLAR_MICRO_COURSE_IDS) {
      const row = FELLOWSHIP_SIMULATIONS.find(
        (s) => simulationCatalogSlug(s.courseId) === catalogSlug
      );
      if (!row) {
        missing.push(catalogSlug);
      }
    }
    expect(missing, `missing simulation data for: ${missing.join(", ")}`).toEqual([]);
  });

  it("maps catalog foundational/advanced to simulation levels", () => {
    expect(resolveFellowshipSimulationLevel("foundational")).toBe("foundational");
    expect(resolveFellowshipSimulationLevel("beginner")).toBe("foundational");
    expect(resolveFellowshipSimulationLevel("advanced")).toBe("advanced");
  });

  it.each(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS)(
    "%s has non-empty ordered pages and min step count",
    (slug) => {
      const sim = FELLOWSHIP_SIMULATIONS.find(
        (s) => simulationCatalogSlug(s.courseId) === slug
      );
      expect(sim, slug).toBeDefined();
      const steps = fellowshipSimulationSteps({
        pages: sim!.pages,
        stepOrder: sim!.stepOrder,
      }) as FellowshipSimStep[];
      expect(steps.length, slug).toBeGreaterThanOrEqual(FELLOWSHIP_SIM_MIN_STEPS);
      expect(steps.every((s) => s.description?.length > 0), slug).toBe(true);
    }
  );

  it.each(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS)(
    "%s has decision choices and debrief",
    (slug) => {
      const sim = FELLOWSHIP_SIMULATIONS.find(
        (s) => simulationCatalogSlug(s.courseId) === slug
      )!;
      const steps = fellowshipSimulationSteps({
        pages: sim.pages,
        stepOrder: sim.stepOrder,
      }) as FellowshipSimStep[];
      const choiceSteps = steps.filter((s) => (s.choices?.length ?? 0) >= 2);
      expect(choiceSteps.length, slug).toBeGreaterThanOrEqual(3);
      expect(steps.some((s) => (s.debriefPoints?.length ?? 0) > 0), slug).toBe(true);
    }
  );

  it.each(FELLOWSHIP_PILLAR_MICRO_COURSE_IDS)(
    "%s has level-appropriate keywords",
    (slug) => {
      const sim = FELLOWSHIP_SIMULATIONS.find(
        (s) => simulationCatalogSlug(s.courseId) === slug
      )!;
      const steps = fellowshipSimulationSteps({
        pages: sim.pages,
        stepOrder: sim.stepOrder,
      }) as FellowshipSimStep[];
      const text = steps.map(fellowshipSimStepText).join(" ");
      expect(fellowshipSimHasLevelKeywords(text, sim.level), slug).toBe(true);
    }
  );

  it("CEO gold paths: asthma-i, septic-shock-ii, meningitis-i", () => {
    for (const slug of ["asthma-i", "septic-shock-ii", "meningitis-i"] as const) {
      const sim = FELLOWSHIP_SIMULATIONS.find(
        (s) => simulationCatalogSlug(s.courseId) === slug
      );
      expect(sim?.courseId, slug).toBeTruthy();
      const steps = fellowshipSimulationSteps({
        pages: sim!.pages,
        stepOrder: sim!.stepOrder,
      });
      expect(steps.length, slug).toBeGreaterThanOrEqual(5);
    }
  });
});
