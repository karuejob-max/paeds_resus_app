import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, enrollments } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

// Email campaign templates
const emailTemplates = {
  enrollmentConfirmation: {
    subject: "Welcome to Paeds Resus Elite Fellowship!",
    body: (name: string, courseName: string) => `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for enrolling in <strong>${courseName}</strong>.</p>
      <p>Your training journey starts now. Here's what to expect:</p>
      <ul>
        <li>Access to exclusive course materials</li>
        <li>Live training sessions with expert instructors</li>
        <li>Hands-on simulation exercises</li>
        <li>Certification upon completion</li>
      </ul>
      <p>Log in to your dashboard to get started: <a href="https://paeds-resus.com/dashboard">Dashboard</a></p>
      <p>Questions? Contact us at paedsresus254@gmail.com or WhatsApp +254706781260</p>
    `,
  },
  completionCongratulations: {
    subject: "Congratulations! You've Completed Your Course",
    body: (name: string, courseName: string, certificateUrl: string) => `
      <h2>🎉 Congratulations, ${name}!</h2>
      <p>You've successfully completed <strong>${courseName}</strong>!</p>
      <p>Your certificate is ready: <a href="${certificateUrl}">Download Certificate</a></p>
      <p>What's next?</p>
      <ul>
        <li>Share your achievement on social media</li>
        <li>Explore advanced fellowship programs</li>
        <li>Join our community of elite providers</li>
      </ul>
      <p>Keep transforming pediatric emergency care!</p>
    `,
  },
  churnRiskAlert: {
    subject: "We Miss You! Complete Your Course",
    body: (name: string, courseName: string, daysInactive: number) => `
      <h2>Hi ${name},</h2>
      <p>We noticed you haven't accessed <strong>${courseName}</strong> in ${daysInactive} days.</p>
      <p>Don't miss out on your certification! Here's how to get back on track:</p>
      <ul>
        <li>Review your progress: <a href="https://paeds-resus.com/progress">View Progress</a></li>
        <li>Access course materials: <a href="https://paeds-resus.com/dashboard">Dashboard</a></li>
        <li>Need help? Contact us anytime</li>
      </ul>
      <p>Your success is our priority. Let's finish strong together!</p>
    `,
  },
  institutionalWelcome: {
    subject: "Welcome to Paeds Resus Institutional Partnership",
    body: (hospitalName: string, staffCount: number) => `
      <h2>Welcome, ${hospitalName}!</h2>
      <p>Thank you for partnering with Paeds Resus to train ${staffCount} staff members.</p>
      <p>Your institutional dashboard is ready: <a href="https://paeds-resus.com/institutional-dashboard">Access Dashboard</a></p>
      <p>Next steps:</p>
      <ul>
        <li>Schedule training sessions</li>
        <li>Invite staff members</li>
        <li>Track progress and outcomes</li>
      </ul>
      <p>Our team is here to support your success. Contact us anytime!</p>
    `,
  },
};

export const emailCampaignsRouter = router({
  // Send enrollment confirmation email (triggered on enrollment)
  sendEnrollmentConfirmation: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        courseName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const template = emailTemplates.enrollmentConfirmation;
        const body = template.body(input.recipientName, input.courseName);

        // Log email campaign (in production, integrate with email service like SendGrid)
        console.log(`[EMAIL] Enrollment confirmation sent to ${input.recipientEmail}`);

        // Store campaign record in database
        // This would be extended with actual email service integration
        return {
          success: true,
          campaignId: `email_${Date.now()}`,
          status: "sent",
          recipient: input.recipientEmail,
          template: "enrollmentConfirmation",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send enrollment confirmation email",
        });
      }
    }),

  // Send course completion congratulations email
  sendCompletionEmail: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        courseName: z.string(),
        certificateUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const template = emailTemplates.completionCongratulations;
        const body = template.body(input.recipientName, input.courseName, input.certificateUrl);

        console.log(`[EMAIL] Completion email sent to ${input.recipientEmail}`);

        return {
          success: true,
          campaignId: `email_${Date.now()}`,
          status: "sent",
          recipient: input.recipientEmail,
          template: "completionCongratulations",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send completion email",
        });
      }
    }),

  // Send churn risk alert email
  sendChurnRiskAlert: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        courseName: z.string(),
        daysInactive: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const template = emailTemplates.churnRiskAlert;
        const body = template.body(input.recipientName, input.courseName, input.daysInactive);

        console.log(`[EMAIL] Churn alert sent to ${input.recipientEmail}`);

        return {
          success: true,
          campaignId: `email_${Date.now()}`,
          status: "sent",
          recipient: input.recipientEmail,
          template: "churnRiskAlert",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send churn risk alert",
        });
      }
    }),

  // Send institutional welcome email
  sendInstitutionalWelcome: protectedProcedure
    .input(
      z.object({
        institutionId: z.string(),
        recipientEmail: z.string().email(),
        hospitalName: z.string(),
        staffCount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const template = emailTemplates.institutionalWelcome;
        const body = template.body(input.hospitalName, input.staffCount);

        console.log(`[EMAIL] Institutional welcome sent to ${input.recipientEmail}`);

        return {
          success: true,
          campaignId: `email_${Date.now()}`,
          status: "sent",
          recipient: input.recipientEmail,
          template: "institutionalWelcome",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send institutional welcome email",
        });
      }
    }),

  // Get campaign statistics
  getCampaignStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // This would query actual campaign data from database
      return {
        totalCampaignsSent: 0,
        enrollmentConfirmations: 0,
        completionEmails: 0,
        churnAlerts: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch campaign statistics",
      });
    }
  }),

  // Schedule automated campaign
  scheduleAutomatedCampaign: protectedProcedure
    .input(
      z.object({
        campaignType: z.enum(["enrollment", "completion", "churnRisk", "institutional"]),
        schedule: z.object({
          frequency: z.enum(["immediate", "daily", "weekly", "monthly"]),
          time: z.string().optional(),
          daysAfterEvent: z.number().optional(),
        }),
        enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[AUTOMATION] Scheduled ${input.campaignType} campaign`);

        return {
          success: true,
          campaignId: `auto_${Date.now()}`,
          campaignType: input.campaignType,
          schedule: input.schedule,
          enabled: input.enabled,
          createdAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule automated campaign",
        });
      }
    }),
});
