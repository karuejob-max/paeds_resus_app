import { describe, expect, it } from "vitest";
import { getAhaContinueRoute, getProviderCourseDestination } from "./providerCourseRoutes";

describe("getProviderCourseDestination", () => {
  it("returns BLS route with enrollment context", () => {
    expect(getProviderCourseDestination("bls", 101)).toBe("/course/bls?enrollmentId=101");
  });

  it("returns ACLS route with enrollment context", () => {
    expect(getProviderCourseDestination("acls", 102)).toBe("/course/acls?enrollmentId=102");
  });

  it("returns PALS route with enrollment context", () => {
    expect(getProviderCourseDestination("pals", 103)).toBe("/course/seriously-ill-child?enrollmentId=103");
  });

  it("returns septic route with enrollment context", () => {
    expect(getProviderCourseDestination("pals_septic", 104)).toBe(
      "/course/paediatric-septic-shock?enrollmentId=104"
    );
  });

  it("returns instructor route with enrollment context", () => {
    expect(getProviderCourseDestination("instructor", 105)).toBe("/course/instructor?enrollmentId=105");
  });

  it("returns intubation sample route with enrollment context", () => {
    expect(getProviderCourseDestination("intubation-essentials", 106)).toBe(
      "/course/intubation-essentials?enrollmentId=106"
    );
  });

  it("returns route without enrollment when not provided", () => {
    expect(getProviderCourseDestination("acls")).toBe("/course/acls");
  });

  it("falls back for unknown course id", () => {
    expect(getProviderCourseDestination("unknown_course", 200)).toBe("/learner-dashboard");
  });

  it("uses custom fallback when provided", () => {
    expect(getProviderCourseDestination("unknown_course", 200, "/fellowship")).toBe("/fellowship");
  });
});

describe("getAhaContinueRoute", () => {
  it("returns start-course CTA and destination for AHA programs", () => {
    const bls = getAhaContinueRoute("bls", 301);
    const acls = getAhaContinueRoute("acls", 302);
    const pals = getAhaContinueRoute("pals", 303);

    expect(bls).toEqual({
      destination: "/course/bls?enrollmentId=301",
      ctaLabel: "Start course",
    });
    expect(acls).toEqual({
      destination: "/course/acls?enrollmentId=302",
      ctaLabel: "Start course",
    });
    expect(pals).toEqual({
      destination: "/course/seriously-ill-child?enrollmentId=303",
      ctaLabel: "Start course",
    });
  });
});
