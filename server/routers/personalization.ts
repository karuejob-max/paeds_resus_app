import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { personalizationEngine } from "../personalization";

export const personalizationRouter = router({
  /**
   * Get user profile
   */
  getProfile: protectedProcedure.query(({ ctx }) => {
    const profile = personalizationEngine.getProfile(ctx.user.id);
    return {
      success: true,
      profile,
    };
  }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        language: z.string().optional(),
        timezone: z.string().optional(),
        emailFrequency: z.enum(["daily", "weekly", "monthly", "never"]).optional(),
        notificationChannels: z.array(z.enum(["email", "sms", "push"])).optional(),
        darkMode: z.boolean().optional(),
        contentLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = personalizationEngine.updatePreferences(ctx.user.id, input);
      return {
        success,
        message: success ? "Preferences updated successfully" : "Failed to update preferences",
      };
    }),

  /**
   * Add interest
   */
  addInterest: protectedProcedure
    .input(
      z.object({
        interest: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = personalizationEngine.addInterest(ctx.user.id, input.interest);
      return {
        success,
        message: success ? "Interest added successfully" : "Failed to add interest",
      };
    }),

  /**
   * Remove interest
   */
  removeInterest: protectedProcedure
    .input(
      z.object({
        interest: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = personalizationEngine.removeInterest(ctx.user.id, input.interest);
      return {
        success,
        message: success ? "Interest removed successfully" : "Failed to remove interest",
      };
    }),

  /**
   * Add learning goal
   */
  addLearningGoal: protectedProcedure
    .input(
      z.object({
        goal: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = personalizationEngine.addLearningGoal(ctx.user.id, input.goal);
      return {
        success,
        message: success ? "Learning goal added successfully" : "Failed to add learning goal",
      };
    }),

  /**
   * Get personalized recommendations
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).optional().default(5),
      })
    )
    .query(({ ctx, input }) => {
      const recommendations = personalizationEngine.getRecommendations(ctx.user.id, input.limit);
      return {
        success: true,
        recommendations,
        total: recommendations.length,
      };
    }),

  /**
   * Get personalized dashboard
   */
  getDashboard: protectedProcedure.query(({ ctx }) => {
    const widgets = personalizationEngine.getDashboard(ctx.user.id);
    return {
      success: true,
      widgets,
      total: widgets.length,
    };
  }),

  /**
   * Update widget visibility
   */
  updateWidgetVisibility: protectedProcedure
    .input(
      z.object({
        widgetId: z.string(),
        isVisible: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = personalizationEngine.updateWidgetVisibility(
        ctx.user.id,
        input.widgetId,
        input.isVisible
      );
      return {
        success,
        message: success ? "Widget visibility updated" : "Failed to update widget visibility",
      };
    }),

  /**
   * Reorder dashboard widgets
   */
  reorderWidgets: protectedProcedure
    .input(
      z.object({
        widgetIds: z.array(z.string()),
      })
    )
    .mutation(({ ctx, input }) => {
      const success = personalizationEngine.reorderWidgets(ctx.user.id, input.widgetIds);
      return {
        success,
        message: success ? "Widgets reordered successfully" : "Failed to reorder widgets",
      };
    }),

  /**
   * Get personalization summary
   */
  getSummary: protectedProcedure.query(({ ctx }) => {
    const summary = personalizationEngine.getPersonalizationSummary(ctx.user.id);
    return {
      success: true,
      ...summary,
    };
  }),
});
