import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  sendEnrollmentConfirmationSMS,
  sendPaymentReminderSMS,
  sendTrainingReminderSMS,
  sendPostTrainingFeedbackSMS,
} from "../sms";

const sendSMSSchema = z.object({
  phoneNumber: z.string().regex(/^\+?254\d{9}$/, "Invalid Kenyan phone number"),
  messageType: z.enum([
    "enrollment_confirmation",
    "payment_reminder",
    "training_reminder",
    "post_training_feedback",
  ]),
  enrollmentId: z.number().optional(),
  amount: z.number().optional(),
  trainingDate: z.date().optional(),
});

export const smsRouter = router({
  // Send enrollment confirmation SMS
  sendEnrollmentConfirmation: protectedProcedure
    .input(z.object({ phoneNumber: z.string(), enrollmentId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await sendEnrollmentConfirmationSMS(
          input.phoneNumber,
          input.enrollmentId
        );

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error("[SMS Router] Error sending enrollment confirmation:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Send payment reminder SMS
  sendPaymentReminder: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        amount: z.number(),
        enrollmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendPaymentReminderSMS(
          input.phoneNumber,
          input.amount,
          input.enrollmentId
        );

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error("[SMS Router] Error sending payment reminder:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Send training reminder SMS
  sendTrainingReminder: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        trainingDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendTrainingReminderSMS(
          input.phoneNumber,
          input.trainingDate
        );

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error("[SMS Router] Error sending training reminder:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Send post-training feedback SMS
  sendPostTrainingFeedback: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await sendPostTrainingFeedbackSMS(input.phoneNumber);

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error("[SMS Router] Error sending feedback SMS:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Generic SMS sender (admin only)
  sendCustom: protectedProcedure
    .input(sendSMSSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          return {
            success: false,
            error: "Unauthorized: Admin access required",
          };
        }

        let result;
        switch (input.messageType) {
          case "enrollment_confirmation":
            if (!input.enrollmentId) {
              return {
                success: false,
                error: "enrollmentId required for enrollment_confirmation",
              };
            }
            result = await sendEnrollmentConfirmationSMS(
              input.phoneNumber,
              input.enrollmentId
            );
            break;

          case "payment_reminder":
            if (!input.amount || !input.enrollmentId) {
              return {
                success: false,
                error: "amount and enrollmentId required for payment_reminder",
              };
            }
            result = await sendPaymentReminderSMS(
              input.phoneNumber,
              input.amount,
              input.enrollmentId
            );
            break;

          case "training_reminder":
            if (!input.trainingDate) {
              return {
                success: false,
                error: "trainingDate required for training_reminder",
              };
            }
            result = await sendTrainingReminderSMS(
              input.phoneNumber,
              input.trainingDate
            );
            break;

          case "post_training_feedback":
            result = await sendPostTrainingFeedbackSMS(input.phoneNumber);
            break;

          default:
            return {
              success: false,
              error: "Unknown message type",
            };
        }

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error("[SMS Router] Error sending custom SMS:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
