import { describe, expect, it } from "vitest";
import {
  classifyQuizAnswerEncoding,
  encodeQuizCorrectAnswerForStorage,
  isStoredQuizCorrectAnswerValid,
  normalizeQuizCorrectAnswer,
  parseStoredQuizCorrectAnswer,
} from "./quiz-answer-contract";

/** DKA I — Module 2 knowledge check includes fluid bolus (batch seed fixture). */
const DKA_FLUID_BOLUS = {
  question: "Initial fluid bolus for DKA in a 20 kg child:",
  options: ["200 mL", "400 mL", "800 mL", "1200 mL"] as string[],
  correctIndex: 0,
  expectedValue: "200 mL",
};

describe("quiz-answer-contract", () => {
  it("maps DKA fluid bolus seed index 0 to value 200 mL", () => {
    expect(
      normalizeQuizCorrectAnswer(DKA_FLUID_BOLUS.correctIndex, DKA_FLUID_BOLUS.options)
    ).toBe("200 mL");
    expect(
      encodeQuizCorrectAnswerForStorage(DKA_FLUID_BOLUS.correctIndex, DKA_FLUID_BOLUS.options)
    ).toBe(JSON.stringify("200 mL"));
  });

  it("parses JSON-encoded storage the way learning.submitQuiz expects", () => {
    const stored = encodeQuizCorrectAnswerForStorage(
      DKA_FLUID_BOLUS.correctIndex,
      DKA_FLUID_BOLUS.options
    );
    expect(parseStoredQuizCorrectAnswer(stored)).toBe("200 mL");
    expect(
      parseStoredQuizCorrectAnswer(stored) === DKA_FLUID_BOLUS.expectedValue
    ).toBe(true);
  });

  it("flags index-only storage as invalid for grading", () => {
    expect(isStoredQuizCorrectAnswerValid('"0"', DKA_FLUID_BOLUS.options)).toBe(false);
    expect(isStoredQuizCorrectAnswerValid("0", DKA_FLUID_BOLUS.options)).toBe(false);
    expect(classifyQuizAnswerEncoding("0", DKA_FLUID_BOLUS.options)).toBe("index");
    expect(classifyQuizAnswerEncoding('"200 mL"', DKA_FLUID_BOLUS.options)).toBe("value");
  });

  it("marks 800 mL storage as valid text but not the keyed correct answer", () => {
    expect(isStoredQuizCorrectAnswerValid('"800 mL"', DKA_FLUID_BOLUS.options)).toBe(true);
    expect(parseStoredQuizCorrectAnswer('"800 mL"')).not.toBe(DKA_FLUID_BOLUS.expectedValue);
  });
});
