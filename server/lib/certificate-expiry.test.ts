import { describe, it, expect } from "vitest";
import {
  computeCertificateExpiryDate,
  getCertificateValidityYears,
  getCertificateExpiryStatus,
  formatCertificateExpiryDate,
  certificateShowsExpiryOnPdf,
} from "./certificate-expiry";

describe("certificate-expiry", () => {
  describe("getCertificateValidityYears", () => {
    it("returns 2 years for AHA provider certs", () => {
      expect(getCertificateValidityYears("bls")).toBe(2);
      expect(getCertificateValidityYears("acls")).toBe(2);
      expect(getCertificateValidityYears("pals")).toBe(2);
      expect(getCertificateValidityYears("heartsaver")).toBe(2);
      expect(getCertificateValidityYears("nrp")).toBe(2);
    });

    it("returns 2 years for AHA cognitive gatepass certs", () => {
      expect(getCertificateValidityYears("bls_cognitive")).toBe(2);
      expect(getCertificateValidityYears("pals_cognitive")).toBe(2);
    });

    it("returns 2 years for micro-course fellowship certs", () => {
      expect(getCertificateValidityYears("fellowship")).toBe(2);
    });

    it("returns 1 year for instructor and fellowship diploma", () => {
      expect(getCertificateValidityYears("instructor")).toBe(1);
      expect(getCertificateValidityYears("fellowship_diploma")).toBe(1);
    });
  });

  describe("computeCertificateExpiryDate", () => {
    it("adds exactly 2 calendar years from issue date", () => {
      const issueDate = new Date("2026-01-20T12:00:00.000Z");
      const expiry = computeCertificateExpiryDate(issueDate, "bls");
      expect(expiry.getUTCFullYear()).toBe(2028);
      expect(expiry.getUTCMonth()).toBe(issueDate.getUTCMonth());
      expect(expiry.getUTCDate()).toBe(issueDate.getUTCDate());
    });

    it("handles leap day issue dates via date-fns addYears", () => {
      const issueDate = new Date("2024-02-29T00:00:00.000Z");
      const expiry = computeCertificateExpiryDate(issueDate, "fellowship");
      expect(expiry.getUTCFullYear()).toBe(2026);
      expect(expiry.getUTCMonth()).toBe(1);
      expect(expiry.getUTCDate()).toBe(28);
    });

    it("micro-course expiry is 2 years from issue", () => {
      const issueDate = new Date("2025-05-28T00:00:00.000Z");
      const expiry = computeCertificateExpiryDate(issueDate, "fellowship");
      expect(expiry.getUTCFullYear()).toBe(2027);
      expect(expiry.getUTCMonth()).toBe(4);
      expect(expiry.getUTCDate()).toBe(28);
    });
  });

  describe("getCertificateExpiryStatus", () => {
    it("marks future expiry as valid", () => {
      const future = new Date(Date.now() + 86400000);
      expect(getCertificateExpiryStatus(future)).toBe("valid");
    });

    it("marks past expiry as expired", () => {
      const past = new Date("2020-01-01T00:00:00.000Z");
      expect(getCertificateExpiryStatus(past)).toBe("expired");
    });

    it("returns unknown when expiry is missing", () => {
      expect(getCertificateExpiryStatus(null)).toBe("unknown");
    });
  });

  describe("certificateShowsExpiryOnPdf", () => {
    it("shows expiry for AHA and micro-course types", () => {
      expect(certificateShowsExpiryOnPdf("bls")).toBe(true);
      expect(certificateShowsExpiryOnPdf("nrp_cognitive")).toBe(true);
      expect(certificateShowsExpiryOnPdf("fellowship")).toBe(true);
    });

    it("does not show expiry for instructor or diploma", () => {
      expect(certificateShowsExpiryOnPdf("instructor")).toBe(false);
      expect(certificateShowsExpiryOnPdf("fellowship_diploma")).toBe(false);
    });
  });

  describe("formatCertificateExpiryDate", () => {
    it("formats as en-GB long date", () => {
      const formatted = formatCertificateExpiryDate(new Date("2028-05-28T00:00:00.000Z"));
      expect(formatted).toBe("28 May 2028");
    });
  });
});
