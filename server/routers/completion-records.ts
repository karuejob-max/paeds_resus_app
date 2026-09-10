import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAuditLog, getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  canRecordExternalCompletion,
  EXTERNAL_COMPLETION_PROGRAMS,
  getExternalCompletionStatusForUser,
  listExternalCompletionCandidates,
  recordExternalTrainingCompletion,
  revokeExternalTrainingCompletion,
} from "../lib/external-training-completion";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const programTypes = [...EXTERNAL_COMPLETION_PROGRAMS] as [typeof EXTERNAL_COMPLETION_PROGRAMS[number], ...typeof EXTERNAL_COMPLETION_PROGRAMS[number][]];

async function requireRecorder(ctx: { user: { id: number } }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [user] = await db
    .select({ role: users.role, instructorApprovedAt: users.instructorApprovedAt, name: users.name })
    .from(users)
    .where(eq(users.id, ctx.user.id))
    .limit(1);
  if (!user || !canRecordExternalCompletion(user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform administrator or approved lead instructor can record completion." });
  }
  return { db, user };
}

export const completionRecordsRouter = router({
  getMyStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return getExternalCompletionStatusForUser(db, ctx.user.id);
  }),

  listCandidates: protectedProcedure
    .input(z.object({ search: z.string().trim().max(120).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db } = await requireRecorder(ctx);
      return listExternalCompletionCandidates(db, input?.search);
    }),

  record: protectedProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      enrollmentId: z.number().int().positive().optional(),
      pathway: z.enum(["ierp", "nerp", "open_enrolment", "ilsp"]),
      courseProgramType: z.enum(programTypes),
      phase2Completed: z.boolean(),
      phase2CompletedAt: z.coerce.date().optional(),
      phase3Completed: z.boolean(),
      phase3CompletedAt: z.coerce.date().optional(),
      evidenceReference: z.string().trim().max(2000).optional(),
      notes: z.string().trim().max(4000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = await requireRecorder(ctx);
      const result = await recordExternalTrainingCompletion(db, {
        ...input,
        recordedByUserId: ctx.user.id,
        recordedByName: user.name,
      });
      if (!result.success) throw new TRPCError({ code: "PRECONDITION_FAILED", message: result.error });
      await createAuditLog({
        userId: ctx.user.id,
        action: "completionRecords.record",
        details: {
          learnerUserId: input.userId,
          enrollmentId: result.enrollmentId,
          pathway: input.pathway,
          courseProgramType: input.courseProgramType,
          phase2Completed: input.phase2Completed,
          phase3Completed: input.phase3Completed,
          evidenceReference: input.evidenceReference ?? null,
        },
      });
      return result;
    }),

  revoke: protectedProcedure
    .input(z.object({ recordId: z.number().int().positive(), reason: z.string().trim().min(5).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = await requireRecorder(ctx);
      if (user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a platform administrator can revoke a final completion record." });
      }
      const result = await revokeExternalTrainingCompletion(db, {
        recordId: input.recordId,
        revokedByUserId: ctx.user.id,
        reason: input.reason,
      });
      if (!result.success) throw new TRPCError({ code: "NOT_FOUND", message: result.error });
      await createAuditLog({ userId: ctx.user.id, action: "completionRecords.revoke", details: input });
      return result;
    }),
});
