import { describe, expect, it } from "vitest";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { computeQuizScoreFromDb, loadSummativeQuestionBank } from "./microcourse-exam-gate";

function mockDb(rows: { id: number; correctAnswer: string | null; options?: string | null; explanation?: string | null; question?: string }[]) {
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
        question: "PAT assessment",
        correctAnswer: encodeQuizCorrectAnswerForStorage(0, options),
        options: JSON.stringify(options),
        explanation: "Appearance is the first PAT step.",
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
        explanation: "Appearance is the first PAT step.",
      }),
    ]);
  });

  it("loadSummativeQuestionBank omits explanation from pre-submit payload", async () => {
    const db = mockDb([
      {
        id: 1,
        question: "Stem",
        correctAnswer: "A",
        options: JSON.stringify(["A", "B"]),
        explanation: "Secret rationale",
      },
    ]);
    const bank = await loadSummativeQuestionBank(db as never, 10);
    expect(bank).toEqual([{ id: 1, question: "Stem", options: ["A", "B"] }]);
    expect(bank[0]).not.toHaveProperty("explanation");
  });
});
