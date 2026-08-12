import { describe, expect, it } from "vitest";
import {
  classifyQuizAnswerEncoding,
  encodeQuizCorrectAnswerForStorage,
  gradeQuizAnswerAgainstStored,
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

  it("gradeQuizAnswerAgainstStored accepts index-encoded legacy rows", () => {
    const opts = ["Appearance", "Work of Breathing", "Circulation to Skin"];
    expect(gradeQuizAnswerAgainstStored("Appearance", "0", opts)).toBe(true);
    expect(gradeQuizAnswerAgainstStored("Work of Breathing", "0", opts)).toBe(false);
    expect(gradeQuizAnswerAgainstStored("Appearance", JSON.stringify("Appearance"), opts)).toBe(true);
  });

  it("round-trips a correct answer that itself contains embedded quote characters (regression: Instructor course Module 4, 2026-08-11)", () => {
    // The seeders in ensure-bls-acls-catalog.ts and ensure-instructor-course-catalog.ts
    // used to store correctAnswer raw whenever it was already a string, only calling
    // JSON.stringify() for non-strings -- but correctAnswer is ALWAYS a string per its
    // type, so that branch never fired. Most answers happened to still grade correctly
    // by accident, because parseStoredQuizCorrectAnswer falls back to the raw trimmed
    // string when JSON.parse() throws. This one didn't fall back: an answer that is
    // itself a quoted phrase (an example line of dialogue) parses as *valid* JSON on
    // its own, so JSON.parse() silently stripped the surrounding quote characters that
    // are still part of the visible option text the learner actually clicks -- the two
    // could never match, so the correct answer was permanently graded as wrong.
    const answerWithEmbeddedQuotes =
      '"I noticed the epinephrine was delayed by about two minutes — what was happening for you at that point?"';
    const options = [
      '"You\'re not good under pressure."',
      answerWithEmbeddedQuotes,
      '"That was a bad round, let\'s move on."',
    ];

    // The buggy encoding (raw string, not JSON-stringified) fails to round-trip.
    const buggyStored = answerWithEmbeddedQuotes; // what the old seeder wrote
    expect(parseStoredQuizCorrectAnswer(buggyStored)).not.toBe(answerWithEmbeddedQuotes);

    // The fixed encoding (always JSON.stringify, matching Heartsaver's seeders and the
    // documented contract) round-trips correctly and grades the right option as correct.
    const fixedStored = JSON.stringify(answerWithEmbeddedQuotes);
    expect(parseStoredQuizCorrectAnswer(fixedStored)).toBe(answerWithEmbeddedQuotes);
    expect(gradeQuizAnswerAgainstStored(answerWithEmbeddedQuotes, fixedStored, options)).toBe(true);
  });
});
