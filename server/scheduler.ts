import cron, { ScheduledTask } from "node-cron";
import { getDb } from "./db";
import { sendPaymentReminder, sendTrainingConfirmation } from "./email";
import { eq, and, lt } from "drizzle-orm";
import { enrollments, payments, smsReminders } from "../drizzle/schema";
import { rollupAllInstitutionalAccounts } from "./institutional-analytics-rollup";
import { runScheduledCertificateRenewalReminders } from "./certificate-renewal-cron";
import { runScheduledFellowshipProgressSync } from "./services/fellowship-progress.service";
import { runSafeTruthFacilityMatching, runSafeTruthEventCodeLinkage } from "./lib/safe-truth-facility-matcher";

function useMpesaMock(): boolean {
  const v = process.env.MPESA_USE_MOCK?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * While the Node process is running, refresh the cached Daraja OAuth token before it expires.
 * (Does not wake a sleeping host — pair with GET /api/health + external ping for that.)
 */
function scheduleDarajaTokenWarm() {
  if (useMpesaMock()) return;

  cron.schedule("*/12 * * * *", async () => {
    try {
      const { getMpesaAccessToken } = await import("./mpesa");
      await getMpesaAccessToken();
    } catch (error) {
      console.warn("[Scheduler] Daraja token warm failed:", error instanceof Error ? error.message : error);
    }
  });
}

/**
 * Initialize scheduled jobs for automated reminders and follow-ups
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing automated tasks...");

  scheduleDarajaTokenWarm();

  // Run payment reminders every day at 9 AM
  schedulePaymentReminders();

  // Run training confirmations every day at 8 AM
  scheduleTrainingConfirmations();

  // Run SMS reminders every 6 hours
  scheduleSmsReminders();

  // INST-14: Nightly rollup for institutional portal charts (~03:20 server time)
  scheduleInstitutionalAnalyticsRollup();

  // HI-CERT-1: Daily renewal reminder emails (deduped per certificate row)
  scheduleCertificateRenewalReminders();

  // Fellowship: refresh denormalized pillar rows for active learners
  scheduleFellowshipProgressSync();

  // Safe-Truth v1 Phase C: facility fuzzy-matching + Care Signal event-code
  // linkage (gap-analysis #11). Was CLI-only (pnpm run safe-truth:match-facilities);
  // CEO asked for it to run automatically, 2026-07-17.
  scheduleSafeTruthFacilityMatching();

  // Platform ops: email alerts for stale payments, critical errors, backlogs
  scheduleAdminOpsAlerts();

  // Legal ops: monthly retention dry-run log (execute via `pnpm run retention:cleanup -- --execute`)
  scheduleRetentionCleanupDryRun();

  console.log("[Scheduler] All scheduled tasks initialized");
}

function scheduleStaleMpesaReconciliation() {
  cron.schedule("10 * * * *", async () => {
    try {
      const { reconcileStaleMpesaPendingBatch } = await import("./mpesa-reconciliation");
      const result = await reconcileStaleMpesaPendingBatch({ olderThanHours: 24, limit: 30 });
      if (result.processed > 0) {
        console.log(
          `[Scheduler] stale M-Pesa reconcile: processed=${result.processed} completed=${result.completed} failed=${result.failed} unchanged=${result.unchanged}`
        );
      }
    } catch (error) {
      console.error("[Scheduler] stale M-Pesa reconcile failed:", error);
    }
  });
}

function scheduleAdminOpsAlerts() {
  scheduleStaleMpesaReconciliation();

  cron.schedule("15 * * * *", async () => {
    try {
      const { runAdminOpsAlerts } = await import("./lib/admin-ops-alerts");
      const result = await runAdminOpsAlerts();
      if (result.alertsSent > 0) {
        console.log(
          `[Scheduler] admin ops alerts: evaluated=${result.rulesEvaluated} sent=${result.alertsSent}`
        );
      }
    } catch (error) {
      console.error("[Scheduler] admin ops alerts failed:", error);
    }
  });
}

/** Log retention eligibility monthly — operator runs `pnpm run retention:cleanup -- --execute` after review. */
function scheduleRetentionCleanupDryRun() {
  cron.schedule("0 5 1 * *", async () => {
    try {
      const db = await getDb();
      if (!db) return;
      const { buildRetentionCleanupPlan } = await import("./lib/retention-cleanup");
      const plan = await buildRetentionCleanupPlan(db);
      console.log(
        `[Scheduler] retention dry-run: ${plan.totalEligible} row(s) eligible across ${plan.categories.length} categories`
      );
    } catch (error) {
      console.error("[Scheduler] retention dry-run failed:", error);
    }
  });
}

function scheduleFellowshipProgressSync() {
  cron.schedule("30 4 * * *", async () => {
    try {
      const result = await runScheduledFellowshipProgressSync();
      console.log(
        `[Scheduler] fellowshipProgress sync: processed=${result.totalProcessed} succeeded=${result.totalSucceeded}`
      );
    } catch (error) {
      console.error("[Scheduler] fellowshipProgress sync failed:", error);
    }
  });
}

/**
 * Safe-Truth v1 Phase C (gap-analysis #11): facility fuzzy-matching +
 * Care Signal event-code linkage. Runs daily in EXECUTE mode (unlike
 * scheduleRetentionCleanupDryRun below, which only logs) — CEO decision,
 * 2026-07-17, after this shipped as a CLI-only job
 * (`pnpm run safe-truth:match-facilities`). The manual CLI command still
 * works too, for on-demand runs or dry-run inspection
 * (`-- ` without `--execute`) between scheduled runs.
 *
 * 04:50 EAT-ish server time — after the Fellowship sync (04:30) and before
 * the certificate renewal reminders (10:15), avoiding the institutional
 * rollup (03:20). Both underlying jobs are idempotent and safe to overlap
 * with themselves if a run ever takes longer than a day (won't double
 * -match an already-resolved row).
 */
function scheduleSafeTruthFacilityMatching() {
  cron.schedule("50 4 * * *", async () => {
    try {
      const facilityResult = await runSafeTruthFacilityMatching(await requireDb(), { dryRun: false });
      const linkageResult = await runSafeTruthEventCodeLinkage(await requireDb(), { dryRun: false });
      console.log(
        `[Scheduler] Safe-Truth facility matching: submissions matched=${facilityResult.submissionsMatched}/${facilityResult.submissionsScanned}, visits matched=${facilityResult.visitsMatched}/${facilityResult.visitsScanned}, event codes resolved=${linkageResult.codesResolved}/${linkageResult.codesScanned}`
      );
    } catch (error) {
      console.error("[Scheduler] Safe-Truth facility matching failed:", error);
    }
  });
}

/** Small helper so the two Safe-Truth job calls above don't each repeat the "no DB" guard. */
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

function scheduleCertificateRenewalReminders() {
  cron.schedule("15 10 * * *", async () => {
    try {
      const result = await runScheduledCertificateRenewalReminders();
      console.log(
        `[Scheduler] certificate renewal reminders: users=${result.usersNotified} certs=${result.certsMarked} (${result.skipped})`
      );
    } catch (error) {
      console.error("[Scheduler] certificate renewal reminders failed:", error);
    }
  });
}

function scheduleInstitutionalAnalyticsRollup() {
  cron.schedule("20 3 * * *", async () => {
    try {
      const result = await rollupAllInstitutionalAccounts();
      console.log(
        `[Scheduler] institutionalAnalytics rollup completed for ${result.updated} account(s)`
      );
    } catch (error) {
      console.error("[Scheduler] institutionalAnalytics rollup failed:", error);
    }
  });
}

/**
 * Send payment reminders to users with pending payments
 * Runs daily at 9 AM
 */
function schedulePaymentReminders() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] Running payment reminder task...");

    try {
      const db = await getDb();
      if (!db) {
        console.warn("[Scheduler] Database not available");
        return;
      }

      // Find enrollments with pending payments created more than 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const pendingPayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.status, "pending"),
            lt(payments.createdAt, twentyFourHoursAgo)
          )
        );

      console.log(`[Scheduler] Found ${pendingPayments.length} pending payments to remind`);

      for (const payment of pendingPayments) {
        try {
          // Get enrollment and user details
          const enrollment = await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.id, payment.enrollmentId))
            .limit(1);

          if (enrollment.length === 0) continue;

          // Send reminder email (in production, would fetch user email from users table)
          // await sendPaymentReminder(user.email, user.name, payment.amount, payment.enrollmentId);

          console.log(`[Scheduler] Sent payment reminder for enrollment ${payment.enrollmentId}`);
        } catch (error) {
          console.error(`[Scheduler] Error sending payment reminder:`, error);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Payment reminder task failed:", error);
    }
  });
}

/**
 * Send training confirmations to users with confirmed payments
 * Runs daily at 8 AM
 */
function scheduleTrainingConfirmations() {
  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] Running training confirmation task...");

    try {
      const db = await getDb();
      if (!db) {
        console.warn("[Scheduler] Database not available");
        return;
      }

      // Find enrollments with completed payments that haven't been notified
      const completedPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.status, "completed"));

      console.log(`[Scheduler] Found ${completedPayments.length} completed payments`);

      for (const payment of completedPayments) {
        try {
          // Get enrollment details
          const enrollment = await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.id, payment.enrollmentId))
            .limit(1);

          if (enrollment.length === 0) continue;

          // Send training confirmation (in production, would fetch user details)
          // await sendTrainingConfirmation(
          //   user.email,
          //   user.name,
          //   enrollment[0].programType,
          //   enrollment[0].trainingDate,
          //   "PICU Training Center, Nairobi",
          //   "Dr. Jane Kipchoge"
          // );

          console.log(`[Scheduler] Sent training confirmation for enrollment ${payment.enrollmentId}`);
        } catch (error) {
          console.error(`[Scheduler] Error sending training confirmation:`, error);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Training confirmation task failed:", error);
    }
  });
}

/**
 * Process SMS reminders
 * Runs every 6 hours
 */
function scheduleSmsReminders() {
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Scheduler] Running SMS reminder task...");

    try {
      const db = await getDb();
      if (!db) {
        console.warn("[Scheduler] Database not available");
        return;
      }

      // Find pending SMS reminders
      const pendingReminders = await db
        .select()
        .from(smsReminders)
        .where(eq(smsReminders.status, "pending"));

      console.log(`[Scheduler] Found ${pendingReminders.length} pending SMS reminders`);

      for (const reminder of pendingReminders) {
        try {
          // In production, integrate with SMS provider (Twilio, Africastalking, etc.)
          // await sendSMS(reminder.phoneNumber, generateSMSMessage(reminder.reminderType));

          console.log(`[Scheduler] Would send SMS to ${reminder.phoneNumber}: ${reminder.reminderType}`);

          // Mark as sent
          // await db.update(smsReminders).set({ status: "sent" }).where(eq(smsReminders.id, reminder.id));
        } catch (error) {
          console.error(`[Scheduler] Error processing SMS reminder:`, error);
        }
      }
    } catch (error) {
      console.error("[Scheduler] SMS reminder task failed:", error);
    }
  });
}

/**
 * Generate SMS message based on reminder type
 */
function generateSMSMessage(reminderType: string): string {
  const messages: Record<string, string> = {
    enrollment_confirmation:
      "Welcome to Paeds Resus! Your enrollment is confirmed. Check your email for payment instructions.",
    payment_reminder:
      "Reminder: Your payment is pending. Complete your payment to secure your training spot. Reply HELP for assistance.",
    training_reminder:
      "Your training starts tomorrow! Please arrive 15 minutes early. See you soon!",
    post_training_feedback:
      "Thank you for attending Paeds Resus training! Please rate your experience: https://survey.paedsresus.com",
  };

  return messages[reminderType] || "Hello from Paeds Resus!";
}

/**
 * Stop all scheduled tasks (useful for cleanup)
 */
export function stopScheduler() {
  console.log("[Scheduler] Stopping all scheduled tasks...");
  cron.getTasks().forEach((task: ScheduledTask) => {
    task.stop();
  });
}
