/**
 * Tests for facility name fuzzy-matching (gap-analysis queue item #11 Phase C).
 */
import { describe, it, expect } from "vitest";
import { normalizeFacilityName, diceCoefficient, bestFacilityMatch } from "./facility-name-similarity";

describe("normalizeFacilityName", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeFacilityName("Consolata Hospital, Mathari!")).toBe("consolata hospital mathari");
  });
});

describe("diceCoefficient", () => {
  it("returns 1 for identical strings", () => {
    expect(diceCoefficient("Consolata Hospital", "Consolata Hospital")).toBe(1);
  });

  it("returns 1 for strings that differ only in case/punctuation", () => {
    expect(diceCoefficient("Consolata Hospital", "consolata hospital!")).toBe(1);
  });

  it("scores word-order differences highly", () => {
    const score = diceCoefficient("Mathari Consolata Hospital", "Consolata Hospital Mathari");
    expect(score).toBeGreaterThan(0.8);
  });

  it("scores unrelated names low", () => {
    const score = diceCoefficient("Consolata Hospital Mathari", "Kenyatta National Hospital");
    expect(score).toBeLessThan(0.5);
  });

  it("handles short/empty strings without throwing", () => {
    expect(diceCoefficient("", "")).toBe(1);
    expect(diceCoefficient("a", "ab")).toBe(0);
  });
});

describe("bestFacilityMatch", () => {
  const candidates = [
    { facilityId: "f1", internalName: "Consolata Hospital Mathari" },
    { facilityId: "f2", internalName: "Nyeri County Referral Hospital" },
    { facilityId: "f3", internalName: "Kenyatta National Hospital" },
  ];

  it("finds the correct candidate for a close variant", () => {
    const result = bestFacilityMatch("consolata hospital, mathari", candidates);
    expect(result?.facilityId).toBe("f1");
  });

  it("returns null when nothing clears the confidence threshold", () => {
    const result = bestFacilityMatch("Some Random Clinic Nobody Has Heard Of", candidates);
    expect(result).toBeNull();
  });

  it("returns null for an empty candidate list", () => {
    expect(bestFacilityMatch("Consolata Hospital", [])).toBeNull();
  });
});
