import { and, eq } from "drizzle-orm";
import { institutionalAccounts, users } from "../../drizzle/schema";
import type { AppDb } from "../lib/institution-access";
import { generateInstitutionExecutiveReport, periodBounds, type PeriodType } from "../routers/institution-performance";

type ScheduledPeriod = { periodType: PeriodType; periodStart: string };

function eatDateKey(date: Date): string {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Closed periods only: previous month, previous quarter, and previous calendar year. */
export function scheduledInstitutionalPeriods(now = new Date()): ScheduledPeriod[] {
  const eatNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const year = eatNow.getUTCFullYear();
  const month = eatNow.getUTCMonth();
  return [
    { periodType: "monthly", periodStart: eatDateKey(new Date(Date.UTC(year, month - 1, 1) - 3 * 60 * 60 * 1000)) },
    { periodType: "quarterly", periodStart: eatDateKey(new Date(Date.UTC(year, Math.floor(month / 3) * 3 - 3, 1) - 3 * 60 * 60 * 1000)) },
    { periodType: "annual", periodStart: eatDateKey(new Date(Date.UTC(year - 1, 0, 1) - 3 * 60 * 60 * 1000)) },
  ];
}

export async function runScheduledInstitutionalPerformanceReports(db: AppDb, now = new Date()) {
  const accounts = await db
    .select()
    .from(institutionalAccounts)
    .innerJoin(users, eq(users.id, institutionalAccounts.userId))
    .where(eq(institutionalAccounts.status, "active"));
  const periods = scheduledInstitutionalPeriods(now);
  const result = { accounts: accounts.length, attempted: 0, generated: 0, existing: 0, skippedUnavailable: 0, failed: 0 };
  for (const row of accounts) {
    for (const period of periods) {
      result.attempted += 1;
      try {
        const report = await generateInstitutionExecutiveReport(
          db,
          row.users,
          { institutionId: row.institutionalAccounts.id, periodType: period.periodType, periodStart: period.periodStart, scopeType: "institution" },
          { automated: true },
        );
        if ("skipped" in report && report.skipped) result.skippedUnavailable += 1;
        else if ("generatedByUserId" in report && report.generatedByUserId == null) result.generated += 1;
        else result.existing += 1;
      } catch (error) {
        result.failed += 1;
        console.error(`[Scheduler] institutional performance report failed institution=${row.institutionalAccounts.id} period=${period.periodType}:${period.periodStart}`, error);
      }
    }
  }
  return result;
}

export { periodBounds };
