import { and, asc, eq, lt, lte } from "drizzle-orm";
import { getDb } from "../db";
import {
  ilsCredentialRequests,
  ilsReminderEvents,
  users,
} from "../../drizzle/schema";
import { isIlsReminderDue } from "@shared/ils-operations";
import { sendEmail } from "../email-service";

export async function runScheduledIlsReminders(): Promise<{
  evaluated: number;
  sent: number;
  failed: number;
  skipped: number;
  expired: number;
}> {
  const db = await getDb();
  if (!db) return { evaluated: 0, sent: 0, failed: 0, skipped: 0, expired: 0 };
  const now = new Date();
  const interruptedSendingCutoff = new Date(now.getTime() - 30 * 60 * 1000);
  await db
    .update(ilsReminderEvents)
    .set({
      status: "failed",
      errorMessage:
        "Reminder dispatch was interrupted; review before retrying.",
      updatedAt: now,
    })
    .where(
      and(
        eq(ilsReminderEvents.status, "sending"),
        lt(ilsReminderEvents.updatedAt, interruptedSendingCutoff)
      )
    );
  const expiredRequests = await db
    .select({
      id: ilsCredentialRequests.id,
      enrollmentId: ilsCredentialRequests.enrollmentId,
    })
    .from(ilsCredentialRequests)
    .where(
      and(
        eq(ilsCredentialRequests.status, "payment_pending"),
        lte(ilsCredentialRequests.credentialingDeadline, now)
      )
    );
  for (const request of expiredRequests) {
    await db
      .update(ilsCredentialRequests)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(ilsCredentialRequests.id, request.id),
          eq(ilsCredentialRequests.status, "payment_pending")
        )
      );
    await db
      .update(ilsReminderEvents)
      .set({ status: "cancelled", updatedAt: now })
      .where(
        and(
          eq(ilsReminderEvents.enrollmentId, request.enrollmentId),
          eq(ilsReminderEvents.reminderType, "credentialing"),
          eq(ilsReminderEvents.status, "queued")
        )
      );
  }
  const rows = await db
    .select({
      id: ilsReminderEvents.id,
      dueAt: ilsReminderEvents.dueAt,
      reminderType: ilsReminderEvents.reminderType,
      userName: users.name,
      userEmail: users.email,
    })
    .from(ilsReminderEvents)
    .leftJoin(users, eq(ilsReminderEvents.userId, users.id))
    .where(
      and(
        eq(ilsReminderEvents.channel, "email"),
        eq(ilsReminderEvents.status, "queued"),
        lte(ilsReminderEvents.dueAt, now)
      )
    )
    .orderBy(asc(ilsReminderEvents.dueAt))
    .limit(100);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const reminder of rows) {
    const claimed = await db
      .update(ilsReminderEvents)
      .set({ status: "sending", updatedAt: now })
      .where(
        and(
          eq(ilsReminderEvents.id, reminder.id),
          eq(ilsReminderEvents.status, "queued"),
          lte(ilsReminderEvents.dueAt, now)
        )
      );
    const claimedRows = Number(
      (claimed as any)?.[0]?.affectedRows ?? (claimed as any)?.affectedRows ?? 0
    );
    if (!claimedRows) {
      skipped += 1;
      continue;
    }
    if (!isIlsReminderDue({ sentAt: null, dueAt: reminder.dueAt, now })) {
      await db
        .update(ilsReminderEvents)
        .set({
          status: "failed",
          errorMessage: "Reminder is not due.",
          updatedAt: now,
        })
        .where(
          and(
            eq(ilsReminderEvents.id, reminder.id),
            eq(ilsReminderEvents.status, "sending")
          )
        );
      failed += 1;
      continue;
    }
    if (!reminder.userEmail) {
      await db
        .update(ilsReminderEvents)
        .set({
          status: "failed",
          errorMessage: "User has no saved email address.",
          updatedAt: now,
        })
        .where(
          and(
            eq(ilsReminderEvents.id, reminder.id),
            eq(ilsReminderEvents.status, "sending")
          )
        );
      failed += 1;
      continue;
    }

    const reminderTitle = `Institutional Life Support ${reminder.reminderType} reminder`;
    const reminderBody =
      reminder.reminderType === "activation"
        ? "Your institution has assigned you to an Institutional Life Support cohort. Sign in to begin your modules."
        : reminder.reminderType === "practical"
          ? "Your Institutional Life Support practical assessment is approaching. Confirm the session details with your institution coordinator."
          : reminder.reminderType === "remediation"
            ? "Your Institutional Life Support practical assessment requires a follow-up action. Contact your coordinator or assessor to arrange remediation."
            : "Your Institutional Life Support programme has an outstanding action. Sign in or contact your institution coordinator for the next step.";
    let result: { success: boolean; error?: string };
    try {
      result = await sendEmail(reminder.userEmail, "providerLifecycleNudge", {
        userName: reminder.userName || "Provider",
        reminderTitle,
        reminderBody,
        actionLink: `${process.env.APP_URL || "https://www.paedsresus.com"}/training/institutional-life-support`,
        actionLabel: "Open Institutional Life Support",
      });
    } catch (error) {
      result = {
        success: false,
        error:
          error instanceof Error ? error.message : "Email delivery failed.",
      };
    }
    const updated = await db
      .update(ilsReminderEvents)
      .set({
        status: result.success ? "sent" : "failed",
        sentAt: result.success ? now : null,
        errorMessage: result.success
          ? null
          : result.error || "Email delivery failed.",
        updatedAt: now,
      })
      .where(
        and(
          eq(ilsReminderEvents.id, reminder.id),
          eq(ilsReminderEvents.status, "sending")
        )
      );
    const affected = Number(
      (updated as any)?.[0]?.affectedRows ?? (updated as any)?.affectedRows ?? 1
    );
    if (!affected) {
      skipped += 1;
    } else if (result.success) {
      sent += 1;
    } else {
      failed += 1;
    }
  }
  return {
    evaluated: rows.length,
    sent,
    failed,
    skipped,
    expired: expiredRequests.length,
  };
}
