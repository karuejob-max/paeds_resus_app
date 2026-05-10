import { describe, expect, it } from "vitest";
import { getAhaContinueRoute, getProviderCourseDestination } from "./providerCourseRoutes";

describe("getProviderCourseDestination", () => {
  it("returns BLS route with enrollment context", () => {
    expect(getProviderCourseDestination("bls", 101)).toBe(
      "/micro-course/1?enrollmentId=101&programType=bls",
    );
  });

  it("returns ACLS route with enrollment context", () => {
    expect(getProviderCourseDestination("acls", 102)).toBe(
      "/micro-course/2?enrollmentId=102&programType=acls",
    );
  });

  it("returns PALS route with enrollment context", () => {
    expect(getProviderCourseDestination("pals", 103)).toBe(
      "/micro-course/3?enrollmentId=103&programType=pals",
    );
  });

  it("returns septic route with enrollment context", () => {
    expect(getProviderCourseDestination("pals_septic", 104)).toBe(
      "/micro-course/3?enrollmentId=104&programType=pals_septic",
    );
  });

  it("returns instructor route with enrollment context", () => {
    expect(getProviderCourseDestination("instructor", 105)).toBe("/course/instructor?enrollmentId=105");
  });

  it("returns intubation sample route with enrollment context", () => {
    expect(getProviderCourseDestination("intubation-essentials", 106)).toBe(
      "/course/intubation-essentials?enrollmentId=106",
    );
  });

  it("returns route without enrollment when not provided", () => {
    expect(getProviderCourseDestination("acls")).toBe("/micro-course/2?programType=acls");
  });

  it("routes unknown course ids through the generic micro-course player", () => {
    expect(getProviderCourseDestination("unknown_course", 200)).toBe(
      "/micro-course/unknown_course?enrollmentId=200",
    );
  });

  it("uses custom fallback when course id is missing", () => {
    expect(getProviderCourseDestination(undefined, undefined, "/fellowship")).toBe("/fellowship");
    expect(getProviderCourseDestination(null, undefined, "/fellowship")).toBe("/fellowship");
  });
});

describe("getAhaContinueRoute", () => {
  it("returns start-course CTA and destination for AHA programs", () => {
    const bls = getAhaContinueRoute("bls", 301);
    const acls = getAhaContinueRoute("acls", 302);
    const pals = getAhaContinueRoute("pals", 303);

    expect(bls).toEqual({
      destination: "/micro-course/1?enrollmentId=301&programType=bls",
      ctaLabel: "Start course",
    });
    expect(acls).toEqual({
      destination: "/micro-course/2?enrollmentId=302&programType=acls",
      ctaLabel: "Start course",
    });
    expect(pals).toEqual({
      destination: "/micro-course/3?enrollmentId=303&programType=pals",
      ctaLabel: "Start course",
    });
  });
});
