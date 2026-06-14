import { describe, expect, it } from "vitest";
import { examKindFromQuizTitle } from "../../shared/microcourse-exam-policy";

/** Mirrors getModuleContent mapQuizQuestions stripping for learner payloads. */
function stripQuizQuestionForLearner(
  quizTitle: string,
  q: Record<string, unknown>
): Record<string, unknown> {
  const kind = examKindFromQuizTitle(quizTitle);
  const base = { ...q };
  if (kind === "summative") {
    const {
      correctAnswer: _omitAnswer,
      explanation: _omitExplanation,
      ...withoutAnswer
    } = base;
    return withoutAnswer;
  }
  const { explanation: _omitExplanation, ...withoutRationale } = base;
  return withoutRationale;
}

describe("microcourse rationale gating (learner payloads)", () => {
  it("strips explanation from formative and diagnostic before submit", () => {
    for (const title of ["Knowledge check: Module 1", "Diagnostic baseline"]) {
      const stripped = stripQuizQuestionForLearner(title, {
        id: 1,
        question: "Q?",
        options: ["A", "B"],
        correctAnswer: "A",
        explanation: "Because A.",
      });
      expect(stripped).not.toHaveProperty("explanation");
      expect(stripped).toHaveProperty("correctAnswer");
    }
  });

  it("strips explanation and correctAnswer from summative before submit", () => {
    const stripped = stripQuizQuestionForLearner("Summative knowledge check", {
      id: 2,
      question: "Q?",
      options: ["A", "B"],
      correctAnswer: "A",
      explanation: "Because A.",
    });
    expect(stripped).not.toHaveProperty("explanation");
    expect(stripped).not.toHaveProperty("correctAnswer");
  });
});
