/**
 * Platform admin alert rules — email digest with per-rule cooldown dedupe.
 */
import { and, eq, gte, lt } from "drizzle-orm";
import { getDb, getRecentErrors } from "../db";
import {
  adminAlertDispatches,
  payments,
  enrollments,
  errorTracking,
  careSignalEvents,
  supportTickets,
} from "../../drizzle/schema";
import { sendEmail } from "../email";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export type AlertRule = {
  ruleKey: string;
  subject: string;
  body: string;
  metricValue: number;
};

function adminRecipients(): string[] {
  const raw =
    process.env.ADMIN_ALERT_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim() ||
    "paedsresus254@gmail.com";
  return raw.split(/[,;]/).map((e) => e.trim()).filter(Boolean);
}

function buildAlertHtml(rule: AlertRule): string {
  const base = process.env.APP_BASE_URL ?? "https://www.paedsresus.com";
  return `<div style="font-family: Arial, sans-serif; max-width: 600px;"><h2 style="color: #b45309;">Paeds Resus — platform alert</h2><p><strong>${rule.subject}</strong></p><pre style="background: #f4f4f5; padding: 12px; white-space: pre-wrap; font-size: 13px;">${rule.body}</pre><p style="font-size: 12px; color: #666;">Review: ${base}/admin/ops</p></div>`;
}

async function wasRecentlySent(ruleKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  const since = new Date(Date.now() - COOLDOWN_MS);
  const rows = await db
    .select({ id: adminAlertDispatches.id })
    .from(adminAlertDispatches)
    .where(
      and(eq(adminAlertDispatches.ruleKey, ruleKey), gte(adminAlertDispatches.createdAt, since))
    )
    .limit(1);
  return rows.length > 0;
}

async function recordDispatch(rule: AlertRule, recipient: string, channel: "email") {
  const db = await getDb();
  if (!db) return;
  await db.insert(adminAlertDispatches).values({
    ruleKey: rule.ruleKey,
    channel,
    recipient,
    subject: rule.subject,
    bodySnippet: rule.body.slice(0, 2000),
    metricValue: rule.metricValue,
  });
}

async function sendAdminAlert(rule: AlertRule): Promise<boolean> {
  if (await wasRecentlySent(rule.ruleKey)) {
    return false;
  }

  const recipients = adminRecipients();
  if (recipients.length === 0) return false;

  const htmlBody = buildAlertHtml(rule);

  let sentAny = false;
  for (const to of recipients) {
    const result = await sendEmail({
      to,
      subject: `[Paeds Resus Ops] ${rule.subject}`,
      htmlBody,
      textBody: `${rule.subject}\n\n${rule.body}\n\nOpen /admin/ops`,
    });
    if (result.success) {
      sentAny = true;
      await recordDispatch(rule, to, "email");
    }
  }
  return sentAny;
}

/** Evaluate thresholds and send alerts (hourly cron). */
export async function runAdminOpsAlerts(): Promise<{
  rulesEvaluated: number;
  alertsSent: number;
}> {
  const db = await getDb();
  if (!db) return { rulesEvaluated: 0, alertsSent: 0 };

  const rules: AlertRule[] = [];
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const staleMpesa = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.status, "pending"),
        eq(payments.paymentMethod, "mpesa"),
        lt(payments.createdAt, twentyFourHoursAgo)
      )
    );
  if (staleMpesa.length >= 5) {
    rules.push({
      ruleKey: "stale_mpesa_pending",
      subject: `${staleMpesa.length} stale M-Pesa payments (>24h)`,
      body: `${staleMpesa.length} M-Pesa payments are still pending after 24 hours. Open M-Pesa reconciliation in admin.`,
      metricValue: staleMpesa.length,
    });
  }

  const failedPayments = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.status, "failed"), gte(payments.createdAt, twentyFourHoursAgo)));
  if (failedPayments.length >= 10) {
    rules.push({
      ruleKey: "failed_payments_spike",
      subject: `${failedPayments.length} failed payments in 24h`,
      body: `Payment failures spiked in the last 24 hours (${failedPayments.length} rows). Check webhook log and M-Pesa config.`,
      metricValue: failedPayments.length,
    });
  }

  const stuckEnrollments = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(eq(enrollments.paymentStatus, "pending"), lt(enrollments.createdAt, fortyEightHoursAgo))
    );
  if (stuckEnrollments.length >= 20) {
    rules.push({
      ruleKey: "stuck_enrollments",
      subject: `${stuckEnrollments.length} enrollments pending payment >48h`,
      body: `${stuckEnrollments.length} enrollments have paymentStatus=pending for over 48 hours.`,
      metricValue: stuckEnrollments.length,
    });
  }

  const criticalErrors = await db
    .select({ id: errorTracking.id })
    .from(errorTracking)
    .where(
      and(
        eq(errorTracking.severity, "critical"),
        eq(errorTracking.status, "new"),
        gte(errorTracking.createdAt, twentyFourHoursAgo)
      )
    );
  if (criticalErrors.length >= 1) {
    const recent = await getRecentErrors(3);
    const sample = recent
      .map((e) => `- ${e.errorType}: ${(e.errorMessage ?? "").slice(0, 120)}`)
      .join("\n");
    rules.push({
      ruleKey: "critical_errors",
      subject: `${criticalErrors.length} new critical error(s)`,
      body: `New critical errors in errorTracking:\n${sample}`,
      metricValue: criticalErrors.length,
    });
  }

  const careUnderReview = await db
    .select({ id: careSignalEvents.id })
    .from(careSignalEvents)
    .where(eq(careSignalEvents.status, "under_review"));
  if (careUnderReview.length >= 50) {
    rules.push({
      ruleKey: "care_signal_backlog",
      subject: `${careUnderReview.length} Care Signal events under review`,
      body: `Care Signal review queue has ${careUnderReview.length} events awaiting action.`,
      metricValue: careUnderReview.length,
    });
  }

  const openTickets = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(eq(supportTickets.status, "open"));
  if (openTickets.length >= 15) {
    rules.push({
      ruleKey: "support_backlog",
      subject: `${openTickets.length} open support tickets`,
      body: `Support ticket backlog: ${openTickets.length} open tickets.`,
      metricValue: openTickets.length,
    });
  }

  let alertsSent = 0;
  for (const rule of rules) {
    const sent = await sendAdminAlert(rule);
    if (sent) alertsSent++;
  }

  return { rulesEvaluated: rules.length, alertsSent };
}
