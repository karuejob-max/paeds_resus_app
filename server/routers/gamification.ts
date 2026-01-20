import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { gamificationService } from "../gamification";

export const gamificationRouter = router({
  /**
   * Award badge
   */
  awardBadge: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        badgeId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const success = gamificationService.awardBadge(input.userId, input.badgeId);

      return {
        success,
        message: success ? "Badge awarded" : "Failed to award badge",
      };
    }),

  /**
   * Get user badges
   */
  getUserBadges: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const badges = gamificationService.getUserBadges(userId);

      return {
        success: true,
        badges,
        total: badges.length,
      };
    }),

  /**
   * Add points
   */
  addPoints: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        points: z.number().positive(),
        reason: z.string(),
      })
    )
    .mutation(({ input }) => {
      const userPoints = gamificationService.addPoints(input.userId, input.points, input.reason);

      return {
        success: true,
        userPoints,
      };
    }),

  /**
   * Get user points
   */
  getUserPoints: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const points = gamificationService.getUserPoints(userId);

      return {
        success: !!points,
        points,
      };
    }),

  /**
   * Update streak
   */
  updateStreak: protectedProcedure
    .input(
      z.object({
        streakType: z.enum(["login", "course", "quiz", "practice"]),
      })
    )
    .mutation(({ ctx, input }) => {
      const streak = gamificationService.updateStreak(ctx.user.id, input.streakType);

      return {
        success: true,
        streak,
      };
    }),

  /**
   * Get user streaks
   */
  getUserStreaks: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const streaks = gamificationService.getUserStreaks(userId);

      return {
        success: true,
        streaks,
        total: streaks.length,
      };
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(({ input }) => {
      const leaderboard = gamificationService.getLeaderboard(input.limit);

      return {
        success: true,
        leaderboard,
        total: leaderboard.length,
      };
    }),

  /**
   * Get user rank
   */
  getUserRank: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const rank = gamificationService.getUserRank(userId);

      return {
        success: !!rank,
        rank,
      };
    }),

  /**
   * Get active challenges
   */
  getActiveChallenges: protectedProcedure.query(() => {
    const challenges = gamificationService.getActiveChallenges();

    return {
      success: true,
      challenges,
      total: challenges.length,
    };
  }),

  /**
   * Get all challenges
   */
  getAllChallenges: protectedProcedure.query(() => {
    const challenges = gamificationService.getChallenges();

    return {
      success: true,
      challenges,
      total: challenges.length,
    };
  }),

  /**
   * Get gamification summary
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const summary = gamificationService.getGamificationSummary(userId);

      return {
        success: true,
        ...summary,
      };
    }),
});
