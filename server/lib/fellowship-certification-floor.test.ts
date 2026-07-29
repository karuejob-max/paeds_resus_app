import { describe, expect, it } from "vitest";
import { getFellowshipCertificationFloorStatus } from "./fellowship-certification-floor";

const FIXED_NOW = new Date("2026-07-29T00:00:00Z");

function cert(programType: string, issueDate: string, expiryDate: string | null = null) {
  return {
    programType,
    issueDate: new Date(issueDate),
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  };
}

describe("getFellowshipCertificationFloorStatus", () => {
  it("is met when all four required certs are held and valid", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("bls", "2025-01-01", "2027-01-01"),
        cert("acls", "2025-01-01", "2027-01-01"),
        cert("pals", "2025-01-01", "2027-01-01"),
        cert("nrp", "2025-01-01", "2027-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.met).toBe(true);
    expect(status.missing).toEqual([]);
    expect(status.held).toEqual(["bls", "acls", "pals", "nrp"]);
  });

  it("is not met when one of the four is missing entirely", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("bls", "2025-01-01", "2027-01-01"),
        cert("acls", "2025-01-01", "2027-01-01"),
        cert("pals", "2025-01-01", "2027-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.met).toBe(false);
    expect(status.missing).toEqual(["nrp"]);
  });

  it("does not count an expired certificate as held", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("bls", "2023-01-01", "2025-01-01"), // expired before FIXED_NOW
        cert("acls", "2025-01-01", "2027-01-01"),
        cert("pals", "2025-01-01", "2027-01-01"),
        cert("nrp", "2025-01-01", "2027-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.met).toBe(false);
    expect(status.missing).toEqual(["bls"]);
  });

  it("does not count a cognitive-only credential toward the full certification", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("bls_cognitive", "2025-01-01", "2027-01-01"),
        cert("acls", "2025-01-01", "2027-01-01"),
        cert("pals", "2025-01-01", "2027-01-01"),
        cert("nrp", "2025-01-01", "2027-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.met).toBe(false);
    expect(status.missing).toEqual(["bls"]);
  });

  it("falls back to computed expiry (2 years for AHA certs) when expiryDate is not stored", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("bls", "2025-01-01", null), // computed expiry: 2027-01-01, still valid at FIXED_NOW
        cert("acls", "2023-01-01", null), // computed expiry: 2025-01-01, expired by FIXED_NOW
        cert("pals", "2025-01-01", "2027-01-01"),
        cert("nrp", "2025-01-01", "2027-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.held).toContain("bls");
    expect(status.missing).toEqual(["acls"]);
  });

  it("uses the most recent renewal when a user holds more than one cert of the same type", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("bls", "2022-01-01", "2024-01-01"), // old, expired renewal
        cert("bls", "2025-01-01", "2027-01-01"), // current renewal
        cert("acls", "2025-01-01", "2027-01-01"),
        cert("pals", "2025-01-01", "2027-01-01"),
        cert("nrp", "2025-01-01", "2027-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.met).toBe(true);
  });

  it("ignores unrelated programTypes (heartsaver, fellowship, instructor)", () => {
    const status = getFellowshipCertificationFloorStatus(
      [
        cert("heartsaver", "2025-01-01", "2027-01-01"),
        cert("fellowship", "2025-01-01", "2027-01-01"),
        cert("instructor", "2025-01-01", "2026-01-01"),
      ],
      FIXED_NOW
    );
    expect(status.met).toBe(false);
    expect(status.held).toEqual([]);
    expect(status.missing).toEqual(["bls", "acls", "pals", "nrp"]);
  });
});
