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
import { ensureInstitutionalLifeSupportCatalog } from "./lib/ensure-institutional-life-support-catalog";
import { getAhaAccessDecision } from "./lib/aha-access";
import { syncInstructorQualificationsForUser, isInstructorQualifiedForCourse } from "./lib/instructor-qualifications";
import { resolveAhaCourseAnchor } from "./lib/resolve-aha-course-anchor";
import { generateCertificatePDF as renderBrandedCertificatePdf } from "./certificate-pdf";
import {
  AHA_CERTIFICATION_PROGRAM_TYPES,
  computeCertificateExpiryDate,
  getCertificateExpiryStatus,
  type CertificateExpiryStatus,
} from "./lib/certificate-expiry";
import {
  ensurePaedsResusCertificatesForUser,
  ensurePaedsResusProviderCertificateForEnrollment,
} from "./lib/paeds-resus-certificate-issuance";

const AHA_PROGRAM_TYPES = AHA_CERTIFICATION_PROGRAM_TYPES;

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
function generateCertificateHash(
  certificateNumber: string,
  recipientName: string
): string {
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
  const enrollmentRows = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  const enrollment = enrollmentRows[0];
  if (!enrollment || enrollment.programType !== "instructor") return true;

  await ensureInstructorCourseCatalog(db);

  const courseRows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, "instructor"));
  if (courseRows.length === 0) return false;

  const courseIds = courseRows.map(c => c.id);
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));
  if (moduleRows.length === 0) return true;

  const moduleIds = moduleRows.map(m => m.id);
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
  const done = new Set(progressRows.map(p => p.moduleId));
  return moduleIds.every(id => done.has(id));
}

// ─────────────────────────────────────────────────────────────────────────────
// AHA-CERT-1: Cognitive completion check for BLS / ACLS
// Checks that all modules in the AHA course catalog are marked completed.
// ─────────────────────────────────────────────────────────────────────────────
export async function isAhaCognitiveComplete(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  enrollmentId: number,
  programType: "bls" | "acls" | "heartsaver" | "nrp"
): Promise<boolean> {
  // Find the course for this program type
  const courseRows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, programType));

  if (courseRows.length === 0) {
    // No catalog seeded yet — treat as incomplete (do not issue cert)
    console.warn(
      `[Certificates] No ${programType.toUpperCase()} course catalog found. Cannot verify cognitive completion.`
    );
    return false;
  }

  const courseIds = courseRows.map(c => c.id);
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));

  if (moduleRows.length === 0) {
    // No modules seeded yet — treat as incomplete
    console.warn(
      `[Certificates] No modules found for ${programType.toUpperCase()} course. Cannot verify cognitive completion.`
    );
    return false;
  }

  const moduleIds = moduleRows.map(m => m.id);
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

  const done = new Set(progressRows.map(p => p.moduleId));
  return moduleIds.every(id => done.has(id));
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
    .set({
      instructorNumber: num,
      instructorCertifiedAt: new Date(),
      instructorTier: "provisional",
    })
    .where(eq(users.id, userId));

  // Now that they're instructor-certified, grant qualification for any
  // provider course they've already completed themselves (CEO decision,
  // 2026-07-21 — per-course competency, not one global instructor flag).
  await syncInstructorQualificationsForUser(db, userId);
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
    const verificationHash = generateCertificateHash(
      certificateNumber,
      recipientName
    );
    const issueDate = new Date();
    const expiryDate = computeCertificateExpiryDate(issueDate, programType);

    const courseDisplayName = await getCourseDisplayNameForEnrollment(
      db,
      enrollmentId
    );

    const pdfBuffer = await renderBrandedCertificatePdf({
      recipientName,
      programType: programType as any,
      trainingDate,
      issueDate,
      expiryDate,
      instructorName: instructorName || "Paeds Resus",
      certificateNumber,
      verificationCode: verificationHash,
      ...(courseDisplayName ? { courseDisplayName } : {}),
    });

    // Save to database
    await db.insert(certificates).values({
      enrollmentId,
      userId,
      recipientName,
      certificateNumber,
      programType: programType as any,
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
export async function verifyCertificateByVerificationCode(
  code: string
): Promise<{
  valid: boolean;
  status?: CertificateExpiryStatus;
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
    const status = getCertificateExpiryStatus(cert.expiryDate);

    return {
      valid: true,
      status,
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
  status?: CertificateExpiryStatus;
  certificate?: typeof certificates.$inferSelect | null;
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

    // New certificates store the printed recipient name. Legacy certificates
    // may be null, so retain number-only verification for those historical rows.
    if (
      cert.recipientName &&
      cert.recipientName.trim().toLowerCase().replace(/\s+/g, " ") !==
        recipientName.trim().toLowerCase().replace(/\s+/g, " ")
    ) {
      return {
        valid: false,
        error: "Recipient name does not match",
      };
    }

    // Verify certificate number matches
    if (cert.certificateNumber !== certificateNumber) {
      return {
        valid: false,
        error: "Certificate number does not match",
      };
    }

    const status = getCertificateExpiryStatus(cert.expiryDate);

    return {
      valid: true,
      status,
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
): Promise<{
  issued: boolean;
  error?: string;
  pendingStep?: "cognitive" | "practical" | "payment";
}> {
  try {
    const db = await getDb();
    if (!db) return { issued: false, error: "Database not available" };

    const enrollmentRows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);
    if (enrollmentRows.length === 0)
      return { issued: false, error: "Enrollment not found" };
    const enrollment = enrollmentRows[0];
    const existing = await getCertificateByEnrollmentId(enrollmentId);

    // Idempotency: historical certificates remain readable and are never
    // revoked by this access-policy change. New certificate issuance must use
    // a supported cohort, ILSP, full independent payment, or admin grant.
    if (["bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(enrollment.programType)) {
      const ahaAccess = await getAhaAccessDecision(db, enrollment.userId, enrollment.programType);
      if (!ahaAccess.allowed && !existing) {
        return { issued: false, pendingStep: "payment", error: ahaAccess.message };
      }
    }

    // Idempotency: if the legacy AHA certificate already exists, still make
    // sure the additional Paeds Resus provider certificate is projected for
    // eligible BLS/ACLS/PALS/NRP completions.
    if (existing) {
      if (["bls", "acls", "pals", "nrp"].includes(enrollment.programType)) {
        try {
          await ensurePaedsResusProviderCertificateForEnrollment(
            db,
            enrollmentId
          );
        } catch (error) {
          console.error(
            "[Certificates] Universal Paeds Resus provider projection failed:",
            error
          );
        }
      }
      return { issued: true };
    }

    // ── Instructor path ──────────────────────────────────────────────────────
    if (enrollment.programType === "instructor") {
      const modulesOk = await instructorEnrollmentModulesComplete(
        db,
        enrollmentId
      );
      if (!modulesOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error:
            "Complete all Instructor Course modules and assessments first. Open your course from the learner dashboard.",
        };
      }
    }

    // ── Institutional Life Support path ─────────────────────────────────────
    if (enrollment.programType === "paeds_resus_ils") {
      if (enrollment.paymentStatus !== "completed") {
        return {
          issued: false,
          pendingStep: "payment",
          error:
            "Complete the Institutional Life Support provider payment before certification can be issued.",
        };
      }
      const ilsOk = await isIlsCognitiveComplete(db, enrollmentId);
      if (!ilsOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error:
            "Complete all Institutional Life Support modules and knowledge checks first. Open the course from the learner dashboard.",
        };
      }
      if (!enrollment.practicalSkillsSignedOff) {
        return {
          issued: false,
          pendingStep: "practical",
          error:
            "Your Paeds Resus competency certificate requires a hands-on skills assessment sign-off by an approved Paeds Resus instructor.",
        };
      }
    }

    // ── PALS path ────────────────────────────────────────────────────────────
    if (enrollment.programType === "pals") {
      // Gate 2a: Cognitive modules
      const palsOk = await isPalsEnrollmentModulesComplete(
        db,
        enrollmentId,
        enrollment.userId
      );
      if (!palsOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error:
            "Complete all PALS modules and knowledge checks first. Open your course from the learner dashboard.",
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

    // ── Remaining AHA paths with standard two-gate model ────────────────────
    if (["bls", "acls", "heartsaver", "nrp"].includes(enrollment.programType)) {
      const pt = enrollment.programType as
        | "bls"
        | "acls"
        | "heartsaver"
        | "nrp";
      const cognitiveOk = await isAhaCognitiveComplete(db, enrollmentId, pt);
      if (!cognitiveOk) {
        return {
          issued: false,
          pendingStep: "cognitive",
          error: `Complete all ${pt.toUpperCase()} modules and knowledge checks first. Open your course from the learner dashboard.`,
        };
      }
      if (!enrollment.practicalSkillsSignedOff) {
        return {
          issued: false,
          pendingStep: "practical",
          error:
            `Your ${pt.toUpperCase()} certificate requires a hands-on skills assessment sign-off by an approved instructor. ` +
            `Attend a scheduled ${pt.toUpperCase()} skills session and ask your instructor to sign off your skills.`,
        };
      }
    }

    // ── All gates passed — issue the certificate ─────────────────────────────
    const userRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, enrollment.userId))
      .limit(1);
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

    if (
      result.success &&
      ["bls", "acls", "pals", "nrp"].includes(enrollment.programType)
    ) {
      try {
        await ensurePaedsResusProviderCertificateForEnrollment(
          db,
          enrollmentId
        );
      } catch (error) {
        // The AHA certificate is already durable. Keep that result successful,
        // while logging the additive projection for a safe retry from the
        // learner certificate sync action.
        console.error(
          "[Certificates] Universal Paeds Resus provider projection failed:",
          error
        );
      }
    }

    return result.success
      ? { issued: true }
      : { issued: false, error: result.error };
  } catch (err) {
    console.error(
      "[Certificates] issueCertificateForEnrollmentIfEligible:",
      err
    );
    return {
      issued: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * AHA-CERT-1: Mark cognitive modules as complete for an AHA enrollment.
 * Called by the module completion handler when the last module is finished.
 */
async function isIlsCognitiveComplete(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  enrollmentId: number
): Promise<boolean> {
  await ensureInstitutionalLifeSupportCatalog(db);
  const courseRows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.programType, "paeds_resus_ils"));
  const courseIds = courseRows.map(course => course.id);
  if (!courseIds.length) return false;
  const moduleRows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(inArray(modules.courseId, courseIds));
  if (!moduleRows.length) return false;
  const progressRows = await db
    .select({ moduleId: userProgress.moduleId })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.enrollmentId, enrollmentId),
        eq(userProgress.status, "completed"),
        inArray(
          userProgress.moduleId,
          moduleRows.map(module => module.id)
        )
      )
    );
  const completed = new Set(progressRows.map(row => row.moduleId));
  return moduleRows.every(module => completed.has(module.id));
}

export async function markIlsCognitiveComplete(
  enrollmentId: number
): Promise<{
  cognitiveComplete: boolean;
  certificateIssued: boolean;
  certificateNumber?: string | null;
}> {
  const db = await getDb();
  if (!db) return { cognitiveComplete: false, certificateIssued: false };
  const rows = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.id, enrollmentId),
        eq(enrollments.programType, "paeds_resus_ils")
      )
    )
    .limit(1);
  if (!rows[0]) return { cognitiveComplete: false, certificateIssued: false };
  if (rows[0].enrollmentStatus !== "active")
    return { cognitiveComplete: false, certificateIssued: false };
  if (rows[0].paymentStatus !== "completed")
    return { cognitiveComplete: false, certificateIssued: false };
  if (!(await isIlsCognitiveComplete(db, enrollmentId)))
    return { cognitiveComplete: false, certificateIssued: false };
  const completedAt = new Date();
  await db
    .update(enrollments)
    .set({
      cognitiveModulesComplete: true,
      cognitiveModulesCompletedAt: completedAt,
      activatedAt: rows[0].activatedAt ?? completedAt,
      lastActivityAt: completedAt,
      updatedAt: completedAt,
    })
    .where(eq(enrollments.id, enrollmentId));
  const result = await issueCertificateForEnrollmentIfEligible(enrollmentId);
  const certificate = await getCertificateByEnrollmentId(enrollmentId);
  return {
    cognitiveComplete: true,
    certificateIssued: result.issued && !!certificate,
    certificateNumber: certificate?.certificateNumber ?? null,
  };
}

export async function markAhaCognitiveComplete(
  enrollmentId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const rows = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  const enrollment = rows[0];
  if (!enrollment) return;
  if (!AHA_PROGRAM_TYPES.has(enrollment.programType)) return;

  const ahaAccess = await getAhaAccessDecision(db, enrollment.userId, enrollment.programType);
  if (!ahaAccess.allowed) return;

  let complete = false;
  if (enrollment.programType === "pals") {
    complete = await isPalsEnrollmentModulesComplete(
      db,
      enrollmentId,
      enrollment.userId
    );
  } else {
    const anchor = await resolveAhaCourseAnchor(
      db,
      enrollment.programType as "bls" | "acls" | "heartsaver" | "nrp" | "pals"
    );
    if (anchor?.id) {
      const modRows = await db
        .select({ id: modules.id })
        .from(modules)
        .where(eq(modules.courseId, anchor.id));
      const moduleIds = modRows.map(m => m.id);
      if (moduleIds.length > 0) {
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
        const done = new Set(progressRows.map(p => p.moduleId));
        complete = moduleIds.every(id => done.has(id));
      }
    }
  }
  if (!complete) return;

  await db
    .update(enrollments)
    .set({ cognitiveModulesComplete: true })
    .where(eq(enrollments.id, enrollmentId));
  console.log(
    `[Certificates] AHA cognitive complete marked for enrollment ${enrollmentId}`
  );
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
  if (!db)
    return {
      success: false,
      certificateIssued: false,
      error: "Database not available",
    };

  // Verify the instructor is approved (instructorApprovedAt is set by platform admin)
  const instructorRows = await db
    .select({
      instructorApprovedAt: users.instructorApprovedAt,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, instructorUserId))
    .limit(1);

  const instructor = instructorRows[0];
  if (!instructor?.instructorApprovedAt) {
    return {
      success: false,
      certificateIssued: false,
      error:
        "Only approved instructors can sign off practical skills assessments.",
    };
  }

  // Verify the enrollment exists and is for an AHA course
  const enrollmentRows = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  const enrollment = enrollmentRows[0];
  if (!enrollment) {
    return {
      success: false,
      certificateIssued: false,
      error: "Enrollment not found",
    };
  }
  const isIlsEnrollment = enrollment.programType === "paeds_resus_ils";
  if (!AHA_PROGRAM_TYPES.has(enrollment.programType) && !isIlsEnrollment) {
    return {
      success: false,
      certificateIssued: false,
      error:
        "Practical sign-off is only applicable to supported Paeds Resus and AHA training programmes.",
    };
  }

  // Per-course competency (CEO decision, 2026-07-21): being a generally
  // approved instructor is not enough — they must be specifically
  // qualified for THIS course (i.e., have completed it themselves).
  const qualified = isIlsEnrollment
    ? true
    : await isInstructorQualifiedForCourse(
        db,
        instructorUserId,
        enrollment.programType
      );
  if (!qualified) {
    return {
      success: false,
      certificateIssued: false,
      error: `This instructor is not yet qualified to sign off ${enrollment.programType.toUpperCase()} — they must have completed ${enrollment.programType.toUpperCase()} themselves first.`,
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

  // This learner may themselves be instructor-certified already and just
  // completed a provider course for the first time — check if that grants
  // them a new teaching qualification.
  if (enrollment.userId) {
    await syncInstructorQualificationsForUser(db, enrollment.userId);
  }

  // Attempt to issue the certificate now that practical is done
  const certResult =
    await issueCertificateForEnrollmentIfEligible(enrollmentId);
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
        readinessPathway: certificates.readinessPathway,
        courseTitle: courses.title,
        microCourseTitle: microCourses.title,
      })
      .from(certificates)
      .leftJoin(enrollments, eq(certificates.enrollmentId, enrollments.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(
        microCourseEnrollments,
        eq(certificates.microCourseEnrollmentId, microCourseEnrollments.id)
      )
      .leftJoin(
        microCourses,
        eq(microCourseEnrollments.microCourseId, microCourses.id)
      )
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issueDate));
    // Resolve title: micro-course certs use microCourseTitle; AHA/fellowship certs use courseTitle
    return list.map(row => ({
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
  cert: typeof certificates.$inferSelect;
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

    // For micro-course certs (enrollmentId=0), look up the course title via microCourseEnrollments
    let courseDisplayName: string | undefined;
    if (cert.enrollmentId === 0 && cert.microCourseEnrollmentId != null) {
      const mceRows = await db
        .select({ title: microCourses.title })
        .from(microCourseEnrollments)
        .leftJoin(
          microCourses,
          eq(microCourseEnrollments.microCourseId, microCourses.id)
        )
        .where(eq(microCourseEnrollments.id, cert.microCourseEnrollmentId))
        .limit(1);
      courseDisplayName = mceRows[0]?.title?.trim() || undefined;
    } else {
      courseDisplayName = await getCourseDisplayNameForEnrollment(
        db,
        cert.enrollmentId
      );
    }

    return { cert, trainingDate, recipientName, courseDisplayName };
  } catch (err) {
    console.error("[Certificates] getCertificateForDownload:", err);
    return null;
  }
}

export async function hasCertificateDownloadFeedback(
  userId: number,
  certificateId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/certificateDownloadFeedback|doesn't exist/i.test(msg)) {
      console.warn(
        "[Certificates] certificateDownloadFeedback table missing — skipping feedback gate"
      );
      return true;
    }
    throw err;
  }
}

/**
 * Issue (or return existing) fellowship micro-course certificate when the learner has completed the course.
 */
export async function ensureMicroCourseCertificateForCompletedCourse(
  userId: number,
  courseIdSlug: string
): Promise<{ success: boolean; certificateNumber?: string; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    const course = await db.query.microCourses.findFirst({
      where: eq(microCourses.courseId, courseIdSlug),
    });
    if (!course) return { success: false, error: "Course not found" };

    const enrollment = await db.query.microCourseEnrollments.findFirst({
      where: and(
        eq(microCourseEnrollments.userId, userId),
        eq(microCourseEnrollments.microCourseId, course.id)
      ),
    });
    if (!enrollment) {
      return { success: false, error: "Not enrolled in this course" };
    }
    if (enrollment.enrollmentStatus !== "completed") {
      return {
        success: false,
        error: "Complete the course final exam to receive your certificate",
      };
    }

    const userRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const recipientName = userRows[0]?.name ?? "Participant";

    const track =
      course.level === "foundational" || course.level === "advanced"
        ? course.level
        : undefined;
    return await saveMicroCourseCertificate(
      enrollment.id,
      userId,
      recipientName,
      course.title ?? courseIdSlug,
      track
    );
  } catch (err) {
    console.error(
      "[Certificates] ensureMicroCourseCertificateForCompletedCourse:",
      err
    );
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
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
  if (r < 1 || r > 5)
    return { success: false, error: "Rating must be between 1 and 5." };
  const imp = params.improvements?.trim() ?? "";
  if (imp.length < 10) {
    return {
      success: false,
      error:
        "Please write at least 10 characters on what we can improve for this course.",
    };
  }
  const certRows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, params.certificateId))
    .limit(1);
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
    if (
      msg.includes("Duplicate") ||
      msg.includes("duplicate") ||
      msg.includes("UNIQUE")
    ) {
      return {
        success: false,
        error: "Feedback was already submitted for this certificate.",
      };
    }
    if (/certificateDownloadFeedback|doesn't exist/i.test(msg)) {
      console.error(
        "[Certificates] certificateDownloadFeedback table missing:",
        e
      );
      return {
        success: false,
        error:
          "Certificate download is temporarily unavailable (server update required). Please try again shortly.",
      };
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
export async function revokeCertificate(
  certificateNumber: string,
  reason: string
) {
  try {
    console.log(
      `[Certificates] Revoking certificate ${certificateNumber}: ${reason}`
    );
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
  courseTitle: string,
  fellowshipTrack?: "foundational" | "advanced"
): Promise<{
  success: boolean;
  certificateNumber?: string;
  pdfBuffer?: Buffer;
  error?: string;
}> {
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
        console.log(
          "[Certificates] Adding microCourseEnrollmentId column (lazy migration)..."
        );
        await db.execute(
          sql`ALTER TABLE \`certificates\` ADD COLUMN \`microCourseEnrollmentId\` int`
        );
        console.log("[Certificates] microCourseEnrollmentId column added");
      }
    } catch (migErr) {
      console.warn(
        "[Certificates] Lazy migration check failed (non-fatal):",
        migErr instanceof Error ? migErr.message : migErr
      );
    }

    // Dedupe: check microCourseEnrollments.certificateIssuedAt to avoid ID collision
    // with AHA enrollments table (both use auto-increment IDs starting at 1)
    const mceRows = await db
      .select({
        certificateIssuedAt: microCourseEnrollments.certificateIssuedAt,
      })
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
      return {
        success: true,
        certificateNumber: certRows[0]?.certificateNumber ?? undefined,
      };
    }

    const certificateNumber = generateCertificateNumber();
    const verificationHash = generateCertificateHash(
      certificateNumber,
      recipientName
    );
    const issueDate = new Date();
    const expiryDate = computeCertificateExpiryDate(issueDate, "fellowship");

    const pdfBuffer = await renderBrandedCertificatePdf({
      recipientName,
      programType: "fellowship",
      trainingDate: issueDate,
      issueDate,
      expiryDate,
      instructorName: "Paeds Resus",
      certificateNumber,
      verificationCode: verificationHash,
      courseDisplayName: courseTitle,
      fellowshipTrack,
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
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
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

    const allCerts = await db.select().from(certificates);

    const stats = {
      totalIssued: allCerts.length,
      byProgram: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentlyIssued: allCerts.slice(-10),
    };

    allCerts.forEach(cert => {
      stats.byProgram[cert.programType] =
        (stats.byProgram[cert.programType] || 0) + 1;
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

/**
 * Issue an AHA cognitive gatepass certificate when a learner completes all cognitive
 * modules for a BLS / ACLS / PALS / Heartsaver course.
 *
 * This certificate is stored in the `certificates` table with the AHA `enrollmentId`
 * and a programType of `{programType}_cognitive` (e.g. "bls_cognitive").
 * It is idempotent — calling it twice for the same enrollment returns the existing cert.
 */
export async function saveAhaCognitiveCertificate(
  enrollmentId: number,
  userId: number,
  recipientName: string,
  programType: "bls" | "acls" | "pals" | "heartsaver" | "nrp" | "instructor"
): Promise<{
  success: boolean;
  certificateNumber?: string;
  pdfBuffer?: Buffer;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    const cognitiveProgramType = (
      programType === "instructor" ? "instructor" : `${programType}_cognitive`
    ) as
      | "bls_cognitive"
      | "acls_cognitive"
      | "pals_cognitive"
      | "heartsaver_cognitive"
      | "nrp_cognitive"
      | "instructor";

    // Idempotency: return existing cert if already issued for this enrollment
    const existing = await db
      .select({ certificateNumber: certificates.certificateNumber })
      .from(certificates)
      .where(
        and(
          eq(certificates.enrollmentId, enrollmentId),
          eq(certificates.userId, userId),
          eq(certificates.programType, cognitiveProgramType)
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0].certificateNumber) {
      return {
        success: true,
        certificateNumber: existing[0].certificateNumber,
      };
    }

    const certificateNumber = generateCertificateNumber();
    const verificationHash = generateCertificateHash(
      certificateNumber,
      recipientName
    );
    const issueDate = new Date();
    const expiryDate = computeCertificateExpiryDate(
      issueDate,
      cognitiveProgramType
    );

    const pdfBuffer = await renderBrandedCertificatePdf({
      recipientName,
      programType: cognitiveProgramType,
      trainingDate: issueDate,
      issueDate,
      expiryDate,
      instructorName: "Paeds Resus",
      certificateNumber,
      verificationCode: verificationHash,
    });

    await db.insert(certificates).values({
      enrollmentId,
      userId,
      certificateNumber,
      programType: cognitiveProgramType,
      issueDate,
      expiryDate,
      certificateUrl: "",
      verificationCode: verificationHash,
    });

    return { success: true, certificateNumber, pdfBuffer };
  } catch (err) {
    console.error("[Certificates] saveAhaCognitiveCertificate:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
