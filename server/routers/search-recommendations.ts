import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { searchRecommendationEngine } from "../search-recommendations";

export const searchRecommendationsRouter = router({
  /**
   * Search content
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        type: z.array(z.string()).optional(),
        difficulty: z.array(z.string()).optional(),
        language: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).optional().default(20),
      })
    )
    .query(({ input }) => {
      const results = searchRecommendationEngine.search(input.query, {
        type: input.type,
        difficulty: input.difficulty,
        language: input.language,
        tags: input.tags,
      }, input.limit);

      return {
        success: true,
        results,
        total: results.length,
      };
    }),

  /**
   * Get personalized recommendations
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const recommendations = searchRecommendationEngine.getRecommendations(userId, input.limit);

      return {
        success: true,
        recommendations,
        total: recommendations.length,
      };
    }),

  /**
   * Set user preferences
   */
  setUserPreferences: protectedProcedure
    .input(
      z.object({
        favoriteCategories: z.array(z.string()).optional(),
        learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]).optional(),
        preferredLanguage: z.string().optional(),
        difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        interests: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      searchRecommendationEngine.setUserPreferences(ctx.user.id, {
        userId: ctx.user.id,
        favoriteCategories: input.favoriteCategories || [],
        learningStyle: (input.learningStyle || "visual") as "visual" | "auditory" | "kinesthetic" | "reading",
        preferredLanguage: input.preferredLanguage || "en",
        difficultyLevel: (input.difficultyLevel || "beginner") as "beginner" | "intermediate" | "advanced",
        interests: input.interests || [],
      });

      return {
        success: true,
        message: "Preferences updated",
      };
    }),

  /**
   * Get user preferences
   */
  getUserPreferences: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      const preferences = searchRecommendationEngine.getUserPreferences(userId);

      return {
        success: !!preferences,
        preferences,
      };
    }),

  /**
   * Track interaction
   */
  trackInteraction: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      searchRecommendationEngine.trackInteraction(ctx.user.id, input.contentId);

      return {
        success: true,
        message: "Interaction tracked",
      };
    }),

  /**
   * Get trending searches
   */
  getTrendingSearches: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).optional().default(10),
      })
    )
    .query(({ input }) => {
      const trending = searchRecommendationEngine.getTrendingSearches(input.limit);

      return {
        success: true,
        trending,
        total: trending.length,
      };
    }),

  /**
   * Get search suggestions
   */
  getSearchSuggestions: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(20).optional().default(5),
      })
    )
    .query(({ input }) => {
      const suggestions = searchRecommendationEngine.getSearchSuggestions(input.query, input.limit);

      return {
        success: true,
        suggestions,
        total: suggestions.length,
      };
    }),

  /**
   * Get search statistics
   */
  getSearchStatistics: adminProcedure.query(() => {
    const stats = searchRecommendationEngine.getSearchStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
