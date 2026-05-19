import { getDb } from "../server/db";
import { certificates, users, enrollments, microCourseEnrollments, microCourses } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function audit() {
    console.log("--- Certificate System Audit ---");
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed");
        return;
    }

    // 1. Check total certificates
    const allCerts = await db.select().from(certificates);
    console.log(`Total Certificates in DB: ${allCerts.length}`);

    // 2. Check broken links (certificates with no user)
    const brokenUsers = allCerts.filter(c => !c.userId);
    console.log(`Certificates missing userId: ${brokenUsers.length}`);

    // 3. Check linkage to enrollments vs micro-course enrollments
    const fellowshipCerts = allCerts.filter(c => c.programType === 'fellowship');
    console.log(`Fellowship Certificates: ${fellowshipCerts.length}`);
    
    const linkedToMicro = fellowshipCerts.filter(c => (c as any).microCourseEnrollmentId);
    console.log(`Fellowship Certs linked to Micro-Course Enrollment: ${linkedToMicro.length}`);
    
    const linkedToStandard = fellowshipCerts.filter(c => c.enrollmentId && c.enrollmentId !== 0);
    console.log(`Fellowship Certs linked to Standard Enrollment: ${linkedToStandard.length}`);

    // 4. Sample a few certificates to check metadata
    if (allCerts.length > 0) {
        console.log("\nSample Certificate Data:");
        const sample = allCerts[0];
        const [user] = await db.select().from(users).where(eq(users.id, sample.userId)).limit(1);
        console.log(`- Number: ${sample.certificateNumber}`);
        console.log(`- Recipient: ${user?.name || "Unknown"}`);
        console.log(`- Program: ${sample.programType}`);
        console.log(`- URL: ${sample.certificateUrl || "EMPTY (Generated on demand)"}`);
        console.log(`- Verification Code: ${sample.verificationCode ? "Present" : "MISSING"}`);
    }

    // 5. Check if any certificates have empty verification codes
    const missingCodes = allCerts.filter(c => !c.verificationCode);
    console.log(`\nCertificates missing verification codes: ${missingCodes.length}`);

    console.log("\n--- Audit Complete ---");
    process.exit(0);
}

audit().catch(err => {
    console.error(err);
    process.exit(1);
});
