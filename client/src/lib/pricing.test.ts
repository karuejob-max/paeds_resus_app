import { describe, expect, it } from "vitest";
import {
  formatAhaRecommendedDuration,
  formatAhaRecommendedDurationLabel,
} from "@/const/aha-course-metadata";
import { getIndividualCoursePrice, individualCourses } from "@/const/pricing";

describe("individual course pricing (KES)", () => {
  it("matches CEO source-of-truth amounts for AHA tracks", () => {
    expect(getIndividualCoursePrice("bls")).toBe(10000);
    expect(getIndividualCoursePrice("acls")).toBe(20000);
    expect(getIndividualCoursePrice("pals")).toBe(20000);
    expect(getIndividualCoursePrice("heartsaver")).toBe(5000);
    expect(getIndividualCoursePrice("nrp")).toBe(10000);
  });

  it("lists NRP at same individual price as BLS", () => {
    const nrp = individualCourses.find((c) => c.id === "nrp");
    const bls = individualCourses.find((c) => c.id === "bls");
    expect(nrp?.price).toBe(10000);
    expect(nrp?.price).toBe(bls?.price);
  });

  it("lists PALS at same price as ACLS", () => {
    const pals = individualCourses.find((c) => c.id === "pals");
    const acls = individualCourses.find((c) => c.id === "acls");
    expect(pals?.price).toBe(20000);
    expect(pals?.price).toBe(acls?.price);
  });

  it("stores CEO-standard recommended total hours on AHA catalog rows", () => {
    expect(individualCourses.find((c) => c.id === "pals")?.duration).toBe("16 hours");
    expect(formatAhaRecommendedDurationLabel("pals")).toBe(
      "Total time (AHA recommendation): 16 hours"
    );
    expect(formatAhaRecommendedDuration("bls")).toBe("1 hour");
  });
});
