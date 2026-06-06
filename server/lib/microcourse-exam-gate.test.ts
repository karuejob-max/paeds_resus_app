import { describe, expect, it } from "vitest";
import { examKindFromQuizTitle, summativePassed } from "../../shared/microcourse-exam-policy";
import {
  isDiagnosticProgressComplete,
  resolveDiagnosticCompleted,
} from "./microcourse-exam-gate";

describe("microcourse-exam-gate helpers", () => {
  it("recognises governance quiz titles", () => {
    expect(examKindFromQuizTitle("Diagnostic baseline")).toBe("diagnostic");
    expect(examKindFromQuizTitle("Summative knowledge check")).toBe("summative");
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
});
