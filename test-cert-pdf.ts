/**
 * Test script: generate a certificate PDF and save it to /tmp/test-cert.pdf
 * Run with: npx tsx test-cert-pdf.ts
 */
import { generateCertificatePDF } from "./server/certificate-pdf.js";
import * as fs from "fs";

async function main() {
  console.log("Testing certificate PDF generation...");
  try {
    const pdfBuffer = await generateCertificatePDF({
      recipientName: "Job Karue",
      programType: "fellowship",
      trainingDate: new Date(),
      instructorName: "Paeds Resus",
      certificateNumber: "PRES-TEST-001",
      verificationCode: "test-verification-code",
      courseDisplayName: "Paediatric Asthma I: Recognition and Initial Management",
    });
    fs.writeFileSync("/tmp/test-cert.pdf", pdfBuffer);
    console.log(`SUCCESS: PDF generated, size=${pdfBuffer.length} bytes, saved to /tmp/test-cert.pdf`);
  } catch (err) {
    console.error("FAILED:", err);
    process.exit(1);
  }
}

main();
