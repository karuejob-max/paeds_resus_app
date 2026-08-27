import { and, eq, isNotNull, lte } from "drizzle-orm";
import {
  inAppNotifications,
  professionalCredentialReminderEvents,
  professionalCredentials,
  userNotificationPreferences,
  users,
} from "../drizzle/schema";
import { sendEmail } from "./email";
import { getDb } from "./db";
import type { AppDb } from "./lib/institution-access";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

type ReminderStage =
  | "three_months"
  | "two_months"
  | "one_month"
  | "weekly_overdue";

function atUtcStart(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

function subtractCalendarMonths(value: Date, months: number): Date {
  const result = new Date(value);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return atUtcStart(result);
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function calculateCredentialReminder(
  expiry: Date,
  now: Date
): { stage: ReminderStage; duePeriod: Date } | null {
  const today = atUtcStart(now);
  const expiryDay = atUtcStart(expiry);
  if (today >= expiryDay) {
    const overdueWeeks = Math.floor(
      (today.getTime() - expiryDay.getTime()) / WEEK_MS
    );
    return {
      stage: "weekly_overdue",
      duePeriod: addDays(expiryDay, overdueWeeks * 7),
    };
  }
  if (today >= subtractCalendarMonths(expiryDay, 1))
    return {
      stage: "one_month",
      duePeriod: subtractCalendarMonths(expiryDay, 1),
    };
  if (today >= subtractCalendarMonths(expiryDay, 2))
    return {
      stage: "two_months",
      duePeriod: subtractCalendarMonths(expiryDay, 2),
    };
  if (today >= subtractCalendarMonths(expiryDay, 3))
    return {
      stage: "three_months",
      duePeriod: subtractCalendarMonths(expiryDay, 3),
    };
  return null;
}

async function hasReminder(
  db: AppDb,
  credentialId: number,
  stage: ReminderStage,
  duePeriod: Date,
  channel: "in_app" | "email"
) {
  const [existing] = await db
    .select({ id: professionalCredentialReminderEvents.id })
    .from(professionalCredentialReminderEvents)
    .where(
      and(
        eq(professionalCredentialReminderEvents.credentialId, credentialId),
        eq(professionalCredentialReminderEvents.reminderStage, stage),
        eq(professionalCredentialReminderEvents.duePeriod, duePeriod),
        eq(professionalCredentialReminderEvents.channel, channel)
      )
    )
    .limit(1);
  return existing != null;
}

async function recordReminder(
  db: AppDb,
  values: {
    credentialId: number;
    userId: number;
    stage: ReminderStage;
    duePeriod: Date;
    channel: "in_app" | "email";
    status: "sent" | "failed";
    errorMessage?: string;
  }
) {
  await db.insert(professionalCredentialReminderEvents).values({
    credentialId: values.credentialId,
    userId: values.userId,
    reminderStage: values.stage,
    duePeriod: values.duePeriod,
    channel: values.channel,
    deliveryStatus: values.status,
    sentAt: values.status === "sent" ? new Date() : null,
    errorMessage: values.errorMessage ?? null,
  });
}

export async function runScheduledProfessionalCredentialReminders(): Promise<{
  credentialsEvaluated: number;
  remindersSent: number;
  remindersFailed: number;
  skipped: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const rows = await db
    .select({
      credential: professionalCredentials,
      email: users.email,
      preferences: userNotificationPreferences,
    })
    .from(professionalCredentials)
    .innerJoin(users, eq(users.id, professionalCredentials.userId))
    .leftJoin(
      userNotificationPreferences,
      eq(userNotificationPreferences.userId, professionalCredentials.userId)
    )
    .where(
      and(
        eq(professionalCredentials.status, "verified"),
        isNotNull(professionalCredentials.expiresAt),
        lte(professionalCredentials.expiresAt, addDays(now, 93))
      )
    );

  let remindersSent = 0;
  let remindersFailed = 0;
  let skipped = 0;
  for (const row of rows) {
    const expiry = row.credential.expiresAt;
    if (!expiry) continue;
    const reminder = calculateCredentialReminder(expiry, now);
    if (!reminder) {
      skipped += 1;
      continue;
    }
    const preferences = row.preferences;
    if (preferences?.certificateAlerts === false) {
      skipped += 1;
      continue;
    }
    const label =
      row.credential.credentialType === "regulatory_license"
        ? "professional licence"
        : `${row.credential.issuer} credential`;
    const overdue = reminder.stage === "weekly_overdue";
    const title = overdue ? `${label} is expired` : `${label} expires soon`;
    const body = overdue
      ? `Your ${label} expired on ${dateKey(expiry)}. Renew and submit current evidence to restore verified status.`
      : `Your ${label} expires on ${dateKey(expiry)}. Submit renewal evidence before the expiry date.`;
    const actionUrl = "/provider-profile#credentials";

    if (
      !(await hasReminder(
        db,
        row.credential.id,
        reminder.stage,
        reminder.duePeriod,
        "in_app"
      ))
    ) {
      try {
        await db.insert(inAppNotifications).values({
          userId: row.credential.userId,
          type: "professional_credential_expiry",
          title,
          body,
          actionUrl,
          relatedId: row.credential.id,
        });
        await recordReminder(db, {
          credentialId: row.credential.id,
          userId: row.credential.userId,
          stage: reminder.stage,
          duePeriod: reminder.duePeriod,
          channel: "in_app",
          status: "sent",
        });
        remindersSent += 1;
      } catch (error) {
        await recordReminder(db, {
          credentialId: row.credential.id,
          userId: row.credential.userId,
          stage: reminder.stage,
          duePeriod: reminder.duePeriod,
          channel: "in_app",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        remindersFailed += 1;
      }
    }

    if (
      preferences?.emailNotifications !== false &&
      row.email &&
      !(await hasReminder(
        db,
        row.credential.id,
        reminder.stage,
        reminder.duePeriod,
        "email"
      ))
    ) {
      const result = await sendEmail({
        to: row.email,
        subject: title,
        htmlBody: `<p>${body}</p><p><a href="${actionUrl}">Open Professional Profile credentials</a></p>`,
        textBody: `${body}\nOpen ${actionUrl}`,
      });
      await recordReminder(db, {
        credentialId: row.credential.id,
        userId: row.credential.userId,
        stage: reminder.stage,
        duePeriod: reminder.duePeriod,
        channel: "email",
        status: result.success ? "sent" : "failed",
        errorMessage: result.success ? undefined : result.error,
      });
      if (result.success) remindersSent += 1;
      else remindersFailed += 1;
    }
  }

  return {
    credentialsEvaluated: rows.length,
    remindersSent,
    remindersFailed,
    skipped,
  };
}
