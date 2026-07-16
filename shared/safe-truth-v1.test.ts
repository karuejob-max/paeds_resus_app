/**
 * Tests for the Safe-Truth v1 submission schema.
 * Spec: docs/EVENT_MODELS_V1.md §2.3–2.7 (gap-analysis queue item #11, Phase A).
 */
import { describe, it, expect } from "vitest";
import { safeTruthSubmissionInputSchema } from "./safe-truth-v1";

function validSubmission(overrides: Record<string, unknown> = {}) {
  return {
    country: "Kenya",
    adminLevel1: "Nyeri",
    facilityNameRaw: "Consolata Hospital Mathari",
    childAgeBand: "Baby (1–12 months)",
    conditionCategory: "Breathing problem",
    outcomeCategory: "Child recovered and went home",
    symptomOnsetDaysAgo: "1–2 days ago",
    adviceReceivedBeforeFacility: ["No, I did not speak to anyone"],
    transportUsed: ["Private car or matatu"],
    transportDelayOccurred: false,
    travelTimeToFirstFacility: "Less than 30 minutes",
    costBarrierOccurred: false,
    facilitiesVisitedCount: "This was the first place we went",
    facilityVisits: [],
    rawNarrative: "My child had trouble breathing and we took him to hospital.",
    ...overrides,
  };
}

describe("safeTruthSubmissionInputSchema", () => {
  it("accepts a minimal valid submission", () => {
    const result = safeTruthSubmissionInputSchema.safeParse(validSubmission());
    expect(result.success).toBe(true);
  });

  it("accepts the locality (adminLevel2) field as optional", () => {
    const withLocality = safeTruthSubmissionInputSchema.safeParse(
      validSubmission({ adminLevel2: "Mathira" })
    );
    expect(withLocality.success).toBe(true);
    const withoutLocality = safeTruthSubmissionInputSchema.safeParse(validSubmission());
    expect(withoutLocality.success).toBe(true);
  });

  it("rejects an unlisted country", () => {
    const result = safeTruthSubmissionInputSchema.safeParse(validSubmission({ country: "Wakanda" }));
    expect(result.success).toBe(false);
  });

  it("rejects a rawNarrative that's empty", () => {
    const result = safeTruthSubmissionInputSchema.safeParse(validSubmission({ rawNarrative: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an empty adviceReceivedBeforeFacility array (must pick at least one)", () => {
    const result = safeTruthSubmissionInputSchema.safeParse(
      validSubmission({ adviceReceivedBeforeFacility: [] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-list value for a plain-language enum field", () => {
    const result = safeTruthSubmissionInputSchema.safeParse(
      validSubmission({ conditionCategory: "Something not on the list" })
    );
    expect(result.success).toBe(false);
  });

  it("accepts up to 10 facility visits and rejects an 11th", () => {
    const visit = {
      visitFacilityNameRaw: "Test Clinic",
      visitFacilityIsFinal: false,
      wasSeenPromptly: "Yes, within minutes",
    };
    const ok = safeTruthSubmissionInputSchema.safeParse(
      validSubmission({ facilityVisits: Array(10).fill(visit) })
    );
    expect(ok.success).toBe(true);
    const tooMany = safeTruthSubmissionInputSchema.safeParse(
      validSubmission({ facilityVisits: Array(11).fill(visit) })
    );
    expect(tooMany.success).toBe(false);
  });

  it("accepts a non-empty honeypot field at the SCHEMA layer (by design — see server/lib/safe-truth-rate-limit.ts)", () => {
    // The schema deliberately does NOT reject this — a schema-level
    // rejection would throw a validation error back to a bot, revealing
    // the trap. isHoneypotTripped() at the router layer is what actually
    // silently short-circuits a tripped submission.
    const result = safeTruthSubmissionInputSchema.safeParse(
      validSubmission({ website: "http://spam.example" })
    );
    expect(result.success).toBe(true);
  });
});
