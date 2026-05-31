import { describe, expect, it } from "vitest";
import { shuffleQuestionIndices } from "../../shared/microcourse-exam-policy";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { computeQuizScoreFromDb } from "./microcourse-exam-gate";

function mockDb(rows: { id: number; correctAnswer: string | null }[]) {
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

describe("summative exam integrity helpers", () => {
  it("shuffleQuestionIndices permutes all indices", () => {
    const order = shuffleQuestionIndices(15, 99);
    expect(order).toHaveLength(15);
    expect(new Set(order).size).toBe(15);
    expect(order.sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i));
  });

  it("computeQuizScoreFromDb grades from stored correct answers", async () => {
    const opts = [["Option A", "Wrong A"], ["Option B", "Wrong B"], ["Option C", "Wrong C"]] as const;
    const db = mockDb([
      { id: 1, correctAnswer: encodeQuizCorrectAnswerForStorage(0, [...opts[0]]) },
      { id: 2, correctAnswer: encodeQuizCorrectAnswerForStorage(0, [...opts[1]]) },
      { id: 3, correctAnswer: encodeQuizCorrectAnswerForStorage(0, [...opts[2]]) },
    ]);
    const perfect = await computeQuizScoreFromDb(db as never, 1, {
      1: "Option A",
      2: "Option B",
      3: "Option C",
    });
    expect(perfect.score).toBe(100);
    expect(perfect.correctCount).toBe(3);

    const partial = await computeQuizScoreFromDb(db as never, 1, {
      1: "Option A",
      2: "Wrong",
      3: "Option C",
    });
    expect(partial.score).toBe(67);
    expect(partial.correctCount).toBe(2);
  });
});
