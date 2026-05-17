import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, like, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc";
import { getDb, getRecentErrors } from "../db";
import { ENV } from "../_core/env";
import { getMpesaDeploymentMode } from "../lib/mpesa-env";
import {
  users,
  enrollments,
  certificates,
  analyticsEvents,
  parentSafeTruthSubmissions,
  clinicalReferrals,
  adminAuditLog,
  resusGPSSessions,
  resusGPSCases,
  careSignalEvents,
  moduleSections,
  courses,
  microCourses,
  microCourseEnrollments,
  fellowshipProgress,
  payments,
  errorTracking,
  supportTickets,
  mpesaWebhookLog,
  adminAlertDispatches,
} from "../../drizzle/schema";
import {
  listCareSignalFacilities,
  getFacilityCareSignalDashboard,
} from "../services/facility-care-signal.service";
import { runAdminOpsAlerts } from "../lib/admin-ops-alerts";
import {
  syncFellowshipProgressForUser,
  syncFellowshipProgressBatch,
  listProvidersWithoutFellowshipProgress,
} from "../services/fellowship-progress.service";
import { rollingHoursAgo } from "../lib/report-time-windows";
import { rollupAnalyticsLastDays, rollupResusGpsLastDays } from "../lib/admin-analytics-rollup";

/** EAT = UTC+3. Report "this month" uses calendar month in EAT per PLATFORM_SOURCE_OF_TRUTH. */
function startOfMonthEAT(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, -3, 0, 0, 0));
}

function endOfMonthEAT(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 20, 59, 59, 999));
}

export const adminStatsRouter = router({
  /**
   * Report for admin: registered users, BLS/ACLS applications and certifications this month,
   * parent Safe-Truth usage, ResusGPS/analytics in last 7 days.
   */
  getReport: adminProcedure
    .input(
      z
        .object({
          month: z.number().min(1).max(12).optional(),
          year: z.number().min(2020).max(2100).optional(),
          lastDays: z.number().min(1).max(90).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          ok: false,
          error: "Database not available",
          usersByType: { individual: 0, parent: 0, institutional: 0 },
          enrollmentsThisMonth: { bls: 0, acls: 0, pals: 0, fellowship: 0 },
          certificatesThisMonth: { bls: 0, acls: 0, pals: 0, fellowship: 0 },
          parentSafeTruthThisMonth: 0,
          referralsThisMonth: 0,
          conversionFunnel: { enrolled: 0, completed: 0, conversionPercent: 0 },
          topProtocolsViewed: [] as { protocol: string; count: number }[],
          analyticsLastDays: { count: 0, eventTypes: [] as { eventType: string; count: number }[] },
          resusGpsAnalyticsLastDays: {
            totalEvents: 0,
            eventTypes: [] as { eventType: string; count: number }[],
          },
          fellowshipStatsLastDays: {
            totalSessions: 0,
            totalCases: 0,
          },
        };
      }

      const now = new Date();
      const year = input?.year ?? now.getFullYear();
      const month = input?.month ?? now.getMonth() + 1;
      const periodStart = startOfMonthEAT(year, month);
      const periodEnd = endOfMonthEAT(year, month);
      const lastDays = input?.lastDays ?? 7;
      const analyticsSince = rollingHoursAgo(lastDays);

      // Users by type
      const allUsers = await db.select({ userType: users.userType }).from(users);
      const usersByType = {
        individual: allUsers.filter((u) => u.userType === "individual").length,
        parent: allUsers.filter((u) => u.userType === "parent").length,
        institutional: allUsers.filter((u) => u.userType === "institutional").length,
      };

      // Enrollments this month (applications by program)
      const enrollmentsInMonth = await db
        .select({ programType: enrollments.programType })
        .from(enrollments)
        .where(and(gte(enrollments.createdAt, periodStart), lte(enrollments.createdAt, periodEnd)));
      const enrollmentsThisMonth = {
        bls: enrollmentsInMonth.filter((e) => e.programType === "bls").length,
        acls: enrollmentsInMonth.filter((e) => e.programType === "acls").length,
        pals: enrollmentsInMonth.filter((e) => e.programType === "pals").length,
        fellowship: enrollmentsInMonth.filter((e) => e.programType === "fellowship").length,
      };

      // Certificates issued this month
      const certsInMonth = await db
        .select({ programType: certificates.programType })
        .from(certificates)
        .where(and(gte(certificates.issueDate, periodStart), lte(certificates.issueDate, periodEnd)));
      const certificatesThisMonth = {
        bls: certsInMonth.filter((c) => c.programType === "bls").length,
        acls: certsInMonth.filter((c) => c.programType === "acls").length,
        pals: certsInMonth.filter((c) => c.programType === "pals").length,
        fellowship: certsInMonth.filter((c) => c.programType === "fellowship").length,
      };

      // Parent Safe-Truth submissions this month
      const parentSubmissions = await db
        .select({ id: parentSafeTruthSubmissions.id })
        .from(parentSafeTruthSubmissions)
        .where(
          and(
            gte(parentSafeTruthSubmissions.createdAt, periodStart),
            lte(parentSafeTruthSubmissions.createdAt, periodEnd)
          )
        );
      const parentSafeTruthThisMonth = parentSubmissions.length;

      // Clinical referrals this month
      const referralsInMonth = await db
        .select({ id: clinicalReferrals.id })
        .from(clinicalReferrals)
        .where(
          and(
            gte(clinicalReferrals.createdAt, periodStart),
            lte(clinicalReferrals.createdAt, periodEnd)
          )
        );
      const referralsThisMonth = referralsInMonth.length;

      // Analytics (ResusGPS / app usage) in last N days
      const analyticsInPeriod = await db
        .select({
          eventType: analyticsEvents.eventType,
          eventName: analyticsEvents.eventName,
        })
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, analyticsSince));
      const analyticsLastDaysRollup = rollupAnalyticsLastDays(analyticsInPeriod);
      const resusGpsAnalyticsLastDays = rollupResusGpsLastDays(analyticsInPeriod);

      // Fellowship session stats
      const fellowshipSessionsInPeriod = await db
        .select({ id: resusGPSSessions.id })
        .from(resusGPSSessions)
        .where(gte(resusGPSSessions.createdAt, analyticsSince));
      
      const fellowshipCasesInPeriod = await db
        .select({ id: resusGPSCases.id })
        .from(resusGPSCases)
        .where(gte(resusGPSCases.createdAt, analyticsSince));

      const fellowshipStatsLastDays = {
        totalSessions: fellowshipSessionsInPeriod.length,
        totalCases: fellowshipCasesInPeriod.length,
      };
      // Care Signal metrics this month
      const careSignalThisMonth = await db
        .select({
          outcome: careSignalEvents.outcome,
          systemGaps: careSignalEvents.systemGaps,
          status: careSignalEvents.status,
        })
        .from(careSignalEvents)
        .where(
          and(
            gte(careSignalEvents.createdAt, periodStart),
            lte(careSignalEvents.createdAt, periodEnd)
          )
        );
      const careSignalUnderReview = careSignalThisMonth.filter(
        (e) => e.status === "under_review"
      ).length;
      const careSignalGapBreakdown: Record<string, number> = {};
      for (const e of careSignalThisMonth) {
        try {
          const gaps = JSON.parse(e.systemGaps) as string[];
          for (const g of gaps) {
            careSignalGapBreakdown[g] = (careSignalGapBreakdown[g] ?? 0) + 1;
          }
        } catch { /* skip */ }
      }
      const topCareSignalGaps = Object.entries(careSignalGapBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([gap, count]) => ({ gap, count }));
      const careSignalStats = {
        totalThisMonth: careSignalThisMonth.length,
        underReview: careSignalUnderReview,
        topGaps: topCareSignalGaps,
      };

      // Count unique active users in last N days
      const activeUsersResult = await db
        .selectDistinct({ userId: analyticsEvents.userId })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, rollingHoursAgo(lastDays)),
            analyticsEvents.userId
          )
        );
      const activeUsersLastDays = activeUsersResult.filter(r => r.userId !== null).length;

      // Top protocols viewed (View Protocol button clicks, last N days)
      const viewProtocolEvents = await db
        .select({ eventData: analyticsEvents.eventData })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, analyticsSince),
            like(analyticsEvents.eventName, "%View Protocol%")
          )
        );
      const protocolCounts: Record<string, number> = {};
      viewProtocolEvents.forEach((row) => {
        try {
          const data = row.eventData ? JSON.parse(row.eventData) : {};
          const protocol = (data.protocol || data.diagnosis || "Unknown").toString();
          protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
        } catch {
          protocolCounts["Unknown"] = (protocolCounts["Unknown"] || 0) + 1;
        }
      });
      const topProtocolsViewed = Object.entries(protocolCounts)
        .map(([protocol, count]) => ({ protocol, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        ok: true,
        periodLabel: `${periodStart.toLocaleString("default", { month: "long", timeZone: "Africa/Nairobi" })} ${year} (EAT)`,
        lastDaysLabel: `Rolling last ${lastDays} days (×24h from now)`,
        usersByType,
        totalUsers: allUsers.length,
        enrollmentsThisMonth,
        totalEnrollmentsThisMonth:
          enrollmentsThisMonth.bls +
          enrollmentsThisMonth.acls +
          enrollmentsThisMonth.pals +
          enrollmentsThisMonth.fellowship,
        certificatesThisMonth,
        totalCertificatesThisMonth:
          certificatesThisMonth.bls +
          certificatesThisMonth.acls +
          certificatesThisMonth.pals +
          certificatesThisMonth.fellowship,
        conversionFunnel: (() => {
          const enrolled =
            enrollmentsThisMonth.bls +
            enrollmentsThisMonth.acls +
            enrollmentsThisMonth.pals +
            enrollmentsThisMonth.fellowship;
          const completed =
            certificatesThisMonth.bls +
            certificatesThisMonth.acls +
            certificatesThisMonth.pals +
            certificatesThisMonth.fellowship;
          const conversionPercent = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
          return { enrolled, completed, conversionPercent };
        })(),
        parentSafeTruthThisMonth,
        referralsThisMonth,
        analyticsLastDays: analyticsLastDaysRollup,
        resusGpsAnalyticsLastDays,
        fellowshipStatsLastDays,
        activeUsersLastDays,
        topProtocolsViewed,
        careSignalStats,
      };
    }),

  /** Recent admin audit log rows (sanitized inputs only). */
  getAdminAuditLog: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(2000).default(500) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rows: [] };
      const limit = input?.limit ?? 500;
      const rows = await db
        .select({
          id: adminAuditLog.id,
          adminUserId: adminAuditLog.adminUserId,
          procedurePath: adminAuditLog.procedurePath,
          inputSummary: adminAuditLog.inputSummary,
          createdAt: adminAuditLog.createdAt,
        })
        .from(adminAuditLog)
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(limit);
      return { rows };
    }),

  /** List registered users (admin only); optional filter by userType. */
  getUsers: adminProcedure
    .input(
      z
        .object({
          userType: z.enum(["individual", "parent", "institutional"]).optional(),
          search: z.string().max(200).optional(),
          limit: z.number().min(1).max(500).default(100),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { users: [], total: 0 };
      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;

      const rawSearch = input?.search?.trim().replace(/[%_\\]/g, "") ?? "";
      const searchPattern = rawSearch.length > 0 ? `%${rawSearch}%` : null;

      const parts: SQL[] = [];
      if (input?.userType) parts.push(eq(users.userType, input.userType));
      if (searchPattern) {
        const searchOr = or(like(users.email, searchPattern), like(users.name, searchPattern));
        if (searchOr) parts.push(searchOr);
      }
      const whereCombined =
        parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : and(...parts);

      const listBase = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt,
          instructorApprovedAt: users.instructorApprovedAt,
          instructorCertifiedAt: users.instructorCertifiedAt,
          instructorNumber: users.instructorNumber,
        })
        .from(users);
      const result = await (whereCombined ? listBase.where(whereCombined) : listBase)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const countBase = db.select({ count: sql<number>`count(*)` }).from(users);
      const countResult = await (whereCombined ? countBase.where(whereCombined) : countBase);
      const total = Number(countResult[0]?.count ?? 0);

      return { users: result, total };
    }),

  /**
   * Approve or revoke a user as an assignable B2B session instructor (Hospital Admin schedule picker).
   */
  setInstructorApproval: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      if (input.approved) {
        const [u] = await db
          .select({
            instructorCertifiedAt: users.instructorCertifiedAt,
            instructorNumber: users.instructorNumber,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);
        if (!u?.instructorCertifiedAt || !u.instructorNumber) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Approve only after the user has completed the Instructor Course and received an instructor number (certified).",
          });
        }
      }

      await db
        .update(users)
        .set({
          instructorApprovedAt: input.approved ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));
      return { success: true as const };
    }),

  /**
   * Platform-admin ledger: training (`enrollments`) or ADF micro-course rows with user + course labels.
   * Supports CSV-style export via higher limit (capped).
   */
  getEnrollmentLedger: adminProcedure
    .input(
      z.object({
        variant: z.enum(["training", "micro"]).default("training"),
        userId: z.number().int().positive().optional(),
        search: z.string().max(200).optional(),
        programType: z
          .enum(["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver"])
          .optional(),
        limit: z.number().int().min(1).max(5000).default(100),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return input.variant === "micro"
          ? { variant: "micro" as const, rows: [], total: 0 }
          : { variant: "training" as const, rows: [], total: 0 };
      }

      const rawSearch = input.search?.trim().replace(/[%_\\]/g, "") ?? "";
      const searchPattern = rawSearch.length > 0 ? `%${rawSearch}%` : null;

      if (input.variant === "training") {
        const parts: SQL[] = [];
        if (input.userId !== undefined) parts.push(eq(enrollments.userId, input.userId));
        if (searchPattern) {
          const searchOr = or(like(users.email, searchPattern), like(users.name, searchPattern));
          if (searchOr) parts.push(searchOr);
        }
        if (input.programType) parts.push(eq(enrollments.programType, input.programType));
        const whereCombined =
          parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : and(...parts);

        const countBase = db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .innerJoin(users, eq(enrollments.userId, users.id));
        const countRow = await (whereCombined ? countBase.where(whereCombined) : countBase);
        const total = Number(countRow[0]?.count ?? 0);

        const listBase = db
          .select({
            enrollmentId: enrollments.id,
            userId: enrollments.userId,
            userEmail: users.email,
            userName: users.name,
            courseId: enrollments.courseId,
            courseTitle: courses.title,
            programType: enrollments.programType,
            paymentStatus: enrollments.paymentStatus,
            amountPaid: enrollments.amountPaid,
            cognitiveModulesComplete: enrollments.cognitiveModulesComplete,
            practicalSkillsSignedOff: enrollments.practicalSkillsSignedOff,
            trainingDate: enrollments.trainingDate,
            createdAt: enrollments.createdAt,
            updatedAt: enrollments.updatedAt,
          })
          .from(enrollments)
          .innerJoin(users, eq(enrollments.userId, users.id))
          .leftJoin(courses, eq(enrollments.courseId, courses.id));

        const pageRows = await (whereCombined ? listBase.where(whereCombined) : listBase)
          .orderBy(desc(enrollments.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const ids = pageRows.map((r) => r.enrollmentId);
        let certMap = new Map<
          number,
          { issueDate: Date | null; certificateNumber: string | null }
        >();
        if (ids.length > 0) {
          const certRows = await db
            .select({
              enrollmentId: certificates.enrollmentId,
              issueDate: certificates.issueDate,
              certificateNumber: certificates.certificateNumber,
            })
            .from(certificates)
            .where(inArray(certificates.enrollmentId, ids));
          for (const c of certRows) {
            const prev = certMap.get(c.enrollmentId);
            const curTs = c.issueDate ? new Date(c.issueDate).getTime() : 0;
            const prevTs = prev?.issueDate ? new Date(prev.issueDate).getTime() : -1;
            if (!prev || curTs >= prevTs) {
              certMap.set(c.enrollmentId, {
                issueDate: c.issueDate,
                certificateNumber: c.certificateNumber,
              });
            }
          }
        }

        const rows = pageRows.map((r) => {
          const cert = certMap.get(r.enrollmentId);
          let completionSummary = "In progress";
          if (cert?.issueDate) completionSummary = "Certificate issued";
          else if (r.practicalSkillsSignedOff && r.cognitiveModulesComplete)
            completionSummary = "Skills track complete (no cert row)";
          else if (r.cognitiveModulesComplete) completionSummary = "Cognitive complete";
          else if (r.paymentStatus === "pending") completionSummary = "Pending payment";

          return {
            kind: "training" as const,
            enrollmentId: r.enrollmentId,
            userId: r.userId,
            userEmail: r.userEmail,
            userName: r.userName,
            courseId: r.courseId,
            courseTitle: r.courseTitle,
            programType: r.programType,
            paymentStatus: r.paymentStatus,
            amountPaidCents: r.amountPaid,
            cognitiveModulesComplete: r.cognitiveModulesComplete,
            practicalSkillsSignedOff: r.practicalSkillsSignedOff,
            trainingDate: r.trainingDate,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            certificateIssuedAt: cert?.issueDate ?? null,
            certificateNumber: cert?.certificateNumber ?? null,
            completionSummary,
          };
        });

        return { variant: "training" as const, rows, total };
      }

      // micro variant
      const parts: SQL[] = [];
      if (input.userId !== undefined) parts.push(eq(microCourseEnrollments.userId, input.userId));
      if (searchPattern) {
        const searchOr = or(like(users.email, searchPattern), like(users.name, searchPattern));
        if (searchOr) parts.push(searchOr);
      }
      const whereCombined =
        parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : and(...parts);

      const countBase = db
        .select({ count: sql<number>`count(*)` })
        .from(microCourseEnrollments)
        .innerJoin(users, eq(microCourseEnrollments.userId, users.id))
        .innerJoin(microCourses, eq(microCourseEnrollments.microCourseId, microCourses.id));
      const countRow = await (whereCombined ? countBase.where(whereCombined) : countBase);
      const total = Number(countRow[0]?.count ?? 0);

      const listBase = db
        .select({
          microEnrollmentId: microCourseEnrollments.id,
          userId: microCourseEnrollments.userId,
          userEmail: users.email,
          userName: users.name,
          microCourseSku: microCourses.courseId,
          microCourseTitle: microCourses.title,
          enrollmentStatus: microCourseEnrollments.enrollmentStatus,
          paymentStatus: microCourseEnrollments.paymentStatus,
          progressPercentage: microCourseEnrollments.progressPercentage,
          quizScore: microCourseEnrollments.quizScore,
          completedAt: microCourseEnrollments.completedAt,
          certificateIssuedAt: microCourseEnrollments.certificateIssuedAt,
          createdAt: microCourseEnrollments.createdAt,
          updatedAt: microCourseEnrollments.updatedAt,
        })
        .from(microCourseEnrollments)
        .innerJoin(users, eq(microCourseEnrollments.userId, users.id))
        .innerJoin(microCourses, eq(microCourseEnrollments.microCourseId, microCourses.id));

      const rows = await (whereCombined ? listBase.where(whereCombined) : listBase)
        .orderBy(desc(microCourseEnrollments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        variant: "micro" as const,
        rows: rows.map((r) => ({
          kind: "micro" as const,
          microEnrollmentId: r.microEnrollmentId,
          userId: r.userId,
          userEmail: r.userEmail,
          userName: r.userName,
          microCourseSku: r.microCourseSku,
          microCourseTitle: r.microCourseTitle,
          enrollmentStatus: r.enrollmentStatus,
          paymentStatus: r.paymentStatus,
          progressPercentage: r.progressPercentage,
          quizScore: r.quizScore,
          completedAt: r.completedAt,
          certificateIssuedAt: r.certificateIssuedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total,
      };
    }),

  /**
   * Platform-admin view of denormalized fellowship pillar progress (`fellowshipProgress` + user identity).
   * Only users with a `fellowshipProgress` row appear (row is created when tracking starts).
   */
  getFellowshipProgressLedger: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive().optional(),
        search: z.string().max(200).optional(),
        qualifiedOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(5000).default(100),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { rows: [], total: 0 };
      }

      const rawSearch = input.search?.trim().replace(/[%_\\]/g, "") ?? "";
      const searchPattern = rawSearch.length > 0 ? `%${rawSearch}%` : null;

      const parts: SQL[] = [];
      if (input.userId !== undefined) parts.push(eq(fellowshipProgress.userId, input.userId));
      if (searchPattern) {
        const searchOr = or(like(users.email, searchPattern), like(users.name, searchPattern));
        if (searchOr) parts.push(searchOr);
      }
      if (input.qualifiedOnly) parts.push(eq(fellowshipProgress.isQualified, true));
      const whereCombined =
        parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : and(...parts);

      const countBase = db
        .select({ count: sql<number>`count(*)` })
        .from(fellowshipProgress)
        .innerJoin(users, eq(fellowshipProgress.userId, users.id));
      const countRow = await (whereCombined ? countBase.where(whereCombined) : countBase);
      const total = Number(countRow[0]?.count ?? 0);

      const listBase = db
        .select({
          fellowshipRowId: fellowshipProgress.id,
          userId: fellowshipProgress.userId,
          userEmail: users.email,
          userName: users.name,
          userType: users.userType,
          totalCoursesRequired: fellowshipProgress.totalCoursesRequired,
          coursesCompleted: fellowshipProgress.coursesCompleted,
          coursesPercentage: fellowshipProgress.coursesPercentage,
          resusGPSCasesCompleted: fellowshipProgress.resusGPSCasesCompleted,
          conditionsWithThreshold: fellowshipProgress.conditionsWithThreshold,
          totalConditionsTaught: fellowshipProgress.totalConditionsTaught,
          resusGPSPercentage: fellowshipProgress.resusGPSPercentage,
          careSignalStreak: fellowshipProgress.careSignalStreak,
          careSignalEventsSubmitted: fellowshipProgress.careSignalEventsSubmitted,
          careSignalPercentage: fellowshipProgress.careSignalPercentage,
          isQualified: fellowshipProgress.isQualified,
          qualifiedAt: fellowshipProgress.qualifiedAt,
          overallPercentage: fellowshipProgress.overallPercentage,
          createdAt: fellowshipProgress.createdAt,
          updatedAt: fellowshipProgress.updatedAt,
        })
        .from(fellowshipProgress)
        .innerJoin(users, eq(fellowshipProgress.userId, users.id));

      const rows = await (whereCombined ? listBase.where(whereCombined) : listBase)
        .orderBy(desc(fellowshipProgress.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      return { rows, total };
    }),

  /** Providers (individual) with no `fellowshipProgress` row — admin radar. */
  getFellowshipTrackingGaps: adminProcedure
    .input(
      z.object({
        search: z.string().max(200).optional(),
        withActivityOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return listProvidersWithoutFellowshipProgress({
        search: input.search,
        withActivityOnly: input.withActivityOnly,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  /** Recompute and upsert `fellowshipProgress` for one user or a batch. */
  recomputeFellowshipProgress: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
        onlyWithActivity: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      if (input.userId !== undefined) {
        const result = await syncFellowshipProgressForUser(input.userId);
        return {
          processed: 1,
          succeeded: 1,
          errors: [] as Array<{ userId: number; message: string }>,
          created: result.created,
        };
      }
      return syncFellowshipProgressBatch({
        limit: input.limit,
        offset: input.offset,
        onlyWithActivity: input.onlyWithActivity,
      });
    }),

  /** Platform ops snapshot: errors, payments, stuck enrollments, deployment hints. */
  getOpsHealthSnapshot: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        ok: false,
        deployment: {
          nodeEnv: ENV.isProduction ? "production" : "development",
          appBaseUrl: ENV.appBaseUrl || null,
          mpesaMode: getMpesaDeploymentMode(),
        },
        errors: { recent: [], newCount: 0, criticalCount: 0 },
        payments: { failedRecent: [], staleMpesaPendingCount: 0 },
        enrollments: { stuckPendingPayment: [] },
        support: { openTicketCount: 0 },
      };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentErrors, criticalErrors, failedPayments, staleMpesa, stuckEnrollments, openTickets] =
      await Promise.all([
        getRecentErrors(25),
        db
          .select({ id: errorTracking.id })
          .from(errorTracking)
          .where(
            and(
              eq(errorTracking.severity, "critical"),
              eq(errorTracking.status, "new")
            )
          ),
        db
          .select({
            id: payments.id,
            enrollmentId: payments.enrollmentId,
            userId: payments.userId,
            amount: payments.amount,
            status: payments.status,
            paymentMethod: payments.paymentMethod,
            transactionId: payments.transactionId,
            createdAt: payments.createdAt,
          })
          .from(payments)
          .where(and(eq(payments.status, "failed"), gte(payments.createdAt, sevenDaysAgo)))
          .orderBy(desc(payments.createdAt))
          .limit(50),
        db
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.status, "pending"),
              eq(payments.paymentMethod, "mpesa"),
              lt(payments.createdAt, twentyFourHoursAgo)
            )
          ),
        db
          .select({
            id: enrollments.id,
            userId: enrollments.userId,
            programType: enrollments.programType,
            paymentStatus: enrollments.paymentStatus,
            createdAt: enrollments.createdAt,
          })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.paymentStatus, "pending"),
              lt(enrollments.createdAt, fortyEightHoursAgo)
            )
          )
          .orderBy(desc(enrollments.createdAt))
          .limit(50),
        db
          .select({ id: supportTickets.id })
          .from(supportTickets)
          .where(eq(supportTickets.status, "open")),
      ]);

    return {
      ok: true,
      deployment: {
        nodeEnv: process.env.NODE_ENV ?? "development",
        appBaseUrl: ENV.appBaseUrl || process.env.APP_BASE_URL || null,
        mpesaMode: getMpesaDeploymentMode(),
        renderGitCommit: process.env.RENDER_GIT_COMMIT?.slice(0, 12) ?? null,
        stagingDocsPath: "docs/STAGING_BRANCH_SETUP.md",
      },
      errors: {
        recent: recentErrors.slice(0, 25),
        newCount: recentErrors.length,
        criticalCount: criticalErrors.length,
      },
      payments: {
        failedRecent: failedPayments,
        staleMpesaPendingCount: staleMpesa.length,
      },
      enrollments: {
        stuckPendingPayment: stuckEnrollments,
      },
      support: {
        openTicketCount: openTickets.length,
      },
    };
  }),

  /** M-Pesa / Daraja webhook audit log (forensics). */
  getMpesaWebhookLog: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(500).default(100),
        outcome: z
          .enum([
            "received",
            "signature_rejected",
            "invalid_payload",
            "duplicate_idempotency",
            "payment_not_found",
            "payment_completed",
            "payment_failed",
            "already_finalized",
            "persist_error",
            "acknowledged",
            "error",
          ])
          .optional(),
        checkoutRequestId: z.string().max(255).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rows: [] as typeof mpesaWebhookLog.$inferSelect[] };

      const filters: SQL[] = [];
      if (input.outcome) filters.push(eq(mpesaWebhookLog.outcome, input.outcome));
      if (input.checkoutRequestId?.trim()) {
        filters.push(eq(mpesaWebhookLog.checkoutRequestId, input.checkoutRequestId.trim()));
      }

      const rows = await db
        .select()
        .from(mpesaWebhookLog)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(mpesaWebhookLog.createdAt))
        .limit(input.limit);

      return { rows };
    }),

  /** Facilities with Care Signal activity (for platform QI dashboards). */
  listCareSignalFacilities: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(async ({ input }) => listCareSignalFacilities({ limit: input?.limit ?? 50 })),

  getFacilityCareSignalDashboard: adminProcedure
    .input(
      z.object({
        facilityName: z.string().min(1).max(255),
        lastDays: z.number().int().min(7).max(365).default(90),
      })
    )
    .query(async ({ input }) =>
      getFacilityCareSignalDashboard({
        facilityName: input.facilityName,
        lastDays: input.lastDays,
      })
    ),

  /** Recent automated platform alert dispatches (dedupe audit). */
  getAdminAlertDispatches: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(30) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rows: [] as typeof adminAlertDispatches.$inferSelect[] };
      const rows = await db
        .select()
        .from(adminAlertDispatches)
        .orderBy(desc(adminAlertDispatches.createdAt))
        .limit(input?.limit ?? 30);
      return { rows };
    }),

  /** Manually run platform ops alert rules (same as hourly cron). */
  runAdminOpsAlertsNow: adminProcedure.mutation(async () => runAdminOpsAlerts()),

  /**
   * One-time migration: replace files.manuscdn.com CDN URLs with self-hosted
   * /assets/course-images/ paths in all moduleSections content.
   * Safe to run multiple times (idempotent).
   */
  runImageMigration: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const CDN_BASE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/';
    const URL_MAP: Record<string, string> = {
      'uPVOEVMtdNNCAFxJ.jpg':  '/assets/course-images/AdultBLSAlgorithmHCP.jpg',
      'JRhqhPQjUavvvnTi.jpg':  '/assets/course-images/AdultBLSCircular.jpg',
      'dlVFAvOxSQtIQAhD.jpg':  '/assets/course-images/HeadTiltChinLift.jpg',
      'bFYHIRnhYRSgoLLr.jpg':  '/assets/course-images/SingleRescuer.jpg',
      'OiYeNjGHMerXxnuo.jpg':  '/assets/course-images/TwoRescuer.jpg',
      'zQTJdmBosnHpHqBa.jpg':  '/assets/course-images/PadPlacement.jpg',
      'EbUetJWLdlcFLPmd.jpg':  '/assets/course-images/AdultFBAO.jpg',
      'OppQyzCIqrmgrqWy.jpg':  '/assets/course-images/BLSTermination.jpg',
      'WMAFDEebhxuLTSvW.jpg':  '/assets/course-images/AdultCAAlgorithm.jpg',
      'iqTAFIaeCgYxlqIE.jpg':  '/assets/course-images/AdultCACircular.jpg',
      'RxhFLJoAuwgNJyEN.jpg':  '/assets/course-images/AdultBradycardia.jpg',
      'siCbDpWmTQthWUzd.jpg':  '/assets/course-images/AdultTachycardia.jpg',
      'UchZBrALpalLmnEq.webp': '/assets/course-images/ElectricalCardioversion.webp',
      'unzmuRCvlBKLAZbp.jpg':  '/assets/course-images/AdvancedAirway.jpg',
      'qbHRuEaQatfuaYHh.jpg':  '/assets/course-images/ALSTermination.jpg',
    };

    // Use Drizzle ORM like() — avoids MySQL parameterized LIKE escaping bug
    const cdnRows = await db
      .select({ id: moduleSections.id, content: moduleSections.content })
      .from(moduleSections)
      .where(like(moduleSections.content, '%files.manuscdn.com%'));

    if (!Array.isArray(cdnRows) || cdnRows.length === 0) {
      return { success: true, updated: 0, message: 'Already migrated — no CDN URLs found' };
    }

    let updated = 0;
    for (const row of cdnRows as any[]) {
      let newContent: string = row.content;
      let changed = false;
      for (const [filename, localPath] of Object.entries(URL_MAP)) {
        const cdnUrl = CDN_BASE + filename;
        if (newContent.includes(cdnUrl)) {
          newContent = newContent.split(cdnUrl).join(localPath);
          changed = true;
        }
      }
      if (changed) {
        await db.update(moduleSections)
          .set({ content: newContent })
          .where(eq(moduleSections.id, row.id));
        updated++;
      }
    }
    return { success: true, updated, message: `Migrated ${updated} sections to self-hosted images` };
  }),
});
