import { describe, expect, it } from "vitest";
import { isProviderShiftReadinessEligible } from "./iers-provider-readiness";

describe("isProviderShiftReadinessEligible", () => {
  it("requires an active shift and explicit provider acceptance", () => {
    expect(isProviderShiftReadinessEligible({
      status: "active",
      assignmentStatus: "active",
      acceptedAt: new Date(),
    })).toBe(true);
  });

  it.each([
    { status: "active", assignmentStatus: "pending_acceptance", acceptedAt: null },
    { status: "active", assignmentStatus: "declined", acceptedAt: null },
    { status: "completed", assignmentStatus: "active", acceptedAt: new Date() },
    { status: "absent", assignmentStatus: "active", acceptedAt: new Date() },
    { status: "active", assignmentStatus: "active", acceptedAt: null },
  ])("rejects unsafe assignment state %#", (assignment) => {
    expect(isProviderShiftReadinessEligible(assignment)).toBe(false);
  });
});
