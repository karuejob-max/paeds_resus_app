/**
 * Certificate PDF Generation Service
 * Generates branded PDF certificates (Paeds Resus branding)
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import sharp from "sharp";

/** ESM has no `__dirname`; bundled `dist/index.js` resolves logo paths relative to project root via `process.cwd()` and this fallback. */
function certificatePdfDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/** Canonical URL for QR codes and printed copy (see PLATFORM_SOURCE_OF_TRUTH §10). */
export const CERTIFICATE_VERIFY_SITE = "https://www.paedsresus.com";

/** Shown under logo on all certificates — neutral; not fellowship-specific. */
const CERTIFICATE_HEADER_TAGLINE = "Global Benchmark for Paediatric Resuscitation Science";

/** Named signatory (env overrides for deployments). */
const CERTIFICATE_SIGNATORY_NAME =
  process.env.CERTIFICATE_SIGNATORY_NAME?.trim() || "Job Karue";
const CERTIFICATE_SIGNATORY_TITLE =
  process.env.CERTIFICATE_SIGNATORY_TITLE?.trim() || "Course Director";

const PAGE = { width: 842, height: 595 };
const MARGIN_X = 52;
const MARGIN_BOTTOM = 38;
/** Horizontal rule above the signature pad and footer metadata row. */
const FOOTER_DIVIDER_Y = 148;
/** Empty band below the rule for a handwritten signature. */
const SIGNATURE_PAD_HEIGHT = 54;
/** Gap between the short signature guide line and the signatory name baseline. */
const SIGNATURE_GUIDE_ABOVE_NAME = 12;
/** Gap between signature pad bottom and the metadata row baseline. */
const FOOTER_METADATA_BELOW_PAD = 14;
const FOOTER_ROW_GAP = 13;
/** Minimum gap between course title baseline and footer rule (non-AHA). */
const GAP_COURSE_TO_FOOTER = 10;
/** Minimum gap between AHA alignment line and footer rule. */
const GAP_AHA_TO_FOOTER = 14;
/** Minimum gap below header tagline before certificate title band. */
const MIN_GAP_AFTER_TAGLINE = 8;
const CERTIFICATE_TITLE_SIZE = 15;
const CERTIFY_LINE_SIZE = 11;
/** Gap between “This is to certify that” and the participant name. */
const GAP_CERTIFY_TO_NAME = 38;
/** Offset below participant name baseline for the orange divider (not full em height). */
const ORANGE_BELOW_NAME_BASELINE = 4;
/** Gap between the orange divider and the description baseline. */
const GAP_ORANGE_TO_DESCRIPTION = 28;
/** Minimum gap between description block and course title when computing vertical center. */
const MIN_GAP_DESC_TO_COURSE = 8;
const COURSE_TITLE_SIZE = 16;

/** Brand tokens aligned with client `index.css` / theme */
const BRAND = {
  teal: rgb(27 / 255, 61 / 255, 61 / 255),
  tealLight: rgb(42 / 255, 90 / 255, 90 / 255),
  orange: rgb(243 / 255, 112 / 255, 33 / 255),
  paper: rgb(1, 1, 1),
  ink: rgb(0.12, 0.14, 0.16),
  inkMuted: rgb(0.38, 0.4, 0.42),
};

interface CertificateData {
  recipientName: string;
  programType: "bls" | "acls" | "pals" | "fellowship" | "instructor" | "fellowship_diploma" | "heartsaver" | "bls_cognitive" | "acls_cognitive" | "pals_cognitive" | "heartsaver_cognitive";
  trainingDate: Date;
  instructorName: string;
  certificateNumber: string;
  verificationCode: string;
  completionHours?: number;
  /** When set (e.g. PALS micro-course), shown on PDF instead of generic PALS/BLS line */
  courseDisplayName?: string;
}

interface CertificateTemplate {
  title: string;
  subtitle: string;
  description: string;
  hours: number;
}

const AHA_CERTIFICATION_PROGRAM_TYPES = new Set([
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "bls_cognitive",
  "acls_cognitive",
  "pals_cognitive",
  "heartsaver_cognitive",
]);

/** Slug for downloaded PDF filename — AHA certs use program type, not linked course title. */
export function getCertificateFilenameSlug(
  programType: string,
  courseDisplayName?: string | null
): string {
  const label = AHA_CERTIFICATION_PROGRAM_TYPES.has(programType)
    ? programType.replace(/_cognitive$/, "")
    : courseDisplayName?.trim() || programType || "certificate";

  return (
    label
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "certificate"
  );
}

const CERTIFICATE_TEMPLATES: Record<string, CertificateTemplate> = {
  bls: {
    title: "Basic Life Support",
    subtitle: "BLS Certification",
    description:
      "has successfully completed the Basic Life Support training programme and meets the international standards of Paeds Resus for emergency care.",
    hours: 6,
  },
  acls: {
    title: "Advanced Cardiovascular Life Support",
    subtitle: "ACLS Certification",
    description:
      "has successfully completed the Advanced Cardiovascular Life Support training programme and meets the international standards of Paeds Resus for emergency care.",
    hours: 16,
  },
  pals: {
    title: "Paediatric Advanced Life Support",
    subtitle: "PALS Certification",
    description:
      "has successfully completed the Paediatric Advanced Life Support training programme and meets the international standards of Paeds Resus for paediatric emergency care.",
    hours: 16,
  },
  fellowship: {
    title: "Micro-Course Excellence",
    subtitle: "Fellowship Module Certification",
    description:
      "has successfully completed this specialised module as part of the Paeds Resus Fellowship, demonstrating clinical competence in paediatric resuscitation.",
    hours: 4,
  },
  fellowship_diploma: {
    title: "Paeds Resus Fellowship Diploma",
    subtitle: "Fellow of the Paeds Resus Academy",
    description:
      "has completed the full Paeds Resus Fellowship curriculum, demonstrating exceptional mastery in pediatric resuscitation science and emergency management.",
    hours: 120,
  },
  instructor: {
    title: "Paeds Resus Instructor Course",
    subtitle: "Instructor Certification",
    description:
      "has successfully completed the Paeds Resus Instructor Course and is authorized to facilitate clinical training under the Paeds Resus framework.",
    hours: 6,
  },
  heartsaver: {
    title: "Heartsaver CPR AED",
    subtitle: "Heartsaver Certification",
    description:
      "has successfully completed the Heartsaver CPR AED programme and is certified to perform CPR and use an AED in emergency situations.",
    hours: 4,
  },
  bls_cognitive: {
    title: "Basic Life Support — Cognitive Completion",
    subtitle: "BLS Cognitive Gatepass Certificate",
    description:
      "has successfully completed all cognitive modules of the Basic Life Support programme. This certificate serves as a gatepass for the practical skills session, upon completion of which the full BLS certification will be issued.",
    hours: 3,
  },
  acls_cognitive: {
    title: "Advanced Cardiovascular Life Support — Cognitive Completion",
    subtitle: "ACLS Cognitive Gatepass Certificate",
    description:
      "has successfully completed all cognitive modules of the Advanced Cardiovascular Life Support programme. This certificate serves as a gatepass for the practical skills session, upon completion of which the full ACLS certification will be issued.",
    hours: 8,
  },
  pals_cognitive: {
    title: "Pediatric Advanced Life Support — Cognitive Completion",
    subtitle: "PALS Cognitive Gatepass Certificate",
    description:
      "has successfully completed all cognitive modules of the Pediatric Advanced Life Support programme. This certificate serves as a gatepass for the practical skills session, upon completion of which the full PALS certification will be issued.",
    hours: 8,
  },
  heartsaver_cognitive: {
    title: "Heartsaver CPR AED — Cognitive Completion",
    subtitle: "Heartsaver Cognitive Gatepass Certificate",
    description:
      "has successfully completed all cognitive modules of the Heartsaver CPR AED programme. This certificate serves as a gatepass for the practical skills session, upon completion of which the full Heartsaver certification will be issued.",
    hours: 3,
  },
};

function isJpgBuffer(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function resolveLogoJpgBytes(): Buffer | null {
  const cwd = process.cwd();
  const here = certificatePdfDir();
  
  const logoPaths = [
    path.join(cwd, "server", "assets", "logos", "logo-landscape.jpg"),
    path.join(cwd, "client", "public", "assets", "logos", "logo-landscape.jpg"),
    path.join(here, "assets", "logos", "logo-landscape.jpg"),
  ];

  for (const p of logoPaths) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p);
      }
    } catch { /* continue */ }
  }
  return null;
}

function drawCenteredText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  y: number,
  size: number,
  textFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  color: ReturnType<typeof rgb>,
  gapAfter = 10
): number {
  const w = textFont.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: PAGE.width / 2 - w / 2,
    y,
    size,
    font: textFont,
    color,
  });
  return y - size - gapAfter;
}

function drawWrappedCentered(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  y: number,
  size: number,
  textFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  color: ReturnType<typeof rgb>,
  maxWidth: number
): number {
  const lines = wrapTextByWidth(text, textFont, size, maxWidth);
  for (const line of lines) {
    const lw = textFont.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: PAGE.width / 2 - lw / 2,
      y,
      size,
      font: textFont,
      color,
    });
    y -= size + 5;
  }
  return y;
}

/**
 * Generate certificate PDF (landscape A4-style: 842 × 595 pt)
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const { width, height } = PAGE;
  const page = pdfDoc.addPage([width, height]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const template = CERTIFICATE_TEMPLATES[data.programType] ?? CERTIFICATE_TEMPLATES.bls;
  const contentMaxWidth = width - MARGIN_X * 2;

  page.drawRectangle({ x: 0, y: 0, width, height, color: BRAND.paper });

  const topBarH = 10;
  page.drawRectangle({
    x: 0,
    y: height - topBarH,
    width,
    height: topBarH,
    color: BRAND.teal,
  });

  // Header: logo + tagline (compact — less empty space at top)
  let headerBottom = height - topBarH - 12;
  const logoJpg = resolveLogoJpgBytes();
  if (logoJpg) {
    try {
      const img = await pdfDoc.embedJpg(logoJpg);
      const maxW = 168;
      const scale = maxW / img.width;
      const lw = img.width * scale;
      const lh = img.height * scale;
      page.drawImage(img, {
        x: width / 2 - lw / 2,
        y: headerBottom - lh,
        width: lw,
        height: lh,
      });
      headerBottom -= lh + 8;
    } catch (e) {
      console.warn("[certificate-pdf] Could not embed logo:", e);
    }
  }

  const taglineBlockBottom = drawCenteredText(
    page,
    CERTIFICATE_HEADER_TAGLINE,
    headerBottom,
    8,
    font,
    BRAND.inkMuted,
    12
  );

  const zoneTop = taglineBlockBottom - MIN_GAP_AFTER_TAGLINE;
  const showAhaLine = AHA_CERTIFICATION_PROGRAM_TYPES.has(data.programType);
  const zoneBottom = FOOTER_DIVIDER_Y + (showAhaLine ? GAP_AHA_TO_FOOTER : GAP_COURSE_TO_FOOTER);

  const isCertificationProgramme = AHA_CERTIFICATION_PROGRAM_TYPES.has(data.programType);
  const courseName = isCertificationProgramme
    ? template.title
    : data.courseDisplayName?.trim() || template.title;

  const nameSize = Math.min(34, data.recipientName.length > 28 ? 26 : 34);
  const descLines = wrapTextByWidth(
    template.description,
    font,
    12,
    contentMaxWidth - 48
  );
  const bodyBlockHeight =
    CERTIFY_LINE_SIZE +
    GAP_CERTIFY_TO_NAME +
    nameSize +
    ORANGE_BELOW_NAME_BASELINE +
    GAP_ORANGE_TO_DESCRIPTION +
    descLines.length * (12 + 6);
  const available = zoneTop - zoneBottom;
  const certifyBaselineY = zoneTop - Math.max(0, (available - bodyBlockHeight) / 2);

  const certTitleBandTop = zoneTop;
  const certTitleBandBottom = certifyBaselineY;
  const certTitleY =
    certTitleBandTop > certTitleBandBottom
      ? certTitleBandBottom + (certTitleBandTop - certTitleBandBottom) / 2
      : certTitleBandBottom;

  drawCenteredText(
    page,
    "CERTIFICATE OF COMPLETION",
    certTitleY,
    CERTIFICATE_TITLE_SIZE,
    fontBold,
    BRAND.orange,
    0
  );
  let y = drawCenteredText(
    page,
    "This is to certify that",
    certifyBaselineY,
    CERTIFY_LINE_SIZE,
    font,
    BRAND.inkMuted,
    GAP_CERTIFY_TO_NAME
  );

  const nameBaselineY = y;
  const nameWidth = fontBold.widthOfTextAtSize(data.recipientName, nameSize);
  page.drawText(data.recipientName, {
    x: width / 2 - nameWidth / 2,
    y: nameBaselineY,
    size: nameSize,
    font: fontBold,
    color: BRAND.teal,
  });
  const orangeLineY = nameBaselineY - ORANGE_BELOW_NAME_BASELINE;
  page.drawLine({
    start: { x: width / 2 - 140, y: orangeLineY },
    end: { x: width / 2 + 140, y: orangeLineY },
    color: BRAND.orange,
    thickness: 1,
  });
  y = orangeLineY - GAP_ORANGE_TO_DESCRIPTION;

  y = drawWrappedCentered(page, template.description, y, 12, font, BRAND.ink, contentMaxWidth - 48);
  const descBlockBottom = y;
  const lastDescBaseline = descBlockBottom + 12 + 5;
  const minGapAboveFooter = showAhaLine ? GAP_AHA_TO_FOOTER : GAP_COURSE_TO_FOOTER;
  const courseTitleBandTop = lastDescBaseline - MIN_GAP_DESC_TO_COURSE;
  const courseTitleBandBottom = FOOTER_DIVIDER_Y + minGapAboveFooter;
  const courseTitleY =
    courseTitleBandTop > courseTitleBandBottom
      ? courseTitleBandBottom + (courseTitleBandTop - courseTitleBandBottom) / 2
      : courseTitleBandBottom;
  drawCenteredText(page, courseName, courseTitleY, COURSE_TITLE_SIZE, fontBold, BRAND.teal, 0);

  // Footer: rule on top; all metadata below the line
  if (showAhaLine) {
    drawCenteredText(
      page,
      "Aligned with 2025 American Heart Association Guidelines",
      FOOTER_DIVIDER_Y + GAP_AHA_TO_FOOTER - 2,
      7,
      font,
      BRAND.inkMuted,
      6
    );
  }

  page.drawLine({
    start: { x: MARGIN_X, y: FOOTER_DIVIDER_Y },
    end: { x: width - MARGIN_X, y: FOOTER_DIVIDER_Y },
    color: BRAND.tealLight,
    thickness: 0.5,
  });

  const expiryDate = new Date(data.trainingDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  const showExpiry = ["bls", "acls", "pals", "heartsaver"].includes(data.programType);

  const metadataRowY = FOOTER_DIVIDER_Y - SIGNATURE_PAD_HEIGHT - FOOTER_METADATA_BELOW_PAD;
  const signatureGuideY = metadataRowY + SIGNATURE_GUIDE_ABOVE_NAME;
  const sigGuideW = 220;
  page.drawLine({
    start: { x: width / 2 - sigGuideW / 2, y: signatureGuideY },
    end: { x: width / 2 + sigGuideW / 2, y: signatureGuideY },
    color: BRAND.inkMuted,
    thickness: 0.35,
  });

  const leftLines = [
    `Issued on: ${formatDate(data.trainingDate)}`,
    ...(showExpiry ? [`Valid until: ${formatDate(expiryDate)}`] : []),
    `Certificate No.: ${data.certificateNumber}`,
  ];
  page.drawText(leftLines[0], {
    x: MARGIN_X,
    y: metadataRowY,
    size: 9,
    font,
    color: BRAND.ink,
  });
  let leftY = metadataRowY - FOOTER_ROW_GAP;
  for (let i = 1; i < leftLines.length; i++) {
    page.drawText(leftLines[i], { x: MARGIN_X, y: leftY, size: 9, font, color: BRAND.ink });
    leftY -= FOOTER_ROW_GAP;
  }

  drawCenteredText(page, CERTIFICATE_SIGNATORY_NAME, metadataRowY, 11, fontBold, BRAND.teal, 4);
  drawCenteredText(page, CERTIFICATE_SIGNATORY_TITLE, metadataRowY - 13, 9, font, BRAND.inkMuted, 4);

  const verifyUrl = `${CERTIFICATE_VERIFY_SITE}/verify?code=${encodeURIComponent(data.verificationCode)}`;
  const qrSize = 52;
  const qrX = width - MARGIN_X - qrSize;
  const qrY = metadataRowY - qrSize / 2 + 4;
  try {
    const qrPng = await QRCode.toBuffer(verifyUrl, {
      type: "png",
      width: 180,
      margin: 1,
      color: { dark: "#1b3d3dff", light: "#ffffffff" },
    });
    const qrImg = await pdfDoc.embedPng(qrPng);
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    const verifyText = "Scan to verify";
    const vtW = font.widthOfTextAtSize(verifyText, 7);
    page.drawText(verifyText, {
      x: qrX + (qrSize - vtW) / 2,
      y: qrY - 11,
      size: 7,
      font,
      color: BRAND.inkMuted,
    });
    const urlText = "paedsresus.com/verify";
    const urlW = font.widthOfTextAtSize(urlText, 6);
    page.drawText(urlText, {
      x: qrX + (qrSize - urlW) / 2,
      y: qrY - 20,
      size: 6,
      font,
      color: BRAND.inkMuted,
    });
  } catch (e) {
    console.warn("[certificate-pdf] QR code failed:", e);
    page.drawText("Verify at paedsresus.com/verify", {
      x: qrX,
      y: MARGIN_BOTTOM + 4,
      size: 7,
      font,
      color: BRAND.inkMuted,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapTextByWidth(
  text: string,
  textFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (textFont.widthOfTextAtSize(candidate, size) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** @deprecated Use wrapTextByWidth — kept for any external imports */
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + word).length > maxLength) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

/** International (en-GB) long date — e.g. 21 May 2026 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function saveCertificateFile(pdfBuffer: Buffer, certificateNumber: string): Promise<string> {
  const dir = path.join(process.cwd(), "certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${certificateNumber}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}
