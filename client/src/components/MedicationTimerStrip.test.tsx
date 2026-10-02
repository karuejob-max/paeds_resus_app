/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { deriveTimerDisplay } from "./MedicationTimerStrip";

describe("persisted medication reassessment timer display", () => {
  it("shows time remaining from the stored deadline", () => {
    expect(deriveTimerDisplay(10_000, 5_001, 1_000)).toEqual({ state: "waiting", seconds: 5 });
  });

  it("distinguishes exactly due from overdue without suggesting another dose", () => {
    expect(deriveTimerDisplay(10_000, 10_000, 1_000)).toEqual({ state: "due", seconds: 0 });
    expect(deriveTimerDisplay(10_000, 13_001, 1_000)).toEqual({ state: "overdue", seconds: 3 });
  });

  it("requires a patient-time check after a clock change or backwards wall-clock jump", () => {
    expect(deriveTimerDisplay(10_000, 13_000, 1_000, true)).toEqual({ state: "clock_check", seconds: 0 });
    expect(deriveTimerDisplay(10_000, 900, 1_000)).toEqual({ state: "clock_check", seconds: 0 });
  });
});
