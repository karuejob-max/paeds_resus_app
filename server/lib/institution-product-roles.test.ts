import { describe, expect, it } from "vitest";
import { isKnownProductRole, PRODUCT_ROLE_DEFINITIONS, selectMatchingProductRole } from "./institution-product-roles";

describe("institution product roles", () => {
  it("keeps role definitions product-specific", () => {
    expect(isKnownProductRole("iers", "iers_chair")).toBe(true);
    expect(isKnownProductRole("iers", "iers_coordinator")).toBe(true);
    expect(isKnownProductRole("iers", "cpd_coordinator")).toBe(false);
    expect(isKnownProductRole("cpd_portal", "cpd_reporter")).toBe(true);
    expect(isKnownProductRole("cpd_portal", "iers_reviewer")).toBe(false);
    expect(PRODUCT_ROLE_DEFINITIONS.connected_services).toHaveLength(2);
  });

  it("selects only active roles for the signed-in identity and requested capability set", () => {
    const rows = [
      { roleKey: "iers_viewer", roleStatus: "suspended", userId: 7, invitedEmail: "provider@example.com" },
      { roleKey: "iers_responder", roleStatus: "active", userId: 7, invitedEmail: "provider@example.com" },
      { roleKey: "iers_coordinator", roleStatus: "active", userId: 99, invitedEmail: "other@example.com" },
    ];
    expect(selectMatchingProductRole(rows, { userId: 7, email: "provider@example.com" }, ["iers_responder", "iers_coordinator"])).toBe("iers_responder");
    expect(selectMatchingProductRole(rows, { userId: 8, email: "provider@example.com" }, ["iers_responder"])).toBe("iers_responder");
    expect(selectMatchingProductRole(rows, { userId: 7, email: "provider@example.com" }, ["iers_viewer"])).toBeUndefined();
    expect(selectMatchingProductRole(rows, { userId: 7, email: "provider@example.com" }, ["cpd_coordinator"])).toBeUndefined();
  });

  it("does not grant a role to an unrelated email or user", () => {
    const rows = [{ roleKey: "cpd_reporter", roleStatus: "active", userId: 11, invitedEmail: "reporter@example.com" }];
    expect(selectMatchingProductRole(rows, { userId: 12, email: "different@example.com" }, ["cpd_reporter"])).toBeUndefined();
  });
});
