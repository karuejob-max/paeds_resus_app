import * as dotenv from 'dotenv';
dotenv.config();
import { generateCertificatePDF } from './server/certificate-pdf';

async function main() {
  try {
    const buf = await generateCertificatePDF({
      recipientName: "Test Provider",
      programType: "fellowship",
      trainingDate: new Date(),
      instructorName: "Paeds Resus",
      certificateNumber: "PRES-TEST-123456",
      verificationCode: "abc123def456",
      courseDisplayName: "Paediatric Asthma I",
    });
    console.log("PDF generated successfully, size:", buf.length, "bytes");
  } catch (err) {
    console.error("PDF generation FAILED:", err);
  }
}

main().catch(console.error);
