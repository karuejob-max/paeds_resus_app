import { and, eq, or } from "drizzle-orm";
import {
  certificates,
  enrollments,
  professionalCredentials,
} from "../../drizzle/schema";
import type { AppDb } from "../lib/institution-access";

const PAEDS_RESUS_ISSUER = "Paeds Resus Competency-based Life Support Program";

async function upsertDerivedCredential(
  db: AppDb,
  values: {
    userId: number;
    credentialType:
      | "paeds_resus_bls_cognitive"
      | "paeds_resus_bls_simulation"
      | "paeds_resus_bls_provider";
    issuer: string;
    issuedAt: Date | null;
    expiresAt: Date | null;
    sourceRecordType: string;
    sourceRecordId: number;
  }
) {
  const [existing] = await db
    .select({ id: professionalCredentials.id })
    .from(professionalCredentials)
    .where(
      and(
        eq(professionalCredentials.userId, values.userId),
        eq(professionalCredentials.credentialType, values.credentialType),
        eq(professionalCredentials.sourceRecordType, values.sourceRecordType),
        eq(professionalCredentials.sourceRecordId, values.sourceRecordId)
      )
    )
    .limit(1);

  const common = {
    sourceType: "paeds_resus" as const,
    issuer: values.issuer,
    issuedAt: values.issuedAt,
    expiresAt: values.expiresAt,
    status: "verified" as const,
    sourceRecordType: values.sourceRecordType,
    sourceRecordId: values.sourceRecordId,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(professionalCredentials)
      .set(common)
      .where(eq(professionalCredentials.id, existing.id));
    return existing.id;
  }

  const result = await db.insert(professionalCredentials).values({
    userId: values.userId,
    credentialType: values.credentialType,
    ...common,
  });
  return (result as unknown as { insertId: number }).insertId;
}

/**
 * Idempotently projects authoritative Paeds Resus BLS completion into the
 * structured credential ledger. These rows are read-only to providers.
 */
export async function syncDerivedCredentialsForUser(
  db: AppDb,
  userId: number
): Promise<{ createdOrUpdated: number }> {
  const [userEnrollments, userCertificates] = await Promise.all([
    db.select().from(enrollments).where(eq(enrollments.userId, userId)),
    db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, userId),
          or(
            eq(certificates.programType, "bls"),
            eq(certificates.programType, "bls_cognitive")
          )
        )
      ),
  ]);

  let createdOrUpdated = 0;
  for (const enrollment of userEnrollments) {
    if (enrollment.programType !== "bls") continue;
    if (enrollment.cognitiveModulesComplete) {
      await upsertDerivedCredential(db, {
        userId,
        credentialType: "paeds_resus_bls_cognitive",
        issuer: PAEDS_RESUS_ISSUER,
        issuedAt: enrollment.trainingDate,
        expiresAt: null,
        sourceRecordType: "enrollment_bls_cognitive",
        sourceRecordId: enrollment.id,
      });
      createdOrUpdated += 1;
    }
    if (enrollment.practicalSkillsSignedOff) {
      await upsertDerivedCredential(db, {
        userId,
        credentialType: "paeds_resus_bls_simulation",
        issuer: PAEDS_RESUS_ISSUER,
        issuedAt: enrollment.practicalSignedOffAt ?? enrollment.trainingDate,
        expiresAt: null,
        sourceRecordType: "enrollment_bls_simulation",
        sourceRecordId: enrollment.id,
      });
      createdOrUpdated += 1;
    }
  }

  for (const certificate of userCertificates) {
    await upsertDerivedCredential(db, {
      userId,
      credentialType: "paeds_resus_bls_provider",
      issuer: PAEDS_RESUS_ISSUER,
      issuedAt: certificate.issueDate,
      expiresAt: certificate.expiryDate,
      sourceRecordType: "certificate_bls_provider",
      sourceRecordId: certificate.id,
    });
    createdOrUpdated += 1;
  }

  return { createdOrUpdated };
}

export async function syncDerivedCredentialsForUsers(
  db: AppDb,
  userIds: number[]
): Promise<{ usersProcessed: number; recordsCreatedOrUpdated: number }> {
  let recordsCreatedOrUpdated = 0;
  for (const userId of Array.from(new Set(userIds))) {
    const result = await syncDerivedCredentialsForUser(db, userId);
    recordsCreatedOrUpdated += result.createdOrUpdated;
  }
  return {
    usersProcessed: Array.from(new Set(userIds)).length,
    recordsCreatedOrUpdated,
  };
}
