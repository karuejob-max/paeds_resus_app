/**
 * Tests for the §5.5 submission-mode payload wiring added while building
 * the Fellowship pseudonymous token model (gap-analysis queue item #10).
 */
import { describe, it, expect } from "vitest";
import { initialCareSignalV3State, buildCareSignalV3SubmitPayload } from "./care-signal-v3";
import type { FacilitySelection } from "@/components/FacilityPicker";

const FACILITY: FacilitySelection = {
  facilityId: 1,
  facilityName: "Test Facility",
  county: "Nyeri",
  country: "Kenya",
};

function baseForm() {
  return {
    ...initialCareSignalV3State(),
    conditionCategory: "RESPIRATORY" as const,
    childAgeBand: "INFANT" as const,
    outcomeCategory: "SURVIVED_WELL" as const,
    roleAtTimeOfEvent: "PRIMARY_CLINICIAN" as const,
    facilityConfirmed: true,
    failureDomains: ["RECOGNITION" as const],
    rawNarrative: "A sufficiently long narrative for validation purposes.",
  };
}

describe("buildCareSignalV3SubmitPayload — submission mode (gap-analysis #10)", () => {
  it("named mode: isAnonymous is false, no fellowshipTokenId sent", () => {
    const payload = buildCareSignalV3SubmitPayload(
      { ...baseForm(), submissionMode: "named" },
      FACILITY
    );
    expect(payload.submissionMode).toBe("named");
    expect(payload.isAnonymous).toBe(false);
    expect(payload.fellowshipTokenId).toBeUndefined();
  });

  it("pseudonymous mode: isAnonymous is true (hides from facility views), fellowshipTokenId is forwarded", () => {
    const payload = buildCareSignalV3SubmitPayload(
      { ...baseForm(), submissionMode: "pseudonymous", fellowshipTokenId: "abc-123" },
      FACILITY
    );
    expect(payload.submissionMode).toBe("pseudonymous");
    expect(payload.isAnonymous).toBe(true);
    expect(payload.fellowshipTokenId).toBe("abc-123");
  });

  it("anonymous mode: isAnonymous is true, fellowshipTokenId is never sent even if stale state has one", () => {
    const payload = buildCareSignalV3SubmitPayload(
      { ...baseForm(), submissionMode: "anonymous", fellowshipTokenId: "stale-token-should-not-leak" },
      FACILITY
    );
    expect(payload.submissionMode).toBe("anonymous");
    expect(payload.isAnonymous).toBe(true);
    expect(payload.fellowshipTokenId).toBeUndefined();
  });
});
