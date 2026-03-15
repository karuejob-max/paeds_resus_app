import { z } from "zod";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  enrollments,
  certificates,
  analyticsEvents,
  parentSafeTruthSubmissions,
} from "../../drizzle/schema";

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

function daysAgo(days: number) {
  const x = new Date();
  x.setDate(x.getDate() - days);
  x.setUTCHours(0, 0, 0, 0);
  return x;
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
          activeUsersLastDays: 0,
          analyticsLastDays: { count: 0, eventTypes: [] as { eventType: string; count: number }[] },
        };
      }

      const now = new Date();
      const year = input?.year ?? now.getFullYear();
      const month = input?.month ?? now.getMonth() + 1;
      const periodStart = startOfMonth(new Date(year, month - 1, 1));
      const periodEnd = endOfMonth(new Date(year, month - 1, 1));
      const lastDays = input?.lastDays ?? 7;
      const analyticsSince = daysAgo(lastDays);

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

      // Analytics (ResusGPS / app usage) in last N days
      const analyticsInPeriod = await db
        .select({
          eventType: analyticsEvents.eventType,
          eventName: analyticsEvents.eventName,
          userId: analyticsEvents.userId,
        })
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, analyticsSince));
      const eventCounts: Record<string, number> = {};
      const uniqueUserIds = new Set<number>();
      analyticsInPeriod.forEach((e) => {
        const key = e.eventType || e.eventName || "other";
        eventCounts[key] = (eventCounts[key] || 0) + 1;
        if (e.userId) uniqueUserIds.add(e.userId);
      });
      const eventTypes = Object.entries(eventCounts).map(([eventType, count]) => ({
        eventType,
        count,
      }));
      const activeUsersLastDays = uniqueUserIds.size;

      return {
        ok: true,
        periodLabel: `${periodStart.toLocaleString("default", { month: "long" })} ${year}`,
        lastDaysLabel: `Last ${lastDays} days`,
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
        parentSafeTruthThisMonth,
        activeUsersLastDays,
        analyticsLastDays: {
          count: analyticsInPeriod.length,
          eventTypes: eventTypes.sort((a, b) => b.count - a.count).slice(0, 15),
        },
      };
    }),

  /** List registered users (admin only); optional filter by userType. */
  getUsers: adminProcedure
    .input(
      z.object({
        userType: z.enum(["individual", "parent", "institutional"]).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { users: [], total: 0 };
      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;

      const where = input?.userType ? eq(users.userType, input.userType) : undefined;
      let listQuery = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
      if (where) listQuery = listQuery.where(where);
      const result = await listQuery;

      let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);
      if (where) countQuery = countQuery.where(where);
      const countResult = await countQuery;
      const total = Number(countResult[0]?.count ?? 0);

      return { users: result, total };
    }),
});
