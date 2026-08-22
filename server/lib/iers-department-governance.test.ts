import { describe, expect, it } from "vitest";
import {
  canUseDepartmentErcoAssignment,
  validateDepartmentErcoAssignment,
} from "./iers-department-governance";

describe("IERS department ERCo governance", () => {
  const valid = {
    institutionId: 3,
    departmentId: 9,
    coordinatorUserId: 101,
    backupUserId: 102,
    effectiveFrom: "2026-08-22",
    effectiveUntil: "2026-08-29",
  };

  it("accepts a valid dated assignment with a distinct backup", () => {
    expect(validateDepartmentErcoAssignment(valid)).toEqual({ valid: true });
  });

  it("rejects the ERCo being their own backup", () => {
    expect(validateDepartmentErcoAssignment({ ...valid, backupUserId: 101 })).toEqual({
      valid: false,
      reason: "The backup provider must be different from the ERCo.",
    });
  });

  it("rejects a reversed effective date range", () => {
    expect(validateDepartmentErcoAssignment({ ...valid, effectiveUntil: "2026-08-21" })).toEqual({
      valid: false,
      reason: "The effective-until date cannot be before the effective-from date.",
    });
  });

  it("only treats an accepted active assignment as usable on its effective dates", () => {
    expect(canUseDepartmentErcoAssignment({
      assignmentStatus: "active",
      acceptedAt: new Date(),
      effectiveFrom: "2026-08-22",
      effectiveUntil: "2026-08-29",
      asOfDate: "2026-08-22",
    })).toBe(true);
    expect(canUseDepartmentErcoAssignment({
      assignmentStatus: "pending_acceptance",
      acceptedAt: null,
      effectiveFrom: "2026-08-22",
      effectiveUntil: "2026-08-29",
      asOfDate: "2026-08-22",
    })).toBe(false);
    expect(canUseDepartmentErcoAssignment({
      assignmentStatus: "active",
      acceptedAt: new Date(),
      effectiveFrom: "2026-08-22",
      effectiveUntil: "2026-08-29",
      asOfDate: "2026-08-30",
    })).toBe(false);
  });
});
