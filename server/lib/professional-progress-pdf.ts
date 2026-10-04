import PDFDocument from "pdfkit";
import { PassThrough } from "node:stream";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type ProfessionalProgressPdfData = {
  reportId: number;
  verificationCode: string;
  verificationUrl: string;
  snapshotHash: string;
  generatedAt: Date | string;
  subject: { name?: string | null; email?: string | null; cadre?: string | null };
  period: { type: string; start: string; end: string };
  reportScope: string;
  lifeSupport?: Array<{ program: string; source?: string; phase?: string; percentage?: number; status?: string; recordStatus?: string }>;
  externalCompletions?: Array<{ program: string; source?: string; phase?: string; percentage?: number }>;
  pathways?: Array<{ program: string; source?: string; phase?: string; percentage?: number; status?: string; paymentStatus?: string | null }>;
  coursework?: Array<{ title: string; category?: string; percentage?: number; status?: string; completedAt?: string | Date | null }>;
  cpd?: { verifiedSessions?: number; points?: number; sessions?: Array<{ title: string; date?: string | Date | null; points?: number }> };
  fellowship?: { overallPercentage?: number; coursesPercentage?: number; resusGPSPercentage?: number; careSignalPercentage?: number } | null;
  certificates?: Array<{ programType?: string; certificateNumber?: string | null; issueDate?: string | Date | null }>;
  periodSemantics?: string;
};

const COLORS = {
  navy: "#0B2447",
  teal: "#0F766E",
  cyan: "#1FB6C1",
  orange: "#E56B2F",
  ink: "#172033",
  muted: "#5B6577",
  line: "#D8E1EA",
  pale: "#F3F7FA",
  white: "#FFFFFF",
};

const APP_BASE = (process.env.APP_BASE_URL?.trim() || "https://www.paedsresus.com").replace(/\/$/, "");

function text(value: unknown, fallback = "—"): string {
  if (value == null || String(value).trim() === "") return fallback;
  return String(value);
}

function dateLabel(value: unknown): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Nairobi" });
}

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || "provider";
}

export function professionalProgressPdfFilename(data: Pick<ProfessionalProgressPdfData, "subject" | "reportId">): string {
  return `Paeds-Resus-Professional-Progress-${slug(text(data.subject.name, "Provider"))}-${data.reportId}.pdf`;
}

function drawFooter(doc: PDFKit.PDFDocument, data: ProfessionalProgressPdfData, pageNumber: number) {
  const y = doc.page.height - 35;
  const originalBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.save();
  doc.strokeColor(COLORS.line).lineWidth(0.6).moveTo(42, y - 8).lineTo(doc.page.width - 42, y - 8).stroke();
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  doc.text(`Paeds Resus · ${data.verificationUrl}`, 42, y, { width: doc.page.width - 180, lineBreak: false });
  doc.text(`Report ID ${data.reportId} · Page ${pageNumber}`, doc.page.width - 135, y, { width: 93, align: "right", lineBreak: false });
  doc.restore();
  doc.page.margins.bottom = originalBottomMargin;
}

function heading(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.x = 42;
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.navy).text(title);
  if (subtitle) doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(subtitle, { width: doc.page.width - 84 });
  doc.moveDown(0.35);
}

function row(doc: PDFKit.PDFDocument, label: string, value: string, options: { status?: string; percentage?: number } = {}) {
  const x = 42;
  const width = doc.page.width - 84;
  const y = doc.y;
  const height = 30;
  doc.roundedRect(x, y, width, height, 4).fillAndStroke(COLORS.pale, COLORS.line);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink).text(label, x + 10, y + 7, { width: width * 0.38, lineBreak: false });
  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(value, x + width * 0.39, y + 7, { width: width * 0.38, lineBreak: false });
  if (options.percentage != null) {
    const pct = Math.max(0, Math.min(100, Number(options.percentage) || 0));
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.teal).text(`${pct}%`, x + width - 55, y + 7, { width: 45, align: "right", lineBreak: false });
  } else if (options.status) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.teal).text(options.status.replaceAll("_", " "), x + width - 125, y + 8, { width: 115, align: "right", lineBreak: false });
  }
  doc.y = y + height + 5;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 80) {
  if (doc.y + needed > doc.page.height - 58) {
    doc.addPage();
  }
}

export function generateProfessionalProgressPdf(data: ProfessionalProgressPdfData): PassThrough {
  const doc = new PDFDocument({ size: "A4", margins: { top: 42, bottom: 58, left: 42, right: 42 }, info: { Title: "Paeds Resus Professional Progress Report", Author: "Paeds Resus", Subject: `Report ${data.reportId}`, Keywords: `Paeds Resus, professional progress, ${data.verificationCode}` } });
  const stream = new PassThrough();
  doc.pipe(stream);
  let pageNumber = 1;
  doc.on("pageAdded", () => { pageNumber += 1; drawFooter(doc, data, pageNumber); });

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.white);
  const logoPath = resolve(process.cwd(), "client/public/paeds-resus-logo-brand.png");
  if (existsSync(logoPath)) {
    try { doc.image(logoPath, 42, 34, { fit: [150, 42] }); } catch { /* text branding remains available */ }
  }
  doc.fillColor(COLORS.teal).rect(42, 86, doc.page.width - 84, 4).fill();
  doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.navy).text("Professional Progress Report", 42, 108);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("Verified learning, performance, and professional evidence record", 42, 136);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink).text(text(data.subject.name, "Provider"), 42, 164);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text(`${text(data.subject.cadre, "Healthcare provider")} · ${data.period.type} report · ${data.period.start} to ${data.period.end}`, 42, 179);

  const metaY = 208;
  doc.roundedRect(42, metaY, doc.page.width - 84, 56, 5).fillAndStroke("#EEF7F6", COLORS.line);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.teal).text("VERIFIED REPORT", 54, metaY + 11);
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.ink).text(`Report ID: ${data.reportId}   ·   Issued: ${dateLabel(data.generatedAt)}`, 54, metaY + 27);
  doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text(`Verify: ${data.verificationUrl}`, 54, metaY + 41, { width: doc.page.width - 108, lineBreak: false });
  doc.y = metaY + 78;

  heading(doc, "Executive summary", "This report is generated from the signed snapshot and is intended for interviews, appraisals, recommendations, and professional review.");
  const ls = data.lifeSupport ?? [];
  const pathway = data.pathways ?? [];
  const average = ls.length ? Math.round(ls.reduce((sum, item) => sum + Number(item.percentage ?? 0), 0) / ls.length) : 0;
  const metricWidth = (doc.page.width - 94) / 3;
  const metricY = doc.y;
  [["Life-support", `${average}%`], ["Pathways", `${pathway.length}`], ["CPD points", `${Number(data.cpd?.points ?? 0).toFixed(1)}`]].forEach(([label, value], index) => {
    const x = 42 + index * (metricWidth + 5);
    doc.roundedRect(x, metricY, metricWidth, 48, 4).fillAndStroke(COLORS.pale, COLORS.line);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.navy).text(value, x + 10, metricY + 9);
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted).text(label, x + 10, metricY + 30);
  });
  doc.y = metricY + 66;

  heading(doc, "Life-support courses", "BLS, ACLS, PALS, and NRP records are shown with their current phase and completion percentage.");
  if (ls.length) ls.forEach(item => row(doc, text(item.program), `${text(item.source)} · ${text(item.phase)}`, { percentage: item.percentage }));
  else doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("No life-support course record is linked to this snapshot.");

  ensureSpace(doc, 90);
  heading(doc, "Programme pathways", "Pathway completion is reported separately from individual course completion.");
  if (pathway.length) pathway.forEach(item => row(doc, text(item.program), `${text(item.source)} · ${text(item.phase)}`, { percentage: item.percentage }));
  else doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("No NERP or IERP pathway is linked to this snapshot.");

  const external = data.externalCompletions ?? [];
  if (external.length) {
    ensureSpace(doc, 90);
    heading(doc, "External completion evidence", "External evidence remains visible but is not counted twice in the core course average.");
    external.forEach(item => row(doc, text(item.program), `${text(item.source)} · ${text(item.phase)}`, { percentage: item.percentage }));
  }

  ensureSpace(doc, 100);
  heading(doc, "CPD and Fellowship", "Verified CPD attendance and Fellowship progress captured in the signed snapshot.");
  row(doc, "CPD participation", `${data.cpd?.verifiedSessions ?? 0} verified session(s)`, { status: `${Number(data.cpd?.points ?? 0).toFixed(1)} points` });
  const fellowship = data.fellowship;
  if (fellowship) row(doc, "Paeds Resus Fellowship", `Courses ${fellowship.coursesPercentage ?? 0}% · ResusGPS ${fellowship.resusGPSPercentage ?? 0}% · Care Signal ${fellowship.careSignalPercentage ?? 0}%`, { percentage: fellowship.overallPercentage });
  (data.coursework ?? []).slice(0, 12).forEach(item => row(doc, text(item.title), `${text(item.category)} · ${text(item.status)}`, { percentage: item.percentage }));

  const certificates = data.certificates ?? [];
  if (certificates.length) {
    ensureSpace(doc, 100);
    heading(doc, "Certificates and evidence", "Certificate numbers remain individually verifiable through the platform.");
    certificates.slice(0, 20).forEach(cert => row(doc, text(cert.programType, "Certificate"), `${text(cert.certificateNumber, "Certificate number pending")} · issued ${dateLabel(cert.issueDate)}`));
  }

  ensureSpace(doc, 70);
  heading(doc, "Verification and report scope");
  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(text(data.periodSemantics), { width: doc.page.width - 84, lineGap: 3 });
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.ink).text("Snapshot SHA-256:");
  doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text(data.snapshotHash, { width: doc.page.width - 84 });
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted).text("This document is a verified professional learning record. It does not replace a statutory licence, clinical credential, or employer appraisal decision.", { width: doc.page.width - 84, lineGap: 3 });

  drawFooter(doc, data, pageNumber);
  doc.end();
  return stream;
}

export const professionalProgressAppBase = APP_BASE;
