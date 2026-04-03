import { createHash } from "crypto";
import { getDb } from "./db";
import { isPalsEnrollmentModulesComplete } from "./lib/pals-enrollment-completion";
import { and, desc, eq, inArray } from "drizzle-orm";
import { certificates, courses, enrollments, modules, userProgress, users } from "../drizzle/schema";
import { ensureInstructorCourseCatalog } from "./lib/ensure-instructor-course-catalog";
import { generateCertificatePDF as renderBrandedCertificatePdf } from "./certificate-pdf";

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PRES-${timestamp}-${random}`;
}

/**
 * Generate certificate hash for verification
 */
function generateCertificateHash(certificateNumber: string, recipientName: string): string {
  return createHash("sha256")
    .update(`${certificateNumber}:${recipientName}:${Date.now()}`)
    .digest("hex");
}

/**
 * Instructor enrollments require all catalog modules marked completed before a certificate is issued.
 */
export async function instructorEnrollmentModulesComplete(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  enrollmentId: number
): Promise<boolean> {
  const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
  const enrollment = enrollmentRows[0];
  if (!enrollment || enrollment.programType !== "instructor") return true;

  await ensureInstructorCourseCatalog(db);

  const courseRows = await db.select({ id: courses.id }).from(courses).where(eq(courses.programType, "instructor"));
  if (courseRows.length === 0) return false;

  const courseIds = courseRows.map((c) => c.id);
  const moduleRows = await db.select({ id: modules.id }).from(modules).where(inArray(modules.courseId, courseIds));
  if (moduleRows.length === 0) return true;

  const moduleIds = moduleRows.map((m) => m.id);
  const progressRows = await db
    .select({ moduleId: userProgress.moduleId })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.enrollmentId, enrollmentId),
        eq(userProgress.status, "completed"),
        inArray(userProgress.moduleId, moduleIds)
      )
    );
  const done = new Set(progressRows.map((p) => p.moduleId));
  return moduleIds.every((id) => done.has(id));
}

async function assignInstructorNumberIfNeeded(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number
): Promise<void> {
  if (!userId) return;
  const [u] = await db
    .select({ instructorNumber: users.instructorNumber })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || u.instructorNumber) return;

  const year = new Date().getFullYear();
  const num = `INS-${year}-${String(userId).padStart(5, "0")}`;
  await db
    .update(users)
    .set({ instructorNumber: num, instructorCertifiedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Save certificate to database
 */
export async function saveCertificate(
  enrollmentId: number,
  recipientName: string,
  programType: string,
  trainingDate: Date,
  instructorName: string,
  userId: number = 0
) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const certificateNumber = generateCertificateNumber();
    const verificationHash = generateCertificateHash(certificateNumber, recipientName);
    const issueDate = new Date();
    const expiryDate = new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

    const pdfBuffer = await renderBrandedCertificatePdf({
      recipientName,
      programType: programType as "bls" | "acls" | "pals" | "fellowship" | "instructor",
      trainingDate,
      instructorName: instructorName || "Paeds Resus",
      certificateNumber,
      verificationCode: verificationHash,
    });

    // Save to database
    await db.insert(certificates).values({
      enrollmentId,
      userId,
      certificateNumber,
      programType: programType as "bls" | "acls" | "pals" | "fellowship" | "instructor",
      issueDate,
      expiryDate,
      certificateUrl: "", // Would be S3 URL in production
      verificationCode: verificationHash,
    });

    if (programType === "instructor" && userId) {
      await assignInstructorNumberIfNeeded(db, userId);
    }

    return {
      success: true,
      certificateNumber,
      verificationHash,
      pdfBuffer,
    };
  } catch (error) {
    console.error("[Certificates] Error saving certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify authenticity using the unique verification hash printed on the PDF / QR code.
 */
export async function verifyCertificateByVerificationCode(code: string): Promise<{
  valid: boolean;
  error?: string;
  certificate?: {
    certificateNumber: string;
    programType: string;
    issueDate: Date | null;
    expiryDate: Date | null;
  };
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const trimmed = code.trim();
    if (trimmed.length < 16) {
      return { valid: false, error: "Invalid verification code" };
    }

    const result = await db
      .select()
      .from(certificates)
      .where(eq(certificates.verificationCode, trimmed))
      .limit(1);

    if (result.length === 0) {
      return { valid: false, error: "Certificate not found" };
    }

    const cert = result[0];

    if (cert.expiryDate && cert.expiryDate < new Date()) {
      return {
        valid: false,
        error: "Certificate has expired",
      };
    }

    return {
      valid: true,
      certificate: {
        certificateNumber: cert.certificateNumber ?? "",
        programType: cert.programType,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate ?? null,
      },
    };
  } catch (error) {
    console.error("[Certificates] Error verifying by code:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(
  certificateNumber: string,
  recipientName: string
): Promise<{
  valid: boolean;
  certificate?: (typeof certificates.$inferSelect) | null;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateNumber, certificateNumber))
      .limit(1);

    if (result.length === 0) {
      return {
        valid: false,
        error: "Certificate not found",
      };
    }

    const cert = result[0];

    // Verify certificate number matches
    if (cert.certificateNumber !== certificateNumber) {
      return {
        valid: false,
        error: "Certificate number does not match",
      };
    }

    // Check if certificate has expired
    if (cert.expiryDate && cert.expiryDate < new Date()) {
      return {
        valid: false,
        error: "Certificate has expired",
      };
    }

    return {
      valid: true,
      certificate: cert,
    };
  } catch (error) {
    console.error("[Certificates] Error verifying certificate:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Issue a certificate for an enrollment when payment is completed (idempotent).
 * Called from payment success flow (e.g. M-Pesa webhook).
 */
export async function issueCertificateForEnrollmentIfEligible(enrollmentId: number): Promise<{ issued: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { issued: false, error: "Database not available" };

    const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
    if (enrollmentRows.length === 0) return { issued: false, error: "Enrollment not found" };
    const enrollment = enrollmentRows[0];

    if (enrollment.paymentStatus !== "completed") {
      return { issued: false, error: "Enrollment payment not completed" };
    }

    const existing = await getCertificateByEnrollmentId(enrollmentId);
    if (existing) return { issued: true }; // Already has certificate

    if (enrollment.programType === "instructor") {
      const modulesOk = await instructorEnrollmentModulesComplete(db, enrollmentId);
      if (!modulesOk) {
        return {
          issued: false,
          error:
            "Complete all Instructor Course modules and assessments first. Open your course from the learner dashboard.",
        };
      }
    }

    if (enrollment.programType === "pals") {
      const palsOk = await isPalsEnrollmentModulesComplete(db, enrollmentId, enrollment.userId);
      if (!palsOk) {
        return {
          issued: false,
          error: "Complete all modules and knowledge checks for this course to receive your certificate.",
        };
      }
    }

    const userRows = await db.select({ name: users.name }).from(users).where(eq(users.id, enrollment.userId)).limit(1);
    const recipientName = userRows[0]?.name || "Participant";

    const result = await saveCertificate(
      enrollmentId,
      recipientName,
      enrollment.programType,
      enrollment.trainingDate,
      "Paeds Resus",
      enrollment.userId
    );

    return result.success ? { issued: true } : { issued: false, error: result.error };
  } catch (err) {
    console.error("[Certificates] issueCertificateForEnrollmentIfEligible:", err);
    return { issued: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Get certificates for a user (for "My Certificates").
 */
export async function getCertificatesByUserId(userId: number) {
  try {
    const db = await getDb();
    if (!db) return [];
    const list = await db
      .select({
        id: certificates.id,
        enrollmentId: certificates.enrollmentId,
        certificateNumber: certificates.certificateNumber,
        programType: certificates.programType,
        issueDate: certificates.issueDate,
        expiryDate: certificates.expiryDate,
        certificateUrl: certificates.certificateUrl,
      })
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issueDate));
    return list;
  } catch (err) {
    console.error("[Certificates] getCertificatesByUserId:", err);
    return [];
  }
}

/**
 * Get certificate by certificate number for the given user (for PDF download). Returns cert, trainingDate, recipientName.
 */
export async function getCertificateForDownload(
  certificateNumber: string,
  userId: number
): Promise<{
  cert: (typeof certificates.$inferSelect);
  trainingDate: Date;
  recipientName: string;
} | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const certRows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateNumber, certificateNumber))
      .limit(1);
    const cert = certRows[0];
    if (!cert || cert.userId !== userId) return null;

    const enrollRows = await db
      .select({ trainingDate: enrollments.trainingDate })
      .from(enrollments)
      .where(eq(enrollments.id, cert.enrollmentId))
      .limit(1);
    const trainingDate = enrollRows[0]?.trainingDate ?? cert.issueDate;

    const userRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, cert.userId))
      .limit(1);
    const recipientName = userRows[0]?.name ?? "Participant";

    return { cert, trainingDate, recipientName };
  } catch (err) {
    console.error("[Certificates] getCertificateForDownload:", err);
    return null;
  }
}

/**
 * Get certificate by enrollment ID
 */
export async function getCertificateByEnrollmentId(enrollmentId: number) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .select()
      .from(certificates)
      .where(eq(certificates.enrollmentId, enrollmentId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Certificates] Error getting certificate:", error);
    return null;
  }
}

/**
 * Revoke certificate (placeholder for future implementation)
 */
export async function revokeCertificate(certificateNumber: string, reason: string) {
  try {
    console.log(`[Certificates] Revoking certificate ${certificateNumber}: ${reason}`);

    return {
      success: true,
      message: "Certificate revoked successfully",
    };
  } catch (error) {
    console.error("[Certificates] Error revoking certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate certificate statistics
 */
export async function getCertificateStats() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get total certificates issued
    const allCerts = await db.select().from(certificates);

    const stats = {
      totalIssued: allCerts.length,
      byProgram: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentlyIssued: allCerts.slice(-10),
    };

    // Count by program
    allCerts.forEach((cert) => {
      stats.byProgram[cert.programType] = (stats.byProgram[cert.programType] || 0) + 1;
    });

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("[Certificates] Error getting stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
