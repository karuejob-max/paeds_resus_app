import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  iersReadinessTemplateItems,
  iersShiftRoleAssignments,
  iersShiftTeams,
  iersTargetedRoleReports,
  iersUtlReadinessCheckItems,
  iersUtlReadinessChecks,
  institutionMemberships,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertInstitutionProductRole } from "../lib/institution-product-roles";
import { TRPCError } from "@trpc/server";

export const iersAdaptiveLearningRouter = router({
  getInstitutionSignals: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), days: z.number().int().min(7).max(365).default(90) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [membership] = await db.select().from(institutionMemberships).where(and(eq(institutionMemberships.institutionalAccountId, input.institutionId), eq(institutionMemberships.userId, ctx.user.id), eq(institutionMemberships.membershipStatus, "active"))).limit(1);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active provider member of this institution." });
      await assertInstitutionProductRole(db, ctx.user as any, input.institutionId, "iers", ["iers_coordinator", "iers_governance", "iers_reviewer", "iers_viewer"]);
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const teams = await db.select().from(iersShiftTeams).where(and(eq(iersShiftTeams.institutionId, input.institutionId), gte(iersShiftTeams.createdAt, since))).orderBy(desc(iersShiftTeams.shiftDate));
      const teamIds = teams.map((team) => team.id);
      const assignments = teamIds.length ? await db.select().from(iersShiftRoleAssignments).where(inArray(iersShiftRoleAssignments.teamId, teamIds)) : [];
      const readinessChecks = await db.select().from(iersUtlReadinessChecks).where(and(eq(iersUtlReadinessChecks.institutionId, input.institutionId), gte(iersUtlReadinessChecks.checkedAt, since), eq(iersUtlReadinessChecks.status, "not_ready"))).orderBy(desc(iersUtlReadinessChecks.checkedAt));
      const allChecks = await db.select().from(iersUtlReadinessChecks).where(and(eq(iersUtlReadinessChecks.institutionId, input.institutionId), gte(iersUtlReadinessChecks.checkedAt, since)));
      const checkIds = allChecks.map((check) => check.id);
      const checkItems = checkIds.length ? await db.select().from(iersUtlReadinessCheckItems).where(inArray(iersUtlReadinessCheckItems.checkId, checkIds)) : [];
      const targetedReports = await db.select().from(iersTargetedRoleReports).where(and(eq(iersTargetedRoleReports.institutionId, input.institutionId), gte(iersTargetedRoleReports.submittedAt, since), eq(iersTargetedRoleReports.submissionState, "submitted"))).orderBy(desc(iersTargetedRoleReports.submittedAt));
      const templateItemIds = [...new Set(checkItems.map((item) => item.templateItemId))];
      const templateItems = templateItemIds.length ? await db.select().from(iersReadinessTemplateItems).where(inArray(iersReadinessTemplateItems.id, templateItemIds)) : [];
      const itemLabels = new Map(templateItems.map((item) => [item.id, item.itemLabel]));
      const assignmentCounts = assignments.reduce<Record<string, number>>((counts, assignment) => { counts[assignment.assignmentStatus] = (counts[assignment.assignmentStatus] ?? 0) + 1; return counts; }, {});
      const reportCounts = targetedReports.reduce<Record<string, number>>((counts, report) => { counts[report.observationCode] = (counts[report.observationCode] ?? 0) + 1; return counts; }, {});
      const criticalGapCounts = checkItems.filter((item) => item.isCriticalGap).reduce<Record<string, number>>((counts, item) => { const label = itemLabels.get(item.templateItemId) ?? "Unknown readiness item"; counts[label] = (counts[label] ?? 0) + 1; return counts; }, {});
      const totalAssignments = assignments.length;
      const acceptedAssignments = assignmentCounts.accepted ?? 0;
      const declinedAssignments = assignmentCounts.declined ?? 0;
      const pendingAssignments = (assignmentCounts.pending_acceptance ?? 0) + (assignmentCounts.approved ?? 0);
      return {
        windowDays: input.days,
        generatedAt: new Date().toISOString(),
        coverage: { teamCount: teams.length, assignmentCount: totalAssignments, readinessCheckCount: allChecks.length, targetedReportCount: targetedReports.length },
        roleCoverage: { accepted: acceptedAssignments, declined: declinedAssignments, pending: pendingAssignments, acceptanceRate: totalAssignments ? Number((acceptedAssignments / totalAssignments).toFixed(3)) : null, uncoveredRoleCount: declinedAssignments + pendingAssignments },
        readiness: { totalChecks: allChecks.length, ready: allChecks.filter((check) => check.status === "ready").length, readyWithGaps: allChecks.filter((check) => check.status === "ready_with_gaps").length, notReady: readinessChecks.length, criticalGapCounts },
        targetedRoleReports: { byObservationCode: reportCounts },
        interpretation: [
          "These are operational observations, not patient outcomes or individual performance scores.",
          "Acceptance and readiness metrics are only as complete as the dated teams and checks recorded in the selected window.",
          "Repeated gaps require human IERS/Resuscitation Committee review before procurement, staffing, or training changes.",
        ],
      };
    }),
});
