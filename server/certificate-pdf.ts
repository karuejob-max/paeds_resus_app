/**
 * Certificate PDF Generation Service
 * Generates branded PDF certificates with verification codes
 */

import { PDFDocument, PDFPage, rgb, degrees } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

interface CertificateData {
  recipientName: string;
  programType: "bls" | "acls" | "pals" | "fellowship";
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
  color: { r: number; g: number; b: number };
  hours: number;
}

const CERTIFICATE_TEMPLATES: Record<string, CertificateTemplate> = {
  bls: {
    title: "Basic Life Support",
    subtitle: "BLS Certification",
    description: "Successfully completed the Basic Life Support training course",
    color: { r: 26, g: 77, b: 77 }, // Teal
    hours: 8,
  },
  acls: {
    title: "Advanced Cardiovascular Life Support",
    subtitle: "ACLS Certification",
    description: "Successfully completed the Advanced Cardiovascular Life Support training course",
    color: { r: 220, g: 38, b: 38 }, // Red
    hours: 16,
  },
  pals: {
    title: "Pediatric Advanced Life Support",
    subtitle: "PALS Certification",
    description: "Successfully completed the Pediatric Advanced Life Support training course",
    color: { r: 59, g: 130, b: 246 }, // Blue
    hours: 16,
  },
  fellowship: {
    title: "Paeds Resus Elite Fellowship",
    subtitle: "Fellowship Certification",
    description: "Successfully completed the Paeds Resus Elite Fellowship program",
    color: { r: 168, g: 85, b: 247 }, // Purple
    hours: 120,
  },
};

/**
 * Generate certificate PDF
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  try {
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size (8.5" x 11")

    const { width, height } = page.getSize();
    const template = CERTIFICATE_TEMPLATES[data.programType];

    // Draw background color bar
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(template.color.r / 255, template.color.g / 255, template.color.b / 255),
    });

    // Draw decorative border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(template.color.r / 255, template.color.g / 255, template.color.b / 255),
      borderWidth: 2,
    });

    // Organization name (top)
    page.drawText("PAEDS RESUS", {
      x: width / 2 - 80,
      y: height - 50,
      size: 28,
      color: rgb(1, 1, 1),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Subtitle
    page.drawText("Elite Fellowship and Safe-Truth Platform", {
      x: width / 2 - 150,
      y: height - 70,
      size: 12,
      color: rgb(1, 1, 1),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Certificate title
    page.drawText("Certificate of Completion", {
      x: 50,
      y: height - 150,
      size: 36,
      color: rgb(template.color.r / 255, template.color.g / 255, template.color.b / 255),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Program name
    page.drawText(template.title, {
      x: 50,
      y: height - 190,
      size: 24,
      color: rgb(0.2, 0.2, 0.2),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Recipient name (large)
    page.drawText(data.recipientName, {
      x: 50,
      y: height - 280,
      size: 32,
      color: rgb(template.color.r / 255, template.color.g / 255, template.color.b / 255),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Description
    const descriptionLines = wrapText(template.description, 70);
    let descY = height - 320;
    for (const line of descriptionLines) {
      page.drawText(line, {
        x: 50,
        y: descY,
        size: 12,
        color: rgb(0.3, 0.3, 0.3),
        font: await pdfDoc.embedFont("Helvetica"),
      });
      descY -= 18;
    }

    // Training details section
    const detailsY = height - 450;
    page.drawText("Training Details", {
      x: 50,
      y: detailsY,
      size: 14,
      color: rgb(0.2, 0.2, 0.2),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Training date
    page.drawText(`Date: ${formatDate(data.trainingDate)}`, {
      x: 50,
      y: detailsY - 25,
      size: 11,
      color: rgb(0.3, 0.3, 0.3),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Hours completed
    const hours = data.completionHours || template.hours;
    page.drawText(`Hours Completed: ${hours}`, {
      x: 50,
      y: detailsY - 45,
      size: 11,
      color: rgb(0.3, 0.3, 0.3),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Instructor name
    page.drawText(`Instructor: ${data.instructorName}`, {
      x: 50,
      y: detailsY - 65,
      size: 11,
      color: rgb(0.3, 0.3, 0.3),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Signature line
    page.drawLine({
      start: { x: 50, y: detailsY - 110 },
      end: { x: 200, y: detailsY - 110 },
      color: rgb(template.color.r / 255, template.color.g / 255, template.color.b / 255),
      thickness: 2,
    });

    page.drawText("Authorized Signature", {
      x: 50,
      y: detailsY - 125,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Certificate number and verification code (bottom)
    page.drawText(`Certificate #: ${data.certificateNumber}`, {
      x: 50,
      y: 80,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    page.drawText(`Verification Code: ${data.verificationCode}`, {
      x: 50,
      y: 60,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    page.drawText("Verify at: www.paeds-resus.com/verify", {
      x: 50,
      y: 40,
      size: 9,
      color: rgb(template.color.r / 255, template.color.g / 255, template.color.b / 255),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Save and return PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    throw error;
  }
}

/**
 * Helper function to wrap text
 */
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

/**
 * Format date for certificate
 */
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
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

    // Create directory if it doesn't exist
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
