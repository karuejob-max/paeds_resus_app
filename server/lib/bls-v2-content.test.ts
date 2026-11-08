import { describe, expect, it } from "vitest";
import { getAhaDiagnosticBank } from "../data/aha-diagnostic-banks";
import { normalizeQuestionStem } from "../../shared/microcourse-exam-policy";
import { AHA_TARGET_SUMMATIVE_SIZE, getAhaSummativeBankForCourse } from "./aha-summative-banks";
import { BLS_MODULES_V2, BLS_V2_COURSE_TITLE } from "./bls-modules-v2-data";
import { BLS_SUMMATIVE_QUESTIONS_V2 } from "./bls-summative-bank-v2";

describe("BLS v2 curriculum structure", () => {
  it("has 8 ordered modules with sections and a knowledge check each", () => {
    expect(BLS_MODULES_V2.map((m) => m.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const m of BLS_MODULES_V2) {
      expect(m.sections.length, m.title).toBeGreaterThanOrEqual(3);
      expect(m.sections.map((s) => s.order)).toEqual(m.sections.map((_, i) => i + 1));
      for (const s of m.sections) expect(s.content.length, s.title).toBeGreaterThan(200);
      expect(m.quiz.questions.length, m.title).toBeGreaterThanOrEqual(3);
      expect(m.quiz.passingScore).toBeLessThanOrEqual(100);
    }
  });

  it("module knowledge checks have exactly one correct, listed answer and no duplicate options", () => {
    for (const m of BLS_MODULES_V2) {
      for (const q of m.quiz.questions) {
        expect(q.options, q.question).toContain(q.correctAnswer);
        expect(new Set(q.options).size, q.question).toBe(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(10);
      }
    }
  });

  it("covers every topic the audit found missing", () => {
    const text = BLS_MODULES_V2.flatMap((m) => m.sections.map((s) => `${s.title} ${s.content}`)).join(" ").toLowerCase();
    for (const topic of [
      "naloxone", "respiratory arrest", "drowning", "pregnan", "left uterine displacement", "pacemaker",
      "medication patch", "hairy", "wet chest", "recovery position", "two-finger", "midaxillary",
      "closed-loop", "advanced airway", "mild", "chest compression fraction", "debrief",
    ]) {
      expect(text, topic).toContain(topic);
    }
  });

  it("uses a distinct course title so it can never be confused with the frozen original", () => {
    expect(BLS_V2_COURSE_TITLE).not.toBe("BLS Provider Course — AHA 2025 Guidelines");
  });
});

describe("BLS v2 summative exam", () => {
  const bank = BLS_SUMMATIVE_QUESTIONS_V2;

  it("has the standard exam size with unique stems and valid answers", () => {
    expect(bank).toHaveLength(AHA_TARGET_SUMMATIVE_SIZE);
    expect(new Set(bank.map((q) => normalizeQuestionStem(q.question))).size).toBe(bank.length);
    for (const q of bank) {
      expect(typeof q.correctAnswer).toBe("number");
      expect(q.correctAnswer as number).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswer as number).toBeLessThan(q.options.length);
      expect(new Set(q.options).size, q.question).toBe(q.options.length);
    }
  });

  it("every exam item is traced to a section that actually teaches it", () => {
    for (const q of bank) {
      const mod = BLS_MODULES_V2.find((m) => m.order === q.source.module);
      expect(mod, q.question).toBeDefined();
      expect(mod!.sections.map((s) => s.title), q.question).toContain(q.source.section);
    }
  });

  it("samples every module at least twice", () => {
    for (const m of BLS_MODULES_V2) {
      expect(bank.filter((q) => q.source.module === m.order).length, m.title).toBeGreaterThanOrEqual(2);
    }
  });

  it("is disjoint from the diagnostic baseline and from module knowledge checks", () => {
    const examStems = new Set(bank.map((q) => normalizeQuestionStem(q.question)));
    const diag = getAhaDiagnosticBank("bls").map((q) => normalizeQuestionStem(q.question));
    expect(diag.filter((s) => examStems.has(s))).toEqual([]);
    const formative = BLS_MODULES_V2.flatMap((m) => m.quiz.questions.map((q) => normalizeQuestionStem(q.question)));
    expect(formative.filter((s) => examStems.has(s))).toEqual([]);
  });

  it("is served only for v2 course rows; the original course keeps its original exam", () => {
    expect(getAhaSummativeBankForCourse("bls", { title: BLS_V2_COURSE_TITLE })).toBe(bank);
    const original = getAhaSummativeBankForCourse("bls", { title: "BLS Provider Course — AHA 2025 Guidelines" });
    expect(original).not.toBe(bank);
    expect(original).toHaveLength(AHA_TARGET_SUMMATIVE_SIZE);
  });
});
