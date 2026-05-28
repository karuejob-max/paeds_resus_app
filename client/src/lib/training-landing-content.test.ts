import { describe, expect, it } from "vitest";
import { TRAINING_LANDING_CONFIGS, ahaCertificationFaqAnswer } from "./training-landing-content";

describe("ahaCertificationFaqAnswer", () => {
  it("starts with Yes and names AHA certificate issuance", () => {
    const answer = ahaCertificationFaqAnswer("PALS");
    expect(answer.startsWith("Yes.")).toBe(true);
    expect(answer).toContain("American Heart Association");
    expect(answer).toMatch(/AHA\)-aligned/);
  });
});

describe("TRAINING_LANDING_CONFIGS AHA certification FAQs", () => {
  const slugs = ["pals", "acls", "bls"] as const;

  for (const slug of slugs) {
    it(`${slug} has an AHA-certified FAQ answer starting with Yes`, () => {
      const config = TRAINING_LANDING_CONFIGS[slug];
      const faq = config.faqs.find((f) => /AHA-certified through Paeds Resus/i.test(f.question));
      expect(faq).toBeDefined();
      expect(faq?.answer.startsWith("Yes.")).toBe(true);
    });
  }
});
