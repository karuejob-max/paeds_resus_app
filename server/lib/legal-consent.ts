import { eq } from "drizzle-orm";
import {
  legalDataRequests,
  userConsentEvents,
  users,
  type InsertLegalDataRequest,
  type InsertUserConsentEvent,
} from "../../drizzle/schema";
import { getDb } from "../db";

export type ConsentRecordInput = {
  userId: number;
  consentType: string;
  documentVersion?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export async function recordUserConsentEvent(data: ConsentRecordInput): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const row: InsertUserConsentEvent = {
    userId: data.userId,
    consentType: data.consentType,
    documentVersion: data.documentVersion ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
    metadata: data.metadata ?? null,
  };
  await db.insert(userConsentEvents).values(row);
}

export async function recordRegistrationConsent(
  userId: number,
  data: {
    termsVersion: string;
    privacyVersion: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .update(users)
    .set({
      termsAcceptedAt: now,
      termsVersion: data.termsVersion,
      privacyAcceptedAt: now,
      privacyVersion: data.privacyVersion,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
  await recordUserConsentEvent({
    userId,
    consentType: "terms_and_privacy_registration",
    documentVersion: `${data.termsVersion}/${data.privacyVersion}`,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

export async function recordTermsReconsent(
  userId: number,
  data: {
    termsVersion: string;
    privacyVersion: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  await recordRegistrationConsent(userId, data);
  await recordUserConsentEvent({
    userId,
    consentType: "terms_reconsent",
    documentVersion: `${data.termsVersion}/${data.privacyVersion}`,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

export async function recordCareSignalConsent(
  userId: number,
  version: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .update(users)
    .set({
      careSignalConsentAt: now,
      careSignalConsentVersion: version,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
  await recordUserConsentEvent({
    userId,
    consentType: "care_signal_qi",
    documentVersion: version,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
}

export async function recordResusGpsAck(
  userId: number,
  version: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .update(users)
    .set({
      resusGpsAckAt: now,
      resusGpsAckVersion: version,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
  await recordUserConsentEvent({
    userId,
    consentType: "resus_gps_clinical_disclaimer",
    documentVersion: version,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
}

export async function recordInstitutionalB2bConsent(
  userId: number,
  version: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .update(users)
    .set({
      institutionalB2bAcceptedAt: now,
      institutionalB2bVersion: version,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
  await recordUserConsentEvent({
    userId,
    consentType: "institutional_b2b",
    documentVersion: version,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
}

export async function recordSafeTruthGuardianAck(
  userId: number,
  version: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .update(users)
    .set({
      safeTruthGuardianAckAt: now,
      safeTruthGuardianAckVersion: version,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
  await recordUserConsentEvent({
    userId,
    consentType: "safe_truth_guardian",
    documentVersion: version,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
}

export async function createLegalDataRequest(data: InsertLegalDataRequest): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(legalDataRequests).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getUserConsentStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      termsAcceptedAt: users.termsAcceptedAt,
      termsVersion: users.termsVersion,
      privacyAcceptedAt: users.privacyAcceptedAt,
      privacyVersion: users.privacyVersion,
      careSignalConsentAt: users.careSignalConsentAt,
      careSignalConsentVersion: users.careSignalConsentVersion,
      resusGpsAckAt: users.resusGpsAckAt,
      resusGpsAckVersion: users.resusGpsAckVersion,
      institutionalB2bAcceptedAt: users.institutionalB2bAcceptedAt,
      institutionalB2bVersion: users.institutionalB2bVersion,
      safeTruthGuardianAckAt: users.safeTruthGuardianAckAt,
      safeTruthGuardianAckVersion: users.safeTruthGuardianAckVersion,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}
