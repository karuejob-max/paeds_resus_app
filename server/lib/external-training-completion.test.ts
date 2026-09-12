import { describe, expect, it } from "vitest";
import {
  canRecordExternalCompletion,
  validateExternalCompletionInput,
} from "./external-training-completion";

describe("external training completion safeguards", () => {
  it("allows platform administrators and approved instructors only", () => {
    expect(canRecordExternalCompletion({ role: "admin", instructorApprovedAt: null })).toBe(true);
    expect(canRecordExternalCompletion({ role: "user", instructorApprovedAt: new Date() })).toBe(true);
    expect(canRecordExternalCompletion({ role: "user", instructorApprovedAt: null })).toBe(false);
  });

  it("requires Phase 2 before Phase 3", () => {
    expect(validateExternalCompletionInput({ phase2Completed: false, phase3Completed: true })).toBe(
      "Phase 2 must be recorded before Phase 3.",
    );
    expect(validateExternalCompletionInput({ phase2Completed: true, phase3Completed: true })).toBeNull();
    expect(validateExternalCompletionInput({ phase2Completed: true, phase3Completed: false })).toBeNull();
  });
});
