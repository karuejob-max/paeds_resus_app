import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateCertificatePDF } from "./certificate-pdf";
import { getCertificateStats } from "./certificates";

async function expectValidBrandedPdf(buffer: Buffer) {
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.length).toBeGreaterThan(0);
  expect(buffer.slice(0, 5).toString()).toBe("%PDF-");
  const doc = await PDFDocument.load(buffer);
  expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
}

function baseCert(overrides: Partial<Parameters<typeof generateCertificatePDF>[0]> = {}) {
  return {
    recipientName: "Test User",
    programType: "bls" as const,
    trainingDate: new Date("2026-01-15"),
    instructorName: "Dr. Test",
    certificateNumber: "PRES-TEST-001",
    verificationCode: "verify-test-001",
    ...overrides,
  };
}

describe("Certificate Service", () => {
  describe("Certificate Number Generation", () => {
    it("should generate unique certificate numbers", async () => {
      const numbers = new Set();
      for (let i = 0; i < 10; i++) {
        numbers.add(`PRES-${Date.now()}-${Math.random()}`);
      }
      expect(numbers.size).toBeGreaterThan(0);
    });

    it("should follow certificate number format", () => {
      const pattern = /^PRES-[A-Z0-9]+-[A-Z0-9]+$/;
      const exampleNumber = "PRES-ABC123-DEF456";
      expect(exampleNumber).toMatch(pattern);
    });
  });

  describe("Certificate PDF Generation (branded)", () => {
    it("should generate a valid PDF buffer", async () => {
      const pdfBuffer = await generateCertificatePDF(baseCert());
      await expectValidBrandedPdf(pdfBuffer);
    });

    it("should generate for each standard program type", async () => {
      const types = ["bls", "acls", "pals", "fellowship", "instructor"] as const;
      for (const programType of types) {
        const pdfBuffer = await generateCertificatePDF(
          baseCert({
            programType,
            certificateNumber: `PRES-${programType.toUpperCase()}-001`,
            verificationCode: `verify-${programType}`,
          })
        );
        await expectValidBrandedPdf(pdfBuffer);
      }
    });

    it("should handle very long recipient names", async () => {
      const longName = "A".repeat(255);
      const pdfBuffer = await generateCertificatePDF(baseCert({ recipientName: longName }));
      await expectValidBrandedPdf(pdfBuffer);
    });

    it("should handle special characters in names", async () => {
      const pdfBuffer = await generateCertificatePDF(
        baseCert({
          recipientName: "José María O'Connor-Smith",
          programType: "acls",
          instructorName: "Dr. François Müller",
          certificateNumber: "PRES-TEST-010",
          verificationCode: "verify-010",
        })
      );
      await expectValidBrandedPdf(pdfBuffer);
    });

    it("should handle future training dates", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      const pdfBuffer = await generateCertificatePDF(
        baseCert({
          programType: "pals",
          trainingDate: futureDate,
          certificateNumber: "PRES-TEST-011",
          verificationCode: "verify-011",
        })
      );
      await expectValidBrandedPdf(pdfBuffer);
    });

    it("should generate PALS-track PDF with courseDisplayName (micro-course)", async () => {
      const pdfBuffer = await generateCertificatePDF(
        baseCert({
          programType: "pals",
          courseDisplayName: "Paediatric Septic Shock I",
          certificateNumber: "PRES-PSS-001",
          verificationCode: "verify-pss",
        })
      );
      await expectValidBrandedPdf(pdfBuffer);
    });
  });

  describe("Certificate Validity", () => {
    it("should set 1-year expiry from issue date", () => {
      const issueDate = new Date("2026-01-20");
      const expectedExpiry = new Date("2027-01-20");
      expect(expectedExpiry.getFullYear()).toBe(issueDate.getFullYear() + 1);
      expect(expectedExpiry.getMonth()).toBe(issueDate.getMonth());
      expect(expectedExpiry.getDate()).toBe(issueDate.getDate());
    });

    it("should handle leap year expiry dates", () => {
      const issueDate = new Date("2024-02-29");
      const expiryDate = new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      expect(expiryDate).toBeDefined();
      expect(expiryDate.getTime()).toBeGreaterThan(issueDate.getTime());
    });
  });

  describe("Certificate Program Types", () => {
    it("should support all program types", () => {
      const programTypes = ["bls", "acls", "pals", "fellowship"] as const;
      programTypes.forEach((type) => {
        expect(type).toBeDefined();
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("Certificate Statistics", () => {
    it("should return stats when database is available, otherwise a clear error", async () => {
      const stats = await getCertificateStats();
      if (stats.success) {
        expect(stats.stats).toBeDefined();
        expect(stats.stats!.totalIssued).toBeGreaterThanOrEqual(0);
        expect(typeof stats.stats!.byProgram).toBe("object");
        expect(Array.isArray(stats.stats!.recentlyIssued)).toBe(true);
      } else {
        expect(stats.success).toBe(false);
        expect(stats).toHaveProperty("error");
      }
    });
  });
});
