import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { trackEvent, trackPageView, trackButtonClick, trackFormSubmission, trackCourseEnrollment, trackPaymentCompletion, calculateAnalyticsMetrics } from "../services/analytics.service";

export const eventsRouter = router({
  /**
   * Track a generic event
   */
  trackEvent: publicProcedure
    .input(
      z.object({
        eventType: z.string(),
        eventName: z.string(),
        pageUrl: z.string().optional(),
        eventData: z.record(z.string(), z.any()).optional(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = input.sessionId || "anonymous";
      await trackEvent({
        userId: ctx.user?.id,
        eventType: input.eventType,
        eventName: input.eventName,
        pageUrl: input.pageUrl,
        eventData: input.eventData,
        sessionId: sessionId,
      });
      return { success: true };
    }),

  /**
   * Track page view
   */
  trackPageView: publicProcedure
    .input(
      z.object({
        pageUrl: z.string(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackPageView(ctx.user?.id, input.pageUrl, input.sessionId);
      return { success: true };
    }),

  /**
   * Track button click
   */
  trackButtonClick: publicProcedure
    .input(
      z.object({
        buttonName: z.string(),
        pageUrl: z.string(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackButtonClick(ctx.user?.id, input.buttonName, input.pageUrl, input.sessionId);
      return { success: true };
    }),

  /**
   * Track form submission
   */
  trackFormSubmission: publicProcedure
    .input(
      z.object({
        formName: z.string(),
        pageUrl: z.string(),
        sessionId: z.string(),
        formData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = input.sessionId || "anonymous";
      const formData = input.formData || {};
      await trackFormSubmission(ctx.user?.id, input.formName, input.pageUrl, sessionId, formData);
      return { success: true };
    }),

  /**
   * Track course enrollment
   */
  trackEnrollment: protectedProcedure
    .input(
      z.object({
        courseType: z.string(),
        coursePrice: z.number(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackCourseEnrollment(ctx.user.id, input.courseType, input.coursePrice, input.sessionId);
      return { success: true };
    }),

  /**
   * Track payment completion
   */
  trackPayment: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        paymentMethod: z.string(),
        transactionId: z.string(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackPaymentCompletion(ctx.user.id, input.amount, input.paymentMethod, input.transactionId, input.sessionId);
      return { success: true };
    }),

  /**
   * Get analytics metrics (admin only)
   */
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    // In production, would fetch from database
    return { success: true, message: "Analytics metrics" };
  }),
});
