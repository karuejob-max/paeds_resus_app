import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  cprCareSignalLinks,
  cprEventLinks,
  cprEvents,
  cprSessions,
  iersActivationArrivals,
  iersActivationEvents,
  iersActivationResources,
  iersActivationResponders,
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

  /** Aggregate linked CPR event-loop signals for institutional QI; never returns patient or raw narrative data. */
  getCprEventSignals: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), days: z.number().int().min(7).max(365).default(90) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [membership] = await db.select().from(institutionMemberships).where(and(
        eq(institutionMemberships.institutionalAccountId, input.institutionId),
        eq(institutionMemberships.userId, ctx.user.id),
        eq(institutionMemberships.membershipStatus, "active"),
      )).limit(1);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active provider member of this institution." });
      await assertInstitutionProductRole(db, ctx.user as any, input.institutionId, "iers", ["iers_coordinator", "iers_governance", "iers_reviewer", "iers_viewer"]);

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const linkedRows = await db.select({ link: cprEventLinks, session: cprSessions, activation: iersActivationEvents })
        .from(cprEventLinks)
        .innerJoin(cprSessions, eq(cprSessions.id, cprEventLinks.cprSessionId))
        .innerJoin(iersActivationEvents, eq(iersActivationEvents.id, cprEventLinks.activationEventId))
        .where(and(eq(cprEventLinks.institutionalAccountId, input.institutionId), gte(cprEventLinks.createdAt, since)))
        .orderBy(desc(cprEventLinks.createdAt));
      const sessionIds = linkedRows.map((row) => row.session.id);
      const activationIds = linkedRows.map((row) => row.activation.id);
      const events = sessionIds.length ? await db.select().from(cprEvents).where(inArray(cprEvents.cprSessionId, sessionIds)) : [];
      const resources = activationIds.length ? await db.select().from(iersActivationResources).where(inArray(iersActivationResources.activationEventId, activationIds)) : [];
      const arrivals = activationIds.length ? await db.select().from(iersActivationArrivals).where(inArray(iersActivationArrivals.activationEventId, activationIds)) : [];
      const responders = activationIds.length ? await db.select().from(iersActivationResponders).where(inArray(iersActivationResponders.activationEventId, activationIds)) : [];
      const careSignalLinks = sessionIds.length ? await db.select().from(cprCareSignalLinks).where(inArray(cprCareSignalLinks.cprSessionId, sessionIds)) : [];

      const outcomeCounts = linkedRows.reduce<Record<string, number>>((counts, row) => {
        const outcome = row.link.terminalOutcome ?? row.session.outcome ?? "unknown";
        counts[outcome] = (counts[outcome] ?? 0) + 1;
        return counts;
      }, {});
      const pathwayCounts = linkedRows.reduce<Record<string, number>>((counts, row) => {
        const pathway = row.link.pathwayKey ?? "unspecified";
        counts[pathway] = (counts[pathway] ?? 0) + 1;
        return counts;
      }, {});
      const eventCounts = events.reduce<Record<string, number>>((counts, event) => {
        counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
        return counts;
      }, {});
      const firstEventTimes = (eventType: string, descriptionIncludes?: string) => linkedRows.map((row) => {
        const candidates = events.filter((event) => event.cprSessionId === row.session.id && event.eventType === eventType && (!descriptionIncludes || event.description?.toLowerCase().includes(descriptionIncludes))).sort((a, b) => a.eventTime - b.eventTime);
        return candidates[0]?.eventTime ?? null;
      }).filter((value): value is number => value !== null);
      const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
      const firstShockSeconds = firstEventTimes("defibrillation");
      const firstEpinephrineSeconds = firstEventTimes("medication", "epinephrine");
      const arrivedProviderIds = new Set(arrivals.map((arrival) => `${arrival.activationEventId}:${arrival.providerUserId}`));
      const responderProviderIds = new Set(responders.map((responder) => `${responder.activationEventId}:${responder.userId}`));
      const coveredResponderCount = [...arrivedProviderIds].filter((key) => responderProviderIds.has(key)).length;
      const unresolvedResourceCount = resources.filter((resource) => ["needed", "claimed", "in_transit"].includes(resource.status)).length;
      const debriefedCount = linkedRows.filter((row) => Boolean(row.link.debriefSubmittedAt) || ["debrief_pending", "closed"].includes(row.link.linkStatus)).length;
      const completedCount = linkedRows.filter((row) => ["outcome_recorded", "debrief_pending", "closed"].includes(row.link.linkStatus)).length;
      const recommendations: string[] = [];
      if (linkedRows.length > 0 && debriefedCount < linkedRows.length) recommendations.push("Complete the ERTL debrief for every linked arrest before interpreting the event as closed.");
      if (unresolvedResourceCount > 0) recommendations.push("Review unresolved activation resources and convert repeated gaps into a readiness action with an owner and evidence.");
      if (responders.length > 0 && coveredResponderCount < responders.length) recommendations.push("Review responder arrival capture; this is operational documentation, not proof that an individual was absent.");
      if (careSignalLinks.length < linkedRows.length) recommendations.push("Offer a named Care Signal after each completed event so system gaps can enter the institutional QI queue.");
      if (recommendations.length === 0) recommendations.push("No immediate event-loop documentation gap was detected in this window; continue committee review and simulation validation.");

      return {
        windowDays: input.days,
        generatedAt: new Date().toISOString(),
        coverage: {
          linkedCprEvents: linkedRows.length,
          completedEvents: completedCount,
          debriefedEvents: debriefedCount,
          careSignalLinks: careSignalLinks.length,
          activationResponderAssignments: responders.length,
          arrivalRecords: arrivals.length,
          resourceRecords: resources.length,
        },
        outcomes: outcomeCounts,
        pathways: pathwayCounts,
        operationalEvents: eventCounts,
        timingSeconds: {
          averageTimeToFirstShock: average(firstShockSeconds),
          averageTimeToFirstEpinephrine: average(firstEpinephrineSeconds),
        },
        arrivalCoverage: responders.length ? Number((coveredResponderCount / responders.length).toFixed(3)) : null,
        unresolvedResourceCount,
        recommendations,
        interpretation: [
          "These are documentation and operational signals, not patient outcomes, diagnostic findings, or individual performance scores.",
          "Missing, delayed, or unlinked records may reflect workflow or connectivity failure rather than clinical absence.",
          "Use the ERTL/Resuscitation Committee review and labelled simulation evidence before changing staffing, procurement, or clinical content.",
        ],
      };
    }),
});
