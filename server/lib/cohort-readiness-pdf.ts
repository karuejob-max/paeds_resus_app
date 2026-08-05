import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import type { CohortProgressRow } from "./cohort-progress";

/**
 * INST-20: a shareable, presentation-ready readiness summary a facility
 * coordinator can hand to a CEO/CNO — deliberately not a re-export of
 * CohortProgressWidget's raw operational table (see docs/INSTITUTIONAL_
 * BACKLOG_BOARD.md). One page, percentage-first, no per-learner detail.
 * Programmatic pdfkit (no external image assets), same choice as the CPD
 * certificate generator (server/cpd/certificate.ts) and for the same
 * reason — survives esbuild bundling in production without a logo file to
 * ship alongside it.
 */

const COLORS = {
  teal: "#1a4d4d",
  tealDark: "#0d3333",
  orange: "#ff6633",
  ink: "#1a2233",
  muted: "#5b6577",
  border: "#dfe6e6",
  rowAlt: "#f4f8f8",
};

// Mirrors displayNameMap in InstitutionalPortal.tsx's CohortProgressWidget —
// not imported (client-only path); keep the two in sync if designations change.
const DESIGNATION_LABELS: Record<string, string> = {
  noi: "NOI (Nursing Officer Intern)",
  coi_bsc: "Clinical Officer Intern (BSc)",
  coi_diploma: "Diploma COI",
  moi: "MOI (Medical Officer Intern)",
  permanent_nurse: "Permanent Nurse",
  permanent_doctor: "Permanent Doctor",
  other: "Other",
};

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Safe download filename, e.g. "Cohort-Readiness-Summary-Consolata-Hospital-Mathari.pdf". */
export function cohortReadinessFilename(institutionName: string): string {
  const slug = (institutionName || "Institution")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "Institution";
  return `Cohort-Readiness-Summary-${slug}.pdf`;
}

/**
 * Generate the readiness summary PDF and return a readable PassThrough
 * stream. Caller pipes it to an HTTP response.
 */
export function generateCohortReadinessPdf(institutionName: string, rows: CohortProgressRow[]): PassThrough {
  const doc = new PDFDocument({ size: "A4", margins: { top: 54, bottom: 54, left: 54, right: 54 } });
  const stream = new PassThrough();
  doc.pipe(stream);

  const W = doc.page.width;
  const contentW = W - 108;

  // --- Header band --------------------------------------------------------
  doc.rect(0, 0, W, 90).fill(COLORS.teal);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Paeds Resus", 54, 26);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica")
    .fontSize(11)
    .text("Cohort Readiness Summary", 54, 50);
  doc
    .fillColor("#cfe3e3")
    .font("Helvetica")
    .fontSize(8)
    .text(
      `Generated ${new Date().toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", year: "numeric", month: "long", day: "numeric" })}`,
      54,
      68
    );

  doc.y = 118;

  // --- Institution line ----------------------------------------------------
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(institutionName || "Healthcare Institution", 54, doc.y, { width: contentW });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Nurses & Interns Emergency Readiness Program (NERP/IERP) — cohort completion, this facility",
      54,
      doc.y + 4,
      { width: contentW }
    );

  doc.moveDown(1.5);

  // --- Aggregate headline stats --------------------------------------------
  const totalLearners = rows.reduce((s, r) => s + r.totalCount, 0);
  const totalBls = rows.reduce((s, r) => s + r.blsCompleteCount, 0);
  const totalAcls = rows.reduce((s, r) => s + r.aclsCompleteCount, 0);
  const totalPhase2 = rows.reduce((s, r) => s + r.phase2CompleteCount, 0);

  const stats: Array<{ label: string; value: string }> = [
    { label: "Enrolled learners", value: String(totalLearners) },
    { label: "BLS certified", value: `${pct(totalBls, totalLearners)}%` },
    { label: "ACLS certified", value: `${pct(totalAcls, totalLearners)}%` },
    { label: "Phase 2 complete", value: `${pct(totalPhase2, totalLearners)}%` },
  ];

  const cardW = contentW / stats.length - 8;
  let cardX = 54;
  const cardY = doc.y;
  for (const s of stats) {
    doc.roundedRect(cardX, cardY, cardW, 58, 4).fillAndStroke(COLORS.rowAlt, COLORS.border);
    doc
      .fillColor(COLORS.orange)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(s.value, cardX, cardY + 10, { width: cardW, align: "center" });
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(s.label, cardX + 4, cardY + 36, { width: cardW - 8, align: "center" });
    cardX += cardW + 8;
  }

  doc.y = cardY + 58 + 28;

  // --- Per-cohort breakdown --------------------------------------------------
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Breakdown by cadre", 54, doc.y);
  doc.moveDown(0.6);

  const colX = { cadre: 54, count: 300, bls: 360, acls: 425, phase2: 490 };
  const headerY = doc.y;
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8);
  doc.text("CADRE", colX.cadre, headerY, { width: 240 });
  doc.text("N", colX.count, headerY, { width: 50, align: "right" });
  doc.text("BLS", colX.bls, headerY, { width: 55, align: "right" });
  doc.text("ACLS", colX.acls, headerY, { width: 55, align: "right" });
  doc.text("PHASE 2", colX.phase2, headerY, { width: 60, align: "right" });
  doc
    .moveTo(54, headerY + 14)
    .lineTo(54 + contentW, headerY + 14)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  let rowY = headerY + 22;
  const sortedRows = [...rows].sort((a, b) => b.totalCount - a.totalCount);
  sortedRows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.rect(54, rowY - 4, contentW, 20).fill(COLORS.rowAlt);
    }
    const label = DESIGNATION_LABELS[row.designation ?? "other"] ?? row.designation ?? "Other";
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9);
    doc.text(label, colX.cadre, rowY, { width: 240 });
    doc.text(String(row.totalCount), colX.count, rowY, { width: 50, align: "right" });
    doc.text(`${pct(row.blsCompleteCount, row.totalCount)}%`, colX.bls, rowY, { width: 55, align: "right" });
    doc.text(`${pct(row.aclsCompleteCount, row.totalCount)}%`, colX.acls, rowY, { width: 55, align: "right" });
    doc.text(`${pct(row.phase2CompleteCount, row.totalCount)}%`, colX.phase2, rowY, { width: 60, align: "right" });
    rowY += 20;
  });

  if (sortedRows.length === 0) {
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("No enrolled learners yet.", colX.cadre, rowY);
    rowY += 20;
  }

  // --- Footer ----------------------------------------------------------------
  // Drawn against page.height directly, with the page's bottom margin
  // zeroed out first -- pdfkit's automatic text-flow pagination otherwise
  // pushes this block onto a spurious blank second page whenever it lands
  // inside the margin band, which is exactly where a footer lives by
  // definition. Safe here because nothing is drawn after this block.
  doc.page.margins.bottom = 0;
  const footerY = doc.page.height - 56;
  doc
    .moveTo(54, footerY)
    .lineTo(54 + contentW, footerY)
    .strokeColor(COLORS.border)
    .lineWidth(0.75)
    .stroke();
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      "Reflects platform data at generation time, not a real-time feed. \"Phase 2 complete\" reflects the hands-on simulation phase of the Cohort Program.",
      54,
      footerY + 8,
      { width: contentW }
    );
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Paeds Resus Limited — www.paedsresus.com", 54, footerY + 20, { width: contentW });

  doc.end();
  return stream;
}
