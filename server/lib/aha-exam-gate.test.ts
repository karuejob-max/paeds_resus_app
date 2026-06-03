import { describe, expect, it, vi } from "vitest";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";
import {
  getAhaCourseExamState,
  resolveCourseDiagnosticQuizId,
} from "./microcourse-exam-gate";

function makeDb(fixtures: {
  enrollment?: { id: number; courseId: number; programType: string };
  modules?: { id: number; order: number }[];
  quizzes?: { id: number; moduleId: number; title: string }[];
  progress?: {
    moduleId: number;
    quizId: number | null;
    score: number | null;
    attempts: number | null;
    status: string | null;
    completedAt?: Date | null;
    updatedAt?: Date | null;
  }[];
}) {
  const enrollment = fixtures.enrollment ?? { id: 1, courseId: 40, programType: "pals" };
  const moduleRows = fixtures.modules ?? [
    { id: 101, order: 1 },
    { id: 106, order: 6 },
  ];
  const quizRows = fixtures.quizzes ?? [
    { id: 501, moduleId: 101, title: "Diagnostic baseline" },
    { id: 599, moduleId: 106, title: "PALS Summative Exam" },
  ];
  const progressRows = fixtures.progress ?? [];

  return {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table && String(table).includes("enrollments")) {
              return [enrollment];
            }
            return [];
          },
          orderBy: async () => moduleRows,
        }),
        orderBy: async () => moduleRows,
      }),
    }),
    query: {
      courses: {
        findFirst: async () => ({ id: enrollment.courseId }),
      },
    },
    _quizRows: quizRows,
    _progressRows: progressRows,
  } as never;
}

describe("AHA exam gate", () => {
  it("classifies PALS summative title", () => {
    expect(examKindFromQuizTitle("PALS Summative Exam")).toBe("summative");
  });

  it("requires diagnostic before modules when diagnostic quiz exists and is incomplete", async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([
              { id: 10, courseId: 40, programType: "pals", userId: 5 },
            ]),
            orderBy: vi.fn().mockResolvedValue([
              { id: 101, order: 1 },
              { id: 106, order: 6 },
            ]),
          })),
          orderBy: vi.fn().mockResolvedValue([
            { id: 101, order: 1 },
            { id: 106, order: 6 },
          ]),
        })),
      }),
      query: {
        courses: { findFirst: vi.fn().mockResolvedValue({ id: 40 }) },
      },
    };

    let call = 0;
    const origSelect = db.select;
    db.select = vi.fn(() => {
      call++;
      if (call === 1) {
        return {
          from: () => ({
            where: () => ({
              limit: async () => [{ id: 10, courseId: 40, programType: "pals" }],
            }),
          }),
        };
      }
      if (call === 2) {
        return {
          from: () => ({
            where: () => ({
              orderBy: async () => [
                { id: 101, order: 1 },
                { id: 106, order: 6 },
              ],
            }),
          }),
        };
      }
      if (call === 3) {
        return {
          from: () => ({
            where: async () => [
              { id: 501, moduleId: 101, title: "Diagnostic baseline" },
              { id: 599, moduleId: 106, title: "PALS Summative Exam" },
            ],
          }),
        };
      }
      return {
        from: () => ({
          where: async () => [],
        }),
      };
    }) as typeof origSelect;

    const state = await getAhaCourseExamState(db as never, 5, 10);
    expect(state).not.toBeNull();
    expect(state?.diagnosticRequired).toBe(true);
    expect(state?.diagnosticCompleted).toBe(false);
    expect(state?.summativeQuizId).toBe(599);
  });
});

describe("resolveCourseDiagnosticQuizId", () => {
  it("finds diagnostic on first module", async () => {
    let call = 0;
    const db = {
      select: vi.fn(() => {
        call++;
        if (call === 1) {
          return {
            from: () => ({
              where: () => ({
                orderBy: async () => [{ id: 101, order: 1 }],
              }),
            }),
          };
        }
        return {
          from: () => ({
            where: async () => [{ id: 501, title: "Diagnostic baseline" }],
          }),
        };
      }),
    };
    const id = await resolveCourseDiagnosticQuizId(db as never, 40);
    expect(id).toBe(501);
  });
});
