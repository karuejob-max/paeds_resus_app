import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  courses,
  modules,
  quizzes,
  quizQuestions,
  userProgress,
  enrollments,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const learningPathRouter = router({
  // Get personalized learning path for user
  getPersonalizedPath: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        programType: z.enum(["bls", "acls", "pals", "fellowship"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get user's enrollment
      const enrollment = await (db as any)
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.id, input.enrollmentId),
            eq(enrollments.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!enrollment[0]) {
        throw new Error("Enrollment not found");
      }

      // Get courses for program
      const programCourses = await (db as any)
        .select()
        .from(courses)
        .where(eq(courses.programType, input.programType))
        .orderBy(courses.order);

      // Get user progress for each course
      const courseProgress = await Promise.all(
        programCourses.map(async (course: any) => {
          const progress = await (db as any)
            .select()
            .from(userProgress)
            .where(
              and(
                eq(userProgress.userId, ctx.user.id),
                eq(userProgress.enrollmentId, input.enrollmentId)
              )
            );

          const completedModules = progress.filter(
            (p: any) => p.status === "completed"
          ).length;
          const totalModules = await (db as any)
            .select()
            .from(modules)
            .where(eq(modules.courseId, course.id));

          return {
            ...course,
            completedModules,
            totalModules: totalModules.length,
            progressPercentage:
              totalModules.length > 0
                ? Math.round((completedModules / totalModules.length) * 100)
                : 0,
          };
        })
      );

      return {
        enrollment: enrollment[0],
        courses: courseProgress,
      };
    }),

  // Get course details with modules
  getCourseDetails: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const course = await (db as any)
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course[0]) {
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

  // Get module with quiz
  getModuleWithQuiz: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const module = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.id, input.moduleId))
        .limit(1);

      if (!module[0]) {
        throw new Error("Module not found");
      }

      const quiz = await (db as any)
        .select()
        .from(quizzes)
        .where(eq(quizzes.moduleId, input.moduleId))
        .limit(1);

      let quizWithQuestions = null;
      if (quiz[0]) {
        const questions = await (db as any)
          .select()
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, quiz[0].id))
          .orderBy(quizQuestions.order);

        quizWithQuestions = {
          ...quiz[0],
          questions: questions.map((q: any) => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : [],
            correctAnswer: q.correctAnswer ? JSON.parse(q.correctAnswer) : null,
          })),
        };
      }

      return {
        ...module[0],
        quiz: quizWithQuestions,
      };
    }),

  // Submit quiz answers
  submitQuiz: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        moduleId: z.number(),
        enrollmentId: z.number(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            answer: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get quiz questions
      const questions = await (db as any)
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, input.quizId));

      // Calculate score
      let correctCount = 0;
      questions.forEach((question: any) => {
        const userAnswer = input.answers.find(
          (a) => a.questionId === question.id
        );
        if (
          userAnswer &&
          userAnswer.answer === JSON.parse(question.correctAnswer)
        ) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);

      // Get quiz to check passing score
      const quiz = await (db as any)
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, input.quizId))
        .limit(1);

      const passed = score >= (quiz[0]?.passingScore || 70);

      // Update user progress
      const existingProgress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.moduleId, input.moduleId),
            eq(userProgress.quizId, input.quizId)
          )
        )
        .limit(1);

      if (existingProgress[0]) {
        await (db as any)
          .update(userProgress)
          .set({
            score,
            attempts: existingProgress[0].attempts + 1,
            status: passed ? "completed" : "in_progress",
            completedAt: passed ? new Date() : null,
          })
          .where(eq(userProgress.id, existingProgress[0].id));
      } else {
        await (db as any)
          .insert(userProgress)
          .values({
            userId: ctx.user.id,
            enrollmentId: input.enrollmentId,
            moduleId: input.moduleId,
            quizId: input.quizId,
            score,
            attempts: 1,
            status: passed ? "completed" : "in_progress",
            completedAt: passed ? new Date() : null,
          });
      }

      return {
        score,
        passed,
        passingScore: quiz[0]?.passingScore || 70,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
      };
    }),

  // Get user progress
  getUserProgress: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId)
          )
        )
        .orderBy(desc(userProgress.completedAt));

      const completedModules = progress.filter(
        (p: any) => p.status === "completed"
      ).length;
      const inProgressModules = progress.filter(
        (p: any) => p.status === "in_progress"
      ).length;
      const averageScore =
        progress.length > 0
          ? Math.round(
              progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) /
                progress.length
            )
          : 0;

      return {
        completedModules,
        inProgressModules,
        averageScore,
        totalAttempts: progress.reduce((sum: number, p: any) => sum + p.attempts, 0),
        progress,
      };
    }),

  // Generate AI course content
  generateCourseContent: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        level: z.enum(["beginner", "intermediate", "advanced"]),
        duration: z.number(), // in minutes
        ageGroup: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `Generate a comprehensive micro-learning module for ${input.level} level healthcare providers on the topic: "${input.topic}". 
      
      Duration: ${input.duration} minutes
      Age group focus: ${input.ageGroup || "general pediatric"}
      
      Provide the response in JSON format with:
      {
        "title": "Module title",
        "description": "Brief description",
        "content": "HTML formatted content with key learning points",
        "keyPoints": ["point1", "point2", "point3"],
        "caseStudies": [{"scenario": "...", "solution": "..."}],
        "quizQuestions": [
          {
            "question": "...",
            "options": ["a", "b", "c", "d"],
            "correctAnswer": "a",
            "explanation": "..."
          }
        ]
      }`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert medical educator creating high-quality micro-learning content for pediatric resuscitation training. Generate engaging, practical content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const messageContent = response.choices[0].message.content;
      const content =
        typeof messageContent === "string"
          ? JSON.parse(messageContent)
          : messageContent;
      return content;
    }),

  // Get recommended courses based on performance
  getRecommendedCourses: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get user's weak areas from quiz performance
      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId)
          )
        );

      const lowScoreModules = progress
        .filter((p: any) => p.score && p.score < 80)
        .sort((a: any, b: any) => a.score - b.score)
        .slice(0, input.limit);

      // Get related courses
      const recommendedCourses = await Promise.all(
        lowScoreModules.map(async (p: any) => {
          const module = await (db as any)
            .select()
            .from(modules)
            .where(eq(modules.id, p.moduleId))
            .limit(1);

          const course = await (db as any)
            .select()
            .from(courses)
            .where(eq(courses.id, module[0]?.courseId))
            .limit(1);

          return {
            ...course[0],
            reason: `Your score on related module was ${p.score}%`,
            priority: 100 - p.score,
          };
        })
      );

      return recommendedCourses.sort((a, b) => b.priority - a.priority);
    }),

  // Get learning statistics
  getLearningStats: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const progress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId)
          )
        );

      const completedModules = progress.filter(
        (p: any) => p.status === "completed"
      ).length;
      const totalAttempts = progress.reduce((sum: number, p: any) => sum + p.attempts, 0);
      const averageScore =
        progress.length > 0
          ? Math.round(
              progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) /
                progress.length
            )
          : 0;

      // Calculate learning velocity (modules completed per day)
      const firstProgressDate =
        progress.length > 0 ? progress[0].createdAt : new Date();
      const daysSinceStart = Math.max(
        1,
        Math.floor(
          (new Date().getTime() - new Date(firstProgressDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const learningVelocity = (completedModules / daysSinceStart).toFixed(2);

      return {
        completedModules,
        totalAttempts,
        averageScore,
        learningVelocity: parseFloat(learningVelocity),
        daysSinceStart,
        estimatedCompletionDays: Math.ceil(
          (100 - completedModules) / parseFloat(learningVelocity)
        ),
      };
    }),

  // Mark module as completed
  markModuleComplete: protectedProcedure
    .input(
      z.object({
        moduleId: z.number(),
        enrollmentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const existingProgress = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.moduleId, input.moduleId),
            eq(userProgress.enrollmentId, input.enrollmentId)
          )
        )
        .limit(1);

      if (existingProgress[0]) {
        await (db as any)
          .update(userProgress)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(userProgress.id, existingProgress[0].id));
      } else {
        await (db as any)
          .insert(userProgress)
          .values({
            userId: ctx.user.id,
            enrollmentId: input.enrollmentId,
            moduleId: input.moduleId,
            status: "completed",
            completedAt: new Date(),
          });
      }

      return { success: true };
    }),
});
