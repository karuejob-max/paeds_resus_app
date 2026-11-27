import { describe, expect, it } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { activeStaffCondition, isActiveMember } from "./institution-active-member";

describe("isActiveMember", () => {
  it("counts a linked, not-removed roster row with an active membership", () => {
    expect(isActiveMember({ facilityLinkStatus: "linked", membershipStatus: "active" })).toBe(true);
  });

  it("counts a linked roster row that has no membership row (older data)", () => {
    expect(isActiveMember({ facilityLinkStatus: "linked", membershipStatus: null })).toBe(true);
    expect(isActiveMember({ facilityLinkStatus: "linked" })).toBe(true);
  });

  it("excludes pending, rejected and removed roster rows", () => {
    expect(isActiveMember({ facilityLinkStatus: "pending", membershipStatus: "active" })).toBe(false);
    expect(isActiveMember({ facilityLinkStatus: "rejected", membershipStatus: "active" })).toBe(false);
    expect(isActiveMember({ facilityLinkStatus: "linked", removedAt: new Date(), membershipStatus: "active" })).toBe(false);
  });

  it("excludes a linked roster row whose membership is suspended, ended or declined", () => {
    for (const membershipStatus of ["suspended", "ended", "declined"]) {
      expect(isActiveMember({ facilityLinkStatus: "linked", membershipStatus })).toBe(false);
    }
  });

  it("does not count an invitation that has not been accepted", () => {
    expect(isActiveMember({ facilityLinkStatus: "pending", membershipStatus: "invited" })).toBe(false);
  });
});

describe("activeStaffCondition (SQL form)", () => {
  const { sql: text } = new MySqlDialect().sqlToQuery(activeStaffCondition()!);

  it("requires a linked, non-removed roster row", () => {
    expect(text).toContain("`facilityLinkStatus` = ?");
    expect(text).toContain("`removedAt` is null");
  });

  it("excludes a blocking membership unless an active one also exists", () => {
    expect(text).toContain("'suspended','ended','declined'");
    expect(text).toMatch(/NOT \(\s*EXISTS/);
    expect(text).toContain("m_act.membershipStatus = 'active'");
  });
});
