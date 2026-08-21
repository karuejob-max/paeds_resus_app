import { describe, expect, it } from "vitest";
import { assertIersActivationContinuity, resolveProductAccessMode } from "./institution-entitlements";

describe("resolveProductAccessMode", () => {
  it("allows full access for active entitlements", () => {
    expect(resolveProductAccessMode({
      subscriptionStatus: "active",
      entitlementStatus: "active",
      capabilityClass: "operate",
      renewalPolicy: "full",
    })).toBe("full");
  });

  it("keeps IERS operational continuity after expiry", () => {
    expect(resolveProductAccessMode({
      subscriptionStatus: "expired",
      entitlementStatus: "active",
      capabilityClass: "operate",
      renewalPolicy: "operational_continuity",
    })).toBe("operational_continuity");
  });

  it("allows read-only reports after expiry", () => {
    expect(resolveProductAccessMode({
      subscriptionStatus: "expired",
      entitlementStatus: "active",
      capabilityClass: "read",
      renewalPolicy: "read_only",
    })).toBe("read_only");
  });

  it("blocks CPD session creation after expiry", () => {
    expect(resolveProductAccessMode({
      subscriptionStatus: "expired",
      entitlementStatus: "active",
      capabilityClass: "operate",
      renewalPolicy: "read_only",
    })).toBe("blocked");
  });

  it("blocks revoked and blocked grants regardless of subscription status", () => {
    for (const entitlementStatus of ["blocked", "revoked"] as const) {
      expect(resolveProductAccessMode({
        subscriptionStatus: "active",
        entitlementStatus,
        capabilityClass: "read",
        renewalPolicy: "full",
      })).toBe("blocked");
    }
  });

  it("preserves legacy continuity while migration 0100 is being reviewed", () => {
    expect(resolveProductAccessMode({
      subscriptionStatus: "legacy_unclassified",
      entitlementStatus: "active",
      capabilityClass: "govern",
      renewalPolicy: "full",
    })).toBe("full");
  });

  it("keeps activation operations available across every renewal-failure state", () => {
    expect(resolveProductAccessMode({
      subscriptionStatus: "grace",
      entitlementStatus: "active",
      capabilityClass: "operate",
      renewalPolicy: "operational_continuity",
    })).toBe("full");

    for (const subscriptionStatus of ["past_due", "expired", "suspended", "cancelled"] as const) {
      expect(resolveProductAccessMode({
        subscriptionStatus,
        entitlementStatus: "active",
        capabilityClass: "operate",
        renewalPolicy: "operational_continuity",
      })).toBe("operational_continuity");
    }
  });

  it("accepts only full, operational-continuity, or legacy-fallback activation decisions", () => {
    for (const mode of ["full", "operational_continuity", "legacy_fallback"] as const) {
      expect(() => assertIersActivationContinuity({
        productKey: "iers",
        capabilityKey: "iers.activation.respond",
        mode,
        subscriptionStatus: "expired",
        entitlementStatus: "active",
        capabilityClass: "operate",
        renewalPolicy: "operational_continuity",
        source: "database",
        reason: "test",
      })).not.toThrow();
    }

    expect(() => assertIersActivationContinuity({
      productKey: "iers",
      capabilityKey: "iers.activation.respond",
      mode: "read_only",
      subscriptionStatus: "expired",
      entitlementStatus: "active",
      capabilityClass: "operate",
      renewalPolicy: "read_only",
      source: "database",
      reason: "test",
    })).toThrow(/activation continuity/i);
  });
});
