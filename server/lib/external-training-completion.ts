import { and, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import {
  certificates,
  enrollments,
  externalTrainingCompletions,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  ensurePhase2CompletionCertificateForUser,
  ensurePaedsResusProviderCertificateForEnrollment,
  ensureIlsCertificateForEnrollment,
} from "./paeds-resus-certificate-issuance";

export const EXTERNAL_COMPLETION_PROGRAMS = [
  "bls",
  "acls",
  "pals",
  "nrp",
  "heartsaver",
  "paeds_resus_ils",
] as const;

export type ExternalCompletionProgram = (typeof EXTERNAL_COMPLETION_PROGRAMS)[number];
export type ExternalCompletionPathway = "ierp" | "nerp" | "open_enrolment" | "ilsp";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export function canRecordExternalCompletion(user: {
  role?: string | null;
  instructorApprovedAt?: Date | null;
}) {
  return user.role === "admin" || Boolean(user.instructorApprovedAt);
}

export function validateExternalCompletionInput(input: {
  phase2Completed: boolean;
  phase3Completed: boolean;
}) {
  if (input.phase3Completed && !input.phase2Completed) {
    return "Phase 2 must be recorded before Phase 3.";
  }
  return null;
}

async function getTargetEnrollment(
  db: Db,
  input: { userId: number; courseProgramType: ExternalCompletionProgram; enrollmentId?: number },
) {
  const rows = await db
    .select({
      id: enrollments.id,
      userId: enrollments.userId,
      programType: enrollments.programType,
      trainingDate: enrollments.trainingDate,
      cognitiveModulesComplete: sql<boolean>`CASE WHEN ${enrollments.cognitiveModulesComplete} = 1 OR ${certificates.id} IS NOT NULL THEN 1 ELSE 0 END`,
      practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
      practicalSignedOffAt: enrollments.practicalSignedOffAt,
    })
    .from(enrollments)
    .leftJoin(
      certificates,
      and(
        eq(certificates.enrollmentId, enrollments.id),
        eq(certificates.programType, input.courseProgramType as any),
      ),
    )
    .where(
      input.enrollmentId
        ? and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, input.userId))
        : and(eq(enrollments.userId, input.userId), eq(enrollments.programType, input.courseProgramType)),
    )
    .orderBy(desc(enrollments.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listExternalCompletionCandidates(db: Db, search?: string) {
  const term = search?.trim();
  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      enrollmentId: enrollments.id,
      courseProgramType: enrollments.programType,
      cognitiveModulesComplete: sql<boolean>`CASE WHEN ${enrollments.cognitiveModulesComplete} = 1 OR ${certificates.id} IS NOT NULL THEN 1 ELSE 0 END`,
      practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
      trainingDate: enrollments.trainingDate,
      recordId: externalTrainingCompletions.id,
      pathway: externalTrainingCompletions.pathway,
      phase2Completed: externalTrainingCompletions.phase2Completed,
      phase2CompletedAt: externalTrainingCompletions.phase2CompletedAt,
      phase3Completed: externalTrainingCompletions.phase3Completed,
      phase3CompletedAt: externalTrainingCompletions.phase3CompletedAt,
      evidenceReference: externalTrainingCompletions.evidenceReference,
      notes: externalTrainingCompletions.notes,
      recordedByName: externalTrainingCompletions.recordedByName,
      recordedAt: externalTrainingCompletions.recordedAt,
      revokedAt: externalTrainingCompletions.revokedAt,
    })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.userId))
    .leftJoin(
      certificates,
      and(
        eq(certificates.enrollmentId, enrollments.id),
        eq(certificates.programType, enrollments.programType as any),
      ),
    )
    .leftJoin(
      externalTrainingCompletions,
      and(
        eq(externalTrainingCompletions.userId, enrollments.userId),
        eq(externalTrainingCompletions.courseProgramType, enrollments.programType as any),
      ),
    )
    .where(
      and(
        inArray(enrollments.programType, EXTERNAL_COMPLETION_PROGRAMS as any),
        or(eq(enrollments.cognitiveModulesComplete, true), isNotNull(certificates.id)),
        term
          ? or(
              sql`${users.name} LIKE ${`%${term}%`}`,
              sql`${users.email} LIKE ${`%${term}%`}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(enrollments.createdAt))
    .limit(250);
  return rows;
}

export async function recordExternalTrainingCompletion(
  db: Db,
  input: {
    userId: number;
    enrollmentId?: number;
    pathway: ExternalCompletionPathway;
    courseProgramType: ExternalCompletionProgram;
    phase2Completed: boolean;
    phase2CompletedAt?: Date;
    phase3Completed: boolean;
    phase3CompletedAt?: Date;
    evidenceReference?: string;
    notes?: string;
    recordedByUserId: number;
    recordedByName?: string | null;
  },
) {
  const validationError = validateExternalCompletionInput(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  const enrollment = await getTargetEnrollment(db, input);
  if (!enrollment) {
    return { success: false as const, error: "A matching course enrollment was not found." };
  }
  if (!enrollment.cognitiveModulesComplete) {
    return { success: false as const, error: "The learner must have completed the cognitive coursework for this course first." };
  }

  const now = new Date();
  const recordKey = `external-training:${input.userId}:${input.courseProgramType}:${input.pathway}`;
  const values = {
    recordKey,
    userId: input.userId,
    enrollmentId: enrollment.id,
    pathway: input.pathway,
    courseProgramType: input.courseProgramType,
    phase2Completed: input.phase2Completed,
    phase2CompletedAt: input.phase2Completed ? input.phase2CompletedAt ?? now : null,
    phase3Completed: input.phase3Completed,
    phase3CompletedAt: input.phase3Completed ? input.phase3CompletedAt ?? now : null,
    evidenceReference: input.evidenceReference?.trim() || null,
    notes: input.notes?.trim() || null,
    recordedByUserId: input.recordedByUserId,
    recordedByName: input.recordedByName?.trim() || null,
    recordedAt: now,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    updatedAt: now,
  };

  const existing = await db
    .select({ id: externalTrainingCompletions.id })
    .from(externalTrainingCompletions)
    .where(eq(externalTrainingCompletions.recordKey, recordKey))
    .limit(1);
  if (existing[0]) {
    await db.update(externalTrainingCompletions).set(values).where(eq(externalTrainingCompletions.id, existing[0].id));
  } else {
    await db.insert(externalTrainingCompletions).values(values);
  }

  if (input.phase3Completed) {
    await db.update(enrollments).set({
      practicalSkillsSignedOff: true,
      practicalSignedOffAt: input.phase3CompletedAt ?? now,
      practicalSignedOffByUserId: input.recordedByUserId,
      practicalSignedOffByName: input.recordedByName?.trim() || null,
      updatedAt: now,
    }).where(eq(enrollments.id, enrollment.id));
  }

  const phase2Certificate = input.phase2Completed
    ? await ensurePhase2CompletionCertificateForUser(db, input.userId)
    : null;
  const finalCertificate = input.phase3Completed
    ? enrollment.programType === "paeds_resus_ils"
      ? await ensureIlsCertificateForEnrollment(db, enrollment.id)
      : await ensurePaedsResusProviderCertificateForEnrollment(db, enrollment.id, { allowExternalNerpVerification: true })
    : null;

  return {
    success: true as const,
    enrollmentId: enrollment.id,
    phase2Certificate,
    finalCertificate,
  };
}

export async function revokeExternalTrainingCompletion(
  db: Db,
  input: { recordId: number; revokedByUserId: number; reason: string },
) {
  const now = new Date();
  const [record] = await db
    .select({ id: externalTrainingCompletions.id, enrollmentId: externalTrainingCompletions.enrollmentId })
    .from(externalTrainingCompletions)
    .where(eq(externalTrainingCompletions.id, input.recordId))
    .limit(1);
  if (!record) return { success: false as const, error: "Completion record not found." };
  await db.update(externalTrainingCompletions).set({
    revokedAt: now,
    revokedByUserId: input.revokedByUserId,
    revocationReason: input.reason.trim(),
    phase2Completed: false,
    phase3Completed: false,
    updatedAt: now,
  }).where(eq(externalTrainingCompletions.id, input.recordId));
  if (record.enrollmentId) {
    await db.update(enrollments).set({
      practicalSkillsSignedOff: false,
      practicalSignedOffAt: null,
      practicalSignedOffByUserId: null,
      practicalSignedOffByName: null,
      updatedAt: now,
    }).where(eq(enrollments.id, record.enrollmentId));
  }
  return { success: true as const };
}

export async function getExternalCompletionStatusForUser(db: Db, userId: number) {
  return db
    .select({
      id: externalTrainingCompletions.id,
      pathway: externalTrainingCompletions.pathway,
      courseProgramType: externalTrainingCompletions.courseProgramType,
      phase2Completed: externalTrainingCompletions.phase2Completed,
      phase2CompletedAt: externalTrainingCompletions.phase2CompletedAt,
      phase3Completed: externalTrainingCompletions.phase3Completed,
      phase3CompletedAt: externalTrainingCompletions.phase3CompletedAt,
      evidenceReference: externalTrainingCompletions.evidenceReference,
      notes: externalTrainingCompletions.notes,
      recordedByName: externalTrainingCompletions.recordedByName,
      recordedAt: externalTrainingCompletions.recordedAt,
      revokedAt: externalTrainingCompletions.revokedAt,
    })
    .from(externalTrainingCompletions)
    .where(and(eq(externalTrainingCompletions.userId, userId), isNull(externalTrainingCompletions.revokedAt)))
    .orderBy(desc(externalTrainingCompletions.updatedAt));
}

export async function hasActiveExternalPhase2Completion(db: Db, userId: number) {
  const [row] = await db
    .select({ id: externalTrainingCompletions.id })
    .from(externalTrainingCompletions)
    .where(and(eq(externalTrainingCompletions.userId, userId), eq(externalTrainingCompletions.phase2Completed, true), isNull(externalTrainingCompletions.revokedAt)))
    .limit(1);
  return Boolean(row);
}

export async function hasActiveExternalPhase3Completion(db: Db, userId: number) {
  const [row] = await db
    .select({ id: externalTrainingCompletions.id })
    .from(externalTrainingCompletions)
    .where(and(eq(externalTrainingCompletions.userId, userId), eq(externalTrainingCompletions.phase3Completed, true), isNull(externalTrainingCompletions.revokedAt)))
    .limit(1);
  return Boolean(row);
}
