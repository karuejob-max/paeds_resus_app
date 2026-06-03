import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { resetSummativeAttemptsForEnrollment } from "../lib/reset-summative-attempts";

const AHA_PROGRAM_TYPES = ["bls", "acls", "pals", "heartsaver", "nrp"] as const;

export const adminLearningRouter = router({
  /**
   * Clears summative attempt count/score so the learner can retry (admin only).
   * Logged via adminProcedure → adminAuditLog.
   */
  resetSummativeAttempts: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        enrollmentId: z.number().int().positive(),
        quizId: z.number().int().positive().optional(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const result = await resetSummativeAttemptsForEnrollment(db as any, {
        userId: input.userId,
        enrollmentId: input.enrollmentId,
        quizId: input.quizId,
        adminUserId: ctx.user.id,
      });

      if (!result.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
      }

      return {
        success: true,
        progressId: result.progressId,
        quizId: result.quizId,
        previousAttempts: result.previousAttempts,
        previousScore: result.previousScore,
        reason: input.reason ?? null,
        resetByAdminId: ctx.user.id,
      };
    }),

  /** Program types that support summative reset via training enrollments ledger. */
  listAhaProgramTypes: adminProcedure.query(() => [...AHA_PROGRAM_TYPES]),
});
