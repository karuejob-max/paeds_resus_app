import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, like, lte, or, sql, type SQL } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  enrollments,
  certificates,
  analyticsEvents,
  parentSafeTruthSubmissions,
  clinicalReferrals,
  adminAuditLog,
} from "../../drizzle/schema";
import { rollingHoursAgo } from "../lib/report-time-windows";

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
      const eventCounts: Record<string, number> = {};
      analyticsInPeriod.forEach((e) => {
        const key = e.eventType || e.eventName || "other";
        eventCounts[key] = (eventCounts[key] || 0) + 1;
      });
      const eventTypes = Object.entries(eventCounts).map(([eventType, count]) => ({
        eventType,
        count,
      }));

      const resusCounts: Record<string, number> = {};
      analyticsInPeriod.forEach((e) => {
        const key = (e.eventType || e.eventName || "").toString();
        if (!key.startsWith("resus_")) return;
        const bucket = e.eventType || e.eventName || "resus_other";
        resusCounts[bucket] = (resusCounts[bucket] || 0) + 1;
      });
      const resusGpsAnalyticsLastDays = {
        totalEvents: Object.values(resusCounts).reduce((a, b) => a + b, 0),
        eventTypes: Object.entries(resusCounts)
          .map(([eventType, count]) => ({ eventType, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
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
        analyticsLastDays: {
          count: analyticsInPeriod.length,
          eventTypes: eventTypes.sort((a, b) => b.count - a.count).slice(0, 15),
        },
        resusGpsAnalyticsLastDays,
        activeUsersLastDays,
        topProtocolsViewed,
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
});
