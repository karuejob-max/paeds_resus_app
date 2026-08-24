import { and, asc, desc, eq, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import {
  facilityDepartments,
  iersReadinessTemplateItems,
  iersReadinessTemplates,
  iersUtlReadinessCheckItems,
  iersUtlReadinessChecks,
  iersShiftRoleAssignments,
  iersShiftTeams,
  inAppNotifications,
  institutionDepartmentResponseCoordinators,
  institutionMemberships,
  shiftUtlRosters,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertInstitutionProductRole } from "../lib/institution-product-roles";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { deriveUtlReadinessStatus, isCriticalReadinessGap } from "../lib/iers-readiness-state";
import { TRPCError } from "@trpc/server";

const ITEM_STATUSES = [
  "present_and_functional",
  "present_not_tested",
  "missing",
  "expired",
  "damaged",
  "insufficient_quantity",
  "inaccessible",
  "not_applicable",
  "not_observed",
] as const;

const itemStatusSchema = z.enum(ITEM_STATUSES);

async function requireActiveMember(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, institutionId: number) {
  const [membership] = await db.select().from(institutionMemberships).where(and(eq(institutionMemberships.institutionalAccountId, institutionId), eq(institutionMemberships.userId, userId), eq(institutionMemberships.membershipStatus, "active"))).limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active provider member of this institution." });
}

async function notifyErco(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, institutionId: number, departmentId: number, title: string, body: string, relatedId: number) {
  const [coordinator] = await db.select({ coordinatorUserId: institutionDepartmentResponseCoordinators.coordinatorUserId }).from(institutionDepartmentResponseCoordinators).where(and(eq(institutionDepartmentResponseCoordinators.institutionId, institutionId), eq(institutionDepartmentResponseCoordinators.departmentId, departmentId), eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"))).orderBy(desc(institutionDepartmentResponseCoordinators.effectiveFrom)).limit(1);
  if (!coordinator?.coordinatorUserId) return;
  await db.insert(inAppNotifications).values({ userId: coordinator.coordinatorUserId, type: "iers_utl_readiness_gap", title, body, relatedId, actionUrl: "/institution?section=iers&iersTab=workforce&workforceTab=roster" });
}

async function resolveAcceptedUtl(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, teamId: number, shiftUtlRosterId?: number) {
  const rows = await db.select({ assignment: iersShiftRoleAssignments, team: iersShiftTeams, roster: shiftUtlRosters }).from(iersShiftRoleAssignments).innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleAssignments.teamId)).leftJoin(shiftUtlRosters, eq(shiftUtlRosters.id, iersShiftRoleAssignments.shiftUtlRosterId)).where(and(eq(iersShiftRoleAssignments.teamId, teamId), eq(iersShiftRoleAssignments.providerUserId, userId), eq(iersShiftRoleAssignments.roleScope, "utl"), eq(iersShiftRoleAssignments.assignmentStatus, "accepted"))).limit(1);
  const row = rows[0];
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "Only the accepted UTL for this dated team can complete the readiness check." });
  if (shiftUtlRosterId && row.assignment.shiftUtlRosterId !== shiftUtlRosterId) throw new TRPCError({ code: "BAD_REQUEST", message: "The UTL roster does not match this published team." });
  const departmentId = row.roster?.departmentId ?? row.assignment.departmentId;
  if (departmentId == null) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The accepted UTL duty has no department scope." });
  return { ...row, departmentId };
}

export const iersReadinessRouter = router({
  getInstitutionTemplates: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await requireActiveMember(db, ctx.user.id, input.institutionId);
      await assertInstitutionProductRole(db, ctx.user as any, input.institutionId, "iers", ["iers_coordinator", "iers_governance"]);
      try {
        const templates = await db.select().from(iersReadinessTemplates).where(eq(iersReadinessTemplates.institutionId, input.institutionId)).orderBy(desc(iersReadinessTemplates.createdAt));
        const result = [];
        for (const template of templates) {
          const items = await db.select().from(iersReadinessTemplateItems).where(and(eq(iersReadinessTemplateItems.templateId, template.id), eq(iersReadinessTemplateItems.isActive, true))).orderBy(asc(iersReadinessTemplateItems.sortOrder));
          result.push({ template, itemCount: items.length, criticalItemCount: items.filter((item) => item.isCritical).length, items });
        }
        return result;
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  approveInstitutionTemplate: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), templateId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await requireActiveMember(db, ctx.user.id, input.institutionId);
      await assertInstitutionProductRole(db, ctx.user as any, input.institutionId, "iers", ["iers_coordinator", "iers_governance"]);
      const [template] = await db.select().from(iersReadinessTemplates).where(and(eq(iersReadinessTemplates.id, input.templateId), eq(iersReadinessTemplates.institutionId, input.institutionId))).limit(1);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Readiness template not found." });
      const [items] = await db.select({ count: sql<number>`count(*)` }).from(iersReadinessTemplateItems).where(and(eq(iersReadinessTemplateItems.templateId, template.id), eq(iersReadinessTemplateItems.isActive, true)));
      if (Number(items?.count ?? 0) === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "A readiness template must contain at least one active item." });
      await db.update(iersReadinessTemplates).set({ status: "superseded", supersededAt: new Date() }).where(and(eq(iersReadinessTemplates.institutionId, input.institutionId), eq(iersReadinessTemplates.status, "active"), ne(iersReadinessTemplates.id, input.templateId)));
      await db.update(iersReadinessTemplates).set({ status: "active", approvedByUserId: ctx.user.id, approvedAt: new Date(), effectiveFrom: new Date() }).where(eq(iersReadinessTemplates.id, input.templateId));
      return { success: true, templateId: input.templateId };
    }),

  getForMyUtl: protectedProcedure
    .input(z.object({ teamId: z.number().int().positive(), shiftUtlRosterId: z.number().int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      try {
      const { team } = await resolveAcceptedUtl(db, ctx.user.id, input.teamId, input.shiftUtlRosterId);
      await requireActiveMember(db, ctx.user.id, team.institutionId);
      const [template] = await db.select().from(iersReadinessTemplates).where(and(eq(iersReadinessTemplates.institutionId, team.institutionId), eq(iersReadinessTemplates.status, "active"), lte(iersReadinessTemplates.effectiveFrom, team.shiftDate))).orderBy(desc(iersReadinessTemplates.effectiveFrom), desc(iersReadinessTemplates.id)).limit(1);
      if (!template) return { template: null, items: [], latestCheck: null };
      const items = await db.select().from(iersReadinessTemplateItems).where(and(eq(iersReadinessTemplateItems.templateId, template.id), eq(iersReadinessTemplateItems.isActive, true))).orderBy(asc(iersReadinessTemplateItems.sortOrder), asc(iersReadinessTemplateItems.id));
      const checks = await db.select().from(iersUtlReadinessChecks).where(and(eq(iersUtlReadinessChecks.teamId, input.teamId), eq(iersUtlReadinessChecks.checkedByUserId, ctx.user.id), ne(iersUtlReadinessChecks.status, "superseded"))).orderBy(desc(iersUtlReadinessChecks.checkedAt)).limit(1);
      const latestCheck = checks[0] ?? null;
      const checkItems = latestCheck ? await db.select().from(iersUtlReadinessCheckItems).where(eq(iersUtlReadinessCheckItems.checkId, latestCheck.id)).orderBy(asc(iersUtlReadinessCheckItems.id)) : [];
      return { template, items, latestCheck: latestCheck ? { ...latestCheck, items: checkItems } : null };
      } catch (error) {
        if (isMissingTableError(error)) return { template: null, items: [], latestCheck: null };
        throw error;
      }
    }),

  submitForMyUtl: protectedProcedure
    .input(z.object({
      teamId: z.number().int().positive(),
      shiftUtlRosterId: z.number().int().positive().optional(),
      templateId: z.number().int().positive(),
      clientRequestId: z.string().trim().min(8).max(128),
      attestation: z.literal("I physically checked the listed items and am reporting their observed state."),
      generalNote: z.string().trim().max(2000).optional(),
      items: z.array(z.object({
        templateItemId: z.number().int().positive(),
        itemStatus: itemStatusSchema,
        observedQuantity: z.number().int().min(0).optional(),
        expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        functionTested: z.boolean().optional(),
        note: z.string().trim().max(1000).optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { assignment, team } = await resolveAcceptedUtl(db, ctx.user.id, input.teamId, input.shiftUtlRosterId);
      await requireActiveMember(db, ctx.user.id, team.institutionId);
      const [existingRequest] = await db.select({ id: iersUtlReadinessChecks.id, status: iersUtlReadinessChecks.status }).from(iersUtlReadinessChecks).where(and(eq(iersUtlReadinessChecks.checkedByUserId, ctx.user.id), eq(iersUtlReadinessChecks.idempotencyKey, input.clientRequestId))).limit(1);
      if (existingRequest) return { success: true, checkId: existingRequest.id, status: existingRequest.status, criticalGapCount: 0, nonCriticalGapCount: 0, duplicate: true };
      const [template] = await db.select().from(iersReadinessTemplates).where(and(eq(iersReadinessTemplates.id, input.templateId), eq(iersReadinessTemplates.institutionId, team.institutionId), eq(iersReadinessTemplates.status, "active"), lte(iersReadinessTemplates.effectiveFrom, team.shiftDate))).limit(1);
      if (!template) throw new TRPCError({ code: "BAD_REQUEST", message: "This readiness checklist is not an active approved template for the institution." });
      const templateItems = await db.select().from(iersReadinessTemplateItems).where(and(eq(iersReadinessTemplateItems.templateId, template.id), eq(iersReadinessTemplateItems.isActive, true))).orderBy(asc(iersReadinessTemplateItems.sortOrder), asc(iersReadinessTemplateItems.id));
      const itemMap = new Map(templateItems.map((item) => [item.id, item]));
      if (input.items.length !== itemMap.size || new Set(input.items.map((item) => item.templateItemId)).size !== input.items.length || input.items.some((item) => !itemMap.has(item.templateItemId))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Complete every active checklist item exactly once before submitting." });
      }
      const definitions = templateItems.map((item) => ({ isCritical: item.isCritical }));
      const observations = templateItems.map((item) => ({ itemStatus: input.items.find((observation) => observation.templateItemId === item.id)?.itemStatus ?? "not_observed" }));
      const criticalGapCount = observations.filter((observation, index) => isCriticalReadinessGap(definitions[index], observation)).length;
      const nonCriticalGapCount = observations.filter((observation, index) => !definitions[index].isCritical && !["present_and_functional", "not_applicable"].includes(observation.itemStatus)).length;
      const status = deriveUtlReadinessStatus(definitions, observations);
      const existing = await db.select({ id: iersUtlReadinessChecks.id }).from(iersUtlReadinessChecks).where(and(eq(iersUtlReadinessChecks.teamId, input.teamId), eq(iersUtlReadinessChecks.checkedByUserId, ctx.user.id), ne(iersUtlReadinessChecks.status, "superseded")));
      if (existing.length > 0) await db.update(iersUtlReadinessChecks).set({ status: "superseded" }).where(eq(iersUtlReadinessChecks.id, existing[0].id));
      const insertedCheck = await db.insert(iersUtlReadinessChecks).values({ institutionId: team.institutionId, poleId: team.poleId, departmentId, teamId: team.id, shiftUtlRosterId: assignment.shiftUtlRosterId ?? null, templateId: template.id, checkedByUserId: ctx.user.id, idempotencyKey: input.clientRequestId, status, attestation: input.attestation, generalNote: input.generalNote ?? null, checkedAt: new Date() });
      const checkId = Number((insertedCheck as unknown as { insertId: number }).insertId);
      for (const item of input.items) {
        const definition = itemMap.get(item.templateItemId)!;
        await db.insert(iersUtlReadinessCheckItems).values({ checkId, templateItemId: item.templateItemId, itemStatus: item.itemStatus, observedQuantity: item.observedQuantity ?? null, expiryDate: item.expiryDate ?? null, functionTested: item.functionTested ?? null, note: item.note ?? null, isCriticalGap: isCriticalReadinessGap(definition, item) });
      }
      if (criticalGapCount > 0) await notifyErco(db, team.institutionId, departmentId, "Critical crash-cart readiness gap", `The UTL readiness check for the ${team.shiftType} shift on ${team.shiftDate} found ${criticalGapCount} critical gap(s). Confirm mitigation before the shift.`, checkId);
      return { success: true, checkId, status, criticalGapCount, nonCriticalGapCount };
    }),
});
