import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

/**
 * CNE certificate generator — A5 landscape, fully programmatic (no external image
 * assets, so it survives esbuild bundling in production). Kept intentionally separate
 * from the main app's pdf-lib certificate system (server/certificate-pdf.ts).
 */

export type CneCadre = "BSN" | "KRCHN" | "KRN" | "Other";

export interface CneCertificateData {
  fullName: string;
  cadre: CneCadre;
  cadreOther?: string | null;
  eventName: string;
  eventDate: string;
  /** Defaults to "CNE Coordinator" if the institution has not set a name. */
  coordinatorName?: string | null;
  institutionName: string;
}

// Brand palette (navy / cyan / pink) used across the certificate.
const COLORS = {
  navy: "#0B2447",
  navySoft: "#19376D",
  cyan: "#1FB6C1",
  pink: "#E84A8A",
  ink: "#1A2233",
  muted: "#5B6577",
  paper: "#FFFFFF",
  watermark: "#EEF3F8",
};

/** Human-readable cadre label, expanding "Other" to the free-text value when present. */
export function formatCadreLabel(cadre: CneCadre, cadreOther?: string | null): string {
  if (cadre === "Other") {
    const other = (cadreOther ?? "").trim();
    return other.length ? other : "Other";
  }
  return cadre;
}

/** Safe download filename, e.g. "CNE-Certificate-Jane-Doe-Sepsis-Update.pdf". */
export function cneCertificateFilename(fullName: string, eventName: string): string {
  const slug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "attendee";
  return `CNE-Certificate-${slug(fullName)}-${slug(eventName)}.pdf`;
}

/**
 * Generate the CNE certificate and return a readable PassThrough stream of the PDF bytes.
 * Caller is responsible for piping the stream to an HTTP response or buffering it.
 */
export function generateCneCertificatePdf(data: CneCertificateData): PassThrough {
  const doc = new PDFDocument({
    size: "A5",
    layout: "landscape",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  const W = doc.page.width; // ~595.28 (A5 landscape width)
  const H = doc.page.height; // ~419.53

  const coordinator = (data.coordinatorName ?? "").trim() || "CNE Coordinator";
  const institution = (data.institutionName ?? "").trim() || "Healthcare Institution";
  const cadreLabel = formatCadreLabel(data.cadre, data.cadreOther);

  // --- Background -------------------------------------------------------------
  doc.rect(0, 0, W, H).fill(COLORS.paper);

  // --- Watermark (large faint institution text, centered, rotated) ------------
  doc.save();
  doc.rotate(-28, { origin: [W / 2, H / 2] });
  doc
    .fillColor(COLORS.watermark)
    .font("Helvetica-Bold")
    .fontSize(46)
    .text(institution.toUpperCase(), 0, H / 2 - 30, {
      width: W,
      align: "center",
    });
  doc.restore();

  // --- Double border ----------------------------------------------------------
  doc
    .lineWidth(3)
    .strokeColor(COLORS.navy)
    .rect(16, 16, W - 32, H - 32)
    .stroke();
  doc
    .lineWidth(1)
    .strokeColor(COLORS.cyan)
    .rect(24, 24, W - 48, H - 48)
    .stroke();

  // --- Header band ------------------------------------------------------------
  const headerY = 40;
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(institution.toUpperCase(), 40, headerY, {
      width: W - 80,
      align: "center",
    });
  doc
    .fillColor(COLORS.cyan)
    .font("Helvetica")
    .fontSize(9)
    .text("CONTINUING NURSING EDUCATION", 40, headerY + 22, {
      width: W - 80,
      align: "center",
      characterSpacing: 2,
    });

  // Accent divider under header
  const dividerY = headerY + 40;
  doc
    .moveTo(W / 2 - 70, dividerY)
    .lineTo(W / 2 + 70, dividerY)
    .lineWidth(1.5)
    .strokeColor(COLORS.pink)
    .stroke();

  // --- Title ------------------------------------------------------------------
  const titleY = dividerY + 14;
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica")
    .fontSize(13)
    .text("CERTIFICATE", 40, titleY, { width: W - 80, align: "center", characterSpacing: 4 });
  doc
    .fillColor(COLORS.navySoft)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text("of Attendance", 40, titleY + 18, { width: W - 80, align: "center" });

  // --- Recipient --------------------------------------------------------------
  const presentedY = titleY + 46;
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text("This certifies that", 40, presentedY, { width: W - 80, align: "center" });

  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(26)
    .text(data.fullName, 40, presentedY + 14, { width: W - 80, align: "center" });

  // Underline beneath the name
  const nameUnderlineY = presentedY + 48;
  doc
    .moveTo(W / 2 - 130, nameUnderlineY)
    .lineTo(W / 2 + 130, nameUnderlineY)
    .lineWidth(0.75)
    .strokeColor(COLORS.muted)
    .stroke();

  // --- Cadre pill -------------------------------------------------------------
  const pillText = cadreLabel.toUpperCase();
  doc.font("Helvetica-Bold").fontSize(8);
  const pillTextWidth = doc.widthOfString(pillText, { characterSpacing: 1 });
  const pillPadX = 12;
  const pillW = pillTextWidth + pillPadX * 2;
  const pillH = 16;
  const pillX = (W - pillW) / 2;
  const pillY = nameUnderlineY + 8;
  doc.roundedRect(pillX, pillY, pillW, pillH, 8).fill(COLORS.cyan);
  doc
    .fillColor(COLORS.paper)
    .text(pillText, pillX, pillY + 4, {
      width: pillW,
      align: "center",
      characterSpacing: 1,
    });

  // --- Event details ----------------------------------------------------------
  const eventY = pillY + pillH + 10;
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text("has attended the Continuing Nursing Education session", 40, eventY, {
      width: W - 80,
      align: "center",
    });
  doc
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(data.eventName, 40, eventY + 13, { width: W - 80, align: "center" });
  doc
    .fillColor(COLORS.navySoft)
    .font("Helvetica")
    .fontSize(10)
    .text(`Held on ${data.eventDate}`, 40, eventY + 31, { width: W - 80, align: "center" });

  // --- Footer: seal (left) + signature (right) --------------------------------
  const footerBaseY = H - 70;

  // Official seal — concentric circles with institution initials.
  const sealCx = 90;
  const sealCy = footerBaseY - 4;
  const sealR = 30;
  doc.lineWidth(2).strokeColor(COLORS.navy).circle(sealCx, sealCy, sealR).stroke();
  doc.lineWidth(0.75).strokeColor(COLORS.cyan).circle(sealCx, sealCy, sealR - 5).stroke();
  const initials =
    institution
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 3)
      .join("")
      .toUpperCase() || "CNE";
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(initials, sealCx - sealR, sealCy - 12, { width: sealR * 2, align: "center" });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(5)
    .text("OFFICIAL SEAL", sealCx - sealR, sealCy + 6, {
      width: sealR * 2,
      align: "center",
      characterSpacing: 1,
    });

  // Signature line — coordinator name flows from institution settings.
  const sigRight = W - 50;
  const sigWidth = 170;
  const sigX = sigRight - sigWidth;
  const sigLineY = footerBaseY + 2;
  doc.moveTo(sigX, sigLineY).lineTo(sigRight, sigLineY).lineWidth(0.75).strokeColor(COLORS.ink).stroke();
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(coordinator, sigX, sigLineY + 4, { width: sigWidth, align: "center" });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(7)
    .text("CNE Coordinator", sigX, sigLineY + 17, { width: sigWidth, align: "center" });

  doc.end();
  return stream;
}
