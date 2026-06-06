import { describe, expect, it } from "vitest";
import {
  buildCourseProgressAlerts,
  type CourseProgressEnrollmentInput,
} from "./course-progress-notifications";

describe("buildCourseProgressAlerts", () => {
  const microInProgress: CourseProgressEnrollmentInput = {
    id: 10,
    source: "micro",
    title: "DKA: Foundational",
    courseSlug: "dka-i",
    progressPercentage: 42,
    enrollmentStatus: "active",
  };

  const microNotStarted: CourseProgressEnrollmentInput = {
    id: 11,
    source: "micro",
    title: "Status Epilepticus: Foundational",
    courseSlug: "status-epilepticus-i",
    progressPercentage: 0,
    enrollmentStatus: "active",
  };

  const ahaInProgress: CourseProgressEnrollmentInput = {
    id: 20,
    source: "aha",
    title: "Paediatric Advanced Life Support (PALS)",
    courseSlug: "pals",
    courseDbId: 40,
    progressPercentage: 18,
    cognitiveModulesComplete: false,
  };

  const ahaNotStarted: CourseProgressEnrollmentInput = {
    id: 21,
    source: "aha",
    title: "Basic Life Support (BLS)",
    courseSlug: "bls",
    courseDbId: 12,
    progressPercentage: 0,
    cognitiveModulesComplete: false,
  };

  it("includes AHA and micro courses with specific titles", () => {
    const alerts = buildCourseProgressAlerts([
      microNotStarted,
      ahaNotStarted,
      microInProgress,
      ahaInProgress,
    ]);

    expect(alerts.some((a) => a.title === "Start DKA: Foundational")).toBe(false);
    expect(alerts.some((a) => a.title === "Start Status Epilepticus: Foundational")).toBe(true);
    expect(alerts.some((a) => a.title === "Start Basic Life Support (BLS)")).toBe(true);
    expect(alerts.some((a) => a.title === "DKA: Foundational: continue learning")).toBe(true);
    expect(alerts.some((a) => a.title === "Paediatric Advanced Life Support (PALS): continue learning")).toBe(
      true
    );
  });

  it("routes AHA enrollments via program slug and course db id", () => {
    const alerts = buildCourseProgressAlerts([ahaInProgress]);
    expect(alerts[0]?.actionUrl).toBe("/micro-course/40?programType=pals&enrollmentId=20");
  });

  it("routes micro enrollments to /micro-course/{slug}", () => {
    const alerts = buildCourseProgressAlerts([microInProgress]);
    expect(alerts[0]?.actionUrl).toBe("/micro-course/dka-i?enrollmentId=10");
  });

  it("skips completed micro and cognitive-complete AHA rows", () => {
    const alerts = buildCourseProgressAlerts([
      { ...microInProgress, enrollmentStatus: "completed" },
      { ...ahaInProgress, cognitiveModulesComplete: true, progressPercentage: 100 },
    ]);
    expect(alerts).toHaveLength(0);
  });

  it("caps at five specific items and adds overflow row", () => {
    const many: CourseProgressEnrollmentInput[] = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      source: "micro" as const,
      title: `Course ${i + 1}`,
      courseSlug: `course-${i + 1}`,
      progressPercentage: 0,
      enrollmentStatus: "active",
    }));

    const alerts = buildCourseProgressAlerts(many);
    expect(alerts.filter((a) => a.type === "course_start")).toHaveLength(5);
    expect(alerts.at(-1)).toMatchObject({
      type: "course_overflow",
      title: "and 2 more",
    });
  });

  it("does not emit aggregate-only not-yet-started copy", () => {
    const alerts = buildCourseProgressAlerts([microNotStarted]);
    expect(alerts[0]?.title).not.toMatch(/enrolled course/i);
    expect(alerts[0]?.title).toBe("Start Status Epilepticus: Foundational");
  });
});
