import { describe, expect, it } from "vitest";
import { deidentifyRawNarrative } from "./care-signal-deidentify";

describe("deidentifyRawNarrative", () => {
  it("redacts a known facility name", () => {
    const { text, redactionCounts } = deidentifyRawNarrative(
      "The child was brought to Consolata Hospital Mathari at night.",
      ["Consolata Hospital Mathari"]
    );
    expect(text).toContain("[FACILITY]");
    expect(text).not.toContain("Consolata Hospital Mathari");
    expect(redactionCounts.facilityNames).toBe(1);
  });

  it("does not redact facility names shorter than 4 characters (false-positive guard)", () => {
    const { text } = deidentifyRawNarrative("The ED team responded quickly.", ["ED"]);
    expect(text).toContain("ED team");
  });

  it("redacts ISO and slash dates", () => {
    const { text, redactionCounts } = deidentifyRawNarrative(
      "Event occurred on 2026-07-12 and was reviewed on 15/07/2026.",
      []
    );
    expect(text).toContain("[DATE]");
    expect(text).not.toMatch(/2026-07-12|15\/07\/2026/);
    expect(redactionCounts.dates).toBe(2);
  });

  it("redacts month-name dates", () => {
    const { text } = deidentifyRawNarrative("It happened on 12 July 2026 in the ward.", []);
    expect(text).toContain("[DATE]");
    expect(text).not.toContain("July");
  });

  it("redacts phone numbers", () => {
    const { text, redactionCounts } = deidentifyRawNarrative(
      "The parent could be reached at 0712345678 for follow-up.",
      []
    );
    expect(text).toContain("[PHONE]");
    expect(redactionCounts.phones).toBe(1);
  });

  it("redacts email addresses", () => {
    const { text } = deidentifyRawNarrative("Follow-up sent to guardian@example.com.", []);
    expect(text).toContain("[EMAIL]");
  });

  it("redacts explicitly labeled ID numbers but not clinical numbers", () => {
    const { text } = deidentifyRawNarrative(
      "Guardian ID Number: 12345678. Weight was 12345 grams (implausible but should not be redacted).",
      []
    );
    expect(text).toContain("[ID]");
    // The clinical number should survive untouched since it isn't labeled as an ID.
    expect(text).toContain("12345 grams");
  });

  it("leaves ordinary clinical narrative untouched", () => {
    const narrative =
      "Child presented with respiratory distress, RR 60, SpO2 88% on room air. Started on oxygen, improved.";
    const { text, redactionCounts } = deidentifyRawNarrative(narrative, ["Some Other Hospital"]);
    expect(text).toBe(narrative);
    expect(Object.values(redactionCounts).every((c) => c === 0)).toBe(true);
  });

  it("does not partially mask a shorter facility name contained within a longer one", () => {
    const { text } = deidentifyRawNarrative(
      "Transferred from Nyeri County Referral Hospital to Nyeri County Hospital.",
      ["Nyeri County Hospital", "Nyeri County Referral Hospital"]
    );
    // Both full names should be fully redacted, not left with dangling fragments.
    expect(text).not.toContain("Referral Hospital");
    expect(text).not.toContain("Nyeri County Hospital");
  });
});
