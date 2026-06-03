import { describe, expect, it, vi } from "vitest";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";
import { resetSummativeAttemptsForEnrollment } from "./reset-summative-attempts";

vi.mock("./sync-micro-course-enrollment-progress", () => ({
  isMicroCourseEnrollmentId: vi.fn().mockResolvedValue(false),
}));

vi.mock("./microcourse-exam-gate", () => ({
  getMicrocourseExamState: vi.fn(),
  resolveCourseSummativeQuizId: vi.fn().mockResolvedValue(599),
}));

vi.mock("./resolve-aha-course-anchor", () => ({
  resolveAhaCourseAnchor: vi.fn(),
}));

describe("resetSummativeAttemptsForEnrollment", () => {
  it("rejects non-summative quiz titles", async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValueOnce([{ courseId: 40, programType: "pals" }])
              .mockResolvedValueOnce([{ title: "Knowledge Check: Adult BLS", moduleId: 101 }])
              .mockResolvedValueOnce([]),
          }),
        }),
      }),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const result = await resetSummativeAttemptsForEnrollment(db as never, {
      userId: 1,
      enrollmentId: 10,
      quizId: 100,
      adminUserId: 99,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("summative");
    }
    expect(examKindFromQuizTitle("Knowledge Check: Adult BLS")).toBe("formative");
  });
});
