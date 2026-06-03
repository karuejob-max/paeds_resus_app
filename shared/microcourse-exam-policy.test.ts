import { describe, expect, it } from "vitest";
import {
  MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS,
  canAttemptSummative,
  assignFormativeByModuleChunks,
  distributeFormativeQuestions,
  expandQuestionBank,
  examKindFromQuizTitle,
  MIN_FORMATIVE_QUESTIONS_PER_MODULE,
  padModuleFormativeQuestions,
  resolveModuleFormativeQuestions,
  materializeModuleNativeFormatives,
  shuffleQuestionIndices,
  summativePassed,
  uniqueFormativeQuestions,
} from "./microcourse-exam-policy";

describe("microcourse-exam-policy", () => {
  it("classifies quiz titles", () => {
    expect(examKindFromQuizTitle("Diagnostic baseline")).toBe("diagnostic");
    expect(examKindFromQuizTitle("Summative knowledge check")).toBe("summative");
    expect(examKindFromQuizTitle("PALS Summative Exam")).toBe("summative");
    expect(examKindFromQuizTitle("Module 2 Knowledge Check")).toBe("formative");
  });

  it("shuffles deterministically with seed", () => {
    const a = shuffleQuestionIndices(5, 42);
    const b = shuffleQuestionIndices(5, 42);
    expect(a).toEqual(b);
    expect(a.sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("enforces summative pass at 80%", () => {
    expect(summativePassed(79)).toBe(false);
    expect(summativePassed(80)).toBe(true);
  });

  it("blocks summative retry within 24h", () => {
    const now = new Date("2026-05-29T12:00:00Z");
    const last = new Date(now.getTime() - MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS + 60_000);
    const r = canAttemptSummative({ attempts: 1, lastAttemptAt: last, now });
    expect(r.allowed).toBe(false);
    expect(r.retryAvailableAt).toBeDefined();
  });

  it("allows summative after cooldown", () => {
    const now = new Date("2026-05-29T12:00:00Z");
    const last = new Date(now.getTime() - MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS - 1);
    expect(canAttemptSummative({ attempts: 1, lastAttemptAt: last, now }).allowed).toBe(true);
  });

  it("caps summative attempts at 3", () => {
    const r = canAttemptSummative({ attempts: 3, lastAttemptAt: null });
    expect(r.allowed).toBe(false);
    expect(r.blockKind).toBe("max_attempts");
  });

  it("distributes at least one formative question per module", () => {
    const qs = [
      { question: "Q1", options: ["a"], correct: 0, explanation: "e1" },
      { question: "Q2", options: ["a"], correct: 0, explanation: "e2" },
    ];
    const perMod = distributeFormativeQuestions(qs, 3);
    expect(perMod).toHaveLength(3);
    expect(perMod.every((m) => m.length >= 1)).toBe(true);
  });

  it("expands question bank to minimum size", () => {
    const qs = [{ q: 1 }, { q: 2 }];
    const expanded = expandQuestionBank(qs, 5);
    expect(expanded).toHaveLength(5);
  });

  it("pads module-native formatives to minimum per module", () => {
    const qs = [{ question: "Q1", options: ["a"], correct: 0, explanation: "e1" }];
    const padded = padModuleFormativeQuestions(qs);
    expect(padded).toHaveLength(MIN_FORMATIVE_QUESTIONS_PER_MODULE);
  });

  it("assigns contiguous chunks with min 3 per module", () => {
    const qs = Array.from({ length: 10 }, (_, i) => ({
      question: `Q${i}`,
      options: ["a"],
      correct: 0,
      explanation: "e",
    }));
    const perMod = assignFormativeByModuleChunks(qs, 3);
    expect(perMod.every((m) => m.length >= MIN_FORMATIVE_QUESTIONS_PER_MODULE)).toBe(true);
  });

  it("materializes unique native formatives per module from summative bank", () => {
    const course = materializeModuleNativeFormatives({
      modules: [{ title: "M1" }, { title: "M2" }, { title: "M3" }],
      quiz: {
        questions: Array.from({ length: 10 }, (_, i) => ({
          question: `Stem ${i}`,
          options: ["a", "b"],
          correct: 0,
          explanation: "e",
        })),
      },
    });
    expect(course.modules.every((m) => (m.questions?.length ?? 0) >= 3)).toBe(true);
    const allStems = course.modules.flatMap((m) => m.questions!.map((q) => q.question));
    expect(uniqueFormativeQuestions(allStems.map((question) => ({ question, options: [], correct: 0, explanation: "" }))).length).toBeGreaterThanOrEqual(9);
  });

  it("prefers module-native questions over summative bank", () => {
    const modules = [
      { questions: [{ question: "M1", options: ["a"], correct: 0, explanation: "e" }] },
      { questions: [] },
    ];
    const bank = [{ question: "B1", options: ["a"], correct: 0, explanation: "e" }];
    const resolved = resolveModuleFormativeQuestions(modules, bank);
    expect(resolved[0]![0]!.question).toBe("M1");
    expect(resolved[0]!.length).toBe(MIN_FORMATIVE_QUESTIONS_PER_MODULE);
  });
});
