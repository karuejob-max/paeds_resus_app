/**
 * Condition Recommendation AI Router
 * 
 * Uses facility gaps + learner progress to recommend next condition.
 * Integrates with ResusGPS auto-launch for seamless UX.
 * 
 * Strategic alignment: Pillar B mastery through personalized learning paths
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { analyticsEvents, users } from '../../drizzle/schema';
import { calculateStreak } from '../lib/streak-tracking';

interface ConditionScore {
  condition: string;
  score: number;
  reason: string;
  lastPracticed: number; // days ago
  facilityGapDays: number;
  learnerStreak: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Score conditions based on:
 * 1. Facility training gaps (not practiced in 30+ days = high priority)
 * 2. Learner progress (conditions with <3 valid sessions = needs practice)
 * 3. Learner streak (conditions with <7 day streak = engagement opportunity)
 * 4. Clinical priority (life-threatening conditions = always high)
 */
async function scoreConditions(
  userId: number,
  institutionId: number
): Promise<ConditionScore[]> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Get learner's session history (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const learnerSessions = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, ninetyDaysAgo)
      )
    );

  // Get facility's session history (last 90 days)
  const facilitySessions = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, 'resusGps_session_completed'),
        gte(analyticsEvents.createdAt, ninetyDaysAgo)
      )
    );

  // Parse conditions from learner sessions
  const learnerConditions = new Map<string, number>();
  for (const session of learnerSessions) {
    try {
      const data = typeof session.eventData === 'string'
        ? JSON.parse(session.eventData)
        : session.eventData;
      if (data.attributedConditions) {
        for (const condition of data.attributedConditions) {
          learnerConditions.set(condition, (learnerConditions.get(condition) || 0) + 1);
        }
      }
    } catch (e) {
      console.error('Error parsing learner session:', e);
    }
  }

  // Parse conditions from facility sessions
  const facilityConditions = new Map<string, { count: number; lastDate: Date }>();
  for (const session of facilitySessions) {
    try {
      const data = typeof session.eventData === 'string'
        ? JSON.parse(session.eventData)
        : session.eventData;
      if (data.attributedConditions) {
        for (const condition of data.attributedConditions) {
          const existing = facilityConditions.get(condition);
          facilityConditions.set(condition, {
            count: (existing?.count || 0) + 1,
            lastDate: session.createdAt > (existing?.lastDate || new Date(0))
              ? session.createdAt
              : existing?.lastDate || new Date(),
          });
        }
      }
    } catch (e) {
      console.error('Error parsing facility session:', e);
    }
  }

  // Clinical priority mapping (higher = more critical)
  const clinicalPriority: Record<string, number> = {
    'cardiac_arrest': 100,
    'septic_shock': 95,
    'respiratory_failure': 90,
    'status_epilepticus': 85,
    'severe_malaria': 80,
    'anaphylaxis': 85,
    'dka': 80,
    'meningitis': 85,
    'pneumonia': 70,
    'gastroenteritis': 60,
    'dehydration': 60,
    'hypoglycemia': 75,
    'airway_obstruction': 90,
  };

  // Score all conditions
  const scores: ConditionScore[] = [];
  const allConditions = new Set([
    ...learnerConditions.keys(),
    ...facilityConditions.keys(),
    ...Object.keys(clinicalPriority),
  ]);

  for (const condition of allConditions) {
    const learnerCount = learnerConditions.get(condition) || 0;
    const facilityData = facilityConditions.get(condition);
    const lastPracticedDate = facilityData?.lastDate || new Date(0);
    const daysSinceLastPractice = Math.floor(
      (Date.now() - lastPracticedDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Calculate learner streak
    let learnerStreak = 0;
    try {
      const streak = await calculateStreak(userId, condition);
      learnerStreak = streak.currentStreak;
    } catch (e) {
      console.error(`Error calculating streak for ${condition}:`, e);
    }

    // Score components
    let score = 0;
    let reason = '';
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';

    // Component 1: Facility gap (30+ days = critical)
    if (daysSinceLastPractice >= 30) {
      score += 40;
      reason += `Facility gap: ${daysSinceLastPractice} days. `;
      priority = 'critical';
    } else if (daysSinceLastPractice >= 14) {
      score += 20;
      reason += `Facility gap: ${daysSinceLastPractice} days. `;
      priority = 'high';
    }

    // Component 2: Learner progress (< 3 sessions = needs practice)
    if (learnerCount < 3) {
      score += 30;
      reason += `You need ${3 - learnerCount} more sessions for mastery. `;
      priority = priority === 'critical' ? 'critical' : 'high';
    } else if (learnerCount < 5) {
      score += 15;
      reason += `Continue practicing for deeper mastery. `;
    }

    // Component 3: Learner streak (< 7 days = engagement opportunity)
    if (learnerStreak < 7 && learnerCount > 0) {
      score += 15;
      reason += `Build your ${learnerStreak}-day streak to 7+ days. `;
    }

    // Component 4: Clinical priority
    const clinicalScore = clinicalPriority[condition] || 50;
    score += clinicalScore / 10; // Normalize to 0-10

    if (clinicalScore >= 85) {
      priority = 'critical';
    } else if (clinicalScore >= 70) {
      priority = priority === 'critical' ? 'critical' : 'high';
    }

    scores.push({
      condition,
      score,
      reason: reason.trim(),
      lastPracticed: daysSinceLastPractice,
      facilityGapDays: daysSinceLastPractice,
      learnerStreak,
      priority,
    });
  }

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  return scores;
}

export const conditionRecommendationAI = router({
  /**
   * Get personalized condition recommendation
   * Returns top recommendation + next 3 alternatives
   */
  getRecommendation: protectedProcedure
    .input(z.object({
      institutionId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const scores = await scoreConditions(ctx.user.id, input.institutionId || 0);

      if (scores.length === 0) {
        return {
          recommended: null,
          alternatives: [],
          message: 'No conditions available for practice.',
        };
      }

      const recommended = scores[0];
      const alternatives = scores.slice(1, 4);

      return {
        recommended: {
          condition: recommended.condition,
          reason: recommended.reason,
          priority: recommended.priority,
          score: Math.round(recommended.score),
        },
        alternatives: alternatives.map(alt => ({
          condition: alt.condition,
          reason: alt.reason,
          priority: alt.priority,
        })),
        message: `Recommended: ${recommended.condition}. ${recommended.reason}`,
      };
    }),

  /**
   * Get all scored conditions for dashboard
   */
  getAllScores: protectedProcedure
    .input(z.object({
      institutionId: z.number().optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const scores = await scoreConditions(ctx.user.id, input.institutionId || 0);

      return {
        scores: scores.slice(0, input.limit).map(s => ({
          condition: s.condition,
          score: Math.round(s.score),
          reason: s.reason,
          priority: s.priority,
          lastPracticed: s.lastPracticed,
          learnerStreak: s.learnerStreak,
        })),
        total: scores.length,
      };
    }),

  /**
   * Get recommendation for ResusGPS auto-launch
   * Returns pathway ID to auto-launch
   */
  getAutoLaunchPathway: protectedProcedure
    .input(z.object({
      institutionId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const scores = await scoreConditions(ctx.user.id, input.institutionId || 0);

      if (scores.length === 0) {
        return {
          pathway: null,
          condition: null,
          message: 'No conditions available.',
        };
      }

      const recommended = scores[0];

      // Map condition to ResusGPS pathway
      const pathwayMap: Record<string, string> = {
        'cardiac_arrest': 'cardiac_arrest_protocol',
        'septic_shock': 'septic_shock_protocol',
        'respiratory_failure': 'respiratory_failure_protocol',
        'status_epilepticus': 'seizure_protocol',
        'anaphylaxis': 'anaphylaxis_protocol',
        'dka': 'dka_protocol',
        'meningitis': 'meningitis_protocol',
        'severe_malaria': 'malaria_protocol',
        'hypoglycemia': 'hypoglycemia_protocol',
        'airway_obstruction': 'airway_protocol',
      };

      const pathway = pathwayMap[recommended.condition] || 'general_resus';

      return {
        pathway,
        condition: recommended.condition,
        reason: recommended.reason,
        message: `Auto-launching: ${recommended.condition}`,
      };
    }),

  /**
   * Log recommendation acceptance
   * Track when user accepts vs. ignores recommendations
   */
  logRecommendationAccepted: protectedProcedure
    .input(z.object({
      condition: z.string(),
      accepted: z.boolean(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      await db.insert(analyticsEvents).values({
        userId: ctx.user.id,
        eventType: 'recommendation_' + (input.accepted ? 'accepted' : 'ignored'),
        eventData: JSON.stringify({
          condition: input.condition,
          reason: input.reason,
          timestamp: new Date().toISOString(),
        }),
        createdAt: new Date(),
      });

      return { success: true };
    }),
});
