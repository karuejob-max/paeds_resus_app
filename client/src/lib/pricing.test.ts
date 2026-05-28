import { describe, expect, it } from "vitest";
import { getIndividualCoursePrice, individualCourses } from "@/const/pricing";

describe("individual course pricing (KES)", () => {
  it("matches CEO source-of-truth amounts for AHA tracks", () => {
    expect(getIndividualCoursePrice("bls")).toBe(10000);
    expect(getIndividualCoursePrice("acls")).toBe(20000);
    expect(getIndividualCoursePrice("pals")).toBe(20000);
    expect(getIndividualCoursePrice("heartsaver")).toBe(5000);
  });

  it("lists PALS at same price as ACLS", () => {
    const pals = individualCourses.find((c) => c.id === "pals");
    const acls = individualCourses.find((c) => c.id === "acls");
    expect(pals?.price).toBe(20000);
    expect(pals?.price).toBe(acls?.price);
  });
});
