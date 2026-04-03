/**
 * Certificate PDF Generation Service
 * Generates branded PDF certificates (Paeds Resus teal + orange) with optional logo
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

/** Brand tokens aligned with client `index.css` / theme */
const BRAND = {
  teal: rgb(27 / 255, 61 / 255, 61 / 255),
  tealLight: rgb(42 / 255, 90 / 255, 90 / 255),
  orange: rgb(243 / 255, 112 / 255, 33 / 255),
  paper: rgb(0.99, 0.99, 0.98),
  ink: rgb(0.12, 0.14, 0.16),
  inkMuted: rgb(0.38, 0.4, 0.42),
};

interface CertificateData {
  recipientName: string;
  programType: "bls" | "acls" | "pals" | "fellowship" | "instructor";
  trainingDate: Date;
  instructorName: string;
  certificateNumber: string;
  verificationCode: string;
  completionHours?: number;
}

interface CertificateTemplate {
  title: string;
  subtitle: string;
  description: string;
  hours: number;
}

const CERTIFICATE_TEMPLATES: Record<string, CertificateTemplate> = {
  bls: {
    title: "Basic Life Support",
    subtitle: "BLS Certification",
    description:
      "has successfully completed the Basic Life Support training programme and meets the completion requirements of Paeds Resus.",
    hours: 8,
  },
  acls: {
    title: "Advanced Cardiovascular Life Support",
    subtitle: "ACLS Certification",
    description:
      "has successfully completed the Advanced Cardiovascular Life Support training programme and meets the completion requirements of Paeds Resus.",
    hours: 16,
  },
  pals: {
    title: "Pediatric Advanced Life Support",
    subtitle: "PALS Certification",
    description:
      "has successfully completed the Pediatric Advanced Life Support training programme and meets the completion requirements of Paeds Resus.",
    hours: 16,
  },
  fellowship: {
    title: "Paeds Resus Elite Fellowship",
    subtitle: "Fellowship Certification",
    description:
      "has successfully completed the Paeds Resus Elite Fellowship programme and meets the completion requirements of Paeds Resus.",
    hours: 120,
  },
  instructor: {
    title: "Paeds Resus Instructor Course",
    subtitle: "Instructor Certification",
    description:
      "has successfully completed the Paeds Resus Instructor Course and meets the completion requirements of Paeds Resus.",
    hours: 6,
  },
};

function isPngBuffer(buf: Buffer): boolean {
  return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

function resolveLogoPngBytes(): Buffer | null {
  const candidates = [
    path.join(process.cwd(), "client", "public", "paeds-resus-logo-brand.png"),
    path.join(process.cwd(), "client", "public", "paeds-resus-logo.png"),
    path.join(process.cwd(), "dist", "public", "paeds-resus-logo-brand.png"),
    path.join(process.cwd(), "dist", "public", "paeds-resus-logo.png"),
    path.join(__dirname, "..", "client", "public", "paeds-resus-logo-brand.png"),
    path.join(__dirname, "..", "client", "public", "paeds-resus-logo.png"),
    path.join(__dirname, "..", "..", "client", "public", "paeds-resus-logo-brand.png"),
    path.join(__dirname, "..", "..", "client", "public", "paeds-resus-logo.png"),
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      if (isPngBuffer(buf)) return buf;
    } catch {
      /* continue */
    }
  }
  return null;
}

/**
 * Generate certificate PDF (landscape A4-style: 842 × 595 pt)
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const width = 842;
  const height = 595;
  const page = pdfDoc.addPage([width, height]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const template = CERTIFICATE_TEMPLATES[data.programType] ?? CERTIFICATE_TEMPLATES.bls;

  const topBarH = 56;
  page.drawRectangle({
    x: 0,
    y: height - topBarH,
    width,
    height: topBarH,
    color: BRAND.teal,
  });

  const orgTitle = "PAEDS RESUS";
  const orgW = fontBold.widthOfTextAtSize(orgTitle, 13);
  page.drawText(orgTitle, {
    x: width / 2 - orgW / 2,
    y: height - 36,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const tag = "Elite Fellowship & Safe-Truth Platform";
  const tagW = font.widthOfTextAtSize(tag, 8);
  page.drawText(tag, {
    x: width / 2 - tagW / 2,
    y: height - 50,
    size: 8,
    font,
    color: rgb(0.92, 0.95, 0.95),
  });

  const logoBytes = resolveLogoPngBytes();
  let logoBottomY = height - topBarH - 12;
  if (logoBytes) {
    try {
      const img = await pdfDoc.embedPng(logoBytes);
      const maxW = 168;
      const scale = maxW / img.width;
      const lw = img.width * scale;
      const lh = img.height * scale;
      const logoY = height - topBarH - 16 - lh;
      page.drawImage(img, {
        x: width / 2 - lw / 2,
        y: logoY,
        width: lw,
        height: lh,
      });
      logoBottomY = logoY;
    } catch (e) {
      console.warn("[certificate-pdf] Could not embed logo:", e);
    }
  }

  const panelTop = logoBottomY - 20;
  const panelBottom = 40;

  page.drawRectangle({
    x: 36,
    y: panelBottom,
    width: width - 72,
    height: panelTop - panelBottom,
    borderColor: BRAND.teal,
    borderWidth: 2,
    color: BRAND.paper,
  });

  page.drawRectangle({
    x: 44,
    y: panelBottom + 8,
    width: width - 88,
    height: panelTop - panelBottom - 16,
    borderColor: BRAND.orange,
    borderWidth: 1,
  });

  let y = panelTop - 56;

  const certLabel = "Certificate of Completion";
  const certW = fontBold.widthOfTextAtSize(certLabel, 26);
  page.drawText(certLabel, {
    x: width / 2 - certW / 2,
    y,
    size: 26,
    font: fontBold,
    color: BRAND.teal,
  });
  y -= 36;

  const subW = font.widthOfTextAtSize(template.subtitle, 12);
  page.drawText(template.subtitle, {
    x: width / 2 - subW / 2,
    y,
    size: 12,
    font,
    color: BRAND.tealLight,
  });
  y -= 40;

  const hereby = "This is to certify that";
  const herebyW = font.widthOfTextAtSize(hereby, 11);
  page.drawText(hereby, {
    x: width / 2 - herebyW / 2,
    y,
    size: 11,
    font,
    color: BRAND.inkMuted,
  });
  y -= 44;

  const nameSize = Math.min(34, 18 + Math.max(0, 14 - data.recipientName.length * 0.25));
  const nameW = fontBold.widthOfTextAtSize(data.recipientName, nameSize);
  page.drawText(data.recipientName, {
    x: width / 2 - nameW / 2,
    y,
    size: nameSize,
    font: fontBold,
    color: BRAND.teal,
  });
  y -= nameSize + 28;

  const descLines = wrapText(template.description, 88);
  for (const line of descLines) {
    const lw = font.widthOfTextAtSize(line, 11);
    page.drawText(line, {
      x: width / 2 - lw / 2,
      y,
      size: 11,
      font,
      color: BRAND.ink,
    });
    y -= 16;
  }

  y -= 24;
  const hours = data.completionHours ?? template.hours;
  const details: [string, string][] = [
    ["Programme", template.title],
    ["Completion date", formatDate(data.trainingDate)],
    ["Credit hours recorded", String(hours)],
    ["Faculty / signatory", data.instructorName || "Paeds Resus"],
  ];

  const boxLeft = width / 2 - 220;
  const boxW = 440;
  const boxH = details.length * 22 + 24;
  page.drawRectangle({
    x: boxLeft,
    y: y - boxH + 18,
    width: boxW,
    height: boxH,
    color: rgb(0.96, 0.98, 0.98),
    borderColor: rgb(0.85, 0.9, 0.9),
    borderWidth: 1,
  });

  let dy = y - 14;
  for (const [k, v] of details) {
    page.drawText(k, {
      x: boxLeft + 16,
      y: dy,
      size: 9,
      font,
      color: BRAND.inkMuted,
    });
    page.drawText(v, {
      x: boxLeft + 140,
      y: dy,
      size: 10,
      font: fontBold,
      color: BRAND.ink,
    });
    dy -= 22;
  }

  const footY = 52;
  page.drawLine({
    start: { x: width / 2 - 90, y: footY + 42 },
    end: { x: width / 2 + 90, y: footY + 42 },
    color: BRAND.orange,
    thickness: 2,
  });
  page.drawText("Authorised representative", {
    x: width / 2 - font.widthOfTextAtSize("Authorised representative", 9) / 2,
    y: footY + 28,
    size: 9,
    font,
    color: BRAND.inkMuted,
  });

  page.drawText(`Certificate No. ${data.certificateNumber}`, {
    x: 56,
    y: footY,
    size: 9,
    font,
    color: BRAND.inkMuted,
  });

  const verifyLine = `Verify: www.paedsresus.com/verify · Code ${data.verificationCode}`;
  page.drawText(verifyLine, {
    x: width - 56 - font.widthOfTextAtSize(verifyLine, 9),
    y: footY,
    size: 9,
    font: fontBold,
    color: BRAND.teal,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

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

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-GB", options);
}

/**
 * Save certificate PDF to file
 */
export async function saveCertificateFile(
  pdfBuffer: Buffer,
  certificateNumber: string
): Promise<string> {
  try {
    const certificatesDir = path.join(process.cwd(), "certificates");

    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const filePath = path.join(certificatesDir, `${certificateNumber}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    return filePath;
  } catch (error) {
    console.error("Error saving certificate file:", error);
    throw error;
  }
}

/**
 * Generate certificate filename
 */
export function generateCertificateFilename(
  recipientName: string,
  programType: string,
  date: Date
): string {
  const sanitizedName = recipientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const dateStr = date.toISOString().split("T")[0];
  return `${sanitizedName}_${programType}_${dateStr}`;
}
