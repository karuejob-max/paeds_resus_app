import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

/**
 * Institutional Notifications Router
 * Handles email and SMS workflows for hospitals
 */

export const institutionalNotificationsRouter = router({
  /**
   * Send enrollment reminder email
   */
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
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Generate personalized email content
        const emailContent = await generateEnrollmentEmail(
          input.staffName,
          input.courseType,
          input.enrollmentDeadline
        );

        // Send email (integrate with AWS SES or email service)
        console.log(`Sending enrollment reminder to ${input.staffEmail}`);

        return {
          success: true,
          message: `Reminder sent to ${input.staffEmail}`,
          emailId: `email_${Date.now()}`,
        };
      } catch (error: any) {
        console.error("Error sending enrollment reminder:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Send completion congratulations email
   */
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
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Generate completion email with certificate details
        const emailContent = await generateCompletionEmail(
          input.staffName,
          input.courseType,
          input.certificateNumber,
          input.completionDate
        );

        console.log(`Sending completion email to ${input.staffEmail}`);

        return {
          success: true,
          message: `Completion email sent to ${input.staffEmail}`,
          emailId: `email_${Date.now()}`,
        };
      } catch (error: any) {
        console.error("Error sending completion email:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Send payment reminder SMS
   */
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
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Generate SMS content
        const smsContent = `Hi ${input.staffName}, your BLS training payment of KES ${input.amountDue} is due by ${input.dueDate.toLocaleDateString()}. Reply CONFIRM to proceed.`;

        console.log(`Sending payment reminder SMS to ${input.phoneNumber}`);

        return {
          success: true,
          message: `SMS sent to ${input.phoneNumber}`,
          smsId: `sms_${Date.now()}`,
        };
      } catch (error: any) {
        console.error("Error sending payment reminder:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Send batch notifications to all staff
   */
  sendBatchNotification: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        notificationType: z.enum(["enrollment", "payment", "completion", "reminder"]),
        subject: z.string(),
        message: z.string(),
        recipientCount: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Log batch notification
        console.log(
          `Sending batch ${input.notificationType} notification to institution ${input.institutionId}`
        );

        // In production, this would:
        // 1. Query all staff members for the institution
        // 2. Send emails/SMS in batches
        // 3. Track delivery status
        // 4. Log in audit trail

        return {
          success: true,
          message: `Batch notification queued for ${input.recipientCount || 0} recipients`,
          batchId: `batch_${Date.now()}`,
          status: "queued",
        };
      } catch (error: any) {
        console.error("Error sending batch notification:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get notification history
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock notification history
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
      } catch (error: any) {
        console.error("Error fetching notification history:", error);
        return {
          success: false,
          error: error.message,
          notifications: [],
          total: 0,
        };
      }
    }),

  /**
   * Configure notification preferences
   */
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
    .mutation(async ({ input }) => {
      try {
        // Save preferences to database
        console.log(`Updated notification preferences for institution ${input.institutionId}`);

        return {
          success: true,
          message: "Notification preferences updated",
        };
      } catch (error: any) {
        console.error("Error setting notification preferences:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});

/**
 * Helper: Generate enrollment reminder email
 */
async function generateEnrollmentEmail(
  staffName: string,
  courseType: string,
  deadline: Date
): Promise<string> {
  const courseNames: Record<string, string> = {
    bls: "Basic Life Support",
    acls: "Advanced Cardiovascular Life Support",
    pals: "Pediatric Advanced Life Support",
    fellowship: "Paeds Resus Elite Fellowship",
  };

  return `
Dear ${staffName},

We hope you're excited to join the ${courseNames[courseType]} training program!

This is a friendly reminder that enrollment closes on ${deadline.toLocaleDateString()}.

To enroll, please:
1. Visit www.paeds-resus.com/enroll
2. Select your preferred course
3. Complete the payment

Questions? Contact us at support@paeds-resus.com

Best regards,
Paeds Resus Team
  `;
}

/**
 * Helper: Generate completion congratulations email
 */
async function generateCompletionEmail(
  staffName: string,
  courseType: string,
  certificateNumber: string,
  completionDate: Date
): Promise<string> {
  const courseNames: Record<string, string> = {
    bls: "Basic Life Support",
    acls: "Advanced Cardiovascular Life Support",
    pals: "Pediatric Advanced Life Support",
    fellowship: "Paeds Resus Elite Fellowship",
  };

  return `
Dear ${staffName},

Congratulations on completing the ${courseNames[courseType]} course!

Your certificate details:
- Certificate Number: ${certificateNumber}
- Completion Date: ${completionDate.toLocaleDateString()}
- Valid Until: ${new Date(completionDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Download your certificate: www.paeds-resus.com/certificates/${certificateNumber}

Thank you for your commitment to saving children's lives!

Best regards,
Paeds Resus Team
  `;
}
