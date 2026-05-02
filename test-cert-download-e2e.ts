/**
 * End-to-end test: simulate the full certificate download flow for all certs owned by userId=1
 * Run with: npx tsx test-cert-download-e2e.ts
 */
import "dotenv/config";
import { getCertificateForDownload, hasCertificateDownloadFeedback } from "./server/certificates.js";
import { generateCertificatePDF } from "./server/certificate-pdf.js";
import { getDb } from "./server/db.js";
import { certificates } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import * as fs from "fs";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const userId = 1;
  const allCerts = await db.select().from(certificates).where(eq(certificates.userId, userId));
  console.log(`Found ${allCerts.length} certificates for userId=${userId}\n`);

  for (const cert of allCerts) {
    console.log(`\n--- Testing cert: ${cert.certificateNumber} (id=${cert.id}, type=${cert.programType}) ---`);

    // Step 1: getCertificateForDownload
    const data = await getCertificateForDownload(cert.certificateNumber!, userId);
    if (!data) {
      console.error(`  FAIL: getCertificateForDownload returned null`);
      continue;
    }
    console.log(`  getCertificateForDownload: OK (recipient=${data.recipientName}, courseDisplay=${data.courseDisplayName})`);

    // Step 2: hasCertificateDownloadFeedback
    const feedbackOk = await hasCertificateDownloadFeedback(userId, cert.id);
    console.log(`  hasCertificateDownloadFeedback: ${feedbackOk ? "OK (feedback submitted)" : "BLOCKED (no feedback yet)"}`);

    if (!feedbackOk) {
      console.log(`  -> Would return { success: false, error: 'feedback_required', certificateId: ${cert.id} }`);
      continue;
    }

    // Step 3: generateCertificatePDF
    try {
      const pdfBuffer = await generateCertificatePDF({
        recipientName: data.recipientName,
        programType: data.cert.programType as any,
        trainingDate: data.trainingDate,
        instructorName: "Paeds Resus",
        certificateNumber: data.cert.certificateNumber ?? "",
        verificationCode: data.cert.verificationCode ?? data.cert.certificateNumber ?? "",
        ...(data.courseDisplayName ? { courseDisplayName: data.courseDisplayName } : {}),
      });
      const outPath = `/tmp/test-${cert.certificateNumber}.pdf`;
      fs.writeFileSync(outPath, pdfBuffer);
      console.log(`  generateCertificatePDF: OK (${pdfBuffer.length} bytes) -> ${outPath}`);
    } catch (err) {
      console.error(`  generateCertificatePDF: FAIL`, err);
    }
  }

  console.log("\n=== Summary ===");
  console.log("All certificates tested. Check above for any FAIL or BLOCKED entries.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
