import { describe, expect, it } from "vitest";
import { PALS_2025_SUMMATIVE_QUESTIONS } from "./pals-2025-summative-bank";

describe("PALS 2025 summative bank", () => {
  it("has at least 15 unique questions", () => {
    expect(PALS_2025_SUMMATIVE_QUESTIONS.length).toBeGreaterThanOrEqual(15);
    const stems = PALS_2025_SUMMATIVE_QUESTIONS.map((q) => q.question.trim());
    expect(new Set(stems).size).toBe(stems.length);
  });

  it("PAT neurological question does not leak the answer in the stem", () => {
    const pat = PALS_2025_SUMMATIVE_QUESTIONS.find((q) =>
      q.question.includes("Pediatric Assessment Triangle")
    );
    expect(pat).toBeDefined();
    expect(pat!.question).not.toMatch(/\(Appearance\)/i);
    expect(pat!.options[pat!.correctAnswer as number]).toBe("Appearance");
  });

  it("includes hypoglycemia reversible-cause item", () => {
    const hypo = PALS_2025_SUMMATIVE_QUESTIONS.find((q) =>
      q.options.some((o) => o.toLowerCase().includes("hypoglycemia"))
    );
    expect(hypo).toBeDefined();
    expect(hypo!.options[hypo!.correctAnswer as number]).toMatch(/hypoglycemia/i);
  });
});
