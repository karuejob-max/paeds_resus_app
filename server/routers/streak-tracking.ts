/**
 * Streak Tracking Router
 * 
 * tRPC procedures for streak calculation, leaderboards, and milestones
 * Drives Pillar B engagement through gamification
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import {
  calculateStreak,
  getFacilityStreakLeaderboard,
  getUserStreakMilestones,
} from '../lib/streak-tracking';

export const streakTrackingRouter = router({
  /**
   * Get streak for a specific condition
   */
  getConditionStreak: protectedProcedure
    .input(
      z.object({
        condition: z.string(),
        userId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.user.id;
      
      // Verify access
      if (input.userId && input.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const streak = await calculateStreak(userId, input.condition);
      return streak;
    }),

  /**
   * Get all streak milestones for current user
   */
  getUserMilestones: protectedProcedure
    .query(async ({ ctx }) => {
      const milestones = await getUserStreakMilestones(ctx.user.id);
      return milestones;
    }),

  /**
   * Get facility streak leaderboard
   */
  getFacilityLeaderboard: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this institution
      // (In production, check institutional membership)
      
      const leaderboard = await getFacilityStreakLeaderboard(input.institutionId);
      return leaderboard;
    }),

  /**
   * Get top 3 conditions by streak (for dashboard quick view)
   */
  getTopStreaks: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(3),
      })
    )
    .query(async ({ input, ctx }) => {
      const milestones = await getUserStreakMilestones(ctx.user.id);
      return milestones.slice(0, input.limit);
    }),
});
