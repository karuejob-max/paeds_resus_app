import { describe, expect, it } from "vitest";
import {
  MICROCOURSE_SUMMATIVE_RETRY_COOLDOWN_MS,
  canAttemptSummative,
  examKindFromQuizTitle,
  shuffleQuestionIndices,
  summativePassed,
} from "./microcourse-exam-policy";

describe("microcourse-exam-policy", () => {
  it("classifies quiz titles", () => {
    expect(examKindFromQuizTitle("Diagnostic baseline")).toBe("diagnostic");
    expect(examKindFromQuizTitle("Summative knowledge check")).toBe("summative");
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
    expect(canAttemptSummative({ attempts: 3, lastAttemptAt: null }).allowed).toBe(false);
  });
});
