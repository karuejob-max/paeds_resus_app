import { describe, expect, it } from "vitest";
import {
  FELLOWSHIP_ABOUT_SECTIONS,
  FELLOWSHIP_PRACTITIONER_QA,
  FELLOWSHIP_MISSION_TAGLINE,
} from "./fellowship-learner-content";

describe("fellowship-learner-content", () => {
  it("includes mission tagline", () => {
    expect(FELLOWSHIP_MISSION_TAGLINE).toContain("Preventable Childhood Deaths");
  });

  it("covers required about sections", () => {
    const ids = FELLOWSHIP_ABOUT_SECTIONS.map((s) => s.id);
    expect(ids).toContain("what");
    expect(ids).toContain("not");
    expect(ids).toContain("pillars");
    expect(ids).toContain("fellow-title");
    expect(ids).toContain("safety");
  });

  it("includes CEO Q&A questions", () => {
    const questions = FELLOWSHIP_PRACTITIONER_QA.map((q) => q.question);
    expect(questions.some((q) => q.includes("summative exams"))).toBe(true);
    expect(questions.some((q) => q.includes("Care Signal"))).toBe(true);
    expect(questions.some((q) => q.includes("hospital lacks"))).toBe(true);
  });
});
