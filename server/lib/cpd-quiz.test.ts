import { describe, expect, it } from "vitest";
import { bestCpdQuizAttemptPassed, scoreCpdQuiz } from "./cpd-quiz";

describe("CPD quiz scoring", () => {
  const questions = [
    { id: 1, questionType: "multiple_choice" as const, correctAnswer: "b" },
    { id: 2, questionType: "true_false" as const, correctAnswer: "true" },
    { id: 3, questionType: "multiple_choice" as const, correctAnswer: "2" },
    { id: 4, questionType: "multiple_choice" as const, correctAnswer: "a" },
    { id: 5, questionType: "true_false" as const, correctAnswer: "false" },
  ];

  it("passes at the default 80 percent threshold", () => {
    expect(scoreCpdQuiz(questions, { "1": "b", "2": "true", "3": 2, "4": "a" }, 80)).toMatchObject({
      correctCount: 4,
      score: 80,
      passed: true,
    });
  });

  it("fails below the threshold and supports a later passing retry", () => {
    const failed = scoreCpdQuiz(questions, { "1": "a" }, 80);
    expect(failed.passed).toBe(false);
    expect(bestCpdQuizAttemptPassed([{ score: failed.score, passed: failed.passed }], 80)).toBe(false);
    expect(bestCpdQuizAttemptPassed([{ score: failed.score, passed: failed.passed }, { score: 100, passed: true }], 80)).toBe(true);
  });
});
