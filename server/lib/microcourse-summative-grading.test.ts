import { describe, expect, it } from "vitest";
import {
  shuffleQuestionIndices,
  shuffleQuestionsDisplayOptions,
} from "../../shared/microcourse-exam-policy";
import { encodeQuizCorrectAnswerForStorage } from "../../shared/quiz-answer-contract";
import { computeQuizScoreFromDb } from "./microcourse-exam-gate";

function mockDb(rows: { id: number; question?: string; correctAnswer: string | null; options?: string | null }[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows.map((r) => ({ ...r, question: r.question ?? `Question ${r.id}` })),
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

  it("shuffleQuestionsDisplayOptions permutes option order without losing values", () => {
    const bank = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      question: `Q${i}`,
      options: ["First", "Second", "Third", "Fourth"],
      explanation: null,
    }));
    const sessionSeed = 777;
    const a = shuffleQuestionsDisplayOptions(bank, sessionSeed);
    const b = shuffleQuestionsDisplayOptions(bank, sessionSeed);
    expect(a).toEqual(b);
    expect(a.every((q) => [...q.options].sort().join() === "First,Fourth,Second,Third")).toBe(true);
    const positions = a.map((q) => q.options.indexOf("First"));
    expect(new Set(positions).size).toBeGreaterThan(1);
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

  it("computeQuizScoreFromDb grades index-encoded correct answers", async () => {
    const opts = ["Appearance", "Work of Breathing", "Circulation to Skin"];
    const db = mockDb([{ id: 9, correctAnswer: "0", options: JSON.stringify(opts) }]);
    const result = await computeQuizScoreFromDb(db as never, 1, { 9: "Appearance" });
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(1);
    expect(result.questionResults[0]?.correctOption).toBe("Appearance");
  });

  it("returns per-question results for summative feedback UI", async () => {
    const opts = [["A", "B"], ["C", "D"]] as const;
    const db = mockDb([
      { id: 1, correctAnswer: encodeQuizCorrectAnswerForStorage(0, [...opts[0]]) },
      { id: 2, correctAnswer: encodeQuizCorrectAnswerForStorage(1, [...opts[1]]) },
    ]);
    const result = await computeQuizScoreFromDb(db as never, 1, { 1: "B", 2: "D" });
    expect(result.score).toBe(50);
    expect(result.questionResults).toHaveLength(2);
    expect(result.questionResults[0]).toMatchObject({ questionId: 1, correct: false, correctOption: "A" });
    expect(result.questionResults[1]).toMatchObject({ questionId: 2, correct: true, correctOption: "D" });
  });
});
