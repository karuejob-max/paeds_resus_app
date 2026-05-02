/**
 * Issue missing certificates for enrollments that completed but never got a cert
 * due to the enum bug (bls_cognitive, acls_cognitive not in DB enum).
 *
 * Run with: npx tsx issue-missing-certs.ts
 */
import "dotenv/config";
import { saveAhaCognitiveCertificate, saveMicroCourseCertificate } from "./server/certificates.js";
import { getDb } from "./server/db.js";
import { users, microCourses } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Get user name for userId=1
  const userRows = await db.select({ name: users.name }).from(users).where(eq(users.id, 1)).limit(1);
  const recipientName = userRows[0]?.name ?? "Participant";
  console.log(`Recipient: ${recipientName}`);

  // 1. Issue BLS cognitive cert for enrollment 9 (BLS, cognitiveModulesComplete=1, paymentStatus=completed)
  console.log("\n[1] Issuing BLS cognitive cert for enrollment 9...");
  const blsResult = await saveAhaCognitiveCertificate(9, 1, recipientName, "bls");
  if (blsResult.success) {
    console.log(`  SUCCESS: BLS cognitive cert issued: ${blsResult.certificateNumber}`);
  } else {
    console.error(`  FAILED: ${blsResult.error}`);
  }

  // 2. Issue Asthma I cert for micro-course enrollment 1 (certIssuedAt was set but cert row is missing)
  // Get course title for courseId=1
  const courseRows = await db.select({ title: microCourses.title }).from(microCourses).where(eq(microCourses.id, 1)).limit(1);
  const courseTitle = courseRows[0]?.title ?? "Paediatric Asthma I";
  console.log(`\n[2] Issuing fellowship cert for micro-course enrollment 1 (${courseTitle})...`);
  // Reset certIssuedAt to null first so saveMicroCourseCertificate doesn't skip it
  await db.execute(
    // @ts-ignore
    `UPDATE microCourseEnrollments SET certificateIssuedAt = NULL WHERE id = 1`
  );
  const asthmaResult = await saveMicroCourseCertificate(1, 1, recipientName, courseTitle);
  if (asthmaResult.success) {
    console.log(`  SUCCESS: Asthma I cert issued: ${asthmaResult.certificateNumber}`);
  } else {
    console.error(`  FAILED: ${asthmaResult.error}`);
  }

  console.log("\nDone. Listing all certificates:");
  const { certificates } = await import("./drizzle/schema.js");
  const allCerts = await db.select().from(certificates);
  for (const c of allCerts) {
    console.log(`  id=${c.id}, num=${c.certificateNumber}, type=${c.programType}, userId=${c.userId}, enrollmentId=${c.enrollmentId}, mceId=${c.microCourseEnrollmentId}`);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
