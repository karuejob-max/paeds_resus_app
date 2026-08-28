import { describe, expect, it } from "vitest";
import { createEntitlementInput } from "./admin-entitlements";

const futureDate = "2099-12-31";
const base = {
  benefitType: "free" as const,
  reason: "Approved pilot scholarship for named account",
  expiresAt: futureDate,
  maxRedemptions: 1,
};

describe("Global Admin entitlement contract", () => {
  it("requires a named user for IERP and NERP", () => {
    expect(
      createEntitlementInput.safeParse({ ...base, programType: "ierp" }).success
    ).toBe(false);
    expect(
      createEntitlementInput.safeParse({ ...base, programType: "nerp" }).success
    ).toBe(false);
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "ierp",
        targetUserId: 7,
      }).success
    ).toBe(true);
  });

  it("requires an institution-only target for ILSP", () => {
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "paeds_resus_ils",
        targetInstitutionalAccountId: 9,
      }).success
    ).toBe(true);
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "paeds_resus_ils",
        targetUserId: 7,
      }).success
    ).toBe(false);
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "paeds_resus_ils",
        targetInstitutionalAccountId: 9,
        targetUserId: 7,
      }).success
    ).toBe(false);
  });

  it("requires an exact course scope for self-pay and percentage bounds", () => {
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "self_pay",
        targetUserId: 7,
      }).success
    ).toBe(false);
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "self_pay",
        targetUserId: 7,
        selfPayCourseId: "asthma-i",
      }).success
    ).toBe(true);
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "self_pay",
        targetUserId: 7,
        selfPayCourseId: "asthma-i",
        benefitType: "percentage_discount",
        discountPercent: 100,
      }).success
    ).toBe(false);
    expect(
      createEntitlementInput.safeParse({
        ...base,
        programType: "self_pay",
        targetUserId: 7,
        selfPayCourseId: "asthma-i",
        benefitType: "percentage_discount",
        discountPercent: 25,
      }).success
    ).toBe(true);
  });
});
