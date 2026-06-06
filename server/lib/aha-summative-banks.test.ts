import { describe, expect, it } from "vitest";
import { getAhaDiagnosticBank } from "../data/aha-diagnostic-banks";
import {
  AHA_MIN_SUMMATIVE_SIZE,
  AHA_TARGET_SUMMATIVE_SIZE,
  getAhaSummativeBank,
} from "./aha-summative-banks";
import { normalizeQuestionStem, uniqueFormativeQuestions } from "../../shared/microcourse-exam-policy";
import type { AhaAnchorProgramType } from "./resolve-aha-course-anchor";

const PROGRAMS: AhaAnchorProgramType[] = ["bls", "acls", "pals", "nrp", "heartsaver"];

describe("AHA summative banks", () => {
  for (const program of PROGRAMS) {
    it(`${program} summative has ${AHA_TARGET_SUMMATIVE_SIZE} unique stems`, () => {
      const bank = getAhaSummativeBank(program);
      expect(bank.length).toBe(AHA_TARGET_SUMMATIVE_SIZE);
      expect(uniqueFormativeQuestions(bank.map((q) => ({ ...q, correct: 0, explanation: "" }))).length).toBe(
        AHA_TARGET_SUMMATIVE_SIZE
      );
    });

    it(`${program} diagnostic and summative stems are disjoint`, () => {
      const diagnostic = getAhaDiagnosticBank(program);
      const summative = getAhaSummativeBank(program);
      const diagStems = new Set(diagnostic.map((q) => normalizeQuestionStem(q.question)));
      const overlap = summative.filter((q) => diagStems.has(normalizeQuestionStem(q.question)));
      expect(overlap).toEqual([]);
    });

    it(`${program} summative meets minimum ${AHA_MIN_SUMMATIVE_SIZE}`, () => {
      expect(getAhaSummativeBank(program).length).toBeGreaterThanOrEqual(AHA_MIN_SUMMATIVE_SIZE);
    });
  }
});
