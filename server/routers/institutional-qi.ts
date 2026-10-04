import { z } from "zod";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  careSignalEvents,
  codeSignalEvents,
  institutionalQiActions,
  institutionalQiEffectivenessReviews,
  institutionalQiParticipationSnapshots,
  institutionalQiReports,
  institutionalQiReportEvents,
  institutionalQiExportRequests,
  institutionalQiRetentionPolicies,
  facilityDepartments,
  institutionMemberships,
} from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { assertInstitutionProductRole } from "../lib/institution-product-roles";
import { participationRequirement, type FacilityLevel } from "@shared/institutional-pricing";
import { canCloseQiReport } from "../lib/institutional-trust-invariants";

const reportTypes = ["safety_event", "improvement_project"] as const;
const reportStatuses = ["draft", "submitted", "triaged", "action_planned", "in_progress", "effectiveness_review", "closed", "reopened"] as const;
const reviewerRoles = ["iers_chair", "iers_coordinator", "iers_reviewer", "iers_governance"] as const;

type ReportStatus = (typeof reportStatuses)[number];

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

async function assertReviewer(db: Awaited<ReturnType<typeof dbOrThrow>>, user: { id: number; role: string; email: string | null }, institutionId: number) {
  await assertInstitutionProductRole(db, user as never, institutionId, "iers", reviewerRoles);
}

async function assertDepartmentBelongsToInstitution(db: Awaited<ReturnType<typeof dbOrThrow>>, institutionId: number, departmentId: number) {
  const [department] = await db.select({ id: facilityDepartments.id }).from(facilityDepartments).where(and(eq(facilityDepartments.id, departmentId), eq(facilityDepartments.institutionId, institutionId), eq(facilityDepartments.isActive, true))).limit(1);
  if (!department) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected department is not an active department of this institution." });
}

async function assertActiveInstitutionMember(db: Awaited<ReturnType<typeof dbOrThrow>>, institutionId: number, userId: number) {
  const [membership] = await db.select({ id: institutionMemberships.id }).from(institutionMemberships).where(and(eq(institutionMemberships.institutionalAccountId, institutionId), eq(institutionMemberships.userId, userId), eq(institutionMemberships.membershipStatus, "active"))).limit(1);
  if (!membership) throw new TRPCError({ code: "BAD_REQUEST", message: "The action owner must be an active member of this institution." });
}

function assertTransition(current: ReportStatus, next: ReportStatus) {
  const allowed: Record<ReportStatus, ReportStatus[]> = {
    draft: ["submitted"],
    submitted: ["triaged", "reopened"],
    triaged: ["action_planned", "effectiveness_review", "reopened"],
    action_planned: ["in_progress", "reopened"],
    in_progress: ["effectiveness_review", "reopened"],
    effectiveness_review: ["closed", "reopened"],
    closed: ["reopened"],
    reopened: ["submitted", "triaged"],
  };
  if (!allowed[current]?.includes(next)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot move a QI report from ${current} to ${next}.` });
  }
}

export const institutionalQiRouter = router({
  createReport: protectedProcedure
    .input(z.object({
      institutionalAccountId: z.number().int().positive(),
      reportType: z.enum(reportTypes),
      title: z.string().trim().min(3).max(255),
      problemStatement: z.string().trim().min(10).max(10000),
      eventDate: z.coerce.date().optional(),
      facilityDepartmentId: z.number().int().positive().optional(),
      careArea: z.string().trim().max(128).optional(),
      ageGroup: z.string().trim().max(64).optional(),
      harmOccurred: z.boolean().default(false),
      severity: z.enum(["low", "moderate", "severe", "critical"]).default("low"),
      expectedProcess: z.string().trim().max(10000).optional(),
      observedGap: z.string().trim().max(10000).optional(),
      contributingFactors: z.record(z.string(), z.unknown()).optional(),
      baselineMeasure: z.number().optional(),
      numerator: z.number().int().nonnegative().optional(),
      denominator: z.number().int().positive().optional(),
      dataSource: z.string().trim().max(255).optional(),
      targetMeasure: z.number().optional(),
      confidentialityLevel: z.enum(["institution_only", "aggregate_only", "restricted"]).default("institution_only"),
      status: z.enum(["draft", "submitted"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      if (input.facilityDepartmentId) await assertDepartmentBelongsToInstitution(db, input.institutionalAccountId, input.facilityDepartmentId);
      const now = new Date();
      const [created] = await db.insert(institutionalQiReports).values({
        institutionalAccountId: input.institutionalAccountId,
        facilityDepartmentId: input.facilityDepartmentId ?? null,
        reportType: input.reportType,
        sourceType: "manual",
        title: input.title,
        eventDate: input.eventDate ?? null,
        careArea: input.careArea ?? null,
        ageGroup: input.ageGroup ?? null,
        harmOccurred: input.harmOccurred,
        severity: input.severity,
        problemStatement: input.problemStatement,
        expectedProcess: input.expectedProcess ?? null,
        observedGap: input.observedGap ?? null,
        contributingFactors: input.contributingFactors ?? null,
        baselineMeasure: input.baselineMeasure?.toString() ?? null,
        numerator: input.numerator ?? null,
        denominator: input.denominator ?? null,
        dataSource: input.dataSource ?? null,
        targetMeasure: input.targetMeasure?.toString() ?? null,
        confidentialityLevel: input.confidentialityLevel,
        status: input.status,
        reporterUserId: ctx.user.id,
        submittedAt: input.status === "submitted" ? now : null,
        createdAt: now,
        updatedAt: now,
      }).$returningId();
      await db.insert(institutionalQiReportEvents).values({ institutionalAccountId: input.institutionalAccountId, reportId: created.id, fromStatus: null, toStatus: input.status, actorUserId: ctx.user.id, actorRole: ctx.user.role, reason: input.status === "submitted" ? "QI report submitted" : "QI report created as draft", occurredAt: now });
      return { id: created.id, status: input.status };
    }),

  listReports: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), status: z.enum(reportStatuses).optional(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const predicates = [eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId)];
      if (input.status) predicates.push(eq(institutionalQiReports.status, input.status));
      return db.select().from(institutionalQiReports).where(and(...predicates)).orderBy(desc(institutionalQiReports.updatedAt)).limit(input.limit);
    }),

  listReportEvents: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), reportId: z.number().int().positive(), limit: z.number().int().min(1).max(200).default(100) }))
    .query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const [report] = await db.select({ id: institutionalQiReports.id }).from(institutionalQiReports).where(and(eq(institutionalQiReports.id, input.reportId), eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId))).limit(1);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "QI report not found." });
      return db.select().from(institutionalQiReportEvents).where(and(eq(institutionalQiReportEvents.institutionalAccountId, input.institutionalAccountId), eq(institutionalQiReportEvents.reportId, input.reportId))).orderBy(desc(institutionalQiReportEvents.occurredAt)).limit(input.limit);
    }),

  addAction: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), reportId: z.number().int().positive(), actionText: z.string().trim().min(3).max(5000), ownerUserId: z.number().int().positive().optional(), dueAt: z.coerce.date().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium") }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const [report] = await db.select({ id: institutionalQiReports.id }).from(institutionalQiReports).where(and(eq(institutionalQiReports.id, input.reportId), eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId))).limit(1);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "QI report not found." });
      if (input.ownerUserId) await assertActiveInstitutionMember(db, input.institutionalAccountId, input.ownerUserId);
      const [created] = await db.insert(institutionalQiActions).values({ institutionalAccountId: input.institutionalAccountId, reportId: input.reportId, actionText: input.actionText, ownerUserId: input.ownerUserId ?? null, dueAt: input.dueAt ?? null, priority: input.priority }).$returningId();
      return { id: created.id };
    }),

  transitionReport: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), reportId: z.number().int().positive(), nextStatus: z.enum(reportStatuses), reason: z.string().trim().min(3).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const [report] = await db.select().from(institutionalQiReports).where(and(eq(institutionalQiReports.id, input.reportId), eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId))).limit(1);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "QI report not found." });
      if (["triaged", "action_planned", "in_progress", "effectiveness_review", "closed"].includes(input.nextStatus)) await assertReviewer(db, ctx.user, input.institutionalAccountId);
      assertTransition(report.status as ReportStatus, input.nextStatus);
      if (input.nextStatus === "closed") {
        const [review] = await db.select({ outcome: institutionalQiEffectivenessReviews.outcome, followUpRequired: institutionalQiEffectivenessReviews.followUpRequired }).from(institutionalQiEffectivenessReviews).where(and(eq(institutionalQiEffectivenessReviews.reportId, input.reportId), eq(institutionalQiEffectivenessReviews.institutionalAccountId, input.institutionalAccountId))).orderBy(desc(institutionalQiEffectivenessReviews.reviewDate)).limit(1);
        if (!canCloseQiReport(review)) throw new TRPCError({ code: "BAD_REQUEST", message: "A verified effectiveness review with no unresolved follow-up is required before closing a QI report." });
      }
      const now = new Date();
      await db.update(institutionalQiReports).set({ status: input.nextStatus, reviewerUserId: ["triaged", "action_planned", "in_progress", "effectiveness_review", "closed"].includes(input.nextStatus) ? ctx.user.id : report.reviewerUserId, submittedAt: input.nextStatus === "submitted" ? now : report.submittedAt, closedAt: input.nextStatus === "closed" ? now : input.nextStatus === "reopened" ? null : report.closedAt, updatedAt: now }).where(eq(institutionalQiReports.id, input.reportId));
      await db.insert(institutionalQiReportEvents).values({ institutionalAccountId: input.institutionalAccountId, reportId: input.reportId, fromStatus: report.status, toStatus: input.nextStatus, actorUserId: ctx.user.id, actorRole: ctx.user.role, reason: input.reason, occurredAt: now });
      return { success: true, status: input.nextStatus, reason: input.reason };
    }),

  addEffectivenessReview: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), reportId: z.number().int().positive(), outcome: z.enum(["effective", "partially_effective", "not_effective", "insufficient_evidence"]), followUpRequired: z.boolean().default(false), evidenceSummary: z.string().trim().min(10).max(10000), measureValue: z.number().optional(), notes: z.string().trim().max(5000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertReviewer(db, ctx.user, input.institutionalAccountId);
      const [report] = await db.select().from(institutionalQiReports).where(and(eq(institutionalQiReports.id, input.reportId), eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId))).limit(1);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "QI report not found." });
      if (["closed", "draft"].includes(report.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Effectiveness review is only available for an active submitted QI workflow." });
      const now = new Date();
      const [created] = await db.insert(institutionalQiEffectivenessReviews).values({ reportId: input.reportId, institutionalAccountId: input.institutionalAccountId, reviewerUserId: ctx.user.id, reviewDate: now, outcome: input.outcome, followUpRequired: input.followUpRequired, evidenceSummary: input.evidenceSummary, measureValue: input.measureValue?.toString() ?? null, notes: input.notes ?? null }).$returningId();
      await db.update(institutionalQiReports).set({ status: "effectiveness_review", reviewerUserId: ctx.user.id, updatedAt: now }).where(eq(institutionalQiReports.id, input.reportId));
      await db.insert(institutionalQiReportEvents).values({ institutionalAccountId: input.institutionalAccountId, reportId: input.reportId, fromStatus: report.status, toStatus: "effectiveness_review", actorUserId: ctx.user.id, actorRole: ctx.user.role, reason: `Effectiveness review recorded: ${input.outcome}`, occurredAt: now });
      return { id: created.id, status: "effectiveness_review" as const };
    }),

  calculateParticipation: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), facilityLevel: z.enum(["level_4", "level_5", "level_6"]), quarterStart: z.coerce.date().optional(), quarterEnd: z.coerce.date().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const end = input.quarterEnd ?? new Date();
      const start = input.quarterStart ?? new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      const [closed] = await db.select({ count: sql<number>`count(distinct ${institutionalQiReports.id})` }).from(institutionalQiReports).innerJoin(institutionalQiEffectivenessReviews, eq(institutionalQiEffectivenessReviews.reportId, institutionalQiReports.id)).where(and(eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId), eq(institutionalQiReports.status, "closed"), gte(institutionalQiReports.closedAt, start), lt(institutionalQiReports.closedAt, end)));
      const [care] = await db.select({ count: sql<number>`count(*)` }).from(careSignalEvents).where(and(eq(careSignalEvents.facilityId, input.institutionalAccountId), gte(careSignalEvents.createdAt, start), lt(careSignalEvents.createdAt, end)));
      const [code] = await db.select({ count: sql<number>`count(*)` }).from(codeSignalEvents).where(and(eq(codeSignalEvents.facilityId, input.institutionalAccountId), gte(codeSignalEvents.createdAt, start), lt(codeSignalEvents.createdAt, end)));
      const closedEffectiveReports = Number(closed?.count ?? 0);
      const required = participationRequirement(input.facilityLevel as FacilityLevel);
      return { quarterStart: start, quarterEnd: end, requiredClosedEffectiveReports: required, closedEffectiveReports, careSignalReports: Number(care?.count ?? 0), codeSignalReports: Number(code?.count ?? 0), participationStatus: closedEffectiveReports >= required ? "met" as const : "not_met" as const };
    }),

  requestExport: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), format: z.enum(["json", "csv"]).default("json"), confidentialityScope: z.enum(["institution_only", "aggregate_only"]).default("institution_only"), status: z.enum(reportStatuses).optional(), limit: z.number().int().min(1).max(500).default(200) }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const predicates = [eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId)];
      if (input.status) predicates.push(eq(institutionalQiReports.status, input.status));
      const reports = await db.select().from(institutionalQiReports).where(and(...predicates)).orderBy(desc(institutionalQiReports.updatedAt)).limit(input.limit);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const [exportRequest] = await db.insert(institutionalQiExportRequests).values({ institutionalAccountId: input.institutionalAccountId, requestedByUserId: ctx.user.id, format: input.format, confidentialityScope: input.confidentialityScope, status: "completed", filters: { status: input.status ?? null, limit: input.limit }, rowCount: reports.length, expiresAt, completedAt: now }).$returningId();
      const rows = input.confidentialityScope === "aggregate_only" ? reports.map(report => ({ id: report.id, reportType: report.reportType, status: report.status, severity: report.severity, careArea: report.careArea, eventDate: report.eventDate, closedAt: report.closedAt })) : reports;
      return { exportId: exportRequest.id, format: input.format, expiresAt, rowCount: rows.length, rows };
    }),

  getRetentionPolicy: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const [policy] = await db.select().from(institutionalQiRetentionPolicies).where(eq(institutionalQiRetentionPolicies.institutionalAccountId, input.institutionalAccountId)).limit(1);
      return policy ?? { institutionalAccountId: input.institutionalAccountId, retentionDays: 2555, autoDeleteEnabled: false, configured: false };
    }),

  setRetentionPolicy: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), retentionDays: z.number().int().min(30).max(3650), autoDeleteEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertReviewer(db, ctx.user, input.institutionalAccountId);
      await db.insert(institutionalQiRetentionPolicies).values({ institutionalAccountId: input.institutionalAccountId, retentionDays: input.retentionDays, autoDeleteEnabled: input.autoDeleteEnabled, approvedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { retentionDays: input.retentionDays, autoDeleteEnabled: input.autoDeleteEnabled, approvedByUserId: ctx.user.id, lastReviewedAt: new Date(), updatedAt: new Date() } });
      return { success: true, retentionDays: input.retentionDays, autoDeleteEnabled: input.autoDeleteEnabled };
    }),

  saveParticipationSnapshot: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), facilityLevel: z.enum(["level_4", "level_5", "level_6"]), quarterStart: z.coerce.date(), quarterEnd: z.coerce.date() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertReviewer(db, ctx.user, input.institutionalAccountId);
      const end = input.quarterEnd;
      const start = input.quarterStart;
      const [closed] = await db.select({ count: sql<number>`count(distinct ${institutionalQiReports.id})` }).from(institutionalQiReports).innerJoin(institutionalQiEffectivenessReviews, eq(institutionalQiEffectivenessReviews.reportId, institutionalQiReports.id)).where(and(eq(institutionalQiReports.institutionalAccountId, input.institutionalAccountId), eq(institutionalQiReports.status, "closed"), gte(institutionalQiReports.closedAt, start), lt(institutionalQiReports.closedAt, end)));
      const [care] = await db.select({ count: sql<number>`count(*)` }).from(careSignalEvents).where(and(eq(careSignalEvents.facilityId, input.institutionalAccountId), gte(careSignalEvents.createdAt, start), lt(careSignalEvents.createdAt, end)));
      const [code] = await db.select({ count: sql<number>`count(*)` }).from(codeSignalEvents).where(and(eq(codeSignalEvents.facilityId, input.institutionalAccountId), gte(codeSignalEvents.createdAt, start), lt(codeSignalEvents.createdAt, end)));
      const closedEffectiveReports = Number(closed?.count ?? 0);
      const required = participationRequirement(input.facilityLevel as FacilityLevel);
      const status = closedEffectiveReports >= required ? "met" : "not_met";
      const [created] = await db.insert(institutionalQiParticipationSnapshots).values({ institutionalAccountId: input.institutionalAccountId, quarterStart: start, quarterEnd: end, facilityLevel: input.facilityLevel, requiredClosedEffectiveReports: required, closedEffectiveReports, careSignalReports: Number(care?.count ?? 0), codeSignalReports: Number(code?.count ?? 0), participationStatus: status }).$returningId();
      return { id: created.id, participationStatus: status, closedEffectiveReports, requiredClosedEffectiveReports: required };
    }),
});
