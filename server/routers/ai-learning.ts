import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generatePersonalizedPath,
  generateAdaptiveQuizzes,
  generateStudySchedule,
  analyzeLearnerPerformance,
  type LearnerProfile,
} from "../ai-learning-paths";

export const aiLearningRouter = router({
  /**
   * Generate personalized learning path for a learner
   */
  generatePath: protectedProcedure
    .input(
      z.object({
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
        specialization: z.string(),
        learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]),
        availableHours: z.number().min(1).max(40),
        goals: z.array(z.string()),
        completedModules: z.array(z.string()).optional(),
        quizScores: z.record(z.string(), z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile: LearnerProfile = {
        userId: ctx.user.id,
        experienceLevel: input.experienceLevel,
        specialization: input.specialization,
        learningStyle: input.learningStyle,
        availableHours: input.availableHours,
        goals: input.goals,
        completedModules: input.completedModules || [],
        quizScores: input.quizScores || {},
      };

      const path = await generatePersonalizedPath(profile);

      return {
        success: true,
        path,
        message: "Personalized learning path generated successfully",
      };
    }),

  /**
   * Get adaptive quiz recommendations
   */
  getAdaptiveQuizzes: protectedProcedure
    .input(
      z.object({
        recentScores: z.record(z.string(), z.number()),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
        learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]),
      })
    )
    .query(async ({ input }) => {
      const profile: LearnerProfile = {
        userId: 0, // Not needed for this operation
        experienceLevel: input.experienceLevel,
        specialization: "",
        learningStyle: input.learningStyle,
        availableHours: 0,
        goals: [],
        completedModules: [],
        quizScores: {},
      };

      const recommendations = await generateAdaptiveQuizzes(
        profile,
        input.recentScores
      );

      return {
        success: true,
        recommendations,
      };
    }),

  /**
   * Generate personalized study schedule
   */
  generateSchedule: protectedProcedure
    .input(
      z.object({
        availableHours: z.number().min(1).max(40),
        learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
        modules: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const profile: LearnerProfile = {
        userId: 0,
        experienceLevel: input.experienceLevel,
        specialization: "",
        learningStyle: input.learningStyle,
        availableHours: input.availableHours,
        goals: [],
        completedModules: [],
        quizScores: {},
      };

      const schedule = await generateStudySchedule(profile, input.modules);

      return {
        success: true,
        schedule,
      };
    }),

  /**
   * Analyze learner performance
   */
  analyzePerformance: protectedProcedure
    .input(
      z.object({
        quizScores: z.record(z.string(), z.number()),
        completedModules: z.array(z.string()),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
        learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]),
      })
    )
    .query(async ({ input }) => {
      const profile: LearnerProfile = {
        userId: 0,
        experienceLevel: input.experienceLevel,
        specialization: "",
        learningStyle: input.learningStyle,
        availableHours: 0,
        goals: [],
        completedModules: input.completedModules,
        quizScores: input.quizScores,
      };

      const analysis = await analyzeLearnerPerformance(profile);

      return {
        success: true,
        analysis,
      };
    }),
});
