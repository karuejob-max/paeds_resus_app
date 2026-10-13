import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * Messaging boundary.
 *
 * No SMS/WhatsApp provider is connected to this deployment. These procedures
 * must not claim that messages were sent, delivered, read, or verified.
 */
const unavailable = () => {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message:
      "SMS/WhatsApp delivery is not connected in this deployment. No message was sent and no phone number was verified.",
  });
};

export const smsWhatsappRouter = router({
  sendSmsNotification: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
        type: z.enum(["reminder", "alert", "update", "certification"]),
      })
    )
    .mutation(() => unavailable()),
  sendWhatsappMessage: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
        mediaUrl: z.string().optional(),
        type: z.enum(["text", "image", "document", "video"]),
      })
    )
    .mutation(() => unavailable()),
  getSmsStatus: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(() => unavailable()),
  getWhatsappStatus: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(() => unavailable()),
  registerPhoneNumber: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        name: z.string(),
        channel: z.enum(["sms", "whatsapp", "both"]),
        notificationPreferences: z.object({
          reminders: z.boolean(),
          alerts: z.boolean(),
          updates: z.boolean(),
          certifications: z.boolean(),
        }),
      })
    )
    .mutation(() => unavailable()),
  verifyPhoneWithOtp: protectedProcedure
    .input(z.object({ phoneNumber: z.string(), otp: z.string() }))
    .mutation(() => unavailable()),
  sendOtp: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(() => unavailable()),
  getRegisteredPhoneNumbers: protectedProcedure.query(() => unavailable()),
  sendBulkSms: protectedProcedure
    .input(
      z.object({
        phoneNumbers: z.array(z.string()),
        message: z.string(),
        type: z.enum(["reminder", "alert", "update", "certification"]),
      })
    )
    .mutation(() => unavailable()),
  getBulkSmsStatus: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(() => unavailable()),
  sendCourseReminder: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        courseId: z.string(),
        phoneNumber: z.string(),
      })
    )
    .mutation(() => unavailable()),
  sendIncidentAlert: protectedProcedure
    .input(
      z.object({
        hospitalId: z.string(),
        incidentType: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        message: z.string(),
      })
    )
    .mutation(() => unavailable()),
  getSmsAnalytics: protectedProcedure
    .input(z.object({ timeframe: z.enum(["day", "week", "month"]) }))
    .query(() => unavailable()),
  getWhatsappAnalytics: protectedProcedure
    .input(z.object({ timeframe: z.enum(["day", "week", "month"]) }))
    .query(() => unavailable()),
  createSmsTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        message: z.string(),
        variables: z.array(z.string()),
        type: z.enum(["reminder", "alert", "update", "certification"]),
      })
    )
    .mutation(() => unavailable()),
  getSmsTemplates: protectedProcedure.query(() => unavailable()),
  sendSmsFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        phoneNumber: z.string(),
        variables: z.record(z.string(), z.string()),
      })
    )
    .mutation(() => unavailable()),
  optOutNotifications: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        channel: z.enum(["sms", "whatsapp", "both"]),
      })
    )
    .mutation(() => unavailable()),
  optInNotifications: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        channel: z.enum(["sms", "whatsapp", "both"]),
      })
    )
    .mutation(() => unavailable()),
});
