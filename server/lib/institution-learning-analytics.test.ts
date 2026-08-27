import { describe, expect, it } from "vitest";
import { computeInstitutionLearningAnalytics } from "./institution-learning-analytics";

describe("institution learning analytics", () => {
  const base = {
    period: {
      periodType: "quarterly" as const,
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
    },
    departments: [
      { id: 1, departmentName: "Paediatrics" },
      { id: 2, departmentName: "Nursing" },
    ],
    staff: [
      {
        id: 10,
        userId: 101,
        fullName: "Ada Nurse",
        email: "ada@example.com",
        staffRole: "nurse",
        department: "Nursing",
        facilityDepartmentId: 2,
        assignedCourses: '["pals"]',
        phaseStatus: "phase_3",
      },
      {
        id: 11,
        userId: 102,
        fullName: "Ben Doctor",
        email: "ben@example.com",
        staffRole: "doctor",
        department: "Paediatrics",
        facilityDepartmentId: 1,
        assignedCourses: '["acls"]',
        phaseStatus: "phase_2",
      },
    ],
    events: [
      {
        id: 1,
        name: "Facility CPD",
        eventDate: "2026-02-01",
        eventDateAt: "2026-02-01",
        createdAt: "2026-02-01",
        eventType: "cpd_general",
        audienceScope: "facility_wide",
        audienceLabel: null,
        facilityDepartmentId: null,
        cpdPoints: "1",
      },
      {
        id: 2,
        name: "Nursing CNE",
        eventDate: "2026-02-08",
        eventDateAt: "2026-02-08",
        createdAt: "2026-02-08",
        eventType: "cne",
        audienceScope: "nursing_wide",
        audienceLabel: null,
        facilityDepartmentId: null,
        cpdPoints: "1",
      },
      {
        id: 3,
        name: "M&M",
        eventDate: "2026-02-15",
        eventDateAt: "2026-02-15",
        createdAt: "2026-02-15",
        eventType: "m_and_m",
        audienceScope: "m_and_m",
        audienceLabel: null,
        facilityDepartmentId: 1,
        cpdPoints: "1",
      },
    ],
    attendees: [
      {
        id: 1,
        cpdEventId: 1,
        email: "ada@example.com",
        fullName: "Ada Nurse",
        department: "Nursing",
        facilityDepartmentId: 2,
        submittedAt: "2026-02-01",
        attendanceStatus: "attendance_verified",
      },
      {
        id: 2,
        cpdEventId: 2,
        email: "ada@example.com",
        fullName: "Ada Nurse",
        department: "Nursing",
        facilityDepartmentId: 2,
        submittedAt: "2026-02-08",
        attendanceStatus: "attendance_verified",
      },
    ],
    enrollments: [
      {
        userId: 101,
        programType: "pals",
        cognitiveModulesComplete: true,
        practicalSkillsSignedOff: true,
        createdAt: "2026-01-10",
      },
      {
        userId: 102,
        programType: "acls",
        cognitiveModulesComplete: true,
        practicalSkillsSignedOff: false,
        createdAt: "2026-01-10",
      },
    ],
    targets: [
      {
        id: 1,
        targetScope: "individual" as const,
        departmentId: null,
        userId: 101,
        metricKey: "cpd_sessions",
        periodType: "quarterly" as const,
        periodStart: "2026-01-01",
        periodEnd: "2026-03-31",
        targetValue: "2",
        courseProgramType: null,
        coursePhase: null,
      },
      {
        id: 2,
        targetScope: "department" as const,
        departmentId: 1,
        userId: null,
        metricKey: "m_and_m_sessions",
        periodType: "quarterly" as const,
        periodStart: "2026-01-01",
        periodEnd: "2026-03-31",
        targetValue: "1",
        courseProgramType: null,
        coursePhase: null,
      },
    ],
  };

  it("reports audience-aware participation and individual attendance", () => {
    const report = computeInstitutionLearningAnalytics(base);
    expect(report.summary.totalSessions).toBe(3);
    expect(
      report.summary.sessionsByAudience.find(
        row => row.audienceScope === "nursing_wide"
      )?.count
    ).toBe(1);
    expect(report.individuals.find(row => row.userId === 101)).toMatchObject({
      attendedSessions: 2,
      eligibleSessions: 2,
      attendanceRate: 100,
      cneAttended: 1,
    });
    expect(report.departments.find(row => row.departmentId === 1)?.status).toBe(
      "needs_support"
    );
  });

  it("reports life-support cognitive, phase, and completion state per course", () => {
    const report = computeInstitutionLearningAnalytics(base);
    expect(
      report.courses.find(
        row => row.userId === 101 && row.programType === "pals"
      )
    ).toMatchObject({
      cognitiveComplete: true,
      phase2Status: "completed",
      phase3Status: "completed",
      completed: true,
      stage: "completed",
    });
    expect(
      report.courses.find(
        row => row.userId === 102 && row.programType === "acls"
      )
    ).toMatchObject({
      cognitiveComplete: true,
      phase2Status: "in_progress",
      phase3Status: "not_started",
      completed: false,
      stage: "phase_2",
    });
  });

  it("compares actuals to individual and department targets", () => {
    const report = computeInstitutionLearningAnalytics(base);
    expect(report.targets.find(row => row.id === 1)).toMatchObject({
      actualValue: 2,
      targetValue: 2,
      progressPercent: 100,
      status: "met",
    });
    expect(report.targets.find(row => row.id === 2)).toMatchObject({
      actualValue: 1,
      targetValue: 1,
      progressPercent: 100,
      status: "met",
    });
  });

  it("includes Institutional Life Support in the institutional learning report", () => {
    const report = computeInstitutionLearningAnalytics({
      ...base,
      staff: [
        ...base.staff,
        {
          id: 12,
          userId: 103,
          fullName: "Cara Provider",
          email: "cara@example.com",
          staffRole: "nurse",
          department: "Nursing",
          facilityDepartmentId: 2,
          assignedCourses: '["paeds_resus_ils"]',
          phaseStatus: "phase_3",
        },
      ],
      enrollments: [
        ...base.enrollments,
        {
          userId: 103,
          programType: "paeds_resus_ils" as const,
          cognitiveModulesComplete: true,
          practicalSkillsSignedOff: true,
          createdAt: "2026-01-15",
        },
      ],
    });
    expect(
      report.courses.find(
        row => row.userId === 103 && row.programType === "paeds_resus_ils"
      )
    ).toMatchObject({
      hasEnrollment: true,
      cognitiveComplete: true,
      completed: true,
      stage: "completed",
    });
  });
});
