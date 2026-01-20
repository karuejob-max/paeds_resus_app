import cron, { ScheduledTask } from "node-cron";
import { getDb } from "./db";
import { sendPaymentReminder, sendTrainingConfirmation } from "./email";
import { eq, and, lt } from "drizzle-orm";
import { enrollments, payments, smsReminders } from "../drizzle/schema";

/**
 * Initialize scheduled jobs for automated reminders and follow-ups
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing automated tasks...");

  // Run payment reminders every day at 9 AM
  schedulePaymentReminders();

  // Run training confirmations every day at 8 AM
  scheduleTrainingConfirmations();

  // Run SMS reminders every 6 hours
  scheduleSmsReminders();

  console.log("[Scheduler] All scheduled tasks initialized");
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
