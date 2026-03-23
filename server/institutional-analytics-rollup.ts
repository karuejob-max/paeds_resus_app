/**
 * INST-14: Roll up staff + incident metrics into `institutionalAnalytics` (nightly or on-demand).
 */
import { eq, count, avg } from "drizzle-orm";
import { getDb } from "./db";
import {
  institutionalAccounts,
  institutionalStaffMembers,
  incidents,
  institutionalAnalytics,
} from "../drizzle/schema";

export async function rollupInstitutionalAnalyticsForAccount(institutionalAccountId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const staffRows = await db
    .select()
    .from(institutionalStaffMembers)
    .where(eq(institutionalStaffMembers.institutionalAccountId, institutionalAccountId));

  const totalStaff = staffRows.length;
  const totalStaffEnrolled = staffRows.filter(
    (s) => s.enrollmentStatus === "enrolled" || s.enrollmentStatus === "in_progress" || s.enrollmentStatus === "completed"
  ).length;
  const totalStaffCertified = staffRows.filter((s) => s.certificationStatus === "certified").length;
  const certificationRate =
    totalStaff > 0 ? Math.round((totalStaffCertified / totalStaff) * 100) : 0;

  let averageCompletionTime: number | null = null;
  const completedWithDates = staffRows.filter(
    (s) => s.enrollmentStatus === "completed" && s.enrollmentDate && s.completionDate
  );
  if (completedWithDates.length > 0) {
    const sumDays = completedWithDates.reduce((acc, s) => {
      const start = new Date(s.enrollmentDate!).getTime();
      const end = new Date(s.completionDate!).getTime();
      const days = Math.max(0, Math.round((end - start) / (86400 * 1000)));
      return acc + days;
    }, 0);
    averageCompletionTime = Math.round(sumDays / completedWithDates.length);
  }

  const [incCountRow] = await db
    .select({ c: count() })
    .from(incidents)
    .where(eq(incidents.institutionalAccountId, institutionalAccountId));
  const incidentsHandled = Number(incCountRow?.c ?? 0);

  const [avgRtRow] = await db
    .select({ a: avg(incidents.responseTime) })
    .from(incidents)
    .where(eq(incidents.institutionalAccountId, institutionalAccountId));
  const avgRt = avgRtRow?.a;
  const averageResponseTime =
    avgRt !== null && avgRt !== undefined ? Math.round(Number(avgRt)) : null;

  const livesImprovedEstimate = incidentsHandled;

  const now = new Date();

  await db
    .insert(institutionalAnalytics)
    .values({
      institutionalAccountId,
      totalStaffEnrolled,
      totalStaffCertified,
      averageCompletionTime,
      certificationRate,
      incidentsHandled,
      livesImprovedEstimate,
      averageResponseTime,
      survivalRateImprovement: null,
      systemGapsResolved: 0,
      lastUpdated: now,
      createdAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        totalStaffEnrolled,
        totalStaffCertified,
        averageCompletionTime,
        certificationRate,
        incidentsHandled,
        livesImprovedEstimate,
        averageResponseTime,
        lastUpdated: now,
      },
    });
}

export async function rollupAllInstitutionalAccounts(): Promise<{ updated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accounts = await db.select({ id: institutionalAccounts.id }).from(institutionalAccounts);
  for (const row of accounts) {
    await rollupInstitutionalAnalyticsForAccount(row.id);
  }
  return { updated: accounts.length };
}
