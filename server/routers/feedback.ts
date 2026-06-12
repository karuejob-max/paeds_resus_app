import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  submitFeedback,
  submitNpsSurvey,
  getUserFeedbackHistory,
  calculateFeedbackAnalytics,
  generateFeedbackReport,
} from "../services/feedback.service";
import { FEEDBACK_CATEGORIES, FEEDBACK_ISSUE_TYPES, FEEDBACK_SEVERITIES } from "../../shared/platform-feedback";
import { createPlatformFeedbackTicket, listUserFeedbackTickets } from "../lib/platform-feedback-tickets";
import { trackEvent } from "../services/analytics.service";

const contextSchema = z
  .object({
    pageUrl: z.string().max(512).optional(),
    courseSlug: z.string().max(64).optional(),
    courseId: z.string().max(64).optional(),
    moduleId: z.number().int().positive().optional(),
    resusSessionId: z.string().max(128).optional(),
    surface: z.string().max(64).optional(),
    userAgent: z.string().max(512).optional(),
    screenshotUrl: z.string().url().max(2048).optional(),
  })
  .optional();

export const feedbackRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        category: z.enum(FEEDBACK_CATEGORIES),
        issueType: z.enum(FEEDBACK_ISSUE_TYPES).optional(),
        severity: z.enum(FEEDBACK_SEVERITIES).optional(),
        message: z.string().min(10).max(4000),
        subject: z.string().max(255).optional(),
        contextJson: contextSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createPlatformFeedbackTicket({
        userId: ctx.user.id,
        category: input.category,
        issueType: input.issueType,
        severity: input.severity,
        message: input.message,
        subject: input.subject,
        contextJson: input.contextJson,
      });
      if (!result.success) return { success: false as const, error: result.error };
      void trackEvent({
        userId: ctx.user.id,
        eventType: "platform_feedback",
        eventName: "feedback_submitted",
        eventData: { ticketId: result.ticketId, category: input.category },
        sessionId: input.contextJson?.resusSessionId ?? `feedback_${result.ticketId}`,
      });
      return { success: true as const, ticketId: result.ticketId };
    }),

  listMine: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => listUserFeedbackTickets(ctx.user.id, input?.limit ?? 20)),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        feedbackType: z.enum(["course", "instructor", "payment", "platform", "general"]),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      submitFeedback({ userId: ctx.user.id, feedbackType: input.feedbackType, rating: input.rating, comment: input.comment })
    ),

  submitNpsSurvey: protectedProcedure
    .input(
      z.object({
        score: z.number().min(0).max(10),
        feedback: z.string().optional(),
        followUpEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      submitNpsSurvey({ userId: ctx.user.id, score: input.score, feedback: input.feedback, followUpEmail: input.followUpEmail })
    ),

  getUserFeedback: protectedProcedure.query(async ({ ctx }) => getUserFeedbackHistory(ctx.user.id)),

  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Unauthorized");
    return calculateFeedbackAnalytics();
  }),

  generateReport: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return generateFeedbackReport(input.startDate, input.endDate);
    }),
});
