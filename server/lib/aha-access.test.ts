import { describe, expect, it } from "vitest";
import { isActiveGrant, isCurrentNckLicence } from "./aha-access";

describe("AHA access primitives", () => {
  const now = new Date("2026-08-28T09:00:00.000Z");

  it("accepts a verified current Nursing Council of Kenya licence with a number", () => {
    expect(
      isCurrentNckLicence(
        {
          issuer: "Nursing Council of Kenya",
          credentialNumber: "NCK-12345",
          status: "verified",
          expiresAt: new Date("2027-08-28T09:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("accepts a verified NCK licence when NERP dates are not recorded", () => {
    expect(
      isCurrentNckLicence(
        {
          issuer: "Nursing Council of Kenya (NCK)",
          jurisdiction: "Kenya",
          credentialNumber: "NCK-OPTIONAL-DATES",
          status: "verified",
          issuedAt: undefined,
          expiresAt: undefined,
        },
        now,
      ),
    ).toBe(true);
  });

  it("rejects unverified, missing-number, expired, or unrelated licences", () => {
    expect(isCurrentNckLicence({ issuer: "NCK", credentialNumber: "NCK-1", status: "pending" }, now)).toBe(false);
    expect(isCurrentNckLicence({ issuer: "NCK", credentialNumber: "", status: "verified" }, now)).toBe(false);
    expect(isCurrentNckLicence({ issuer: "NCK", credentialNumber: "NCK-1", status: "verified", expiresAt: new Date("2026-08-28T08:59:59.000Z") }, now)).toBe(false);
    expect(isCurrentNckLicence({ issuer: "Medical Council of Kenya", credentialNumber: "MCK-1", status: "verified" }, now)).toBe(false);
  });

  it("accepts a live all-course grant or matching course grant", () => {
    expect(isActiveGrant({ programType: null, revokedAt: null, expiresAt: null }, "acls", now)).toBe(true);
    expect(isActiveGrant({ programType: "acls", revokedAt: null, expiresAt: new Date("2026-08-29T00:00:00.000Z") }, "acls", now)).toBe(true);
    expect(isActiveGrant({ programType: "bls", revokedAt: null, expiresAt: null }, "acls", now)).toBe(false);
  });

  it("rejects revoked or expired grants", () => {
    expect(isActiveGrant({ programType: "acls", revokedAt: new Date("2026-08-28T08:00:00.000Z"), expiresAt: null }, "acls", now)).toBe(false);
    expect(isActiveGrant({ programType: "acls", revokedAt: null, expiresAt: new Date("2026-08-28T08:59:59.000Z") }, "acls", now)).toBe(false);
  });
});
