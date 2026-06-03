import { describe, expect, it } from "vitest";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { computeQuizScoreFromDb } from "./microcourse-exam-gate";

function mockDb(rows: { id: number; correctAnswer: string | null; options?: string | null }[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  };
}

describe("recordQuizAttempt summative payload shape", () => {
  it("PALS Summative Exam title is classified as summative", () => {
    expect(examKindFromQuizTitle("PALS Summative Exam")).toBe("summative");
  });

  it("graded summative attempt exposes score and questionResults for the client", async () => {
    const options = ["Appearance", "Work of Breathing", "Circulation to Skin"];
    const db = mockDb([
      {
        id: 14,
        correctAnswer: encodeQuizCorrectAnswerForStorage(0, options),
        options: JSON.stringify(options),
      },
    ]);
    const graded = await computeQuizScoreFromDb(db as never, 99, { 14: "Appearance" });
    expect(graded.score).toBe(100);
    expect(graded.questionResults).toEqual([
      expect.objectContaining({
        questionId: 14,
        correct: true,
        correctOption: "Appearance",
        userAnswer: "Appearance",
      }),
    ]);
  });
});
