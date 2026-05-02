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

/** Shown under “PAEDS RESUS” on all certificates — neutral; not fellowship-specific. */
const CERTIFICATE_HEADER_TAGLINE = "Global Benchmark for Paediatric Resuscitation Science";

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
    title: "Pediatric Advanced Life Support",
    subtitle: "PALS Certification",
    description:
      "has successfully completed the Pediatric Advanced Life Support training programme and meets the international standards of Paeds Resus for pediatric emergency care.",
    hours: 16,
  },
  fellowship: {
    title: "Micro-Course Excellence",
    subtitle: "Fellowship Module Certification",
    description:
      "has successfully completed this specialized module as part of the Paeds Resus Fellowship, demonstrating clinical competence in pediatric resuscitation.",
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

  // Background Design - Elegant Border
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: BRAND.paper,
  });

  // Top Accent Bar
  const topBarH = 12;
  page.drawRectangle({
    x: 0,
    y: height - topBarH,
    width,
    height: topBarH,
    color: BRAND.teal,
  });

  // Logo Integration
  const logoJpg = resolveLogoJpgBytes();
  if (logoJpg) {
    try {
      const img = await pdfDoc.embedJpg(logoJpg);
      const maxW = 220;
      const scale = maxW / img.width;
      const lw = img.width * scale;
      const lh = img.height * scale;
      page.drawImage(img, {
        x: width / 2 - lw / 2,
        y: height - topBarH - 30 - lh,
        width: lw,
        height: lh,
      });
    } catch (e) {
      console.warn("[certificate-pdf] Could not embed logo:", e);
    }
  }

  let y = height - 200;

  // Tagline
  const tag = CERTIFICATE_HEADER_TAGLINE;
  const tagW = font.widthOfTextAtSize(tag, 9);
  page.drawText(tag, {
    x: width / 2 - tagW / 2,
    y,
    size: 9,
    font,
    color: BRAND.inkMuted,
  });
  y -= 45;

  // Certificate Label
  const certLabel = "CERTIFICATE OF COMPLETION";
  const certW = fontBold.widthOfTextAtSize(certLabel, 16);
  page.drawText(certLabel, {
    x: width / 2 - certW / 2,
    y,
    size: 16,
    font: fontBold,
    color: BRAND.orange,
  });
  y -= 40;

  // Recipient Name
  const hereby = "This is to certify that";
  const herebyW = font.widthOfTextAtSize(hereby, 12);
  page.drawText(hereby, {
    x: width / 2 - herebyW / 2,
    y,
    size: 12,
    font,
    color: BRAND.inkMuted,
  });
  y -= 45;

  const nameSize = 36;
  const nameW = fontBold.widthOfTextAtSize(data.recipientName, nameSize);
  page.drawText(data.recipientName, {
    x: width / 2 - nameW / 2,
    y,
    size: nameSize,
    font: fontBold,
    color: BRAND.teal,
  });
  y -= 40;

  // Horizontal Divider
  page.drawLine({
    start: { x: width / 2 - 150, y },
    end: { x: width / 2 + 150, y },
    color: BRAND.orange,
    thickness: 1,
  });
  y -= 35;

  // Course Description
  const courseName = data.courseDisplayName?.trim() || template.title;
  const bodyDescription = template.description;
  const descLines = wrapText(bodyDescription, 80);
  for (const line of descLines) {
    const lw = font.widthOfTextAtSize(line, 13);
    page.drawText(line, {
      x: width / 2 - lw / 2,
      y,
      size: 13,
      font,
      color: BRAND.ink,
    });
    y -= 18;
  }
  y -= 25;

  // Specific Course Title (Bold)
  const courseTitleSize = 18;
  const courseTitleW = fontBold.widthOfTextAtSize(courseName, courseTitleSize);
  page.drawText(courseName, {
    x: width / 2 - courseTitleW / 2,
    y,
    size: courseTitleSize,
    font: fontBold,
    color: BRAND.teal,
  });
  y -= 60;

  // Footer Details (Date, ID, QR)
  // footY raised to 100 to give the QR code (height=70) a top edge at ~165,
  // safely below the course title which can reach as low as ~140 on long titles.
  const footY = 100;
  
  // Date
  page.drawText(`Date of Issue: ${formatDate(data.trainingDate)}`, {
    x: 80,
    y: footY,
    size: 10,
    font,
    color: BRAND.ink,
  });

  // Certificate ID
  page.drawText(`Certificate ID: ${data.certificateNumber}`, {
    x: 80,
    y: footY - 15,
    size: 10,
    font,
    color: BRAND.ink,
  });

  // Verification QR Code
  const verifyUrl = `${CERTIFICATE_VERIFY_SITE}/verify?code=${encodeURIComponent(data.verificationCode)}`;
  try {
    const qrPng = await QRCode.toBuffer(verifyUrl, {
      type: "png",
      width: 200,
      margin: 1,
      color: { dark: "#1b3d3dff", light: "#ffffffff" },
    });
    const qrImg = await pdfDoc.embedPng(qrPng);
    const qrSize = 70;
    page.drawImage(qrImg, { 
      x: width - 80 - qrSize, 
      y: footY - 5,   // QR top edge = footY - 5 + qrSize = footY + 65 — clear of course title
      width: qrSize, 
      height: qrSize 
    });
    
    // Verify text sits below the QR code with 4px gap
    const verifyText = "Verify at paedsresus.com/verify";
    const vtW = font.widthOfTextAtSize(verifyText, 7);
    page.drawText(verifyText, {
      x: width - 80 - qrSize + (qrSize - vtW) / 2,
      y: footY - 14,  // 9px below the QR bottom edge
      size: 7,
      font,
      color: BRAND.inkMuted,
    });
  } catch (e) {
    console.warn("[certificate-pdf] QR code failed:", e);
  }

  // Authorized Signature (Placeholder for future digital signature)
  const sigW = 180;
  const sigX = width / 2 - sigW / 2;
  page.drawLine({
    start: { x: sigX, y: footY + 10 },
    end: { x: sigX + sigW, y: footY + 10 },
    color: BRAND.ink,
    thickness: 0.5,
  });
  const repText = "Authorised Representative";
  const repW = font.widthOfTextAtSize(repText, 10);
  page.drawText(repText, {
    x: width / 2 - repW / 2,
    y: footY - 5,
    size: 10,
    font,
    color: BRAND.inkMuted,
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
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function saveCertificateFile(pdfBuffer: Buffer, certificateNumber: string): Promise<string> {
  const dir = path.join(process.cwd(), "certificates");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${certificateNumber}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}
