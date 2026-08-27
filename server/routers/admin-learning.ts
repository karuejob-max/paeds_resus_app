import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { resetSummativeAttemptsForEnrollment } from "../lib/reset-summative-attempts";
import { resetDiagnosticAttemptsForEnrollment } from "../lib/reset-diagnostic-attempts";
import { ahaAccessGrants, users } from "../../drizzle/schema";
import { AHA_PROGRAM_TYPES, AHA_PROGRAM_LABELS, type AhaProgramType } from "../../shared/aha-pathways";

const GRANT_PROGRAM_TYPES = [...AHA_PROGRAM_TYPES] as [AhaProgramType, ...AhaProgramType[]];

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

  resetDiagnosticAttempts: adminProcedure
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

      const result = await resetDiagnosticAttemptsForEnrollment(db as any, {
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
        previousScore: result.previousScore,
        reason: input.reason ?? null,
        resetByAdminId: ctx.user.id,
      };
    }),

  /** Program types that support summative reset via training enrollments ledger. */
  listAhaProgramTypes: adminProcedure.query(() => [...AHA_PROGRAM_TYPES]),

  /** Search named provider accounts before granting access; no shareable token is created. */
  searchAhaGrantUsers: adminProcedure
    .input(z.object({ query: z.string().trim().min(2).max(255) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const term = `%${input.query.trim()}%`;
      return db
        .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, providerType: users.providerType })
        .from(users)
        .where(and(eq(users.userType, "provider"), or(like(users.name, term), like(users.email, term))))
        .orderBy(users.name)
        .limit(20);
    }),

  listAhaAccessGrants: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select({
        id: ahaAccessGrants.id,
        userId: ahaAccessGrants.userId,
        userName: users.name,
        userEmail: users.email,
        programType: ahaAccessGrants.programType,
        reason: ahaAccessGrants.reason,
        grantedByUserId: ahaAccessGrants.grantedByUserId,
        expiresAt: ahaAccessGrants.expiresAt,
        revokedAt: ahaAccessGrants.revokedAt,
        revokeReason: ahaAccessGrants.revokeReason,
        createdAt: ahaAccessGrants.createdAt,
      })
      .from(ahaAccessGrants)
      .leftJoin(users, eq(users.id, ahaAccessGrants.userId))
      .orderBy(desc(ahaAccessGrants.createdAt))
      .limit(100);
  }),

  grantAhaAccess: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        programType: z.enum(GRANT_PROGRAM_TYPES).nullable().default(null),
        reason: z.string().trim().min(10).max(500),
        expiresAt: z.string().date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Provider account not found." });
      const expiresAt = input.expiresAt ? new Date(`${input.expiresAt}T23:59:59.999Z`) : null;
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Grant expiry must be in the future." });
      }
      await db.insert(ahaAccessGrants).values({
        userId: input.userId,
        programType: input.programType,
        reason: input.reason,
        grantedByUserId: ctx.user.id,
        expiresAt,
      });
      return { success: true, userId: input.userId, programType: input.programType, label: input.programType ? AHA_PROGRAM_LABELS[input.programType] : "All AHA courses" };
    }),

  revokeAhaAccess: adminProcedure
    .input(z.object({ grantId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const result = await db
        .update(ahaAccessGrants)
        .set({ revokedAt: new Date(), revokedByUserId: ctx.user.id, revokeReason: input.reason, updatedAt: new Date() })
        .where(and(eq(ahaAccessGrants.id, input.grantId), isNull(ahaAccessGrants.revokedAt)));
      if ((result as unknown as { affectedRows?: number }).affectedRows === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Active AHA grant not found." });
      }
      return { success: true, grantId: input.grantId };
    }),
});
