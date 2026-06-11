import { describe, expect, it } from "vitest";
import { fellowshipSimulationHasSteps } from "../../shared/fellowship-simulation-scenario";
import { examKindFromQuizTitle, summativePassed } from "../../shared/microcourse-exam-policy";
import { resolveFellowshipCourseFromCandidates } from "../../shared/resolve-fellowship-course";
import {
  assertMicrocourseCompletionAllowed,
  findDiagnosticQuizInRows,
  findSummativeQuizInRows,
  isDiagnosticProgressComplete,
  resolveDiagnosticCompleted,
  resolveFellowshipCourseId,
} from "./microcourse-exam-gate";

describe("microcourse-exam-gate helpers", () => {
  it("fellowship course resolution prefers exact title over order (duplicate rows)", () => {
    const picked = resolveFellowshipCourseFromCandidates(
      [
        { id: 66, title: "Asthma I (legacy)", order: 1 },
        { id: 6, title: "Asthma I: Recognition & Initial Management", order: 1 },
      ],
      { title: "Asthma I: Recognition & Initial Management", order: 1 }
    );
    expect(picked?.id).toBe(6);
  });

  it("recognises governance quiz titles", () => {
    expect(examKindFromQuizTitle("Diagnostic baseline")).toBe("diagnostic");
    expect(examKindFromQuizTitle("Summative knowledge check")).toBe("summative");
  });

  it("findSummativeQuizInRows locates summative when simulation module is last", () => {
    const rows = [
      { id: 10, moduleId: 201, title: "Knowledge check: Module 1" },
      { id: 20, moduleId: 202, title: "Summative knowledge check" },
      { id: 30, moduleId: 203, title: "Fellowship simulation" },
    ];
    expect(findSummativeQuizInRows(rows)?.id).toBe(20);
  });

  it("findDiagnosticQuizInRows prefers module 1 then falls back", () => {
    const rows = [
      { id: 11, moduleId: 101, title: "Diagnostic baseline" },
      { id: 12, moduleId: 102, title: "Summative knowledge check" },
    ];
    expect(findDiagnosticQuizInRows(rows, 101)?.id).toBe(11);
    expect(findDiagnosticQuizInRows(rows, 999)?.id).toBe(11);
  });

  it("summative pass threshold is 80", () => {
    expect(summativePassed(80)).toBe(true);
    expect(summativePassed(79)).toBe(false);
  });

  it("isDiagnosticProgressComplete accepts completedAt or status", () => {
    expect(isDiagnosticProgressComplete({ completedAt: new Date(), status: "in_progress" })).toBe(
      true
    );
    expect(isDiagnosticProgressComplete({ completedAt: null, status: "completed" })).toBe(true);
    expect(isDiagnosticProgressComplete({ completedAt: null, status: "in_progress" })).toBe(false);
  });

  it("resolveDiagnosticCompleted matches diagnostic quiz progress on module 1", () => {
    const firstModuleId = 101;
    const diagnosticQuizId = 501;
    const completed = resolveDiagnosticCompleted({
      firstModuleId,
      diagnosticQuizId,
      quizRows: [
        { id: diagnosticQuizId, moduleId: firstModuleId, title: "Diagnostic baseline" },
        { id: 502, moduleId: 999, title: "Summative knowledge check" },
      ],
      progressRows: [
        {
          moduleId: firstModuleId,
          quizId: diagnosticQuizId,
          status: "completed",
          completedAt: new Date(),
        },
      ],
    });
    expect(completed).toBe(true);
  });

  it("resolveDiagnosticCompleted ignores unrelated module progress", () => {
    const completed = resolveDiagnosticCompleted({
      firstModuleId: 101,
      diagnosticQuizId: 501,
      quizRows: [{ id: 501, moduleId: 101, title: "Diagnostic baseline" }],
      progressRows: [
        {
          moduleId: 102,
          quizId: 501,
          status: "completed",
          completedAt: new Date(),
        },
      ],
    });
    expect(completed).toBe(false);
  });

  it("resolveFellowshipCourseId prefers exact title before order duplicate", async () => {
    let findCall = 0;
    const db = {
      query: {
        courses: {
          findFirst: async () => {
            findCall++;
            if (findCall === 1) return { id: 6 };
            return undefined;
          },
        },
      },
    };
    const id = await resolveFellowshipCourseId(db as never, {
      title: "Paediatric Asthma: Foundational",
      order: 1,
    });
    expect(id).toBe(6);
    expect(findCall).toBe(1);
  });

  it("resolveFellowshipCourseId falls back to order when title misses", async () => {
    let findCall = 0;
    const db = {
      query: {
        courses: {
          findFirst: async () => {
            findCall++;
            if (findCall === 1) return undefined;
            if (findCall === 2) return { id: 12 };
            return undefined;
          },
        },
      },
    };
    const id = await resolveFellowshipCourseId(db as never, {
      title: "DKA: Foundational",
      order: 3,
    });
    expect(id).toBe(12);
    expect(findCall).toBe(2);
  });

  it("fellowshipSimulationHasSteps accepts legacy root-level scenario JSON", () => {
    const legacy = {
      pat_assessment: { page: "pat_assessment", description: "Assess child" },
    };
    expect(fellowshipSimulationHasSteps(legacy)).toBe(true);
    expect(fellowshipSimulationHasSteps({ pages: legacy })).toBe(true);
    expect(fellowshipSimulationHasSteps({})).toBe(false);
  });

  it("assertMicrocourseCompletionAllowed fails closed when exam state is unavailable", async () => {
    const db = {
      query: {
        microCourseEnrollments: { findFirst: async () => undefined },
      },
    };
    const result = await assertMicrocourseCompletionAllowed(db as never, 1, 999);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/verify exam completion/i);
    }
  });
});
