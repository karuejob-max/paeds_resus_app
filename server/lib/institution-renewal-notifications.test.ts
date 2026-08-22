import { describe, expect, it } from "vitest";
import { determineRenewalNotificationType } from "./institution-renewal-notifications";

describe("institution renewal notification windows", () => {
  const now = new Date("2026-08-22T00:00:00.000Z");
  const atDays = (days: number) => new Date(now.getTime() + days * 86_400_000);

  it("uses the nearest active renewal reminder window", () => {
    expect(determineRenewalNotificationType({ subscriptionStatus: "active", renewsAt: atDays(31) }, now)).toBeNull();
    expect(determineRenewalNotificationType({ subscriptionStatus: "active", renewsAt: atDays(30) }, now)).toBe("renewal_30d");
    expect(determineRenewalNotificationType({ subscriptionStatus: "active", renewsAt: atDays(14) }, now)).toBe("renewal_14d");
    expect(determineRenewalNotificationType({ subscriptionStatus: "active", renewsAt: atDays(7) }, now)).toBe("renewal_7d");
    expect(determineRenewalNotificationType({ subscriptionStatus: "active", renewsAt: atDays(0) }, now)).toBe("renewal_due");
  });

  it("preserves explicit payment-failure and expiry states", () => {
    expect(determineRenewalNotificationType({ subscriptionStatus: "past_due", renewsAt: atDays(20) }, now)).toBe("past_due");
    expect(determineRenewalNotificationType({ subscriptionStatus: "expired", renewsAt: atDays(20) }, now)).toBe("expired");
    expect(determineRenewalNotificationType({ subscriptionStatus: "cancelled", renewsAt: atDays(0) }, now)).toBeNull();
  });

  it("does not invent a reminder when no renewal date exists", () => {
    expect(determineRenewalNotificationType({ subscriptionStatus: "active", renewsAt: null }, now)).toBeNull();
    expect(determineRenewalNotificationType({ subscriptionStatus: "legacy_unclassified", renewsAt: null }, now)).toBeNull();
  });
});
