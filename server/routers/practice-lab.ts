import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { assertTrainingWorkspaceOrAdmin } from "../lib/training-workspace-guard";
import {
  ahaPracticeLabAttempts,
  enrollments,
  userProgress,
  quizQuestions,
} from "../../drizzle/schema";
import {
  PRACTICE_LAB_TRACKS,
  WEAK_DOMAIN_TO_TRACK,
  type PracticeLabTrackId,
} from "../../shared/practice-lab-types";

const AHA_PROGRAM_TYPES = ["bls", "acls", "pals", "heartsaver", "nrp"] as const;

const BOOSTER_INTERVALS_DAYS = [1, 3, 7, 14, 30];

async function fetchEligibleEnrollments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: enrollments.id,
      programType: enrollments.programType,
      cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
      paymentStatus: enrollments.paymentStatus,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        sql`${enrollments.programType} IN ('bls', 'acls', 'pals', 'heartsaver', 'nrp')`
      )
    );
  return rows.filter(
    (r) =>
      r.paymentStatus === "completed" ||
      r.paymentStatus === "partial" ||
      r.cognitiveModulesComplete
  );
}

export const practiceLabRouter = router({
  getAccess: protectedProcedure.query(async ({ ctx }) => {
    assertTrainingWorkspaceOrAdmin(ctx.user);
    const eligible = await fetchEligibleEnrollments(ctx.user.id);
    return {
      hasAccess: eligible.length > 0,
      enrollments: eligible.map((e) => ({
        id: e.id,
        programType: e.programType,
        cognitiveModulesComplete: e.cognitiveModulesComplete,
      })),
    };
  }),

  recordAttempt: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        programType: z.enum(AHA_PROGRAM_TYPES),
        trackId: z.enum(PRACTICE_LAB_TRACKS),
        scenarioId: z.string().min(1).max(64),
        score: z.number().min(0).max(100),
        passed: z.boolean(),
        eventLog: z.array(
          z.object({
            timestamp: z.number(),
            type: z.string(),
            description: z.string(),
            correct: z.boolean().optional(),
          })
        ),
        isBooster: z.boolean().optional(),
        durationSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [enrollment] = await db
        .select({ id: enrollments.id, userId: enrollments.userId })
        .from(enrollments)
        .where(
          and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id))
        )
        .limit(1);

      if (!enrollment) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Enrollment not found" });
      }

      await db.insert(ahaPracticeLabAttempts).values({
        userId: ctx.user.id,
        enrollmentId: input.enrollmentId,
        programType: input.programType,
        trackId: input.trackId,
        scenarioId: input.scenarioId,
        score: input.score,
        passed: input.passed,
        eventLog: input.eventLog,
        isBooster: input.isBooster ?? false,
        durationSeconds: input.durationSeconds ?? null,
      });

      return { success: true };
    }),

  getMyAttempts: protectedProcedure
    .input(z.object({ enrollmentId: z.number().optional(), limit: z.number().max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(ahaPracticeLabAttempts.userId, ctx.user.id)];
      if (input.enrollmentId) {
        conditions.push(eq(ahaPracticeLabAttempts.enrollmentId, input.enrollmentId));
      }

      return db
        .select()
        .from(ahaPracticeLabAttempts)
        .where(and(...conditions))
        .orderBy(desc(ahaPracticeLabAttempts.createdAt))
        .limit(input.limit);
    }),

  getDueBoosters: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) return { due: [] as { trackId: string; scenarioId: string; dueAt: string }[] };

      const attempts = await db
        .select()
        .from(ahaPracticeLabAttempts)
        .where(
          and(
            eq(ahaPracticeLabAttempts.userId, ctx.user.id),
            eq(ahaPracticeLabAttempts.enrollmentId, input.enrollmentId),
            eq(ahaPracticeLabAttempts.passed, true)
          )
        )
        .orderBy(desc(ahaPracticeLabAttempts.createdAt));

      const seen = new Map<string, (typeof attempts)[0]>();
      for (const a of attempts) {
        const key = `${a.trackId}:${a.scenarioId}`;
        if (!seen.has(key)) seen.set(key, a);
      }

      const now = Date.now();
      const due: { trackId: string; scenarioId: string; dueAt: string; reason: string }[] = [];

      for (const [, attempt] of seen) {
        const passCount = attempts.filter(
          (a) => a.trackId === attempt.trackId && a.scenarioId === attempt.scenarioId && a.passed
        ).length;
        const intervalIdx = Math.min(passCount - 1, BOOSTER_INTERVALS_DAYS.length - 1);
        const intervalDays = BOOSTER_INTERVALS_DAYS[Math.max(0, intervalIdx)];
        const lastAt = attempt.createdAt?.getTime() ?? now;
        const dueAt = lastAt + intervalDays * 24 * 60 * 60 * 1000;
        if (dueAt <= now) {
          due.push({
            trackId: attempt.trackId,
            scenarioId: attempt.scenarioId,
            dueAt: new Date(dueAt).toISOString(),
            reason: `Spaced repetition booster (${intervalDays}d interval)`,
          });
        }
      }

      return { due };
    }),

  getWeakDomainSuggestions: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      assertTrainingWorkspaceOrAdmin(ctx.user);
      const db = await getDb();
      if (!db) return { suggestedTracks: [] as PracticeLabTrackId[] };

      const failedProgress = await db
        .select({ quizId: userProgress.quizId, score: userProgress.score })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.enrollmentId, input.enrollmentId),
            sql`${userProgress.score} < 70`
          )
        )
        .limit(10);

      const suggested = new Set<PracticeLabTrackId>();
      for (const row of failedProgress) {
        if (!row.quizId) continue;
        const questions = await db
          .select({ questionText: quizQuestions.question })
          .from(quizQuestions)
          .where(eq(quizQuestions.quizId, row.quizId))
          .limit(20);
        for (const q of questions) {
          const text = (q.questionText ?? "").toLowerCase();
          for (const [keyword, track] of Object.entries(WEAK_DOMAIN_TO_TRACK)) {
            if (text.includes(keyword)) suggested.add(track);
          }
        }
      }

      return { suggestedTracks: [...suggested] };
    }),

  getAdminSimAttemptsByProgram: adminProcedure
    .input(
      z.object({
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { byProgram: [], byTrack: [], total: 0 };

      const conditions = [];
      if (input.year && input.month) {
        const start = new Date(Date.UTC(input.year, input.month - 1, 1, -3, 0, 0, 0));
        const end = new Date(Date.UTC(input.year, input.month, 0, 20, 59, 59, 999));
        conditions.push(gte(ahaPracticeLabAttempts.createdAt, start));
        conditions.push(lte(ahaPracticeLabAttempts.createdAt, end));
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [byProgram, byTrack, totalRow] = await Promise.all([
        db
          .select({
            programType: ahaPracticeLabAttempts.programType,
            count: sql<number>`count(*)`.mapWith(Number),
            avgScore: sql<number>`avg(${ahaPracticeLabAttempts.score})`.mapWith(Number),
          })
          .from(ahaPracticeLabAttempts)
          .where(whereClause)
          .groupBy(ahaPracticeLabAttempts.programType),
        db
          .select({
            trackId: ahaPracticeLabAttempts.trackId,
            count: sql<number>`count(*)`.mapWith(Number),
          })
          .from(ahaPracticeLabAttempts)
          .where(whereClause)
          .groupBy(ahaPracticeLabAttempts.trackId),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(ahaPracticeLabAttempts)
          .where(whereClause),
      ]);

      return {
        byProgram,
        byTrack,
        total: totalRow[0]?.count ?? 0,
      };
    }),
});
