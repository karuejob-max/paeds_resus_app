import { describe, expect, it } from "vitest";
import {
  calculateAuthoritativePhase2Completion,
  getIerpPaymentAccess,
  isIerpInternProfileReady,
  IERP_NAMED_TEAM_MEMBER_ROLES,
  IERP_TOTAL_FEE_KES,
} from "./ierp-program-state";

describe("IERP authoritative programme state", () => {
  it("requires three team-leader sessions and all six named team-member roles", () => {
    const roles = [
      "team_leader", "team_leader", "team_leader",
      ...IERP_NAMED_TEAM_MEMBER_ROLES,
    ];
    const result = calculateAuthoritativePhase2Completion(roles);
    expect(result.teamLeaderCount).toBe(3);
    expect(result.teamMemberSessionsTotal).toBe(6);
    expect(result.teamMemberRolesCovered).toBe(6);
    expect(result.phase2Complete).toBe(true);
  });

  it("does not count legacy generic team_member labels as named-role completion", () => {
    const result = calculateAuthoritativePhase2Completion([
      "team_leader", "team_leader", "team_leader",
      "team_member", "team_member", "team_member", "team_member", "team_member", "team_member",
    ]);
    expect(result.teamLeaderMet).toBe(true);
    expect(result.teamMemberSessionsTotal).toBe(0);
    expect(result.teamMemberRolesCovered).toBe(0);
    expect(result.phase2Complete).toBe(false);
  });

  it("allows unpaid August-to-November starters to use Phase 1 and Phase 2 before December", () => {
    const access = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-08-15T10:00:00+03:00"), totalPaidAmount: "0.00" },
      new Date("2026-11-30T23:59:59+03:00")
    );
    expect(access.deferredStartWindow).toBe(true);
    expect(access.paymentDeadline).toEqual(new Date("2026-12-01T00:00:00+03:00"));
    expect(access.cognitiveAccessLocked).toBe(false);
    expect(access.phase2BookingLocked).toBe(false);
  });

  it("locks an unpaid August-to-November starter at the December EAT boundary", () => {
    const access = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-08-15T10:00:00+03:00"), totalPaidAmount: "0.00" },
      new Date("2026-12-01T00:00:00+03:00")
    );
    expect(access.cognitiveAccessLocked).toBe(true);
    expect(access.phase2BookingLocked).toBe(true);
    expect(access.isPaidInFull).toBe(false);
  });

  it("requires full payment immediately for December-to-July starters", () => {
    const access = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-12-01T09:00:00+03:00"), totalPaidAmount: "2500.00" },
      new Date("2026-12-01T09:01:00+03:00")
    );
    expect(access.deferredStartWindow).toBe(false);
    expect(access.paymentDeadline).toBeNull();
    expect(access.cognitiveAccessLocked).toBe(true);
    expect(access.phase2BookingLocked).toBe(true);
    expect(access.balance).toBe(IERP_TOTAL_FEE_KES - 2500);
  });

  it("treats 31 July as immediate-payment and 1 August as deferred-payment", () => {
    const july = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-07-31T23:59:59+03:00"), totalPaidAmount: 0 },
      new Date("2026-08-01T00:00:00+03:00")
    );
    const august = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-08-01T00:00:00+03:00"), totalPaidAmount: 0 },
      new Date("2026-08-01T00:00:01+03:00")
    );
    expect(july.deferredStartWindow).toBe(false);
    expect(july.cognitiveAccessLocked).toBe(true);
    expect(august.deferredStartWindow).toBe(true);
    expect(august.cognitiveAccessLocked).toBe(false);
  });

  it("unlocks every start month only after the full KES 15,000 is paid", () => {
    const access = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-12-01T09:00:00+03:00"), totalPaidAmount: String(IERP_TOTAL_FEE_KES) },
      new Date("2026-12-01T09:01:00+03:00")
    );
    expect(access.isPaidInFull).toBe(true);
    expect(access.cognitiveAccessLocked).toBe(false);
    expect(access.phase2BookingLocked).toBe(false);
    expect(access.balance).toBe(0);
  });

  it("uses the enrolment timestamp as the December deadline for a November EAT starter", () => {
    const access = getIerpPaymentAccess(
      { enrolledAt: new Date("2026-11-30T23:30:00+03:00"), totalPaidAmount: "0" },
      new Date("2026-12-01T00:00:00+03:00")
    );
    expect(access.paymentDeadline).toEqual(new Date("2026-12-01T00:00:00+03:00"));
    expect(access.paymentLockoutActive).toBe(true);
  });

  it("uses the declared effective commencement date for the payment window", () => {
    const access = getIerpPaymentAccess(
      {
        enrolledAt: new Date("2026-07-31T10:00:00+03:00"),
        effectiveCommencementDate: new Date("2026-08-01T00:00:00+03:00"),
        totalPaidAmount: 0,
      },
      new Date("2026-08-15T00:00:00+03:00")
    );
    expect(access.deferredStartWindow).toBe(true);
    expect(access.cognitiveAccessLocked).toBe(false);
  });

  it("accepts submitted or verified intern profiles but fails closed for missing or rejected profiles", () => {
    expect(isIerpInternProfileReady(null)).toBe(false);
    expect(isIerpInternProfileReady({ status: "rejected" })).toBe(false);
    expect(isIerpInternProfileReady({ status: "pending" })).toBe(true);
    expect(isIerpInternProfileReady({ status: "verified" })).toBe(true);
  });
});
