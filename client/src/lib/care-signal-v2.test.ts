import { describe, expect, it } from "vitest";
import { initialCareSignalV2State, validateCareSignalV2Step } from "./care-signal-v2";

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
});
