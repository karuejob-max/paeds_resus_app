import { createHash } from "crypto";
import { getDb } from "./db";
import { isPalsEnrollmentModulesComplete } from "./lib/pals-enrollment-completion";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  certificates,
  certificateDownloadFeedback,
  courses,
  enrollments,
  microCourseEnrollments,
  microCourses,
  modules,
  userProgress,
  users,
} from "../drizzle/schema";
import { ensureInstructorCourseCatalog } from "./lib/ensure-instructor-course-catalog";
import { generateCertificatePDF as renderBrandedCertificatePdf } from "./certificate-pdf";

// ─────────────────────────────────────────────────────────────────────────────
// AHA-CERT-1: Certificate validity periods
//   BLS / ACLS / PALS provider cards: 2 years (AHA standard)
//   Fellowship / Instructor:          1 year  (Paeds Resus internal)
// ─────────────────────────────────────────────────────────────────────────────
const AHA_PROGRAM_TYPES = new Set(["bls", "acls", "pals"]);

function getCertificateValidityMs(programType: string): number {
  if (AHA_PROGRAM_TYPES.has(programType)) {
    return 730 * 24 * 60 * 60 * 1000; // 2 years
  }
  return 365 * 24 * 60 * 60 * 1000; // 1 year
}

async function getCourseDisplayNameForEnrollment(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  enrollmentId: number
): Promise<string | undefined> {
  const rows = await db
    .select({ title: courses.title })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  const t = rows[0]?.title?.trim();
  return t || undefined;
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

// ─────────────────────────────────────────────────────────────────────────────
// AHA-CERT-1: Cognitive completion check for BLS / ACLS
// Checks that all modules in the AHA course catalog are marked completed.
// ─────────────────────────────────────────────────────────────────────────────
export async function isAhaCognitiveComplete(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  enrollmentId: number,
  programType: "bls" | "acls"
): Promise<boolean> {
  // Find the course for this program type
  const courseRows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, programType));

  if (courseRows.length === 0) {
    // No catalog seeded yet — treat as incomplete (do not issue cert)
    console.warn(`[Certificates] No ${programType.toUpperCase()} course catalog found. Cannot verify cognitive completion.`);
    return false;
  }

  const courseIds = courseRows.map((c) => c.id);
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));

  if (moduleRows.length === 0) {
    // No modules seeded yet — treat as incomplete
    console.warn(`[Certificates] No modules found for ${programType.toUpperCase()} course. Cannot verify cognitive completion.`);
    return false;
  }

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
    // AHA-CERT-1: Use 2-year validity for BLS/ACLS/PALS, 1-year for others
    const expiryDate = new Date(issueDate.getTime() + getCertificateValidityMs(programType));

    const courseDisplayName = await getCourseDisplayNameForEnrollment(db, enrollmentId);

    const pdfBuffer = await renderBrandedCertificatePdf({
      recipientName,
      programType: programType as "bls" | "acls" | "pals" | "fellowship" | "instructor",
      trainingDate,
      instructorName: instructorName || "Paeds Resus",
      certificateNumber,
      verificationCode: verificationHash,
      ...(courseDisplayName ? { courseDisplayName } : {}),
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

// ─────────────────────────────────────────────────────────────────────────────
// AHA-CERT-1: Core issuance function — enforces two-part completion gate
//
// Certificate issuance rules by program type:
//   bls / acls : payment complete + cognitive modules complete + practical signed off
//   pals       : payment complete + PALS modules complete + practical signed off
//   instructor : payment complete + all instructor modules complete
//   fellowship : payment complete (micro-course path handles its own gating)
//
// Called from:
//   - M-Pesa payment webhook (on payment completion)
//   - Instructor sign-off endpoint (on practical skills sign-off)
//   - Learner dashboard "claim certificate" action
// ─────────────────────────────────────────────────────────────────────────────
export async function issueCertificateForEnrollmentIfEligible(
  enrollmentId: number
): Promise<{ issued: boolean; error?: string; pendingStep?: "cognitive" | "practical" | "payment" }> {
  try {
    const db = await getDb();
    if (!db) return { issued: false, error: "Database not available" };

    const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
    if (enrollmentRows.length === 0) return { issued: false, error: "Enrollment not found" };
    const enrollment = enrollmentRows[0];

    // Gate 1: Payment must be completed for all program types
    if (enrollment.paymentStatus !== "completed") {
      return { issued: false, error: "Enrollment payment not completed", pendingStep: "payment" };
    }

    // Idempotency: if already issued, return success
    const existing = await getCertificateByEnrollmentId(enrollmentId);
    if (existing) return { issued: true };

    // ── Instructor path ──────────────────────────────────────────────────────
    if (enrollment.programType === "instructor") {
      const modulesOk = await instructorEnrollmentModulesComplete(db, enrollmentId);
      if (!modulesOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error: "Complete all Instructor Course modules and assessments first. Open your course from the learner dashboard.",
        };
      }
    }

    // ── PALS path ────────────────────────────────────────────────────────────
    if (enrollment.programType === "pals") {
      // Gate 2a: Cognitive modules
      const palsOk = await isPalsEnrollmentModulesComplete(db, enrollmentId, enrollment.userId);
      if (!palsOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error: "Complete all PALS modules and knowledge checks first. Open your course from the learner dashboard.",
        };
      }
      // Gate 2b: Practical skills sign-off by instructor
      if (!enrollment.practicalSkillsSignedOff) {
        return {
          issued: false,
          pendingStep: "practical",
          error:
            "Your PALS certificate requires a hands-on skills assessment sign-off by an approved instructor. " +
            "Attend a scheduled PALS skills session and ask your instructor to sign off your skills.",
        };
      }
    }

    // ── BLS path ─────────────────────────────────────────────────────────────
    if (enrollment.programType === "bls") {
      // Gate 2a: Cognitive modules
      const blsOk = await isAhaCognitiveComplete(db, enrollmentId, "bls");
      if (!blsOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error: "Complete all BLS modules and knowledge checks first. Open your course from the learner dashboard.",
        };
      }
      // Gate 2b: Practical skills sign-off by instructor
      if (!enrollment.practicalSkillsSignedOff) {
        return {
          issued: false,
          pendingStep: "practical",
          error:
            "Your BLS certificate requires a hands-on skills assessment sign-off by an approved instructor. " +
            "Attend a scheduled BLS skills session and ask your instructor to sign off your skills.",
        };
      }
    }

    // ── ACLS path ────────────────────────────────────────────────────────────
    if (enrollment.programType === "acls") {
      // Gate 2a: Cognitive modules
      const aclsOk = await isAhaCognitiveComplete(db, enrollmentId, "acls");
      if (!aclsOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error: "Complete all ACLS modules and knowledge checks first. Open your course from the learner dashboard.",
        };
      }
      // Gate 2b: Practical skills sign-off by instructor
      if (!enrollment.practicalSkillsSignedOff) {
        return {
          issued: false,
          pendingStep: "practical",
          error:
            "Your ACLS certificate requires a hands-on skills assessment sign-off by an approved instructor. " +
            "Attend a scheduled ACLS skills session and ask your instructor to sign off your skills.",
        };
      }
    }

    // ── All gates passed — issue the certificate ─────────────────────────────
    const userRows = await db.select({ name: users.name }).from(users).where(eq(users.id, enrollment.userId)).limit(1);
    const recipientName = userRows[0]?.name || "Participant";

    // Use the instructor's name on the certificate if available
    const instructorName = enrollment.practicalSignedOffByName ?? "Paeds Resus";

    const result = await saveCertificate(
      enrollmentId,
      recipientName,
      enrollment.programType,
      enrollment.trainingDate,
      instructorName,
      enrollment.userId
    );

    return result.success ? { issued: true } : { issued: false, error: result.error };
  } catch (err) {
    console.error("[Certificates] issueCertificateForEnrollmentIfEligible:", err);
    return { issued: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * AHA-CERT-1: Mark cognitive modules as complete for an AHA enrollment.
 * Called by the module completion handler when the last module is finished.
 */
export async function markAhaCognitiveComplete(enrollmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(enrollments)
    .set({ cognitiveModulesComplete: true })
    .where(eq(enrollments.id, enrollmentId));
  console.log(`[Certificates] AHA cognitive complete marked for enrollment ${enrollmentId}`);
  // Attempt to issue certificate — will succeed only if practical is also signed off
  await issueCertificateForEnrollmentIfEligible(enrollmentId);
}

/**
 * AHA-CERT-1: Instructor signs off practical skills for an AHA enrollment.
 * Called from the instructor portal sign-off endpoint.
 * Returns the certificate issuance result.
 */
export async function signOffPracticalSkills(
  enrollmentId: number,
  instructorUserId: number,
  instructorName: string
): Promise<{ success: boolean; certificateIssued: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, certificateIssued: false, error: "Database not available" };

  // Verify the instructor is approved (instructorApprovedAt is set by platform admin)
  const instructorRows = await db
    .select({ instructorApprovedAt: users.instructorApprovedAt, name: users.name })
    .from(users)
    .where(eq(users.id, instructorUserId))
    .limit(1);

  const instructor = instructorRows[0];
  if (!instructor?.instructorApprovedAt) {
    return {
      success: false,
      certificateIssued: false,
      error: "Only approved instructors can sign off practical skills assessments.",
    };
  }

  // Verify the enrollment exists and is for an AHA course
  const enrollmentRows = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
  const enrollment = enrollmentRows[0];
  if (!enrollment) {
    return { success: false, certificateIssued: false, error: "Enrollment not found" };
  }
  if (!AHA_PROGRAM_TYPES.has(enrollment.programType)) {
    return {
      success: false,
      certificateIssued: false,
      error: "Practical sign-off is only applicable to AHA courses (BLS, ACLS, PALS).",
    };
  }

  // Record the sign-off
  await db
    .update(enrollments)
    .set({
      practicalSkillsSignedOff: true,
      practicalSignedOffAt: new Date(),
      practicalSignedOffByUserId: instructorUserId,
      practicalSignedOffByName: instructorName || instructor.name,
    })
    .where(eq(enrollments.id, enrollmentId));

  console.log(
    `[Certificates] Practical skills signed off for enrollment ${enrollmentId} by instructor ${instructorUserId} (${instructorName})`
  );

  // Attempt to issue the certificate now that practical is done
  const certResult = await issueCertificateForEnrollmentIfEligible(enrollmentId);
  return {
    success: true,
    certificateIssued: certResult.issued,
    error: certResult.issued ? undefined : certResult.error,
  };
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
        courseTitle: courses.title,
        microCourseTitle: microCourses.title,
      })
      .from(certificates)
      .leftJoin(enrollments, eq(certificates.enrollmentId, enrollments.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(microCourseEnrollments, eq(certificates.microCourseEnrollmentId, microCourseEnrollments.id))
      .leftJoin(microCourses, eq(microCourseEnrollments.microCourseId, microCourses.id))
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issueDate));
    // Resolve title: micro-course certs use microCourseTitle; AHA/fellowship certs use courseTitle
    return list.map((row) => ({
      ...row,
      courseTitle: row.microCourseTitle ?? row.courseTitle ?? null,
    }));
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
  courseDisplayName?: string;
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

    const courseDisplayName = await getCourseDisplayNameForEnrollment(db, cert.enrollmentId);

    return { cert, trainingDate, recipientName, courseDisplayName };
  } catch (err) {
    console.error("[Certificates] getCertificateForDownload:", err);
    return null;
  }
}

export async function hasCertificateDownloadFeedback(userId: number, certificateId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: certificateDownloadFeedback.id })
    .from(certificateDownloadFeedback)
    .where(
      and(
        eq(certificateDownloadFeedback.userId, userId),
        eq(certificateDownloadFeedback.certificateId, certificateId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function submitCertificateDownloadFeedback(params: {
  userId: number;
  certificateId: number;
  rating: number;
  improvements: string;
}): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };
  const r = params.rating;
  if (r < 1 || r > 5) return { success: false, error: "Rating must be between 1 and 5." };
  const imp = params.improvements?.trim() ?? "";
  if (imp.length < 10) {
    return {
      success: false,
      error: "Please write at least 10 characters on what we can improve for this course.",
    };
  }
  const certRows = await db.select().from(certificates).where(eq(certificates.id, params.certificateId)).limit(1);
  const cert = certRows[0];
  if (!cert || cert.userId !== params.userId) {
    return { success: false, error: "Certificate not found or access denied." };
  }
  try {
    await db.insert(certificateDownloadFeedback).values({
      userId: params.userId,
      certificateId: params.certificateId,
      rating: r,
      improvements: imp,
    });
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Duplicate") || msg.includes("duplicate") || msg.includes("UNIQUE")) {
      return { success: false, error: "Feedback was already submitted for this certificate." };
    }
    console.error("[Certificates] submitCertificateDownloadFeedback:", e);
    return { success: false, error: "Could not save feedback." };
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
 * Revoke certificate
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
 * Issue a fellowship-type certificate for a completed micro-course enrollment.
 * Stores in the certificates table (enrollmentId = microCourseEnrollment.id)
 * and also updates certificateIssuedAt on the microCourseEnrollments row.
 * Idempotent — safe to call multiple times.
 */
export async function saveMicroCourseCertificate(
  microCourseEnrollmentId: number,
  userId: number,
  recipientName: string,
  courseTitle: string
): Promise<{ success: boolean; certificateNumber?: string; pdfBuffer?: Buffer; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };
    // Lazy migration: ensure microCourseEnrollmentId column exists in certificates table
    try {
      const [colCheck] = await db.execute(sql`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'certificates'
          AND COLUMN_NAME = 'microCourseEnrollmentId'
      `);
      if (Array.isArray(colCheck) && (colCheck as any[]).length === 0) {
        console.log('[Certificates] Adding microCourseEnrollmentId column (lazy migration)...');
        await db.execute(sql`ALTER TABLE \`certificates\` ADD COLUMN \`microCourseEnrollmentId\` int`);
        console.log('[Certificates] microCourseEnrollmentId column added');
      }
    } catch (migErr) {
      console.warn('[Certificates] Lazy migration check failed (non-fatal):', migErr instanceof Error ? migErr.message : migErr);
    }

    // Dedupe: check microCourseEnrollments.certificateIssuedAt to avoid ID collision
    // with AHA enrollments table (both use auto-increment IDs starting at 1)
    const mceRows = await db
      .select({ certificateIssuedAt: microCourseEnrollments.certificateIssuedAt })
      .from(microCourseEnrollments)
      .where(eq(microCourseEnrollments.id, microCourseEnrollmentId))
      .limit(1);
    if (mceRows.length > 0 && mceRows[0].certificateIssuedAt != null) {
      // Already issued — look up the cert number using microCourseEnrollmentId (no ID collision)
      const certRows = await db
        .select({ certificateNumber: certificates.certificateNumber })
        .from(certificates)
        .where(
          and(
            eq(certificates.microCourseEnrollmentId, microCourseEnrollmentId),
            eq(certificates.userId, userId)
          )
        )
        .limit(1);
      return { success: true, certificateNumber: certRows[0]?.certificateNumber ?? undefined };
    }

    const certificateNumber = generateCertificateNumber();
    const verificationHash = generateCertificateHash(certificateNumber, recipientName);
    const issueDate = new Date();
    // Fellowship micro-course certificates: 1-year validity
    const expiryDate = new Date(issueDate.getTime() + getCertificateValidityMs("fellowship"));

    const pdfBuffer = await renderBrandedCertificatePdf({
      recipientName,
      programType: "fellowship",
      trainingDate: issueDate,
      instructorName: "Paeds Resus",
      certificateNumber,
      verificationCode: verificationHash,
      courseDisplayName: courseTitle,
    });

    await db.insert(certificates).values({
      enrollmentId: 0, // sentinel: micro-course certs use microCourseEnrollmentId, not enrollmentId
      microCourseEnrollmentId,
      userId,
      certificateNumber,
      programType: "fellowship",
      issueDate,
      expiryDate,
      certificateUrl: "",
      verificationCode: verificationHash,
    });

    // Mark the micro-course enrollment as certificate issued
    await db
      .update(microCourseEnrollments)
      .set({ certificateIssuedAt: issueDate })
      .where(eq(microCourseEnrollments.id, microCourseEnrollmentId));

    return { success: true, certificateNumber, pdfBuffer };
  } catch (err) {
    console.error("[Certificates] saveMicroCourseCertificate:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
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

    const allCerts = await db.select().from(certificates);

    const stats = {
      totalIssued: allCerts.length,
      byProgram: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentlyIssued: allCerts.slice(-10),
    };

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
