/**
 * Provider Intelligence Router
 * 
 * Tracks individual provider mastery progress, recommends next conditions,
 * and provides anonymized peer benchmarking to drive engagement.
 * 
 * Strategic alignment: Pillar B (ResusGPS mastery) + engagement
 */

import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db';
import { resusSessionRecords, usersTable, streakRecords } from '../../drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { FellowshipCondition } from '../lib/pathway-condition-mapping';

export const providerIntelligenceRouter = router({
  /**
   * Get provider's ResusGPS mastery progress
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get all ResusGPS sessions for this provider
    const sessions = await db.query.resusSessionRecords.findMany({
      where: eq(resusSessionRecords.userId, userId),
      orderBy: desc(resusSessionRecords.createdAt),
    });

    // Aggregate by condition
    const conditionStats: Record<string, any> = {};
    const conditions = Object.values(FellowshipCondition);

    conditions.forEach((condition) => {
      conditionStats[condition] = {
        condition,
        casesCompleted: 0,
        casesRequired: 3,
        depthScore: 0,
        lastPracticed: 'Never',
        status: 'not-started' as const,
      };
    });

    // Process sessions
    sessions.forEach((session: any) => {
      const data = session.data || {};
      const attributedConditions = data.attributedConditions || [];

      attributedConditions.forEach((cond: string) => {
        if (conditionStats[cond]) {
          conditionStats[cond].casesCompleted += 1;
          conditionStats[cond].depthScore = Math.max(
            conditionStats[cond].depthScore,
            data.depthScore || 0
          );
          conditionStats[cond].lastPracticed = new Date(session.createdAt).toLocaleDateString();
        }
      });
    });

    // Determine status
    Object.values(conditionStats).forEach((stat: any) => {
      if (stat.casesCompleted >= 3) {
        stat.status = 'mastered';
      } else if (stat.casesCompleted > 0) {
        stat.status = 'in-progress';
      }
    });

    // Get this week's sessions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionsThisWeek = sessions.filter(
      (s: any) => new Date(s.createdAt) > weekAgo
    ).length;

    // Get current streak
    const streak = await db.query.streakRecords.findFirst({
      where: eq(streakRecords.userId, userId),
      orderBy: desc(streakRecords.createdAt),
    });

    // Calculate average depth score
    const avgDepthScore =
      sessions.length > 0
        ? sessions.reduce((sum: number, s: any) => sum + (s.data?.depthScore || 0), 0) /
          sessions.length
        : 0;

    return {
      conditions: Object.values(conditionStats),
      sessionsThisWeek,
      currentStreak: streak?.currentStreak || 0,
      avgDepthScore,
      totalSessions: sessions.length,
    };
  }),

  /**
   * Get anonymized peer benchmarking
   */
  getPeerBenchmarks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get user's institution
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user?.institutionId) {
      return {
        yourRank: 0,
        totalProviders: 0,
        facilityAvgSessions: 0,
        facilityAvgMastered: 0,
        facilityAvgDepth: 0,
      };
    }

    // Get all providers in the same institution
    const institutionProviders = await db.query.usersTable.findMany({
      where: and(
        eq(usersTable.institutionId, user.institutionId),
        eq(usersTable.role, 'provider')
      ),
    });

    // Calculate metrics for each provider
    const providerMetrics = await Promise.all(
      institutionProviders.map(async (provider: any) => {
        const sessions = await db.query.resusSessionRecords.findMany({
          where: eq(resusSessionRecords.userId, provider.id),
        });

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const sessionsThisWeek = sessions.filter(
          (s: any) => new Date(s.createdAt) > weekAgo
        ).length;

        // Count mastered conditions
        const conditionCounts: Record<string, number> = {};
        sessions.forEach((session: any) => {
          const attributed = session.data?.attributedConditions || [];
          attributed.forEach((cond: string) => {
            conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
          });
        });

        const masteredCount = Object.values(conditionCounts).filter(
          (count) => count >= 3
        ).length;

        const avgDepth =
          sessions.length > 0
            ? sessions.reduce((sum: number, s: any) => sum + (s.data?.depthScore || 0), 0) /
              sessions.length
            : 0;

        return {
          userId: provider.id,
          sessionsThisWeek,
          masteredCount,
          avgDepth,
        };
      })
    );

    // Sort by sessions this week
    const ranked = providerMetrics.sort((a, b) => b.sessionsThisWeek - a.sessionsThisWeek);
    const yourRank = ranked.findIndex((m) => m.userId === userId) + 1;

    // Calculate facility averages
    const facilityAvgSessions =
      ranked.length > 0
        ? Math.round(ranked.reduce((sum, m) => sum + m.sessionsThisWeek, 0) / ranked.length)
        : 0;

    const facilityAvgMastered =
      ranked.length > 0
        ? Math.round(ranked.reduce((sum, m) => sum + m.masteredCount, 0) / ranked.length)
        : 0;

    const facilityAvgDepth =
      ranked.length > 0
        ? ranked.reduce((sum, m) => sum + m.avgDepth, 0) / ranked.length
        : 0;

    return {
      yourRank,
      totalProviders: ranked.length,
      facilityAvgSessions,
      facilityAvgMastered,
      facilityAvgDepth,
    };
  }),

  /**
   * Get next recommended condition for provider
   */
  getNextRecommendation: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get provider's current progress
    const sessions = await db.query.resusSessionRecords.findMany({
      where: eq(resusSessionRecords.userId, userId),
      orderBy: desc(resusSessionRecords.createdAt),
    });

    // Count cases per condition
    const conditionCounts: Record<string, number> = {};
    const lastPracticed: Record<string, Date> = {};

    sessions.forEach((session: any) => {
      const attributed = session.data?.attributedConditions || [];
      attributed.forEach((cond: string) => {
        conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        lastPracticed[cond] = new Date(session.createdAt);
      });
    });

    // Find conditions with <3 cases
    const incompleteConds = Object.values(FellowshipCondition).filter(
      (cond) => (conditionCounts[cond] || 0) < 3
    );

    if (incompleteConds.length === 0) {
      return null;
    }

    // Score by: missing cases + facility gap + clinical priority
    const scored = incompleteConds.map((cond) => {
      const casesCompleted = conditionCounts[cond] || 0;
      const casesMissing = 3 - casesCompleted;
      const daysSinceLastPractice = lastPracticed[cond]
        ? Math.floor((Date.now() - lastPracticed[cond].getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const clinicalPriority = getClinicalPriority(cond);

      const score =
        casesMissing * 100 + // Heavily weight missing cases
        daysSinceLastPractice * 10 + // Weight recency
        clinicalPriority; // Weight clinical importance

      return {
        condition: cond,
        score,
        casesCompleted,
        daysSinceLastPractice,
        clinicalPriority,
      };
    });

    const recommended = scored.sort((a, b) => b.score - a.score)[0];

    return {
      condition: recommended.condition,
      casesCompleted: recommended.casesCompleted,
      reason: `You've completed ${recommended.casesCompleted}/3 cases. This is a critical condition for your facility.`,
      impact: recommended.clinicalPriority > 75 ? 'High' : 'Medium',
      facilityGapDays: recommended.daysSinceLastPractice,
    };
  }),
});

/**
 * Get clinical priority score for a condition
 */
function getClinicalPriority(condition: string): number {
  const priorities: Record<string, number> = {
    cardiac_arrest: 100,
    airway_obstruction: 95,
    severe_respiratory_distress: 90,
    anaphylaxis: 85,
    status_epilepticus: 80,
    septic_shock: 75,
    hypovolemic_shock: 70,
    dka: 65,
    tension_pneumothorax: 60,
    meningitis: 55,
    severe_dehydration: 50,
    hypoglycemia: 45,
    aspiration: 40,
    drowning: 35,
    trauma: 30,
    asthma_exacerbation: 25,
    bronchiolitis: 20,
    pneumonia: 15,
    gastroenteritis: 10,
    fever: 5,
  };

  return priorities[condition] || 50;
}
