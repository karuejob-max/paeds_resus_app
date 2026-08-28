import { describe, expect, it } from "vitest";
import {
  calculateEntitlementPrice,
  isEntitlementActive,
  newEntitlementReference,
} from "./global-entitlements";

describe("Global Admin entitlement engine", () => {
  it("calculates a full waiver without pretending cash was paid", () => {
    expect(calculateEntitlementPrice(15000, "free")).toEqual({
      originalAmountKes: 15000,
      discountAmountKes: 15000,
      effectiveAmountKes: 0,
    });
  });

  it("calculates a bounded percentage discount in whole KES", () => {
    expect(calculateEntitlementPrice(15000, "percentage_discount", 25)).toEqual(
      {
        originalAmountKes: 15000,
        discountAmountKes: 3750,
        effectiveAmountKes: 11250,
      }
    );
    expect(calculateEntitlementPrice(100, "percentage_discount", 99)).toEqual({
      originalAmountKes: 100,
      discountAmountKes: 99,
      effectiveAmountKes: 1,
    });
  });

  it("fails closed for expired or exhausted entitlements", () => {
    const now = new Date("2026-08-28T10:00:00Z");
    expect(
      isEntitlementActive(
        {
          status: "active",
          expiresAt: new Date("2026-08-28T10:00:01Z"),
          redemptionCount: 0,
          maxRedemptions: 1,
        },
        now
      )
    ).toBe(true);
    expect(
      isEntitlementActive(
        {
          status: "active",
          expiresAt: new Date("2026-08-28T09:59:59Z"),
          redemptionCount: 0,
          maxRedemptions: 1,
        },
        now
      )
    ).toBe(false);
    expect(
      isEntitlementActive(
        {
          status: "active",
          expiresAt: new Date("2026-08-28T11:00:00Z"),
          redemptionCount: 1,
          maxRedemptions: 1,
        },
        now
      )
    ).toBe(false);
    expect(
      isEntitlementActive(
        {
          status: "revoked",
          expiresAt: new Date("2026-08-28T11:00:00Z"),
          redemptionCount: 0,
          maxRedemptions: 1,
        },
        now
      )
    ).toBe(false);
  });

  it("generates an internal reference rather than a redeemable token", () => {
    expect(newEntitlementReference()).toMatch(/^ENT-\d{8}-[A-Z0-9]{8}$/);
  });
});
