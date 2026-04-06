import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { analyticsService } from "../analytics";

export const analyticsRouter = router({
  /**
   * Record metric
   */
  recordMetric: adminProcedure
    .input(
      z.object({
        name: z.string(),
        value: z.number(),
        unit: z.string(),
        category: z.enum(["enrollment", "completion", "engagement", "impact", "revenue"]),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ input }) => {
      const metric = analyticsService.recordMetric(
        input.name,
        input.value,
        input.unit,
        input.category as "enrollment" | "completion" | "engagement" | "impact" | "revenue",
        input.metadata || {}
      );

      return {
        success: true,
        metric,
      };
    }),

  /**
   * Update user analytics
   */
  updateUserAnalytics: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        coursesCompleted: z.number().optional(),
        certificatesEarned: z.number().optional(),
        totalLearningHours: z.number().optional(),
        quizzesPassed: z.number().optional(),
        averageQuizScore: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const analytics = analyticsService.updateUserAnalytics(userId, {
        coursesCompleted: input.coursesCompleted,
        certificatesEarned: input.certificatesEarned,
        totalLearningHours: input.totalLearningHours,
        quizzesPassed: input.quizzesPassed,
        averageQuizScore: input.averageQuizScore,
      });

      return {
        success: true,
        analytics,
      };
    }),

  /**
   * Get user analytics
   */
  getUserAnalytics: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const analytics = analyticsService.getUserAnalytics(userId);

      return {
        success: !!analytics,
        analytics,
      };
    }),

  /**
   * Get impact metrics
   */
  getImpactMetrics: protectedProcedure.query(() => {
    const impact = analyticsService.getImpactMetrics();

    return {
      success: true,
      impact,
    };
  }),

  /**
   * Create cohort
   */
  createCohort: adminProcedure
    .input(
      z.object({
        cohortId: z.string(),
        startDate: z.date(),
        enrollmentCount: z.number(),
      })
    )
    .mutation(({ input }) => {
      const cohort = analyticsService.createCohort(input.cohortId, input.startDate, input.enrollmentCount);

      return {
        success: true,
        cohort,
      };
    }),

  /**
   * Update cohort analytics
   */
  updateCohortAnalytics: adminProcedure
    .input(
      z.object({
        cohortId: z.string(),
        completionCount: z.number().optional(),
        averageTimeToCompletion: z.number().optional(),
        averageScore: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const cohort = analyticsService.updateCohortAnalytics(input.cohortId, {
        completionCount: input.completionCount,
        averageTimeToCompletion: input.averageTimeToCompletion,
        averageScore: input.averageScore,
      });

      return {
        success: !!cohort,
        cohort,
      };
    }),

  /**
   * Get cohort analytics
   */
  getCohortAnalytics: adminProcedure
    .input(
      z.object({
        cohortId: z.string(),
      })
    )
    .query(({ input }) => {
      const cohort = analyticsService.getCohortAnalytics(input.cohortId);

      return {
        success: !!cohort,
        cohort,
      };
    }),

  /**
   * Record revenue
   */
  recordRevenue: adminProcedure
    .input(
      z.object({
        period: z.string(),
        totalRevenue: z.number(),
        byPaymentMethod: z.record(z.string(), z.number()),
        byUserType: z.record(z.string(), z.number()),
      })
    )
    .mutation(({ input }) => {
      const revenue = analyticsService.recordRevenue(
        input.period,
        input.totalRevenue,
        input.byPaymentMethod,
        input.byUserType
      );

      return {
        success: true,
        revenue,
      };
    }),

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics: adminProcedure
    .input(
      z.object({
        period: z.string(),
      })
    )
    .query(({ input }) => {
      const revenue = analyticsService.getRevenueAnalytics(input.period);

      return {
        success: !!revenue,
        revenue,
      };
    }),

  /**
   * Record engagement metrics
   */
  recordEngagementMetrics: adminProcedure
    .input(
      z.object({
        period: z.string(),
        dailyActiveUsers: z.number(),
        weeklyActiveUsers: z.number(),
        monthlyActiveUsers: z.number(),
        averageSessionDuration: z.number(),
      })
    )
    .mutation(({ input }) => {
      const engagement = analyticsService.recordEngagementMetrics(
        input.period,
        input.dailyActiveUsers,
        input.weeklyActiveUsers,
        input.monthlyActiveUsers,
        input.averageSessionDuration
      );

      return {
        success: true,
        engagement,
      };
    }),

  /**
   * Get engagement metrics
   */
  getEngagementMetrics: adminProcedure
    .input(
      z.object({
        period: z.string(),
      })
    )
    .query(({ input }) => {
      const engagement = analyticsService.getEngagementMetrics(input.period);

      return {
        success: !!engagement,
        engagement,
      };
    }),

  /**
   * Generate social impact report
   */
  generateSocialImpactReport: adminProcedure
    .input(
      z.object({
        period: z.string(),
      })
    )
    .query(({ input }) => {
      const report = analyticsService.generateSocialImpactReport(input.period);

      return {
        success: true,
        report,
      };
    }),

  /**
   * Get dashboard summary
   */
  getDashboardSummary: protectedProcedure.query(() => {
    const summary = analyticsService.getDashboardSummary();

    return {
      success: true,
      ...summary,
    };
  }),
});
