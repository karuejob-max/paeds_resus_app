import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { aiContentService } from "../ai-content";

export const aiContentRouter = router({
  /**
   * Generate content
   */
  generateContent: adminProcedure
    .input(
      z.object({
        type: z.enum(["course", "quiz", "article", "video_script", "lesson_plan", "assessment"]),
        title: z.string(),
        description: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        language: z.enum(["en", "sw", "fr", "es", "ar"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const content = await aiContentService.generateContent(
        input.type as "course" | "quiz" | "article" | "video_script" | "lesson_plan" | "assessment",
        input.title,
        input.description,
        (input.difficulty || "intermediate") as "beginner" | "intermediate" | "advanced",
        (input.language || "en") as "en" | "sw" | "fr" | "es" | "ar"
      );

      return {
        success: !!content,
        content,
      };
    }),

  /**
   * Localize content
   */
  localizeContent: adminProcedure
    .input(
      z.object({
        contentId: z.string(),
        targetLanguage: z.enum(["en", "sw", "fr", "es", "ar"]),
      })
    )
    .mutation(async ({ input }) => {
      const localized = await aiContentService.localizeContent(
        input.contentId,
        input.targetLanguage as "en" | "sw" | "fr" | "es" | "ar"
      );

      return {
        success: !!localized,
        localized,
      };
    }),

  /**
   * Get content
   */
  getContent: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
      })
    )
    .query(({ input }) => {
      const content = aiContentService.getContent(input.contentId);

      return {
        success: !!content,
        content,
      };
    }),

  /**
   * Get localized content
   */
  getLocalizedContent: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
        language: z.enum(["en", "sw", "fr", "es", "ar"]),
      })
    )
    .query(({ input }) => {
      const localized = aiContentService.getLocalizedContent(
        input.contentId,
        input.language as "en" | "sw" | "fr" | "es" | "ar"
      );

      return {
        success: !!localized,
        localized,
      };
    }),

  /**
   * Get all content
   */
  getAllContent: protectedProcedure
    .input(
      z.object({
        type: z
          .enum(["course", "quiz", "article", "video_script", "lesson_plan", "assessment"])
          .optional(),
      })
    )
    .query(({ input }) => {
      const content = aiContentService.getAllContent(
        input.type as "course" | "quiz" | "article" | "video_script" | "lesson_plan" | "assessment" | undefined
      );

      return {
        success: true,
        content,
        total: content.length,
      };
    }),

  /**
   * Get content statistics
   */
  getStatistics: adminProcedure.query(() => {
    const stats = aiContentService.getStatistics();

    return {
      success: true,
      ...stats,
    };
  }),
});
