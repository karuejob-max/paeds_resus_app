import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { advancedAnalyticsService } from "../advanced-analytics";

export const advancedAnalyticsRouter = router({
  /**
   * Create dashboard
   */
  createDashboard: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.enum(["executive", "instructor", "learner", "admin", "custom"]),
        isPublic: z.boolean().optional().default(false),
      })
    )
    .mutation(({ ctx, input }) => {
      const dashboard = advancedAnalyticsService.createDashboard({
        name: input.name,
        description: input.description,
        type: input.type,
        widgets: [],
        filters: [],
        createdBy: ctx.user.id,
        isPublic: input.isPublic,
      });

      return {
        success: true,
        dashboard,
      };
    }),

  /**
   * Get dashboard
   */
  getDashboard: protectedProcedure
    .input(z.object({ dashboardId: z.string() }))
    .query(({ input }) => {
      const dashboard = advancedAnalyticsService.getDashboard(input.dashboardId);

      return {
        success: !!dashboard,
        dashboard,
      };
    }),

  /**
   * Add widget to dashboard
   */
  addWidget: protectedProcedure
    .input(
      z.object({
        dashboardId: z.string(),
        type: z.enum(["chart", "metric", "table", "gauge", "map", "timeline"]),
        title: z.string(),
        dataSource: z.string(),
        configuration: z.record(z.string(), z.unknown()),
        position: z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        }),
      })
    )
    .mutation(({ input }) => {
      const success = advancedAnalyticsService.addWidget(input.dashboardId, {
        id: `widget-${Date.now()}`,
        type: input.type,
        title: input.title,
        dataSource: input.dataSource,
        configuration: input.configuration,
        position: input.position,
      });

      return {
        success,
        message: success ? "Widget added" : "Failed to add widget",
      };
    }),

  /**
   * Create metric
   */
  createMetric: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        formula: z.string(),
        unit: z.string(),
        category: z.string(),
        currentValue: z.number(),
      })
    )
    .mutation(({ input }) => {
      const metric = advancedAnalyticsService.createMetric({
        name: input.name,
        description: input.description,
        formula: input.formula,
        unit: input.unit,
        category: input.category,
        currentValue: input.currentValue,
        trend: "stable",
        trendPercentage: 0,
      });

      return {
        success: true,
        metric,
      };
    }),

  /**
   * Get metric
   */
  getMetric: protectedProcedure
    .input(z.object({ metricId: z.string() }))
    .query(({ input }) => {
      const metric = advancedAnalyticsService.getMetric(input.metricId);

      return {
        success: !!metric,
        metric,
      };
    }),

  /**
   * Update metric value
   */
  updateMetricValue: adminProcedure
    .input(
      z.object({
        metricId: z.string(),
        newValue: z.number(),
      })
    )
    .mutation(({ input }) => {
      const success = advancedAnalyticsService.updateMetricValue(input.metricId, input.newValue);

      return {
        success,
        message: success ? "Metric updated" : "Failed to update metric",
      };
    }),

  /**
   * Create predictive analytics
   */
  createPredictiveAnalytics: adminProcedure
    .input(
      z.object({
        metric: z.string(),
        prediction: z.number(),
        confidence: z.number(),
        forecastDate: z.number(),
        factors: z.array(
          z.object({
            name: z.string(),
            impact: z.number(),
            direction: z.enum(["positive", "negative"]),
          })
        ),
        accuracy: z.number(),
      })
    )
    .mutation(({ input }) => {
      const analytics = advancedAnalyticsService.createPredictiveAnalytics({
        metric: input.metric,
        prediction: input.prediction,
        confidence: input.confidence,
        forecastDate: input.forecastDate,
        factors: input.factors,
        accuracy: input.accuracy,
      });

      return {
        success: true,
        analytics,
      };
    }),

  /**
   * Create custom metric
   */
  createCustomMetric: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        formula: z.string(),
        dataType: z.enum(["number", "percentage", "currency", "duration"]),
      })
    )
    .mutation(({ ctx, input }) => {
      const metric = advancedAnalyticsService.createCustomMetric({
        name: input.name,
        description: input.description,
        formula: input.formula,
        dataType: input.dataType,
        createdBy: ctx.user.id,
        isActive: true,
      });

      return {
        success: true,
        metric,
      };
    }),

  /**
   * Track analytics event
   */
  trackEvent: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        eventData: z.record(z.string(), z.unknown()),
        sessionId: z.string(),
        deviceId: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const event = advancedAnalyticsService.trackEvent({
        userId: ctx.user.id,
        eventType: input.eventType,
        eventData: input.eventData,
        sessionId: input.sessionId,
        deviceId: input.deviceId,
      });

      return {
        success: true,
        event,
      };
    }),

  /**
   * Get user events
   */
  getUserEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const events = advancedAnalyticsService.getUserEvents(ctx.user.id, input.startDate, input.endDate);

      return {
        success: true,
        events,
        total: events.length,
      };
    }),

  /**
   * Create cohort
   */
  createCohort: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        criteria: z.array(
          z.object({
            field: z.string(),
            operator: z.enum(["equals", "contains", "gt", "lt", "between", "in"]),
            value: z.unknown(),
          })
        ),
      })
    )
    .mutation(({ input }) => {
      const cohort = advancedAnalyticsService.createCohort({
        name: input.name,
        description: input.description,
        criteria: input.criteria,
        memberCount: 0,
      });

      return {
        success: true,
        cohort,
      };
    }),

  /**
   * Get cohort
   */
  getCohort: protectedProcedure
    .input(z.object({ cohortId: z.string() }))
    .query(({ input }) => {
      const cohort = advancedAnalyticsService.getCohort(input.cohortId);

      return {
        success: !!cohort,
        cohort,
      };
    }),

  /**
   * Get all dashboards
   */
  getDashboards: protectedProcedure.query(() => {
    const dashboards = advancedAnalyticsService.getDashboards();

    return {
      success: true,
      dashboards,
      total: dashboards.length,
    };
  }),

  /**
   * Get all metrics
   */
  getMetrics: protectedProcedure.query(() => {
    const metrics = advancedAnalyticsService.getMetrics();

    return {
      success: true,
      metrics,
      total: metrics.length,
    };
  }),

  /**
   * Get analytics statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = advancedAnalyticsService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
