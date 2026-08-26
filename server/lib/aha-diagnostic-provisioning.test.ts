import { describe, expect, it, vi } from "vitest";
import {
  AHA_DIAGNOSTIC_MIN_QUESTIONS,
  AHA_DIAGNOSTIC_PROGRAMS,
  getAhaDiagnosticBank,
} from "../data/aha-diagnostic-banks";
import { ensureAhaDiagnosticQuiz } from "./ensure-aha-diagnostic-quiz";

function makeMissingDiagnosticDb() {
  let selectCall = 0;
  const insertedQuizValues: Record<string, unknown>[] = [];
  const insertedQuestionValues: Record<string, unknown>[] = [];
  let insertCall = 0;

  const db = {
    select: vi.fn(() => {
      selectCall += 1;
      if (selectCall === 1) {
        return {
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: async () => [{ id: 101 }],
              }),
            }),
          }),
        };
      }
      if (selectCall === 2) {
        return {
          from: () => ({
            where: async () => [],
          }),
        };
      }
      if (selectCall === 3) {
        return {
          from: () => ({
            where: () => ({
              limit: async () => [{ id: 501 }],
            }),
          }),
        };
      }
      return {
        from: () => ({
          where: async () => [],
        }),
      };
    }),
    insert: vi.fn(() => ({
      values: async (values: Record<string, unknown>) => {
        insertCall += 1;
        if (insertCall === 1) {
          insertedQuizValues.push(values);
        } else {
          insertedQuestionValues.push(values);
        }
      },
    })),
  };

  return { db, insertedQuizValues, insertedQuestionValues };
}

describe("AHA diagnostic provisioning", () => {
  it("defines diagnostic baselines for every diagnostic-enabled AHA program, not instructor", () => {
    expect(AHA_DIAGNOSTIC_PROGRAMS).toEqual(["bls", "acls", "pals", "nrp", "heartsaver"]);
    for (const program of AHA_DIAGNOSTIC_PROGRAMS) {
      const bank = getAhaDiagnosticBank(program);
      expect(bank.length).toBeGreaterThanOrEqual(AHA_DIAGNOSTIC_MIN_QUESTIONS);
      expect(
        bank.every((question) => question.options.includes(question.correctAnswer))
      ).toBe(true);
    }
    expect(getAhaDiagnosticBank("instructor")).toHaveLength(0);
  });

  it("creates the missing PALS diagnostic quiz and stores option text answers", async () => {
    const { db, insertedQuizValues, insertedQuestionValues } = makeMissingDiagnosticDb();

    const quizId = await ensureAhaDiagnosticQuiz(db, 40, "pals");

    expect(quizId).toBe(501);
    expect(insertedQuizValues).toHaveLength(1);
    expect(insertedQuizValues[0]).toMatchObject({
      moduleId: 101,
      title: "Diagnostic baseline",
      passingScore: 0,
      order: 0,
    });
    expect(insertedQuestionValues).toHaveLength(12);
    expect(insertedQuestionValues[0]?.correctAnswer).toBe(
      JSON.stringify("Appearance, Work of Breathing, Circulation to Skin")
    );
  });
});
