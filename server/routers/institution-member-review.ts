import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  assignLegacyMemberDepartment,
  confirmLegacyMember,
  flagNotInMyDepartment,
  listAssignableDepartments,
  listLegacyMembers,
  removeLegacyMember,
  resolveReviewScope,
} from "../lib/legacy-member-review";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

const base = z.object({ institutionId: z.number().int().positive(), membershipId: z.number().int().positive() });

async function requireScope(db: Awaited<ReturnType<typeof requireDb>>, user: { id: number; email?: string | null; role?: string | null }, institutionId: number) {
  const scope = await resolveReviewScope(db, user, institutionId);
  if (!scope) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have a member-review responsibility for this institution." });
  return scope;
}

export const institutionMemberReviewRouter = router({
  /** Null when the caller reviews nothing here, so the UI can hide itself. */
  myScope: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await resolveReviewScope(db, ctx.user, input.institutionId);
      return scope ? { tier: scope.tier, role: scope.role, departmentIds: scope.departmentIds } : null;
    }),

  list: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await requireScope(db, ctx.user, input.institutionId);
      const members = await listLegacyMembers(db, scope, input.institutionId);
      const departments = scope.tier === "institution" ? await listAssignableDepartments(db, input.institutionId) : [];
      return { tier: scope.tier, members, departments };
    }),

  confirm: protectedProcedure
    .input(base.extend({ note: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await requireScope(db, ctx.user, input.institutionId);
      await confirmLegacyMember(db, scope, ctx.user, input);
      return { success: true as const };
    }),

  notInMyDepartment: protectedProcedure
    .input(base.extend({ note: z.string().trim().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await requireScope(db, ctx.user, input.institutionId);
      await flagNotInMyDepartment(db, scope, ctx.user, input);
      return { success: true as const };
    }),

  remove: protectedProcedure
    .input(base.extend({ reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await requireScope(db, ctx.user, input.institutionId);
      await removeLegacyMember(db, scope, ctx.user, input);
      return { success: true as const };
    }),

  assignDepartment: protectedProcedure
    .input(base.extend({ departmentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const scope = await requireScope(db, ctx.user, input.institutionId);
      await assignLegacyMemberDepartment(db, scope, ctx.user, input);
      return { success: true as const };
    }),
});
