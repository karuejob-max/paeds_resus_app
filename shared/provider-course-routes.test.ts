import { describe, expect, it } from "vitest";
import {
  getProviderCourseDestination,
  isProviderProgramSlug,
} from "./provider-course-routes";

describe("provider course routes", () => {
  it("recognizes Institutional Life Support as a provider programme, not an AHA slug", () => {
    expect(isProviderProgramSlug("paeds_resus_ils")).toBe(true);
  });

  it("opens Institutional Life Support in the shared interactive course player", () => {
    expect(getProviderCourseDestination("paeds_resus_ils", 42)).toBe(
      "/micro-course/paeds-resus-competency?programType=paeds_resus_ils&enrollmentId=42"
    );
  });
});
