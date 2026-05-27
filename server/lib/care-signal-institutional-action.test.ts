import { describe, expect, it } from "vitest";
import { summarizeCareSignalGaps } from "./care-signal-institutional-action";

describe("summarizeCareSignalGaps", () => {
  it("returns generic message when no gaps", () => {
    expect(summarizeCareSignalGaps([], "septic_shock")).toBe(
      "Care Signal (septic_shock) — review for QI follow-up"
    );
  });

  it("joins up to four gaps", () => {
    expect(summarizeCareSignalGaps(["fluid delay", "no antibiotics"], "shock_sepsis")).toBe(
      "fluid delay; no antibiotics"
    );
  });

  it("truncates long gap lists", () => {
    const gaps = ["a", "b", "c", "d", "e", "f"];
    expect(summarizeCareSignalGaps(gaps, "cardiac_arrest")).toBe("a; b; c; d; +2 more");
  });
});
