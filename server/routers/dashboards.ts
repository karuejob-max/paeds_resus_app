import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getExecutiveDashboard, getAnalyticsMetrics, getCohortAnalysis } from "../services/dashboards.service";

export const dashboardsRouter = router({
  /**
   * Get executive dashboard (admin only)
   */
  getExecutiveDashboard: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await getExecutiveDashboard();
  }),

  /**
   * Get detailed analytics metrics (admin only)
   */
  getAnalyticsMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await getAnalyticsMetrics();
  }),

  /**
   * Get cohort analysis (admin only)
   */
  getCohortAnalysis: protectedProcedure
    .input(z.object({ cohortName: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await getCohortAnalysis(input.cohortName);
    }),
});
