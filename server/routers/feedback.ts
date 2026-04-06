import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { submitFeedback, submitNpsSurvey, getUserFeedbackHistory, calculateFeedbackAnalytics, generateFeedbackReport } from "../services/feedback.service";

export const feedbackRouter = router({
  /**
   * Submit user feedback
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        feedbackType: z.enum(["course", "instructor", "payment", "platform", "general"]),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await submitFeedback({
        userId: ctx.user.id,
        feedbackType: input.feedbackType,
        rating: input.rating,
        comment: input.comment,
      });
    }),

  /**
   * Submit NPS survey
   */
  submitNpsSurvey: protectedProcedure
    .input(
      z.object({
        score: z.number().min(0).max(10),
        feedback: z.string().optional(),
        followUpEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await submitNpsSurvey({
        userId: ctx.user.id,
        score: input.score,
        feedback: input.feedback,
        followUpEmail: input.followUpEmail,
      });
    }),

  /**
   * Get user's feedback history
   */
  getUserFeedback: protectedProcedure.query(async ({ ctx }) => {
    return await getUserFeedbackHistory(ctx.user.id);
  }),

  /**
   * Get feedback analytics (admin only)
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await calculateFeedbackAnalytics();
  }),

  /**
   * Generate feedback report (admin only)
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await generateFeedbackReport(input.startDate, input.endDate);
    }),
});
