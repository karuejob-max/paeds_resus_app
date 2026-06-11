import { describe, expect, it } from "vitest";
import { FELLOWSHIP_ID_MAPPING } from "../scripts/fellowship-seed-lib";
import { FELLOWSHIP_SIMULATIONS } from "../server/lib/fellowship-simulations-data";
import { FELLOWSHIP_PILLAR_MICRO_COURSE_IDS } from "./micro-course-catalog";
import { resolveFellowshipSimulationLevel } from "./fellowship-simulation-scenario";

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
});
