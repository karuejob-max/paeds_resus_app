import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { recordApiResponseTime, recordPageLoadTime, recordError, generatePerformanceReport, getRecentMetrics, getRecentErrorsReport } from "../services/performance.service";

export const performanceRouter = router({
  /**
   * Record API response time
   */
  recordApiTime: publicProcedure
    .input(
      z.object({
        endpoint: z.string(),
        responseTime: z.number(),
        statusCode: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await recordApiResponseTime(input.endpoint, input.responseTime, input.statusCode);
      return { success: true };
    }),

  /**
   * Record page load time
   */
  recordPageLoadTime: publicProcedure
    .input(
      z.object({
        pageUrl: z.string(),
        loadTime: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await recordPageLoadTime(input.pageUrl, input.loadTime);
      return { success: true };
    }),

  /**
   * Record an error
   */
  recordError: publicProcedure
    .input(
      z.object({
        errorType: z.string(),
        errorMessage: z.string(),
        stackTrace: z.string().optional(),
        endpoint: z.string().optional(),
        statusCode: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await recordError({
        userId: ctx.user?.id,
        errorType: input.errorType,
        errorMessage: input.errorMessage,
        stackTrace: input.stackTrace,
        endpoint: input.endpoint,
        statusCode: input.statusCode,
        severity: "high",
      });
      return { success: true };
    }),

  /**
   * Get performance report (admin only)
   */
  getReport: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    const metrics = await getRecentMetrics(100);
    const errors = await getRecentErrorsReport(50);
    return await generatePerformanceReport(metrics, errors);
  }),

  /**
   * Get recent metrics (admin only)
   */
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await getRecentMetrics(100);
  }),

  /**
   * Get recent errors (admin only)
   */
  getErrors: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await getRecentErrorsReport(50);
  }),
});
