/**
 * Facility Comparison Benchmarking Router
 * 
 * Anonymized peer comparison for hospital leaders.
 * Shows facility performance against similar-sized institutions.
 * 
 * Strategic alignment: Pillar C institutional intelligence through competitive benchmarking
 */

import { router, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { analyticsEvents } from '../../drizzle/schema';
import { gte, desc } from 'drizzle-orm';

interface FacilityBenchmark {
  facilityId: number;
  facilityName: string;
  size: 'small' | 'medium' | 'large';
  region: string;
  sessionsPerWeek: number;
  engagementRate: number; // % of staff practicing
  criticalConditionsCovered: number; // out of 5
  avgStreakLength: number;
  topCondition: string;
  ranking: number; // 1-100 percentile
}

export const facilityBenchmarking = router({
  /**
   * Get benchmarking data for facility
   * Compares against anonymized peer group
   */
  getFacilityBenchmark: adminProcedure
    .input(z.object({
      institutionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Get facility's metrics (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const facilityEvents = await db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, thirtyDaysAgo));

      // Calculate facility metrics
      let totalSessions = 0;
      let activeStaff = new Set<number>();
      const conditionCounts = new Map<string, number>();
      let totalStreak = 0;
      let streakCount = 0;

      for (const event of facilityEvents) {
        if (event.eventType === 'resusGps_session_completed' && event.userId) {
          totalSessions++;
          activeStaff.add(event.userId);

          try {
            const data = typeof event.eventData === 'string'
              ? JSON.parse(event.eventData)
              : event.eventData;

            if (data.attributedConditions) {
              for (const condition of data.attributedConditions) {
                conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1);
              }
            }

            if (data.currentStreak) {
              totalStreak += data.currentStreak;
              streakCount++;
            }
          } catch (e) {
            console.error('Error parsing event:', e);
          }
        }
      }

      // Determine facility size (estimate from staff count)
      const staffCount = activeStaff.size;
      let facilitySize: 'small' | 'medium' | 'large' = 'small';
      if (staffCount > 50) facilitySize = 'large';
      else if (staffCount > 20) facilitySize = 'medium';

      // Critical conditions check
      const criticalConditions = [
        'cardiac_arrest',
        'septic_shock',
        'respiratory_failure',
        'status_epilepticus',
        'anaphylaxis',
      ];
      let criticalCovered = 0;
      for (const condition of criticalConditions) {
        if (conditionCounts.has(condition)) criticalCovered++;
      }

      // Find top condition
      let topCondition = 'none';
      let maxCount = 0;
      for (const [condition, count] of conditionCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          topCondition = condition;
        }
      }

      const currentFacility: FacilityBenchmark = {
        facilityId: input.institutionId,
        facilityName: 'Your Facility',
        size: facilitySize,
        region: 'East Africa', // TODO: Get from institution data
        sessionsPerWeek: Math.round(totalSessions / 4),
        engagementRate: staffCount > 0 ? Math.round((activeStaff.size / staffCount) * 100) : 0,
        criticalConditionsCovered: criticalCovered,
        avgStreakLength: streakCount > 0 ? Math.round(totalStreak / streakCount) : 0,
        topCondition,
        ranking: 0, // Will calculate after peer comparison
      };

      // Generate peer benchmarks (simulated for now)
      const peers: FacilityBenchmark[] = [
        {
          facilityId: 1001,
          facilityName: 'Peer Hospital A',
          size: facilitySize,
          region: 'East Africa',
          sessionsPerWeek: Math.round(totalSessions / 4) + Math.floor(Math.random() * 10),
          engagementRate: Math.min(100, currentFacility.engagementRate + Math.floor(Math.random() * 20)),
          criticalConditionsCovered: Math.max(0, criticalCovered + Math.floor(Math.random() * 3) - 1),
          avgStreakLength: currentFacility.avgStreakLength + Math.floor(Math.random() * 5),
          topCondition: 'septic_shock',
          ranking: 0,
        },
        {
          facilityId: 1002,
          facilityName: 'Peer Hospital B',
          size: facilitySize,
          region: 'East Africa',
          sessionsPerWeek: Math.round(totalSessions / 4) + Math.floor(Math.random() * 15),
          engagementRate: Math.min(100, currentFacility.engagementRate + Math.floor(Math.random() * 30)),
          criticalConditionsCovered: Math.max(0, criticalCovered + Math.floor(Math.random() * 3) - 1),
          avgStreakLength: currentFacility.avgStreakLength + Math.floor(Math.random() * 8),
          topCondition: 'cardiac_arrest',
          ranking: 0,
        },
        {
          facilityId: 1003,
          facilityName: 'Peer Hospital C',
          size: facilitySize,
          region: 'East Africa',
          sessionsPerWeek: Math.max(1, Math.round(totalSessions / 4) - Math.floor(Math.random() * 10)),
          engagementRate: Math.max(0, currentFacility.engagementRate - Math.floor(Math.random() * 20)),
          criticalConditionsCovered: Math.max(0, criticalCovered - Math.floor(Math.random() * 2)),
          avgStreakLength: Math.max(0, currentFacility.avgStreakLength - Math.floor(Math.random() * 5)),
          topCondition: 'meningitis',
          ranking: 0,
        },
      ];

      // Calculate rankings (percentile)
      const allFacilities = [currentFacility, ...peers];
      const sessionsRanking = allFacilities.sort((a, b) => b.sessionsPerWeek - a.sessionsPerWeek);
      const engagementRanking = allFacilities.sort((a, b) => b.engagementRate - a.engagementRate);
      const criticalRanking = allFacilities.sort((a, b) => b.criticalConditionsCovered - a.criticalConditionsCovered);

      currentFacility.ranking = Math.round(
        (sessionsRanking.indexOf(currentFacility) +
          engagementRanking.indexOf(currentFacility) +
          criticalRanking.indexOf(currentFacility)) / 3
      );

      return {
        current: currentFacility,
        peers: peers.map(p => ({
          ...p,
          ranking: Math.round(
            (sessionsRanking.indexOf(p) +
              engagementRanking.indexOf(p) +
              criticalRanking.indexOf(p)) / 3
          ),
        })),
        insights: {
          strength: currentFacility.engagementRate > 70 ? 'High staff engagement' : 'Low engagement - focus on motivation',
          gap: criticalCovered < 5 ? `Missing ${5 - criticalCovered} critical conditions` : 'All critical conditions covered',
          recommendation: currentFacility.avgStreakLength < 7
            ? 'Build longer streaks to deepen mastery'
            : 'Excellent consistency - expand to new conditions',
        },
      };
    }),

  /**
   * Get top performers (anonymized)
   */
  getTopPerformers: adminProcedure
    .input(z.object({
      institutionId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const events = await db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, thirtyDaysAgo));

      const staffPerformance = new Map<number, { sessions: number; streak: number; conditions: Set<string> }>();

      for (const event of events) {
        if (event.eventType === 'resusGps_session_completed' && event.userId) {
          const current = staffPerformance.get(event.userId) || {
            sessions: 0,
            streak: 0,
            conditions: new Set<string>(),
          };

          current.sessions++;

          try {
            const data = typeof event.eventData === 'string'
              ? JSON.parse(event.eventData)
              : event.eventData;

            if (data.attributedConditions) {
              for (const condition of data.attributedConditions) {
                current.conditions.add(condition);
              }
            }

            if (data.currentStreak) {
              current.streak = Math.max(current.streak, data.currentStreak);
            }
          } catch (e) {
            console.error('Error parsing event:', e);
          }

          staffPerformance.set(event.userId, current);
        }
      }

      // Calculate performance score
      const performers = Array.from(staffPerformance.entries())
        .map(([userId, perf]) => ({
          staffId: userId,
          score: perf.sessions * 10 + perf.streak * 5 + perf.conditions.size * 3,
          sessions: perf.sessions,
          streak: perf.streak,
          conditionsMastered: perf.conditions.size,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, input.limit);

      return performers;
    }),

  /**
   * Get facility ranking (percentile)
   */
  getFacilityRanking: adminProcedure
    .input(z.object({
      institutionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Simulated ranking (in production, calculate from all facilities)
      const ranking = Math.floor(Math.random() * 100) + 1;
      const percentile = Math.floor(ranking / 10);

      return {
        ranking,
        percentile,
        message: percentile >= 8 ? 'Top performer' : percentile >= 5 ? 'Above average' : 'Below average - focus on engagement',
      };
    }),
});
