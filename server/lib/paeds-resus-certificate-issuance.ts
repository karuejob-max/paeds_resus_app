import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  certificates,
  enrollments,
  ierpProgramEnrollments,
  nerpOfferEnrollments,
  nerpOfferExternalVerifications,
  users,
} from "../../drizzle/schema";
import { generateCertificatePDF } from "../certificate-pdf";
import { getDb } from "../db";
import { computeCertificateExpiryDate } from "./certificate-expiry";
import {
  PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE,
  type PaedsResusProviderCertificateType,
  type ReadinessPathway,
} from "../../shared/paeds-resus-certificates";
import { getAuthoritativePhase2CompletionStatus } from "./ierp-program-state";

export type PaedsResusCertificateIssueResult = {
  issued: boolean;
  alreadyIssued?: boolean;
  certificateId?: number;
  certificateNumber?: string;
  reason?: string;
  error?: string;
};

type CertificateProgramType =
  | typeof PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE
  | PaedsResusProviderCertificateType;

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const PROVIDER_CERTIFICATE_BY_AHA_PROGRAM: Record<
  "bls" | "acls" | "pals" | "nrp",
  PaedsResusProviderCertificateType
> = {
  bls: "paeds_resus_bls_provider",
  acls: "paeds_resus_acls_provider",
  pals: "paeds_resus_pals_provider",
  nrp: "paeds_resus_nrp_provider",
};

const PROVIDER_AHA_PROGRAMS = Object.keys(
  PROVIDER_CERTIFICATE_BY_AHA_PROGRAM
) as Array<keyof typeof PROVIDER_CERTIFICATE_BY_AHA_PROGRAM>;

function generateCertificateNumber(): string {
  return `PRES-${Date.now().toString(36).toUpperCase()}-${randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

function generateVerificationCode(certificateNumber: string, recipientName: string): string {
  return createHash("sha256")
    .update(`${certificateNumber}:${recipientName}:${randomBytes(20).toString("hex")}`)
    .digest("hex");
}

function normalizeName(value: string | null | undefined): string {
  return value?.trim() || "Participant";
}

async function getRecipientName(db: Db, userId: number): Promise<string> {
  const rows = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return normalizeName(rows[0]?.name);
}

async function getReadinessPathway(db: Db, userId: number): Promise<ReadinessPathway> {
  const [ierpState, nerpState] = await Promise.all([
    db
      .select({ id: ierpProgramEnrollments.id })
      .from(ierpProgramEnrollments)
      .where(
        and(
          eq(ierpProgramEnrollments.userId, userId),
          eq(ierpProgramEnrollments.programKey, "ierp")
        )
      )
      .limit(1),
    db
      .select({ id: nerpOfferEnrollments.id })
      .from(nerpOfferEnrollments)
      .where(eq(nerpOfferEnrollments.userId, userId))
      .limit(1),
  ]);

  if (ierpState[0]) return "ierp";
  if (nerpState[0]) return "nerp";
  return "open_enrolment";
}

async function getExistingBySourceKey(db: Db, sourceKey: string) {
  const rows = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
    })
    .from(certificates)
    .where(eq(certificates.sourceKey, sourceKey))
    .limit(1);
  return rows[0] ?? null;
}

async function insertUniversalCertificate(
  db: Db,
  input: {
    userId: number;
    readinessPathway: ReadinessPathway;
    programType: CertificateProgramType;
    sourceKey: string;
    enrollmentId?: number;
    trainingDate: Date;
    issueDate?: Date;
    expiryDate?: Date | null;
  }
): Promise<PaedsResusCertificateIssueResult> {
  const existing = await getExistingBySourceKey(db, input.sourceKey);
  if (existing) {
    return {
      issued: true,
      alreadyIssued: true,
      certificateId: existing.id,
      certificateNumber: existing.certificateNumber ?? undefined,
    };
  }

  const recipientName = await getRecipientName(db, input.userId);
  const issueDate = input.issueDate ?? new Date();
  const certificateNumber = generateCertificateNumber();
  const verificationCode = generateVerificationCode(certificateNumber, recipientName);
  const expiryDate = input.expiryDate === undefined
    ? computeCertificateExpiryDate(issueDate, input.programType)
    : input.expiryDate;

  // Render once here to verify the new certificate kind is renderable. PDFs are
  // intentionally generated on download through the existing owner-only route;
  // certificate bytes are not stored in the database.
  await generateCertificatePDF({
    recipientName,
    programType: input.programType,
    trainingDate: input.trainingDate,
    issueDate,
    expiryDate: expiryDate ?? undefined,
    instructorName: "Paeds Resus",
    certificateNumber,
    verificationCode,
  });

  try {
    const inserted = await db.insert(certificates).values({
      enrollmentId: input.enrollmentId ?? 0,
      userId: input.userId,
      recipientName,
      certificateNumber,
      programType: input.programType,
      readinessPathway: input.readinessPathway,
      sourceKey: input.sourceKey,
      issueDate,
      expiryDate: expiryDate ?? null,
      certificateUrl: "",
      verificationCode,
    });
    const certificateId = Number(
      (inserted as any)[0]?.id ?? (inserted as any).insertId ?? 0
    );
    return {
      issued: true,
      certificateId: certificateId || undefined,
      certificateNumber,
    };
  } catch (error) {
    // A concurrent retry may have won the unique sourceKey race. Return the
    // durable winner rather than generating a duplicate completion credential.
    const winner = await getExistingBySourceKey(db, input.sourceKey);
    if (winner) {
      return {
        issued: true,
        alreadyIssued: true,
        certificateId: winner.id,
        certificateNumber: winner.certificateNumber ?? undefined,
      };
    }
    throw error;
  }
}

async function getNerpVerifiedPhases(db: Db, userId: number) {
  const rows = await db
    .select({
      phase: nerpOfferExternalVerifications.phase,
      status: nerpOfferExternalVerifications.status,
      completedAt: nerpOfferExternalVerifications.completedAt,
      verifiedAt: nerpOfferExternalVerifications.verifiedAt,
    })
    .from(nerpOfferExternalVerifications)
    .innerJoin(
      nerpOfferEnrollments,
      eq(
        nerpOfferExternalVerifications.nerpOfferEnrollmentId,
        nerpOfferEnrollments.id
      )
    )
    .where(eq(nerpOfferEnrollments.userId, userId));

  const phase2 = rows.find(
    (row) => row.phase === "phase_2" && row.status === "verified"
  );
  const phase3 = rows.find(
    (row) => row.phase === "phase_3" && row.status === "verified"
  );
  return {
    phase2Verified: Boolean(phase2),
    phase3Verified: Boolean(phase3),
    phase2CompletedAt: phase2?.completedAt ?? phase2?.verifiedAt ?? null,
    phase3CompletedAt: phase3?.completedAt ?? phase3?.verifiedAt ?? null,
  };
}

export async function ensurePhase2CompletionCertificateForUser(
  db: Db,
  userId: number
): Promise<PaedsResusCertificateIssueResult> {
  const sharedPhase2 = await getAuthoritativePhase2CompletionStatus(db, userId);
  const nerpPhases = await getNerpVerifiedPhases(db, userId);
  if (!sharedPhase2.phase2Complete && !nerpPhases.phase2Verified) {
    return { issued: false, reason: "phase2_incomplete" };
  }

  const readinessPathway = await getReadinessPathway(db, userId);
  const completedAt = nerpPhases.phase2CompletedAt ?? new Date();
  return insertUniversalCertificate(db, {
    userId,
    readinessPathway,
    programType: PAEDS_RESUS_PHASE2_CERTIFICATE_TYPE,
    sourceKey: `paeds-resus:phase2:user:${userId}`,
    trainingDate: completedAt,
    issueDate: new Date(),
    expiryDate: null,
  });
}

async function ensureProviderCertificateForEnrollment(
  db: Db,
  input: {
    enrollmentId: number;
    userId: number;
    programType: keyof typeof PROVIDER_CERTIFICATE_BY_AHA_PROGRAM;
    trainingDate: Date;
    issueDate: Date;
    sourceKey?: string;
  }
): Promise<PaedsResusCertificateIssueResult> {
  const readinessPathway = await getReadinessPathway(db, input.userId);
  return insertUniversalCertificate(db, {
    userId: input.userId,
    readinessPathway,
    programType: PROVIDER_CERTIFICATE_BY_AHA_PROGRAM[input.programType],
    enrollmentId: input.enrollmentId,
    sourceKey:
      input.sourceKey ??
      `paeds-resus:${PROVIDER_CERTIFICATE_BY_AHA_PROGRAM[input.programType]}:enrollment:${input.enrollmentId}`,
    trainingDate: input.trainingDate,
    issueDate: input.issueDate,
  });
}

/**
 * Issue the additional Paeds Resus provider certificate after the existing
 * AHA enrollment gate has passed. The existing AHA certificate remains intact.
 */
export async function ensurePaedsResusProviderCertificateForEnrollment(
  db: Db,
  enrollmentId: number,
  options: { allowExternalNerpVerification?: boolean } = {}
): Promise<PaedsResusCertificateIssueResult> {
  const rows = await db
    .select({
      id: enrollments.id,
      userId: enrollments.userId,
      programType: enrollments.programType,
      trainingDate: enrollments.trainingDate,
      cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
      practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
      practicalSignedOffAt: enrollments.practicalSignedOffAt,
    })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  const enrollment = rows[0];
  if (!enrollment || !PROVIDER_AHA_PROGRAMS.includes(enrollment.programType as any)) {
    return { issued: false, reason: "not_provider_enrollment" };
  }

  const isLocallyComplete =
    enrollment.cognitiveModulesComplete && enrollment.practicalSkillsSignedOff;
  const nerpPhases = options.allowExternalNerpVerification
    ? await getNerpVerifiedPhases(db, enrollment.userId)
    : null;
  const isExternallyComplete =
    Boolean(nerpPhases?.phase2Verified && nerpPhases.phase3Verified);
  if (!isLocallyComplete && !isExternallyComplete) {
    return { issued: false, reason: "provider_requirements_incomplete" };
  }

  const issueDate =
    enrollment.practicalSignedOffAt ?? nerpPhases?.phase3CompletedAt ?? new Date();
  return ensureProviderCertificateForEnrollment(db, {
    enrollmentId: enrollment.id,
    userId: enrollment.userId,
    programType: enrollment.programType as keyof typeof PROVIDER_CERTIFICATE_BY_AHA_PROGRAM,
    trainingDate: enrollment.trainingDate,
    issueDate,
  });
}

export async function ensurePaedsResusCertificatesForUser(
  db: Db,
  userId: number
) {
  const phase2 = await ensurePhase2CompletionCertificateForUser(db, userId);
  const enrollmentRows = await db
    .select({
      id: enrollments.id,
      programType: enrollments.programType,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        inArray(enrollments.programType, PROVIDER_AHA_PROGRAMS)
      )
    )
    .orderBy(desc(enrollments.createdAt));

  const providers: PaedsResusCertificateIssueResult[] = [];
  for (const enrollment of enrollmentRows) {
    providers.push(
      await ensurePaedsResusProviderCertificateForEnrollment(
        db,
        enrollment.id,
        { allowExternalNerpVerification: true }
      )
    );
  }
  return { phase2, providers };
}

export async function getPaedsResusCertificateStatusForUser(
  db: Db,
  userId: number
) {
  const rows = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      programType: certificates.programType,
      readinessPathway: certificates.readinessPathway,
      issueDate: certificates.issueDate,
      expiryDate: certificates.expiryDate,
      sourceKey: certificates.sourceKey,
    })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, userId),
        inArray(certificates.programType, [
          "paeds_resus_phase2",
          "paeds_resus_bls_provider",
          "paeds_resus_acls_provider",
          "paeds_resus_pals_provider",
          "paeds_resus_nrp_provider",
        ])
      )
    )
    .orderBy(desc(certificates.issueDate));
  return rows;
}

export { PROVIDER_CERTIFICATE_BY_AHA_PROGRAM };
