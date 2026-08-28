import { describe, expect, it } from "vitest";
import {
  clinicalLicenceBlockMessage,
  evaluateClinicalLicenceRows,
} from "./professional-credential-safety";

const now = new Date("2026-08-28T00:00:00.000Z");

function row(overrides: Partial<{
  status: string;
  credentialNumber: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
}> = {}) {
  return {
    status: "verified",
    credentialNumber: "NCK-12345",
    issuedAt: new Date("2024-01-01T00:00:00.000Z"),
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("professional credential ERT safety policy", () => {
  it("fails closed when no regulatory licence exists", () => {
    const decision = evaluateClinicalLicenceRows([], now);
    expect(decision).toEqual({ allowed: false, reason: "missing" });
    expect(clinicalLicenceBlockMessage("missing")).toContain("Licence number");
  });

  it("requires verification, a licence number, and both dates", () => {
    expect(evaluateClinicalLicenceRows([row({ status: "pending" })], now)).toEqual({
      allowed: false,
      reason: "unverified",
    });
    expect(evaluateClinicalLicenceRows([row({ credentialNumber: "" })], now)).toEqual({
      allowed: false,
      reason: "missing_number",
    });
    expect(evaluateClinicalLicenceRows([row({ issuedAt: null })], now)).toEqual({
      allowed: false,
      reason: "missing_dates",
    });
    expect(evaluateClinicalLicenceRows([row({ expiresAt: null })], now)).toEqual({
      allowed: false,
      reason: "missing_dates",
    });
  });

  it("rejects future issue dates and expired licences", () => {
    expect(
      evaluateClinicalLicenceRows(
        [row({ issuedAt: new Date("2026-09-01T00:00:00.000Z") })],
        now,
      ),
    ).toEqual({ allowed: false, reason: "future_issue_date" });
    expect(
      evaluateClinicalLicenceRows(
        [row({ expiresAt: new Date("2026-08-28T00:00:00.000Z") })],
        now,
      ),
    ).toEqual({ allowed: false, reason: "expired" });
  });

  it("allows a verified licence with a number and current dates", () => {
    expect(evaluateClinicalLicenceRows([row()], now)).toEqual({
      allowed: true,
      reason: null,
    });
  });
});
