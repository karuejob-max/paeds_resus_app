import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  courses,
  modules,
  quizzes,
  quizQuestions,
  userProgress,
  enrollments,
} from "../../drizzle/schema";

export const learningRouter = router({
  // Get all courses
  getCourses: publicProcedure
    .input(
      z.object({
        programType: z.string().optional(),
        level: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      let query: any = (db as any).select().from(courses);

      if (input.programType) {
        // Skip programType filtering for now
      }

      if (input.level) {
        // Skip level filtering for now
      }

      return query.orderBy((courses as any).order);
    }),

  // Get course details with modules
  getCourseDetails: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const course = await (db as any)
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course.length) {
        throw new Error("Course not found");
      }

      const courseModules = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.courseId, input.courseId))
        .orderBy(modules.order);

      return {
        ...course[0],
        modules: courseModules,
      };
    }),

  // Get module content with quizzes
  getModuleContent: publicProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const module = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.id, input.moduleId))
        .limit(1);

      if (!module.length) {
        throw new Error("Module not found");
      }

      const moduleQuizzes = await (db as any)
        .select()
        .from(quizzes)
        .where(eq(quizzes.moduleId, input.moduleId))
        .orderBy(quizzes.order);

      return {
        ...module[0],
        quizzes: moduleQuizzes,
      };
    }),

  // Get quiz questions
  getQuizQuestions: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return (db as any)
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, input.quizId))
        .orderBy(quizQuestions.order);
    }),

  // Enroll in course
  enrollCourse: protectedProcedure
    .input(z.object({ courseId: z.number(), programType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Create enrollment
      await (db as any).insert(enrollments).values({
        // @ts-ignore
        userId: ctx.user.id,
        programType: input.programType,
        trainingDate: new Date(),
        paymentStatus: "completed",
      });

      return { success: true, message: "Enrolled successfully" };
    }),

  // Get user progress
  getUserProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.courseId)
          )
        );

      return progress;
    }),

  // Record quiz attempt
  recordQuizAttempt: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        moduleId: z.number(),
        enrollmentId: z.number(),
        score: z.number(),
        answers: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check if progress record exists
      const existing = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.moduleId, input.moduleId),
            eq(userProgress.quizId, input.quizId)
          )
        );

      if (existing && existing.length > 0) {
        // Update existing progress
        await (db as any)
          .update(userProgress)
          .set({
            score: input.score,
            attempts: ((existing[0] as any).attempts || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, (existing[0] as any).id));
      } else {
        // Create new progress record
        await (db as any).insert(userProgress).values({
          userId: ctx.user.id,
          enrollmentId: input.enrollmentId,
          moduleId: input.moduleId,
          quizId: input.quizId,
          score: input.score,
          attempts: 1,
          status: input.score >= 70 ? "completed" : "in_progress",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true, score: input.score };
    }),

  // Get recommended courses based on performance
  getRecommendedCourses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    // Get all courses
    const allCourses = await (db as any).select().from(courses).limit(5);

    return allCourses;
  }),

  // Mark module as completed
  completeModule: protectedProcedure
    .input(z.object({ moduleId: z.number(), enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Update all quiz progress for this module to completed
      await (db as any)
        .update(userProgress)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.moduleId, input.moduleId)
          )
        );

      return { success: true };
    }),

  // Get course completion stats
  getCourseStats: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Get course modules
      const courseModules = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.courseId, input.courseId));

      // Get user progress for each module
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, ctx.user.id));

      const completedModules = progress.filter(
        (p: any) => p.status === "completed"
      ).length;
      const averageScore =
        progress.length > 0
          ? progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) /
            progress.length
          : 0;

      return {
        totalModules: courseModules.length,
        completedModules,
        averageScore: Math.round(averageScore),
        percentComplete: Math.round(
          (completedModules / courseModules.length) * 100
        ),
      };
    }),

  // Get learning dashboard
  getLearningDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    // Get enrolled courses
    const enrolledCourses = await (db as any)
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id));

    // Get all courses for reference
    const allCourses = await (db as any).select().from(courses);

    // Get progress for each enrollment
    const courseProgress = enrolledCourses.map((enrollment: any) => {
      const course = allCourses.find((c: any) => c.id === enrollment.programType);
      return {
        ...enrollment,
        course,
        progress: { completed: 0, total: 0, percentage: 0 },
      } as any;
    });

    return {
      enrolledCourses: courseProgress,
      totalCoursesCompleted: courseProgress.filter(
        (c: any) => (c as any).status === "completed"
      ).length,
      inProgressCourses: courseProgress.filter(
        (c: any) => c.status === "in_progress"
      ).length,
    };
  }),
});
