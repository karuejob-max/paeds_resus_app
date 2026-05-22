import { describe, expect, it } from "vitest";
import {
  buildCareSignalV2SubmitPayload,
  initialCareSignalV2State,
  validateCareSignalV2Step,
} from "./care-signal-v2";

describe("validateCareSignalV2Step", () => {
  it("step 0 only requires event date (not report type)", () => {
    const form = { ...initialCareSignalV2State(), reportType: "", careLocation: "" };
    expect(validateCareSignalV2Step(0, form)).toBeNull();
  });

  it("step 0 fails when event date is missing", () => {
    const form = { ...initialCareSignalV2State(), eventDate: "" };
    expect(validateCareSignalV2Step(0, form)).toBe("Enter when the event occurred.");
  });

  it("step 1 requires report type and care location", () => {
    const form = { ...initialCareSignalV2State(), reportType: "", careLocation: "" };
    expect(validateCareSignalV2Step(1, form)).toBe("Select what type of report this is.");
  });

  it("step 1 passes when report type and care location are set", () => {
    const form = {
      ...initialCareSignalV2State(),
      reportType: "near_miss" as const,
      careLocation: "emergency_department" as const,
    };
    expect(validateCareSignalV2Step(1, form)).toBeNull();
  });

  it("step 2 requires exact child age for resuscitation events", () => {
    const form = {
      ...initialCareSignalV2State(),
      reportType: "resuscitation_event" as const,
      careLocation: "emergency_department" as const,
      primaryEmergencyType: "cardiac_arrest" as const,
      presentationSummary: "Brief summary of arrest event.",
      childYears: "",
    };
    expect(validateCareSignalV2Step(2, form)).toMatch(/years/);
  });

  it("buildCareSignalV2SubmitPayload stores exact age in gapDetails", () => {
    const form = {
      ...initialCareSignalV2State(),
      reportType: "resuscitation_event" as const,
      careLocation: "emergency_department" as const,
      primaryEmergencyType: "cardiac_arrest" as const,
      presentationSummary: "Brief summary of arrest event.",
      ageBand: "child" as const,
      childYears: "7",
      childExtraMonths: "2",
      outcome: "survived_neurologically_intact",
      neurologicalStatus: "intact",
      preventableAssessment: "unknown" as const,
      systemGaps: ["Training Gap"],
      proposedSystemFix: "Monthly paediatric emergency skills drill for ward staff.",
    };
    const payload = buildCareSignalV2SubmitPayload(form, {
      facilityId: 1,
      facilityName: "Test Hospital",
      county: "Nairobi",
      country: "Kenya",
    });
    expect(payload.childAge).toBe(86);
    expect((payload.gapDetails as { patientAge?: { childYears?: number } }).patientAge?.childYears).toBe(7);
  });
});
