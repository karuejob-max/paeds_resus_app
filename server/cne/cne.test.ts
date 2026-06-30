import { describe, it, expect } from "vitest";
import {
  formatCadreLabel,
  cneCertificateFilename,
  generateCneCertificatePdf,
  decodeSignaturePng,
} from "./certificate";
import { buildAttendeeCsv } from "../routers/cne";

/**
 * DB-optional unit tests for the pure CNE helpers (no database required), so
 * they pass in the fast `test:unit` gate with DATABASE_URL unset.
 */

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

describe("formatCadreLabel", () => {
  it("returns the cadre as-is for known cadres", () => {
    expect(formatCadreLabel("BSN")).toBe("BSN");
    expect(formatCadreLabel("KRCHN")).toBe("KRCHN");
    expect(formatCadreLabel("KRN")).toBe("KRN");
  });

  it("expands Other to the free-text value when present", () => {
    expect(formatCadreLabel("Other", "Clinical Officer")).toBe("Clinical Officer");
  });

  it("falls back to 'Other' when no free-text value is given", () => {
    expect(formatCadreLabel("Other")).toBe("Other");
    expect(formatCadreLabel("Other", "   ")).toBe("Other");
  });
});

describe("cneCertificateFilename", () => {
  it("produces a safe, slugged filename", () => {
    expect(cneCertificateFilename("Jane Wanjiku Mwangi", "Sepsis Update")).toBe(
      "CNE-Certificate-Jane-Wanjiku-Mwangi-Sepsis-Update.pdf"
    );
  });

  it("strips unsafe characters and collapses whitespace", () => {
    const name = cneCertificateFilename("Dr. O'Brien / Nurse", "A&B  Course!!");
    expect(name).toMatch(/^CNE-Certificate-[\w-]+\.pdf$/);
    expect(name).not.toMatch(/[^\w.-]/);
  });

  it("falls back to 'attendee' for empty input", () => {
    expect(cneCertificateFilename("", "")).toBe("CNE-Certificate-attendee-attendee.pdf");
  });
});

describe("buildAttendeeCsv", () => {
  const baseRow = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+254712345678",
    cadre: "KRCHN",
    cadreOther: null,
    higherDiploma: null,
    department: "PICU",
    eventName: "Sepsis Update",
    eventDate: "12 June 2026",
    submittedAt: "2026-06-12T08:00:00.000Z",
  };

  it("includes a header row and one line per attendee", () => {
    const csv = buildAttendeeCsv([baseRow]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("Full Name");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Jane Doe");
    expect(lines[1]).toContain("PICU");
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = buildAttendeeCsv([
      { ...baseRow, fullName: 'Doe, Jane "JD"', department: "Ward 3\nUnit B" },
    ]);
    expect(csv).toContain('"Doe, Jane ""JD"""');
    expect(csv).toContain('"Ward 3\nUnit B"');
  });

  it("handles an empty list (header only)", () => {
    const csv = buildAttendeeCsv([]);
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});

describe("generateCneCertificatePdf", () => {
  it("produces a non-empty PDF buffer with a valid header", async () => {
    const stream = generateCneCertificatePdf({
      fullName: "Jane Wanjiku Mwangi",
      cadre: "KRCHN",
      eventName: "Paediatric Sepsis Update",
      eventDate: "12 June 2026",
      coordinatorName: "Job Karue",
      institutionName: "Consolata Hospital Mathari",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("works without a coordinator name (defaults gracefully)", async () => {
    const stream = generateCneCertificatePdf({
      fullName: "Test Nurse",
      cadre: "Other",
      cadreOther: "Clinical Officer",
      eventName: "BLS Refresher",
      eventDate: "01 Jan 2026",
      coordinatorName: null,
      institutionName: "County Referral Hospital",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  // A real, pdfkit-decodable 120x48 PNG, base64-encoded as a data URL.
  const validSignaturePng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAwCAYAAADab77TAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAA/0lEQVR4nO2VwREDMRDC7k8b9LL9V5RUkQEueujvQZb9yPeBe+0GT/oAcAjmEhwFcwmOJ1p/+CXwBzsvAcEFQ2kUCnZeAoILhtIoFOy8BAQXDKVRKNh5CQguGEqjULDzEhBcMJRGoWDnJSC4YCiNQsHOS0BwwVAahYKdl4DggqE0CgU7LwHBBUNpFAp2XgKCC4bSKBTsvAQEFwylUSjYeQkILhhKo1Cw8xIQXDCURqFg5yUguGAojULBzktAcMFQGoWCnZeA4IKhNAoFOy8BwQVDaRQKdl4CgguG0igU7LwEBBcMpVEo2HkJCC4YSqNQsPMSEFwwlEahYOcl/FLwF5NKymGd5D34AAAAAElFTkSuQmCC";

  it("embeds a valid signature image without breaking generation", async () => {
    const stream = generateCneCertificatePdf({
      fullName: "Signed Nurse",
      cadre: "KRN",
      eventName: "Signed Session",
      eventDate: "02 Feb 2026",
      coordinatorName: "Job Karue",
      coordinatorSignature: validSignaturePng,
      institutionName: "Consolata Hospital Mathari",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("ignores a malformed signature and still produces a valid PDF", async () => {
    const stream = generateCneCertificatePdf({
      fullName: "Test Nurse",
      cadre: "BSN",
      eventName: "Session",
      eventDate: "03 Mar 2026",
      coordinatorSignature: "not-a-valid-data-url",
      institutionName: "County Referral Hospital",
    });
    const buf = await streamToBuffer(stream);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("decodeSignaturePng", () => {
  const validPngDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  it("decodes a valid PNG data URL to a non-empty Buffer", () => {
    const buf = decodeSignaturePng(validPngDataUrl);
    expect(buf).toBeInstanceOf(Buffer);
    expect((buf as Buffer).length).toBeGreaterThan(0);
  });

  it("returns null for empty, missing, or non-PNG input", () => {
    expect(decodeSignaturePng(null)).toBeNull();
    expect(decodeSignaturePng(undefined)).toBeNull();
    expect(decodeSignaturePng("")).toBeNull();
    expect(decodeSignaturePng("data:image/jpeg;base64,/9j/4AAQ")).toBeNull();
    expect(decodeSignaturePng("not-a-data-url")).toBeNull();
  });
});
