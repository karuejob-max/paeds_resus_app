import { describe, expect, it } from "vitest";
import { getAhaContinueRoute, getProviderCourseDestination } from "./providerCourseRoutes";

describe("getProviderCourseDestination", () => {
  it("returns BLS route with enrollment context and DB course id", () => {
    expect(getProviderCourseDestination("bls", 101, "/fellowship", 47)).toBe(
      "/micro-course/47?programType=bls&enrollmentId=101",
    );
  });

  it("returns ACLS route with enrollment context and DB course id", () => {
    expect(getProviderCourseDestination("acls", 102, "/fellowship", 52)).toBe(
      "/micro-course/52?programType=acls&enrollmentId=102",
    );
  });

  it("falls back to program slug when DB id is unknown", () => {
    expect(getProviderCourseDestination("bls", 101)).toBe(
      "/micro-course/bls?programType=bls&enrollmentId=101",
    );
  });

  it("returns PALS route with enrollment context", () => {
    expect(getProviderCourseDestination("pals", 103, "/fellowship", 8)).toBe(
      "/micro-course/8?programType=pals&enrollmentId=103",
    );
  });

  it("returns septic route with enrollment context", () => {
    expect(getProviderCourseDestination("pals_septic", 104, "/fellowship", 8)).toBe(
      "/micro-course/8?programType=pals&enrollmentId=104",
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
    expect(getProviderCourseDestination("acls", undefined, "/fellowship", 52)).toBe(
      "/micro-course/52?programType=acls",
    );
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
    const bls = getAhaContinueRoute("bls", 301, 47);
    const acls = getAhaContinueRoute("acls", 302, 52);
    const pals = getAhaContinueRoute("pals", 303, 8);

    expect(bls).toEqual({
      destination: "/micro-course/47?programType=bls&enrollmentId=301",
      ctaLabel: "Start course",
    });
    expect(acls).toEqual({
      destination: "/micro-course/52?programType=acls&enrollmentId=302",
      ctaLabel: "Start course",
    });
    expect(pals).toEqual({
      destination: "/micro-course/8?programType=pals&enrollmentId=303",
      ctaLabel: "Start course",
    });
  });
});
