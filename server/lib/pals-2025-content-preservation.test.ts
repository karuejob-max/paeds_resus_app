import { describe, expect, it } from "vitest";
import {
  PALS_2025_SUMMATIVE_QUESTIONS,
  PALS_MODULE6_PEA_SECTION2_HTML,
} from "./pals-2025-summative-bank";

/** Guards PR #158/#160 PALS content — diagnostic work must not remove these. */
describe("PALS 2025 content preservation", () => {
  it("summative bank includes hypoglycemia in H's and reversible-cause items", () => {
    expect(PALS_MODULE6_PEA_SECTION2_HTML).toContain("Hypoglycemia");
    const hypoglycemiaQ = PALS_2025_SUMMATIVE_QUESTIONS.find((q) =>
      q.options.some((o) => o.includes("Hypoglycemia"))
    );
    expect(hypoglycemiaQ).toBeDefined();
  });

  it("summative bank remains at least 15 questions for shuffle", () => {
    expect(PALS_2025_SUMMATIVE_QUESTIONS.length).toBeGreaterThanOrEqual(15);
  });
});
