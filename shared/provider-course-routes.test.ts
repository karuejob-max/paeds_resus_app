import { describe, expect, it } from "vitest";
import {
  getAhaNextPhaseAction,
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

describe("getAhaNextPhaseAction", () => {
  it("opens the course player for unfinished cognitive learning", () => {
    expect(getAhaNextPhaseAction("bls", 301, 47, false, false, "active")).toEqual({
      phase: "cognitive",
      destination: "/micro-course/47?programType=bls&enrollmentId=301",
      label: "Continue cognitive modules",
    });
  });

  it("opens practical booking after cognitive completion", () => {
    expect(getAhaNextPhaseAction("acls", 302, 52, true, false, "active")).toEqual({
      phase: "practical",
      destination: "/aha-book-session?programType=acls&enrollmentId=302",
      label: "Book hands-on session",
    });
  });

  it("opens certificates after both phases are complete", () => {
    expect(getAhaNextPhaseAction("pals", 303, undefined, true, true, "active")).toEqual({
      phase: "completed",
      destination: "/certificates",
      label: "View course certificates",
    });
  });

  it("routes cancelled enrollments to review instead of resuming them", () => {
    expect(getAhaNextPhaseAction("nrp", 304, undefined, false, false, "cancelled")).toEqual({
      phase: "review",
      destination: "/aha-courses",
      label: "Review enrollment",
    });
  });
});
