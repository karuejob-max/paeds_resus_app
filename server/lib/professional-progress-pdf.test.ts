import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { competenceValidityLabel, generateProfessionalProgressPdf, professionalProgressPdfFilename, type ProfessionalProgressPdfData } from "./professional-progress-pdf";

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

const sample: ProfessionalProgressPdfData = {
  reportId: 42,
  verificationCode: "PPR-0123456789ABCDEF01234567",
  verificationUrl: "https://www.paedsresus.com/verify-progress/PPR-0123456789ABCDEF01234567",
  snapshotHash: "a".repeat(64),
  generatedAt: "2026-10-04T04:00:00.000Z",
  reportScope: "activity",
  subject: { name: "Job Karue", cadre: "PICU Nurse", email: "karuejob@gmail.com" },
  period: { type: "monthly", start: "2026-10-01", end: "2026-10-04" },
  lifeSupport: [
    { program: "BLS", source: "Self Pay / Individual", phase: "Cognitive / Phase 1", percentage: 75, status: "active" },
    { program: "ACLS", source: "NERP", phase: "Not started", percentage: 0, status: "active" },
  ],
  pathways: [{ program: "NERP ACLS PATHWAY", source: "NERP", phase: "Phase 2", percentage: 50, status: "active" }],
  externalCompletions: [{ program: "PALS", source: "External completion", phase: "Provider / Phase 3", percentage: 100 }],
  coursework: Array.from({ length: 8 }, (_, index) => ({ title: `Micro-course ${index + 1}`, category: "Fellowship", percentage: 100, status: "completed" })),
  cpd: { verifiedSessions: 3, sessionsAttended: 3, sessionsPresented: 1, points: 6, sessions: [{ title: "Paediatric shock", points: 2, date: "2026-10-02" }] },
  qualityReports: { careSignalSubmitted: 2, codeSignalSubmitted: 1 },
  fellowship: { overallPercentage: 40, coursesPercentage: 50, resusGPSPercentage: 25, careSignalPercentage: 45 },
  certificates: [{ programType: "BLS", certificateNumber: "PR-BLS-42", issueDate: "2026-10-03" }],
  periodSemantics: "This report shows learning activity during the selected period.",
};

describe("professional progress PDF", () => {
  it("renders a valid branded PDF with multiple pages and report metadata", async () => {
    const buffer = await streamToBuffer(generateProfessionalProgressPdf(sample));
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThan(1);
    expect(document.getPageCount()).toBeLessThan(8);
    expect(document.getTitle()).toContain("Professional Progress Report");
    expect(document.getAuthor()).toBe("Paeds Resus");
  });

  it("uses the stable report ID in the download filename", () => {
    expect(professionalProgressPdfFilename(sample)).toBe("Paeds-Resus-Professional-Progress-Job-Karue-42.pdf");
  });

  it("labels expired observed competence as expired even when the historical result was competent", () => {
    expect(competenceValidityLabel({ result: "competent", effectiveStatus: "expired", assessmentMethod: "Megacode", assessmentDate: "2026-01-01", validUntil: "2026-09-30" })).toContain("Current validity: Expired");
    expect(competenceValidityLabel({ result: "competent", effectiveStatus: "expired", assessmentMethod: "Megacode", assessmentDate: "2026-01-01", validUntil: "2026-09-30" })).toContain("Result: Competent");
  });
});
