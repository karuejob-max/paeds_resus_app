import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getExecutiveDashboard, getAnalyticsMetrics, getCohortAnalysis } from "../services/dashboards.service";
import { buildProviderHomeSummary } from "../lib/provider-home-summary";

function assertProviderOrAdmin(user: { role?: string | null; userType?: string | null }) {
  const isAdmin = user.role === "admin";
  const isProvider = user.userType === "individual";
  if (!isAdmin && !isProvider) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action is available to provider accounts only.",
    });
  }
}

export const dashboardsRouter = router({
  /**
   * Lightweight provider-home summary used to render the next action without client-side races.
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    assertProviderOrAdmin(ctx.user);
    try {
      return await buildProviderHomeSummary(ctx.user.id);
    } catch (error) {
      console.error("[dashboards.getSummary]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not load your provider home right now.",
      });
    }
  }),

  /**
   * Convenience endpoint for consumers that only need the next step.
   */
  getNextAction: protectedProcedure.query(async ({ ctx }) => {
    assertProviderOrAdmin(ctx.user);
    try {
      const summary = await buildProviderHomeSummary(ctx.user.id);
      return summary.primaryAction;
    } catch (error) {
      console.error("[dashboards.getNextAction]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not load your next step right now.",
      });
    }
  }),

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
