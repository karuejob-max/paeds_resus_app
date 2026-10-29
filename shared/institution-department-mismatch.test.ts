import { describe, expect, it } from "vitest";
import { classifyDepartmentMismatch } from "./institution-department-mismatch";

describe("classifyDepartmentMismatch", () => {
  it("fails closed when the staff row is missing", () => {
    expect(classifyDepartmentMismatch({ staffExists: false, targetDepartmentId: 2, targetDepartmentActive: true })).toBe("missing_staff");
  });

  it("closes a stale alert when the current department already matches", () => {
    expect(classifyDepartmentMismatch({ staffExists: true, currentDepartmentId: 2, targetDepartmentId: 2, targetDepartmentActive: true })).toBe("already_corrected");
  });

  it("does not offer reallocation to an inactive target", () => {
    expect(classifyDepartmentMismatch({ staffExists: true, currentDepartmentId: 3, targetDepartmentId: 2, targetDepartmentActive: false })).toBe("target_inactive");
  });

  it("keeps a different active target actionable", () => {
    expect(classifyDepartmentMismatch({ staffExists: true, currentDepartmentId: 3, targetDepartmentId: 2, targetDepartmentActive: true })).toBe("actionable");
  });
});
