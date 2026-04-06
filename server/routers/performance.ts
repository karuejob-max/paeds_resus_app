import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { recordApiResponseTime, recordPageLoadTime, recordError, generatePerformanceReport, getRecentMetrics, getRecentErrorsReport } from "../services/performance.service";
import { getDb } from "../db";
import {
  providerStats,
  leaderboardRankings,
  achievements,
  performanceHistory,
  teamPerformance,
  performanceEvents,
  users,
} from "../../drizzle/schema";
import { eq, desc, and, gte, asc, or, inArray } from "drizzle-orm";

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

  // ============================================
  // PROVIDER PERFORMANCE DASHBOARD PROCEDURES
  // ============================================

  /**
   * Get provider statistics
   */
  getProviderStats: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId || ctx.user.id;
      const db = getDb() as any;

      const stats = await db
        .select()
        .from(providerStats)
        .where(eq(providerStats.userId, targetUserId))
        .limit(1);

      return stats[0] || null;
    }),

  /**
   * Get leaderboard rankings
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        category: z.enum(["performance", "interventions", "patients_served", "training"]),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb() as any;
      const rankings = await db
        .select({
          id: leaderboardRankings.id,
          userId: leaderboardRankings.userId,
          rank: leaderboardRankings.rank,
          score: leaderboardRankings.score,
          percentile: leaderboardRankings.percentile,
          rankChange: leaderboardRankings.rankChange,
          userName: users.name,
          userEmail: users.email,
          providerType: users.providerType,
        })
        .from(leaderboardRankings)
        .leftJoin(users, eq(leaderboardRankings.userId, users.id))
        .where(eq(leaderboardRankings.category, input.category))
        .orderBy(asc(leaderboardRankings.rank))
        .limit(input.limit)
        .offset(input.offset);

      return rankings;
    }),

  /**
   * Get provider achievements
   */
  getAchievements: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId || ctx.user.id;
      const db = getDb() as any;

      const userAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, targetUserId))
        .orderBy(desc(achievements.earnedAt));

      return userAchievements;
    }),

  /**
   * Get performance history for trend analysis
   */
  getPerformanceHistory: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        metricType: z.string(),
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId || ctx.user.id;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const db = getDb() as any;

      const history = await db
        .select()
        .from(performanceHistory)
        .where(
          and(
            eq(performanceHistory.userId, targetUserId),
            eq(performanceHistory.metricType, input.metricType),
            gte(performanceHistory.recordedAt, startDate)
          )
        )
        .orderBy(desc(performanceHistory.recordedAt));

      return history;
    }),

  /**
   * Get team performance (for institutional users)
   */
  getTeamPerformance: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb() as any;
      const teamPerf = await db
        .select()
        .from(teamPerformance)
        .where(eq(teamPerformance.institutionalAccountId, input.institutionalAccountId))
        .limit(1);

      return teamPerf[0] || null;
    }),

  /**
   * Get recent performance events
   */
  getRecentEvents: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId || ctx.user.id;
      const db = getDb() as any;

      const events = await db
        .select()
        .from(performanceEvents)
        .where(eq(performanceEvents.userId, targetUserId))
        .orderBy(desc(performanceEvents.createdAt))
        .limit(input.limit);

      return events.map((event: any) => ({
        ...event,
        eventData: event.eventData ? JSON.parse(event.eventData) : null,
      }));
    }),

  /**
   * Update provider statistics (admin/system only)
   */
  updateProviderStats: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        totalPatientsServed: z.number().optional(),
        totalInterventions: z.number().optional(),
        averageResponseTime: z.number().optional(),
        successRate: z.number().optional(),
        patientsImproved: z.number().optional(),
        certificationsCompleted: z.number().optional(),
        trainingHoursCompleted: z.number().optional(),
        performanceScore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or updating their own stats
      if (ctx.user.role !== "admin" && ctx.user.id !== input.userId) {
        throw new Error("Unauthorized");
      }
      const db = getDb() as any;

      const existing = await db
        .select()
        .from(providerStats)
        .where(eq(providerStats.userId, input.userId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(providerStats)
          .set({
            totalPatientsServed: input.totalPatientsServed ?? existing[0].totalPatientsServed,
            totalInterventions: input.totalInterventions ?? existing[0].totalInterventions,
            averageResponseTime: input.averageResponseTime ?? existing[0].averageResponseTime,
            successRate: input.successRate ?? existing[0].successRate,
            patientsImproved: input.patientsImproved ?? existing[0].patientsImproved,
            certificationsCompleted:
              input.certificationsCompleted ?? existing[0].certificationsCompleted,
            trainingHoursCompleted:
              input.trainingHoursCompleted ?? existing[0].trainingHoursCompleted,
            performanceScore: input.performanceScore ?? existing[0].performanceScore,
          })
          .where(eq(providerStats.userId, input.userId));
      } else {
        // Create new
        await db.insert(providerStats).values({
          userId: input.userId,
          totalPatientsServed: input.totalPatientsServed || 0,
          totalInterventions: input.totalInterventions || 0,
          averageResponseTime: input.averageResponseTime || 0,
          successRate: input.successRate || 0,
          patientsImproved: input.patientsImproved || 0,
          certificationsCompleted: input.certificationsCompleted || 0,
          trainingHoursCompleted: input.trainingHoursCompleted || 0,
          performanceScore: input.performanceScore || 0,
        });
      }

      return { success: true };
    }),

  /**
   * Record performance event
   */
  recordEvent: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        eventData: z.record(z.string(), z.any()).optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb() as any;
      await db.insert(performanceEvents).values({
        userId: ctx.user.id,
        eventType: input.eventType,
        eventData: input.eventData ? JSON.stringify(input.eventData) : null,
        severity: input.severity || "info",
      });

      return { success: true };
    }),

  /**
   * Award achievement
   */
  awardAchievement: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        achievementType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin or awarding to themselves
      if (ctx.user.role !== "admin" && ctx.user.id !== input.userId) {
        throw new Error("Unauthorized");
      }
      const db = getDb() as any;

      await db.insert(achievements).values({
        userId: input.userId,
        achievementType: input.achievementType,
        title: input.title,
        description: input.description,
        icon: input.icon,
      });

      return { success: true };
    }),

  /**
   * Get top performers
   */
  getTopPerformers: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = getDb() as any;
      const topPerformers = await db
        .select({
          userId: providerStats.userId,
          performanceScore: providerStats.performanceScore,
          totalPatientsServed: providerStats.totalPatientsServed,
          totalInterventions: providerStats.totalInterventions,
          successRate: providerStats.successRate,
          userName: users.name,
          userEmail: users.email,
          providerType: users.providerType,
        })
        .from(providerStats)
        .leftJoin(users, eq(providerStats.userId, users.id))
        .orderBy(desc(providerStats.performanceScore))
        .limit(input.limit);

      return topPerformers;
    }),

  /**
   * Get performance comparison
   */
  getComparison: protectedProcedure
    .input(z.object({ userIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      const db = getDb() as any;
      
      if (input.userIds.length === 0) {
        return [];
      }

      const comparison: any = await db
        .select({
          userId: providerStats.userId,
          performanceScore: providerStats.performanceScore,
          totalPatientsServed: providerStats.totalPatientsServed,
          totalInterventions: providerStats.totalInterventions,
          successRate: providerStats.successRate,
          userName: users.name,
          providerType: users.providerType,
        })
        .from(providerStats)
        .leftJoin(users, eq(providerStats.userId, users.id))
        .where(inArray(providerStats.userId, input.userIds))

      return comparison;
    }),
});
