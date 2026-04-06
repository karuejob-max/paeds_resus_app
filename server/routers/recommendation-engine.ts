/**
 * Recommendation Engine
 * 
 * Suggests which condition a learner should practice next based on:
 * 1. Fellowship progress (conditions with <3 cases)
 * 2. Facility gaps (conditions not practiced in 30 days)
 * 3. Clinical priority (life-threatening conditions first)
 * 4. Learner engagement (avoid burnout, vary conditions)
 */

import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../db';
import { resusSessionRecords, usersTable } from '../../drizzle/schema';
import { eq, sql, and, desc, lte } from 'drizzle-orm';
import { FELLOWSHIP_CONDITIONS } from '../lib/pathway-condition-mapping';

// Clinical priority scoring (higher = more critical)
const CLINICAL_PRIORITY: Record<string, number> = {
  'cardiac_arrest': 100,
  'airway_obstruction': 95,
  'severe_respiratory_distress': 90,
  'anaphylaxis': 85,
  'status_epilepticus': 80,
  'septic_shock': 75,
  'hypovolemic_shock': 70,
  'dka': 65,
  'tension_pneumothorax': 60,
  'meningitis': 55,
  'severe_dehydration': 50,
  'hypoglycemia': 45,
  'aspiration': 40,
  'drowning': 35,
  'trauma': 30,
  'asthma_exacerbation': 25,
  'bronchiolitis': 20,
  'pneumonia': 15,
  'gastroenteritis': 10,
  'fever': 5,
};

export const recommendationEngineRouter = router({
  /**
   * Get next recommended condition for learner
   * Considers: progress, facility gaps, clinical priority, engagement
   */
  getNextRecommendation: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        institutionId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;

      // Get learner's progress
      const userSessions = await db
        .select({
          condition: resusSessionRecords.attributedConditions,
          createdAt: resusSessionRecords.createdAt,
          isValid: resusSessionRecords.isValid,
        })
        .from(resusSessionRecords)
        .where(eq(resusSessionRecords.userId, userId));

      // Count valid sessions per condition
      const conditionCounts: Record<string, number> = {};
      const lastPracticedDate: Record<string, Date> = {};

      userSessions.forEach((session) => {
        if (session.isValid && session.condition) {
          const conditions = Array.isArray(session.condition)
            ? session.condition
            : [session.condition];

          conditions.forEach((cond) => {
            conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
            if (
              !lastPracticedDate[cond] ||
              session.createdAt > lastPracticedDate[cond]
            ) {
              lastPracticedDate[cond] = session.createdAt;
            }
          });
        }
      });

      // Score each condition
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const scoredConditions = FELLOWSHIP_CONDITIONS.map((cond) => {
        const count = conditionCounts[cond.value] || 0;
        const lastPracticed = lastPracticedDate[cond.value];
        const daysSinceLast = lastPracticed
          ? Math.floor(
              (now.getTime() - lastPracticed.getTime()) / (24 * 60 * 60 * 1000)
            )
          : null;

        // Scoring logic:
        // 1. Conditions with 0-2 cases get priority (need more practice)
        // 2. Conditions not practiced in 30 days get bonus
        // 3. Clinical priority as tiebreaker

        let score = 0;

        // Progress score (0-100): conditions with fewer cases score higher
        if (count === 0) {
          score += 100; // Never practiced
        } else if (count === 1) {
          score += 75; // Only 1 case
        } else if (count === 2) {
          score += 50; // Only 2 cases
        } else {
          score += 0; // Already at minimum (3+ cases)
        }

        // Facility gap bonus (0-30): conditions not practiced recently
        if (daysSinceLast === null) {
          score += 30; // Never practiced at this facility
        } else if (daysSinceLast > 30) {
          score += 20; // Not practiced in 30 days
        } else if (daysSinceLast > 14) {
          score += 10; // Not practiced in 14 days
        }

        // Clinical priority tiebreaker (0-100)
        score += (CLINICAL_PRIORITY[cond.value] || 0) / 2;

        return {
          condition: cond.value,
          label: cond.label,
          count,
          lastPracticed,
          daysSinceLast,
          score,
          priority: CLINICAL_PRIORITY[cond.value] || 0,
        };
      });

      // Sort by score (descending) and return top recommendation
      const sorted = scoredConditions.sort((a, b) => b.score - a.score);
      const topRecommendation = sorted[0];
      const topThree = sorted.slice(0, 3);

      return {
        recommended: topRecommendation,
        alternatives: topThree.slice(1),
        allScores: sorted,
        learnerProgress: {
          totalConditionsAtMinimum: Object.values(conditionCounts).filter(
            (c) => c >= 3
          ).length,
          totalConditions: FELLOWSHIP_CONDITIONS.length,
          percentage: Math.round(
            (Object.values(conditionCounts).filter((c) => c >= 3).length /
              FELLOWSHIP_CONDITIONS.length) *
              100
          ),
        },
      };
    }),

  /**
   * Get facility-level recommendations
   * Shows which conditions are training gaps for the institution
   */
  getFacilityRecommendations: protectedProcedure
    .input(
      z.object({
        institutionId: z.string(),
        daysBack: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const cutoffDate = new Date(
        Date.now() - input.daysBack * 24 * 60 * 60 * 1000
      );

      // Get all sessions for this institution in the period
      const sessions = await db
        .select({
          condition: resusSessionRecords.attributedConditions,
          createdAt: resusSessionRecords.createdAt,
          isValid: resusSessionRecords.isValid,
        })
        .from(resusSessionRecords)
        .where(
          and(
            eq(resusSessionRecords.institutionId, input.institutionId),
            lte(resusSessionRecords.createdAt, cutoffDate)
          )
        );

      // Count conditions practiced
      const conditionCounts: Record<string, number> = {};

      sessions.forEach((session) => {
        if (session.isValid && session.condition) {
          const conditions = Array.isArray(session.condition)
            ? session.condition
            : [session.condition];

          conditions.forEach((cond) => {
            conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
          });
        }
      });

      // Identify gaps (conditions with 0 practice)
      const gaps = FELLOWSHIP_CONDITIONS.filter(
        (cond) => !conditionCounts[cond.value]
      ).map((cond) => ({
        condition: cond.value,
        label: cond.label,
        priority: CLINICAL_PRIORITY[cond.value] || 0,
      }));

      // Sort gaps by clinical priority
      gaps.sort((a, b) => b.priority - a.priority);

      return {
        trainingGaps: gaps,
        gapCount: gaps.length,
        conditionsCovered: FELLOWSHIP_CONDITIONS.length - gaps.length,
        topPriority: gaps[0] || null,
        criticalGaps: gaps.filter((g) => g.priority >= 75),
      };
    }),

  /**
   * Get personalized learning path
   * Combines learner progress + facility gaps for optimal learning order
   */
  getPersonalizedLearningPath: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        institutionId: z.string().optional(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;

      // Get learner recommendation
      const learnerRec = await ctx.caller.recommendationEngine.getNextRecommendation(
        {
          userId,
          institutionId: input.institutionId,
        }
      );

      // Get facility recommendation if institution provided
      let facilityGaps = null;
      if (input.institutionId) {
        facilityGaps = await ctx.caller.recommendationEngine.getFacilityRecommendations(
          {
            institutionId: input.institutionId,
            daysBack: 30,
          }
        );
      }

      // Combine recommendations: prioritize learner gaps that are also facility gaps
      const learningPath = [];

      // Add learner's top recommendations
      if (learnerRec.recommended) {
        learningPath.push({
          ...learnerRec.recommended,
          reason: 'You need more practice in this condition',
          type: 'learner_gap',
        });
      }

      // Add facility critical gaps
      if (facilityGaps?.criticalGaps) {
        facilityGaps.criticalGaps.forEach((gap: any) => {
          if (
            !learningPath.some((item: any) => item.condition === gap.condition)
          ) {
            learningPath.push({
              condition: gap.condition,
              label: gap.label,
              count: 0,
              priority: gap.priority,
              reason: 'Critical training gap at your facility',
              type: 'facility_gap',
            });
          }
        });
      }

      // Add learner alternatives
      if (learnerRec.alternatives) {
        learnerRec.alternatives.forEach((alt: any) => {
          if (!learningPath.some((item: any) => item.condition === alt.condition)) {
            learningPath.push({
              ...alt,
              reason: 'Next condition to practice',
              type: 'learner_alternative',
            });
          }
        });
      }

      return {
        path: learningPath.slice(0, input.limit),
        learnerProgress: learnerRec.learnerProgress,
        facilityGaps: facilityGaps?.gapCount || 0,
        nextSteps: learningPath.slice(0, 3).map((item) => item.label),
      };
    }),
});
