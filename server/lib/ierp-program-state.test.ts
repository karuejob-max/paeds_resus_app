import { describe, expect, it } from "vitest";
import {
  calculateAuthoritativePhase2Completion,
  getIerpPaymentLockout,
  IERP_NAMED_TEAM_MEMBER_ROLES,
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

  it("is not locked before four months, and unlocks once any payment is recorded", () => {
    const joinedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 5);
    expect(getIerpPaymentLockout({ enrolledAt: joinedAt, totalPaidAmount: "0.00" }).paymentLockoutActive).toBe(true);
    expect(getIerpPaymentLockout({ enrolledAt: joinedAt, totalPaidAmount: "1.00" }).paymentLockoutActive).toBe(false);
    expect(getIerpPaymentLockout({ enrolledAt: new Date(), totalPaidAmount: "0.00" }).paymentLockoutActive).toBe(false);
  });
});
