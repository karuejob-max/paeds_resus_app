// import { PDFDocument, PDFPage, rgb } from "@pdfkit/core"; // Optional PDF library
import { createHash } from "crypto";
import { getDb } from "./db";
import { desc, eq } from "drizzle-orm";
import { certificates, enrollments, users } from "../drizzle/schema";

interface CertificateData {
  recipientName: string;
  programType: string;
  trainingDate: Date;
  instructorName: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate?: Date;
}

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
 * Create a PDF certificate
 * Note: In production, use a proper PDF library like PDFKit or ReportLab
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  // For now, return a placeholder buffer
  // In production, integrate with PDFKit or similar
  const certificateContent = `
    CERTIFICATE OF COMPLETION
    
    This is to certify that
    
    ${data.recipientName}
    
    has successfully completed the
    
    ${data.programType}
    
    Training Program
    
    Date: ${data.trainingDate.toLocaleDateString()}
    Instructor: ${data.instructorName}
    Certificate Number: ${data.certificateNumber}
    Issue Date: ${data.issueDate.toLocaleDateString()}
    ${data.expiryDate ? `Expiry Date: ${data.expiryDate.toLocaleDateString()}` : ""}
    
    Paeds Resus Limited
    Transforming Paediatric Emergency Care
  `;

  return Buffer.from(certificateContent);
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

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF({
      recipientName,
      programType,
      trainingDate,
      instructorName,
      certificateNumber,
      issueDate,
      expiryDate,
    });

    // Save to database
    await db.insert(certificates).values({
      enrollmentId,
      userId,
      certificateNumber,
      programType: programType as "bls" | "acls" | "pals" | "fellowship",
      issueDate,
      expiryDate,
      certificateUrl: "", // Would be S3 URL in production
      verificationCode: verificationHash,
    });

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
