import { z } from "zod";
import {
  splitModuleHtmlIntoSections,
  moduleSectionsStale,
} from "../../shared/split-module-html-sections";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import {
  courses,
  modules,
  moduleSections,
  quizzes,
  quizQuestions,
  userProgress,
  enrollments,
} from "../../drizzle/schema";
import { ensurePalsAhaCatalog } from "../lib/ensure-pals-aha-catalog";
import { ensurePals2025Content } from "../lib/ensure-pals-2025-content";
import {
  ensureSeriouslyIllChildFellowshipCatalog,
} from "../lib/ensure-seriously-ill-child-fellowship-catalog";
import {
  ensurePaediatricSepticShockCatalog,
  getPaediatricSepticShockCourseId,
} from "../lib/ensure-paediatric-septic-shock-catalog";
import { ensureInstructorCourseCatalog } from "../lib/ensure-instructor-course-catalog";
import {
  ensureIntubationSampleCourseCatalog,
  getIntubationSampleCourseId,
} from "../lib/ensure-intubation-sample-course-catalog";
import { issueCertificateForEnrollmentIfEligible, markAhaCognitiveComplete } from "../certificates";
import { ensureBlsCatalog, ensureAclsCatalog } from "../lib/ensure-bls-acls-catalog";
import { fellowshipSimulations } from "../../drizzle/schema";
import { ensureHeartsaverCatalog } from "../lib/ensure-heartsaver-catalog";
import { resolveAhaCourseAnchor, type AhaAnchorProgramType } from "../lib/resolve-aha-course-anchor";
import {
  isMicroCourseEnrollmentId,
  syncMicroCourseEnrollmentProgress,
} from "../lib/sync-micro-course-enrollment-progress";
import {
  assertMicrocourseCompletionAllowed,
  computeQuizScoreFromDb,
  getAhaCourseExamState,
  getMicrocourseExamState,
  loadSummativeQuestionBank,
} from "../lib/microcourse-exam-gate";
import {
  MICROCOURSE_SUMMATIVE_PASS_PERCENT,
  canAttemptSummative,
  dedupeQuizRowsByStem,
  examKindFromQuizTitle,
  shuffleQuestionIndices,
  shuffleQuestionsDisplayOptions,
  summativePassed,
} from "../../shared/microcourse-exam-policy";
import { formatSummativeForbiddenMessage } from "../../shared/summative-retry-display";
import { TRPCError } from "@trpc/server";
import { trackEvent } from "../services/analytics.service";

const SUMMATIVE_IDEMPOTENT_WINDOW_MS = 30_000;

function scheduleMicroEnrollmentProgressSync(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  enrollmentId: number
) {
  void syncMicroCourseEnrollmentProgress(db as any, userId, enrollmentId).catch((err) => {
    console.error("[learning.recordQuizAttempt] syncMicroCourseEnrollmentProgress", err);
  });
}

export const learningRouter = router({
  // Get all courses
  getSepticShockCourseMeta: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { courseId: null as number | null };
    try {
      await ensurePaediatricSepticShockCatalog(db);
      const id = await getPaediatricSepticShockCourseId(db);
      return { courseId: id };
    } catch (e) {
      console.error("[learning.getSepticShockCourseMeta]", e);
      return { courseId: null };
    }
  }),

  getIntubationSampleCourseMeta: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { courseId: null as number | null };
    try {
      await ensureIntubationSampleCourseCatalog(db);
      const id = await getIntubationSampleCourseId(db);
      return { courseId: id };
    } catch (e) {
      console.error("[learning.getIntubationSampleCourseMeta]", e);
      return { courseId: null };
    }
  }),

  getCourses: publicProcedure
    .input(
      z.object({
        programType: z.string().optional(),
        level: z.string().optional(),
        /** When set (e.g. PALS micro-course), only this catalog row is returned. */
        courseId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.programType) {
        const pt = input.programType as "bls" | "acls" | "pals" | "fellowship" | "instructor";
        let rows = await (db as any)
          .select()
          .from(courses)
          .where(eq(courses.programType, pt))
          .orderBy(courses.order);
        if (pt === "pals") {
          try {
            await ensurePaediatricSepticShockCatalog(db);
            await ensurePalsAhaCatalog(db);
            rows = await (db as any)
              .select()
              .from(courses)
              .where(eq(courses.programType, pt))
              .orderBy(courses.order);
          } catch (e) {
            console.error("[learning.getCourses] ensure PALS catalog failed:", e);
          }
        }
        if (pt === "fellowship") {
          try {
            await ensureSeriouslyIllChildFellowshipCatalog(db);
            rows = await (db as any)
              .select()
              .from(courses)
              .where(eq(courses.programType, pt))
              .orderBy(courses.order);
          } catch (e) {
            console.error("[learning.getCourses] ensure fellowship catalog failed:", e);
          }
        }
        if (input.courseId != null) {
          rows = rows.filter((r: { id: number }) => r.id === input.courseId);
        }
        if (pt === "instructor" && rows.length === 0) {
          try {
            await ensureInstructorCourseCatalog(db);
            rows = await (db as any)
              .select()
              .from(courses)
              .where(eq(courses.programType, pt))
              .orderBy(courses.order);
          } catch (e) {
            console.error("[learning.getCourses] ensure Instructor catalog failed:", e);
          }
        }
        return rows;
      }
      return (db as any).select().from(courses).orderBy(courses.order);
    }),

  /** Canonical AHA catalog row (most modules) for BLS / ACLS / PALS / Heartsaver. */
  getAhaCourseAnchor: publicProcedure
    .input(z.object({ programType: z.enum(["bls", "acls", "pals", "heartsaver", "nrp"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      return resolveAhaCourseAnchor(db, input.programType as AhaAnchorProgramType);
    }),

  // Get course details with modules
  getCourseDetails: publicProcedure
    .input(
      z.object({
        courseId: z.number(),
        /** When the URL has a stale numeric id (e.g. /micro-course/1), resolve the real row. */
        programType: z.enum(["bls", "acls", "pals", "heartsaver", "nrp"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Course not found");
      }

      let courseRow: (typeof courses.$inferSelect) | null = null;

      if (input.programType && (!input.courseId || input.courseId <= 0)) {
        courseRow = await resolveAhaCourseAnchor(db, input.programType);
      }

      if (!courseRow && input.courseId > 0) {
        const byId = await (db as any)
          .select()
          .from(courses)
          .where(eq(courses.id, input.courseId))
          .limit(1);

        if (byId.length) {
          const row = byId[0];
          const pt = input.programType;
          if (!pt || row.programType === pt) {
            courseRow = row;
          }
        }
      }

      if (!courseRow && input.programType) {
        courseRow = await resolveAhaCourseAnchor(db, input.programType);
      }

      if (!courseRow) {
        throw new Error("Course not found");
      }

      const pt = courseRow.programType as string;
      if (pt === "bls") {
        await ensureBlsCatalog(db);
      } else if (pt === "acls") {
        await ensureAclsCatalog(db);
      } else if (pt === "heartsaver") {
        await ensureHeartsaverCatalog(db);
      } else if (pt === "pals") {
        await ensurePalsAhaCatalog(db);
        try {
          await ensurePals2025Content(db);
        } catch (e) {
          console.error("[learning.getCourseDetails] ensure PALS 2025 content:", e);
        }
      } else if (pt === "nrp") {
        const { ensureNrpCatalog } = await import("../lib/ensure-nrp-catalog");
        await ensureNrpCatalog(db);
      }

      const courseModules = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.courseId, courseRow.id))
        .orderBy(modules.order);

      return {
        ...courseRow,
        modules: courseModules,
      };
    }),

  // Get module content with sections and quizzes
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

      // Fetch sections for this module
      let sections = await (db as any)
        .select()
        .from(moduleSections)
        .where(eq(moduleSections.moduleId, input.moduleId))
        .orderBy(moduleSections.order);

      const moduleHtml = String(module[0].content ?? "");
      if (moduleSectionsStale(moduleHtml, sections)) {
        sections = splitModuleHtmlIntoSections(moduleHtml).map((section, index) => ({
          id: index + 1,
          moduleId: input.moduleId,
          title: section.title,
          content: section.content,
          order: section.order,
        }));
      }

      const moduleQuizzes = await (db as any)
        .select()
        .from(quizzes)
        .where(eq(quizzes.moduleId, input.moduleId))
        .orderBy(quizzes.order);

      const mapQuizQuestions = async (quiz: { id: number; title?: string }) => {
        const raw = await (db as any)
          .select()
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, quiz.id))
          .orderBy(quizQuestions.order);
        const questions = dedupeQuizRowsByStem(
          raw.map((q: Record<string, unknown>) => {
            let options: string[] = [];
            if (q.options) {
              try {
                const parsed = JSON.parse(q.options as string);
                options = Array.isArray(parsed) ? parsed : [];
              } catch {
                options = [];
              }
            }
            const kind = examKindFromQuizTitle(quiz.title as string);
            const base = { ...q, question: String(q.question ?? ""), options };
            if (kind === "summative") {
              const { correctAnswer: _omit, ...withoutAnswer } = base as Record<string, unknown>;
              return withoutAnswer;
            }
            return base;
          }) as { id?: number; question: string }[]
        );
        return { ...quiz, questions };
      };

      const quizzesWithQuestions = await Promise.all(moduleQuizzes.map(mapQuizQuestions));

      return {
        ...module[0],
        sections,
        quizzes: quizzesWithQuestions,
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

  getMicroCourseExamState: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      if (await isMicroCourseEnrollmentId(db as any, input.enrollmentId)) {
        return getMicrocourseExamState(db as any, ctx.user.id, input.enrollmentId);
      }
      return getAhaCourseExamState(db as any, ctx.user.id, input.enrollmentId);
    }),

  getFellowshipSimulation: protectedProcedure
    .input(z.object({ courseId: z.string(), level: z.enum(["foundational", "advanced"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [simulation] = await db
        .select()
        .from(fellowshipSimulations)
        .where(and(eq(fellowshipSimulations.courseId, input.courseId), eq(fellowshipSimulations.level, input.level)))
        .limit(1);

      if (!simulation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fellowship simulation not found" });
      }

      return {
        ...simulation,
        scenarioData: JSON.parse(simulation.scenarioData as string),
      };
    }),

  getSummativeExamQuestions: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        summativeQuizId: z.number(),
        shuffleSeed: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const isMicro = await isMicroCourseEnrollmentId(db as any, input.enrollmentId);
      const state = isMicro
        ? await getMicrocourseExamState(db as any, ctx.user.id, input.enrollmentId)
        : await getAhaCourseExamState(db as any, ctx.user.id, input.enrollmentId);

      if (!state) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Enrollment not found for summative exam" });
      }
      if (state.summativeQuizId && state.summativeQuizId !== input.summativeQuizId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid summative quiz for this course" });
      }
      const bank = dedupeQuizRowsByStem(await loadSummativeQuestionBank(db as any, input.summativeQuizId));
      const sessionSeed = input.shuffleSeed ?? Date.now();
      const order = shuffleQuestionIndices(bank.length, sessionSeed);
      const ordered = order.map((i) => bank[i]!);
      const withShuffledOptions = shuffleQuestionsDisplayOptions(ordered, sessionSeed);
      return {
        questions: withShuffledOptions,
        passPercent: MICROCOURSE_SUMMATIVE_PASS_PERCENT,
      };
    }),

  recordQuizAttempt: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        quizId: z.number(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            answer: z.string(),
          })
        ),
        shuffleSeed: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const isMicro = await isMicroCourseEnrollmentId(db as any, input.enrollmentId);
      const state = isMicro
        ? await getMicrocourseExamState(db as any, ctx.user.id, input.enrollmentId)
        : await getAhaCourseExamState(db as any, ctx.user.id, input.enrollmentId);

      if (!state) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Enrollment not found for quiz attempt" });
      }
      if (state.summativeQuizId && state.summativeQuizId !== input.quizId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid quiz for this course" });
      }

      const lastAttempt = (state as any).lastSummativeAttempt;
      if (lastAttempt && Date.now() - lastAttempt.getTime() < SUMMATIVE_IDEMPOTENT_WINDOW_MS) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: formatSummativeForbiddenMessage(lastAttempt),
        });
      }

      const bank = dedupeQuizRowsByStem(await loadSummativeQuestionBank(db as any, input.quizId));
      const order = shuffleQuestionIndices(bank.length, input.shuffleSeed);
      const questions = order.map((i) => bank[i]);

      const { score, correctCount } = computeQuizScoreFromDb(questions as any, input.answers as any);
      const passed = summativePassed(score, MICROCOURSE_SUMMATIVE_PASS_PERCENT);

      await (db as any).insert(userProgress).values({
        userId: ctx.user.id,
        enrollmentId: input.enrollmentId,
        quizId: input.quizId,
        score,
        attempts: (state.summativeAttempts || 0) + 1,
        status: passed ? "completed" : "failed",
        completedAt: passed ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        moduleId: 0, // Micro-course summative is usually course-level, using 0 as placeholder if moduleId is not explicitly known
      });

      if (passed) {
        await issueCertificateForEnrollmentIfEligible(input.enrollmentId);
      }

      scheduleMicroEnrollmentProgressSync(db as any, ctx.user.id, input.enrollmentId);

      return {
        score,
        passed,
        passingScore: MICROCOURSE_SUMMATIVE_PASS_PERCENT,
        correctAnswers: correctCount,
                totalQuestions: questions.length,
      };
    }),

  completeFellowshipSimulation: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        courseId: z.string(),
        level: z.enum(["foundational", "advanced"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if the simulation exists and is associated with the course/level
      const [simulation] = await db
        .select()
        .from(fellowshipSimulations)
        .where(and(eq(fellowshipSimulations.courseId, input.courseId), eq(fellowshipSimulations.level, input.level)))
        .limit(1);

      if (!simulation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fellowship simulation not found" });
      }

      // Record completion in userProgress
      await (db as any).insert(userProgress).values({
        userId: ctx.user.id,
        enrollmentId: input.enrollmentId,
        fellowshipSimulationId: simulation.id,
        status: "completed",
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        moduleId: 0, // Placeholder
      });

      scheduleMicroEnrollmentProgressSync(db as any, ctx.user.id, input.enrollmentId);

      return { success: true };
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

      // Check if any progress row exists for this module + enrollment
      const existing = await (db as any)
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId),
            eq(userProgress.moduleId, input.moduleId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing row(s) to completed
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
              eq(userProgress.enrollmentId, input.enrollmentId),
              eq(userProgress.moduleId, input.moduleId)
            )
          );
      } else {
        // Insert a new progress row to mark the module as completed
        await (db as any).insert(userProgress).values({
          userId: ctx.user.id,
          enrollmentId: input.enrollmentId,
          moduleId: input.moduleId,
          status: "completed",
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // After marking a module complete, check if ALL modules for this enrollment are now done.
      // If so, set the cognitiveModulesComplete gate and attempt certificate issuance.
      // markAhaCognitiveComplete internally checks all modules before setting the flag.
      await markAhaCognitiveComplete(input.enrollmentId);

      if (await isMicroCourseEnrollmentId(db as any, input.enrollmentId)) {
        await syncMicroCourseEnrollmentProgress(db as any, ctx.user.id, input.enrollmentId);
      }

      return { success: true };
    }),

  // Get course completion stats
  getCourseStats: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        /** When set, stats only count progress rows for this enrollment (recommended). */
        enrollmentId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Get course modules
      const courseModules = await (db as any)
        .select()
        .from(modules)
        .where(eq(modules.courseId, input.courseId));

      const moduleIds = new Set(courseModules.map((m: { id: number }) => m.id));

      // Get user progress for each module
      const progressRows = await (db as any)
        .select()
        .from(userProgress)
        .where(
          input.enrollmentId !== undefined
            ? and(eq(userProgress.userId, ctx.user.id), eq(userProgress.enrollmentId, input.enrollmentId))
            : eq(userProgress.userId, ctx.user.id)
        );

      const progress = progressRows.filter((p: { moduleId: number }) => moduleIds.has(p.moduleId));

      const completedModules = progress.filter(
        (p: any) => p.status === "completed"
      ).length;
      const averageScore =
        progress.length > 0
          ? progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) /
            progress.length
          : 0;

      const totalModules = courseModules.length;
      return {
        totalModules,
        completedModules,
        averageScore: Math.round(averageScore),
        percentComplete:
          totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100),
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

  // Get personalized learning path
  getPersonalizedPath: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        programType: z.enum(["bls", "acls", "pals", "fellowship", "instructor"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
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
      if (!enrollment[0]) throw new Error("Enrollment not found");
      let programCourses = await (db as any)
        .select()
        .from(courses)
        .where(eq(courses.programType, input.programType as any))
        .orderBy(courses.order);
      if (input.programType === "pals") {
        try {
          await ensurePaediatricSepticShockCatalog(db);
          await ensurePalsAhaCatalog(db);
        } catch (e) {
          console.error("[learning.getPersonalizedPath] ensure PALS catalog:", e);
        }
        const ec = (enrollment[0] as { courseId?: number | null }).courseId;
        if (ec != null) {
          programCourses = programCourses.filter((c: { id: number }) => c.id === ec);
        } else {
          const anchor = await resolveAhaCourseAnchor(db, "pals");
          if (anchor) {
            programCourses = programCourses.filter((c: { id: number }) => c.id === anchor.id);
          }
        }
      }
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
          const totalModules = await (db as any)
            .select()
            .from(modules)
            .where(eq(modules.courseId, course.id));
          const moduleIds = new Set(totalModules.map((m: { id: number }) => m.id));
          const completedModules = progress.filter(
            (p: any) => p.status === "completed" && moduleIds.has(p.moduleId)
          ).length;
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
      return { enrollment: enrollment[0], courses: courseProgress };
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

  // Submit quiz
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
      const questions = await (db as any)
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, input.quizId));
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
      const quiz = await (db as any)
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, input.quizId))
        .limit(1);
      const passed = score >= (quiz[0]?.passingScore || 70);
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

  // Mark module as complete
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

  /**
   * getResumeModule — returns the 0-based index of the first module the user
   * has NOT yet completed for a given enrollment.  Returns 0 if no progress
   * exists (fresh start).
   *
   * When all modules are complete (allCompleted=true), returns resumeIndex=0
   * so that review mode always starts from the first module rather than
   * dropping the user onto the final exam.
   */
  getResumeModule: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),       // DB course id (modules.courseId)
        enrollmentId: z.number(),   // enrollment id scoping the progress rows
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Fetch ordered module list for this course
      const courseModules = await (db as any)
        .select({ id: modules.id })
        .from(modules)
        .where(eq(modules.courseId, input.courseId))
        .orderBy(modules.order);

      if (!courseModules.length) return { resumeIndex: 0, totalModules: 0 };

      // Fetch all completed progress rows for this user + enrollment
      const completedRows = await (db as any)
        .select({ moduleId: userProgress.moduleId })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId),
            eq(userProgress.status, "completed")
          )
        );

      const completedModuleIds = new Set(
        completedRows.map((r: { moduleId: number }) => r.moduleId)
      );

      // First module whose id is NOT in the completed set
      const resumeIndex = courseModules.findIndex(
        (m: { id: number }) => !completedModuleIds.has(m.id)
      );

      // -1 means every module is completed → review mode: start from module 1
      const allCompleted = resumeIndex === -1;
      return {
        resumeIndex: allCompleted ? 0 : resumeIndex,
        totalModules: courseModules.length,
        allCompleted,
      };
    }),
});
