import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendEmail, emailTemplates } from "../email-service";

/**
 * Email Router
 * Handles email sending for various scenarios
 */

export const emailRouter = router({
  // Send provider activation email
  sendProviderActivation: protectedProcedure
    .input(
      z.object({
        providerEmail: z.string().email(),
        providerName: z.string(),
        activationLink: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendEmail(
          input.providerEmail,
          "provider-activation",
          {
            providerName: input.providerName,
            activationLink: input.activationLink,
          }
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to send email",
          });
        }

        console.log(`[Email] Provider activation sent to ${input.providerEmail}`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error("[Email Router] Error sending provider activation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send provider activation email",
        });
      }
    }),

  // Send course completion email
  sendCourseCompletion: protectedProcedure
    .input(
      z.object({
        userEmail: z.string().email(),
        userName: z.string(),
        courseName: z.string(),
        certificateLink: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendEmail(
          input.userEmail,
          "course-completion",
          {
            userName: input.userName,
            courseName: input.courseName,
            certificateLink: input.certificateLink,
          }
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to send email",
          });
        }

        console.log(`[Email] Course completion sent to ${input.userEmail}`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error("[Email Router] Error sending course completion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send course completion email",
        });
      }
    }),

  // Send churn alert email
  sendChurnAlert: protectedProcedure
    .input(
      z.object({
        userEmail: z.string().email(),
        userName: z.string(),
        newCourseCount: z.string(),
        eventCount: z.string(),
        communityUpdate: z.string(),
        dashboardLink: z.string().url(),
        specialOffer: z.string(),
        promoCode: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendEmail(
          input.userEmail,
          "churn-alert",
          {
            userName: input.userName,
            newCourseCount: input.newCourseCount,
            eventCount: input.eventCount,
            communityUpdate: input.communityUpdate,
            dashboardLink: input.dashboardLink,
            specialOffer: input.specialOffer,
            promoCode: input.promoCode,
          }
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to send email",
          });
        }

        console.log(`[Email] Churn alert sent to ${input.userEmail}`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error("[Email Router] Error sending churn alert:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send churn alert email",
        });
      }
    }),

  // Send enrollment confirmation email
  sendEnrollmentConfirmation: protectedProcedure
    .input(
      z.object({
        userEmail: z.string().email(),
        userName: z.string(),
        courseName: z.string(),
        courseDuration: z.string(),
        startDate: z.string(),
        instructorName: z.string(),
        amountPaid: z.string(),
        courseLink: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendEmail(
          input.userEmail,
          "enrollment-confirmation",
          {
            userName: input.userName,
            courseName: input.courseName,
            courseDuration: input.courseDuration,
            startDate: input.startDate,
            instructorName: input.instructorName,
            amountPaid: input.amountPaid,
            courseLink: input.courseLink,
          }
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to send email",
          });
        }

        console.log(`[Email] Enrollment confirmation sent to ${input.userEmail}`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error("[Email Router] Error sending enrollment confirmation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send enrollment confirmation email",
        });
      }
    }),

  // Get available email templates
  getTemplates: publicProcedure.query(async () => {
    try {
      const templates = Object.values(emailTemplates).map((t) => ({
        id: t.id,
        name: t.name,
        variables: t.variables,
      }));

      return {
        success: true,
        templates,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch templates",
      });
    }
  }),

  // Test email sending
  sendTestEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        templateId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Only admins can send test emails
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can send test emails",
          });
        }

        const template = emailTemplates[input.templateId];
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Template '${input.templateId}' not found`,
          });
        }

        // Create test variables
        const testVariables: Record<string, string> = {};
        template.variables.forEach((v) => {
          testVariables[v] = `[TEST: ${v}]`;
        });

        const result = await sendEmail(
          input.email,
          input.templateId,
          testVariables
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to send test email",
          });
        }

        console.log(`[Email] Test email sent to ${input.email}`);

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error("[Email Router] Error sending test email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send test email",
        });
      }
    }),
});
