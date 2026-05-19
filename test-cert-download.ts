import * as dotenv from 'dotenv';
dotenv.config();
import { getCertificateForDownload, hasCertificateDownloadFeedback } from './server/certificates';
import { generateCertificatePDF } from './server/certificate-pdf';

async function main() {
  // Real cert number from database: PRES-MOMPXP4J-X58C71 (userId=1, certId=2)
  const certNumber = "PRES-MOMPXP4J-X58C71";
  const userId = 1;

  console.log("=== Testing getCertificateForDownload ===");
  const data = await getCertificateForDownload(certNumber, userId);
  if (!data) {
    console.error("FAIL: getCertificateForDownload returned null");
    return;
  }
  console.log("OK: cert found:", {
    id: data.cert.id,
    certNumber: data.cert.certificateNumber,
    programType: data.cert.programType,
    enrollmentId: data.cert.enrollmentId,
    microCourseEnrollmentId: (data.cert as any).microCourseEnrollmentId,
    trainingDate: data.trainingDate,
    recipientName: data.recipientName,
    courseDisplayName: data.courseDisplayName,
  });

  console.log("\n=== Testing hasCertificateDownloadFeedback ===");
  const feedbackOk = await hasCertificateDownloadFeedback(userId, data.cert.id);
  console.log("Feedback submitted:", feedbackOk);

  if (!feedbackOk) {
    console.log("BLOCKED: feedback_required — user must submit feedback first");
    return;
  }

  console.log("\n=== Testing PDF generation ===");
  try {
    const pdfBuffer = await generateCertificatePDF({
      recipientName: data.recipientName,
      programType: data.cert.programType,
      trainingDate: data.trainingDate,
      instructorName: "Paeds Resus",
      certificateNumber: data.cert.certificateNumber ?? "",
      verificationCode: data.cert.verificationCode ?? data.cert.certificateNumber ?? "",
      courseDisplayName: data.courseDisplayName ?? undefined,
    });
    console.log("OK: PDF generated, size:", pdfBuffer.length, "bytes");
    console.log("\n✅ FULL DOWNLOAD FLOW WORKS — the issue is in the frontend, not the backend");
  } catch (err) {
    console.error("FAIL: PDF generation threw:", err);
  }
}

main().catch(console.error);
