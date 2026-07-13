import { eq } from "drizzle-orm";
import {
  careSignalEvents,
  legalDataRequests,
  passwordResetTokens,
  providerProfiles,
  resusGPSCases,
  users,
} from "../../drizzle/schema";
import type { DbClient } from "../db";
import { anonymizeCareSignalEventsForUser } from "./care-signal-anonymize";

export type DsarDeletionStep = {
  table: string;
  action: string;
  count: number;
};

export type DsarDeletionPlan = {
  userId: number;
  email: string | null;
  steps: DsarDeletionStep[];
};

export type DsarDeletionResult = {
  dryRun: boolean;
  userId: number;
  requestId?: number;
  steps: DsarDeletionStep[];
  completed: boolean;
  error?: string;
};

function anonymisedEmail(userId: number): string {
  return `deleted_user_${userId}@anonymised.local`;
}

/** Build deletion checklist per DSAR_PROCEDURE.md §6 (engineering baseline). */
export async function buildDsarDeletionPlan(db: DbClient, userId: number): Promise<DsarDeletionPlan | null> {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const careSignalRows = await db
    .select({ id: careSignalEvents.id })
    .from(careSignalEvents)
    .where(eq(careSignalEvents.userId, userId));

  const resusCases = await db
    .select({ id: resusGPSCases.id })
    .from(resusGPSCases)
    .where(eq(resusGPSCases.userId, userId));

  const resetTokens = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));

  const steps: DsarDeletionStep[] = [
    {
      table: "users",
      action: "anonymise email/phone/name; delete passwordHash; invalidate openId",
      count: 1,
    },
    { table: "passwordResetTokens", action: "delete", count: resetTokens.length },
    { table: "careSignalEvents", action: "anonymise: userId → null, raw_narrative redacted (never hard-deleted — see docs/legal/DSAR_PROCEDURE.md §6)", count: careSignalRows.length },
    { table: "resusGPSCases", action: "delete saved cases", count: resusCases.length },
    { table: "providerProfiles", action: "unlink facility reference", count: 1 },
    {
      table: "mpesaWebhookLog / payments",
      action: "retain per tax law — redact PII where possible (manual)",
      count: 0,
    },
  ];

  return { userId, email: user.email, steps };
}

export async function executeDsarAccountDeletion(
  db: DbClient,
  options: { userId: number; requestId?: number; dryRun: boolean; adminUserId?: number }
): Promise<DsarDeletionResult> {
  const plan = await buildDsarDeletionPlan(db, options.userId);
  if (!plan) {
    return {
      dryRun: options.dryRun,
      userId: options.userId,
      requestId: options.requestId,
      steps: [],
      completed: false,
      error: "user_not_found",
    };
  }

  if (options.dryRun) {
    return {
      dryRun: true,
      userId: options.userId,
      requestId: options.requestId,
      steps: plan.steps,
      completed: false,
    };
  }

  const anonEmail = anonymisedEmail(options.userId);
  const deletedOpenId = `deleted:${options.userId}:${Date.now()}`;

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, options.userId));
  await anonymizeCareSignalEventsForUser(db, options.userId, "DSAR erasure request");
  await db.delete(resusGPSCases).where(eq(resusGPSCases.userId, options.userId));

  await db
    .update(providerProfiles)
    .set({ facilityId: null, updatedAt: new Date() })
    .where(eq(providerProfiles.userId, options.userId));

  await db
    .update(users)
    .set({
      email: anonEmail,
      phone: null,
      name: "Deleted User",
      passwordHash: null,
      openId: deletedOpenId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, options.userId));

  if (options.requestId) {
    await db
      .update(legalDataRequests)
      .set({
        status: "completed",
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(legalDataRequests.id, options.requestId));
  }

  return {
    dryRun: false,
    userId: options.userId,
    requestId: options.requestId,
    steps: plan.steps,
    completed: true,
  };
}
