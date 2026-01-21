import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { forecastRevenue, predictChurnRisk, calculatePredictedLTV, identifyHighValueAtRiskUsers, predictNextBestAction, generatePredictiveReport } from "../services/predictive-analytics.service";

export const predictionsRouter = router({
  /**
   * Forecast revenue (admin only)
   */
  forecastRevenue: protectedProcedure
    .input(z.object({ periodDays: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await forecastRevenue(input.periodDays || 30);
    }),

  /**
   * Predict churn risk for user
   */
  predictChurnRisk: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      // Allow users to see their own churn risk or admins to see any user
      if (userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await predictChurnRisk(userId);
    }),

  /**
   * Calculate predicted LTV for user
   */
  calculateLTV: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      // Allow users to see their own LTV or admins to see any user
      if (userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await calculatePredictedLTV(userId);
    }),

  /**
   * Get next best action for user
   */
  getNextBestAction: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      // Allow users to see their own recommendations or admins to see any user
      if (userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return await predictNextBestAction(userId);
    }),

  /**
   * Identify high-value users at risk (admin only)
   */
  getAtRiskUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await identifyHighValueAtRiskUsers();
  }),

  /**
   * Generate predictive report (admin only)
   */
  generateReport: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await generatePredictiveReport();
  }),
});
