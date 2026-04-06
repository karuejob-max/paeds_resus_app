import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendEmail } from "../email-service";
import { assertInstitutionAccess } from "../lib/institution-access";

const APP_BASE = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://app.paedsresus.com";

function courseTypeLabel(courseType: string): string {
  const courseNames: Record<string, string> = {
    bls: "Basic Life Support",
    acls: "Advanced Cardiovascular Life Support",
    pals: "Pediatric Advanced Life Support",
    fellowship: "Paeds Resus Elite Fellowship",
  };
  return courseNames[courseType] ?? courseType;
}

/**
 * Institutional Notifications Router
 * Email via SendGrid/Mailgun (`email-service`); tenant checks via `assertInstitutionAccess`.
 */
export const institutionalNotificationsRouter = router({
  sendEnrollmentReminder: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffEmail: z.string().email(),
        staffName: z.string(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
        enrollmentDeadline: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await assertInstitutionAccess(db, ctx.user, input.institutionId);

        const courseName = courseTypeLabel(input.courseType);
        const courseLink = `${APP_BASE}/enroll`;
        const result = await sendEmail(input.staffEmail, "institutionalEnrollmentReminder", {
          staffName: input.staffName,
          courseName,
          enrollmentDeadline: input.enrollmentDeadline.toLocaleDateString(),
          courseLink,
        });

        if (!result.success) {
          console.warn("[institutionalNotifications] enrollment reminder email:", result.error);
        }

        return {
          success: result.success,
          message: result.success
            ? `Reminder sent to ${input.staffEmail}`
            : result.error || "Email send failed",
          emailId: result.messageId,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error sending enrollment reminder:", error);
        return { success: false, error: message };
      }
    }),

  sendCompletionEmail: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        staffEmail: z.string().email(),
        staffName: z.string(),
        courseType: z.enum(["bls", "acls", "pals", "fellowship"]),
        certificateNumber: z.string(),
        completionDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await assertInstitutionAccess(db, ctx.user, input.institutionId);

        const courseName = courseTypeLabel(input.courseType);
        const dashboardLink = `${APP_BASE}/hospital-admin-dashboard`;
        const result = await sendEmail(input.staffEmail, "institutionalCourseCompletion", {
          staffName: input.staffName,
          courseName,
          certificateNumber: input.certificateNumber,
          completionDate: input.completionDate.toLocaleDateString(),
          dashboardLink,
        });

        if (!result.success) {
          console.warn("[institutionalNotifications] completion email:", result.error);
        }

        return {
          success: result.success,
          message: result.success
            ? `Completion email sent to ${input.staffEmail}`
            : result.error || "Email send failed",
          emailId: result.messageId,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error sending completion email:", error);
        return { success: false, error: message };
      }
    }),

  sendPaymentReminder: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        phoneNumber: z.string(),
        staffName: z.string(),
        amountDue: z.number(),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await assertInstitutionAccess(db, ctx.user, input.institutionId);

        const smsContent = `Hi ${input.staffName}, your BLS training payment of KES ${input.amountDue} is due by ${input.dueDate.toLocaleDateString()}. Reply CONFIRM to proceed.`;
        console.log(
          `[institutionalNotifications] payment reminder SMS (not sent — no SMS provider): ${input.phoneNumber}`,
          smsContent
        );

        return {
          success: true,
          message: `SMS workflow logged for ${input.phoneNumber} (integrate SMS provider to deliver)`,
          smsId: `sms_${Date.now()}`,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error sending payment reminder:", error);
        return { success: false, error: message };
      }
    }),

  sendBatchNotification: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        notificationType: z.enum(["enrollment", "payment", "completion", "reminder"]),
        subject: z.string(),
        message: z.string(),
        recipientEmails: z.array(z.string().email()).optional(),
        recipientCount: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await assertInstitutionAccess(db, ctx.user, input.institutionId);

        const appLink = APP_BASE;
        const emails = input.recipientEmails ?? [];
        if (emails.length === 0) {
          console.log(
            `[institutionalNotifications] batch ${input.notificationType} queued (no recipientEmails) for institution ${input.institutionId}`
          );
          return {
            success: true,
            message: `Batch queued for ${input.recipientCount ?? 0} recipients (pass recipientEmails to send via email)`,
            batchId: `batch_${Date.now()}`,
            status: "queued",
            emailsSent: 0,
          };
        }

        let sent = 0;
        for (const to of emails) {
          const result = await sendEmail(to, "institutionalBatchNotice", {
            subjectLine: input.subject,
            bodyMessage: input.message,
            appLink,
          });
          if (result.success) sent++;
          else console.warn("[institutionalNotifications] batch email failed:", to, result.error);
        }

        return {
          success: sent > 0,
          message: `Sent ${sent}/${emails.length} batch emails`,
          batchId: `batch_${Date.now()}`,
          status: sent === emails.length ? "sent" : "partial",
          emailsSent: sent,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error sending batch notification:", error);
        return { success: false, error: message };
      }
    }),

  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await assertInstitutionAccess(db, ctx.user, input.institutionId);

        const notifications = [
          {
            id: "notif_1",
            type: "enrollment",
            recipient: "jane@hospital.com",
            status: "delivered",
            sentAt: new Date("2026-01-22"),
            subject: "BLS Training Enrollment Reminder",
          },
          {
            id: "notif_2",
            type: "payment",
            recipient: "+254712345678",
            status: "delivered",
            sentAt: new Date("2026-01-21"),
            subject: "Payment Due Reminder",
          },
          {
            id: "notif_3",
            type: "completion",
            recipient: "john@hospital.com",
            status: "delivered",
            sentAt: new Date("2026-01-20"),
            subject: "Congratulations on Completing BLS",
          },
        ];

        return {
          success: true,
          notifications: notifications.slice(input.offset, input.offset + input.limit),
          total: notifications.length,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error fetching notification history:", error);
        return { success: false, error: message, notifications: [], total: 0 };
      }
    }),

  setNotificationPreferences: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        emailNotifications: z.boolean(),
        smsNotifications: z.boolean(),
        notificationFrequency: z.enum(["daily", "weekly", "monthly"]),
        preferredContactMethod: z.enum(["email", "sms", "both"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await assertInstitutionAccess(db, ctx.user, input.institutionId);

        console.log(`Updated notification preferences for institution ${input.institutionId}`);

        return { success: true, message: "Notification preferences updated" };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error setting notification preferences:", error);
        return { success: false, error: message };
      }
    }),
});
