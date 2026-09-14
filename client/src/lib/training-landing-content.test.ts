import { describe, expect, it } from "vitest";
import {
  TRAINING_LANDING_CONFIGS,
  ahaCertificationFaqAnswer,
  getTrainingPrice,
} from "./training-landing-content";

describe("ahaCertificationFaqAnswer", () => {
  it("starts with Yes and names AHA certificate issuance", () => {
    const answer = ahaCertificationFaqAnswer("PALS");
    expect(answer.startsWith("Yes.")).toBe(true);
    expect(answer).toContain("American Heart Association");
    expect(answer).toMatch(/AHA\)-aligned/);
  });
});

describe("getTrainingPrice", () => {
  it("returns 10000 KES for NRP landing", () => {
    expect(getTrainingPrice("nrp")).toBe(10000);
  });
});

describe("local-intent training content", () => {
  it("covers Kenya, Nairobi, practical-session expectations, and approved BLS pricing", () => {
    const config = TRAINING_LANDING_CONFIGS.bls;
    const text = [config.title, config.metaDescription, config.subtitle, ...config.sections.flatMap((section) => section.paragraphs), ...config.faqs.flatMap((faq) => [faq.question, faq.answer])].join(" ");
    expect(text).toContain("BLS training in Kenya");
    expect(text).toContain("Nairobi");
    expect(text).toContain("KES 10,000 per person; KES 7,500 per person for cohorts of 7 or more");
    expect(text).toContain("confirmed during booking");
  });

  it("covers Kenya, Nairobi, practical megacode expectations, and approved ACLS pricing", () => {
    const config = TRAINING_LANDING_CONFIGS.acls;
    const text = [config.title, config.metaDescription, config.subtitle, ...config.sections.flatMap((section) => section.paragraphs), ...config.faqs.flatMap((faq) => [faq.question, faq.answer])].join(" ");
    expect(text).toContain("ACLS training in Kenya");
    expect(text).toContain("Nairobi");
    expect(text).toContain("KES 20,000 per person; KES 17,500 per person for cohorts of 7 or more");
    expect(text).toContain("megacode");
    expect(text).toContain("confirmed during booking");
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
