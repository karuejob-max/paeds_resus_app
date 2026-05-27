import { and, eq, lt, lte } from "drizzle-orm";
import {
  adminAuditLog,
  analyticsEvents,
  legalDataRequests,
  resusGPSCases,
} from "../../drizzle/schema";
import type { DbClient } from "../db";

/** Retention windows from DATA_RETENTION_SCHEDULE.md (engineering baseline). */
export const RETENTION_WINDOWS = {
  analyticsRawMonths: 13,
  adminAuditLogDays: 90,
  dsarTicketsYears: 3,
  resusGpsCasesMonths: 24,
} as const;

export type RetentionCategory = {
  category: string;
  table: string;
  cutoff: Date;
  eligibleCount: number;
  action: string;
};

export type RetentionCleanupPlan = {
  generatedAt: string;
  categories: RetentionCategory[];
  totalEligible: number;
};

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export async function buildRetentionCleanupPlan(db: DbClient): Promise<RetentionCleanupPlan> {
  const analyticsCutoff = monthsAgo(RETENTION_WINDOWS.analyticsRawMonths);
  const auditCutoff = daysAgo(RETENTION_WINDOWS.adminAuditLogDays);
  const dsarCutoff = yearsAgo(RETENTION_WINDOWS.dsarTicketsYears);
  const resusCutoff = monthsAgo(RETENTION_WINDOWS.resusGpsCasesMonths);

  const [analyticsRows, auditRows, dsarRows, resusRows] = await Promise.all([
    db.select({ id: analyticsEvents.id }).from(analyticsEvents).where(lt(analyticsEvents.createdAt, analyticsCutoff)),
    db.select({ id: adminAuditLog.id }).from(adminAuditLog).where(lt(adminAuditLog.createdAt, auditCutoff)),
    db
      .select({ id: legalDataRequests.id })
      .from(legalDataRequests)
      .where(
        and(eq(legalDataRequests.status, "completed"), lte(legalDataRequests.resolvedAt, dsarCutoff))
      ),
    db.select({ id: resusGPSCases.id }).from(resusGPSCases).where(lt(resusGPSCases.createdAt, resusCutoff)),
  ]);

  const categories: RetentionCategory[] = [
    {
      category: "Analytics raw",
      table: "analyticsEvents",
      cutoff: analyticsCutoff,
      eligibleCount: analyticsRows.length,
      action: "delete rows older than 13 months",
    },
    {
      category: "Admin audit log",
      table: "adminAuditLog",
      cutoff: auditCutoff,
      eligibleCount: auditRows.length,
      action: "delete rows older than 90 days",
    },
    {
      category: "DSAR tickets (closed)",
      table: "legalDataRequests",
      cutoff: dsarCutoff,
      eligibleCount: dsarRows.length,
      action: "delete completed requests older than 3 years",
    },
    {
      category: "ResusGPS saved cases",
      table: "resusGPSCases",
      cutoff: resusCutoff,
      eligibleCount: resusRows.length,
      action: "delete cases older than 24 months",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    categories,
    totalEligible: categories.reduce((sum, c) => sum + c.eligibleCount, 0),
  };
}

export type RetentionCleanupResult = {
  dryRun: boolean;
  deleted: Record<string, number>;
};

export async function runRetentionCleanup(
  db: DbClient,
  options: { dryRun: boolean }
): Promise<RetentionCleanupResult> {
  const plan = await buildRetentionCleanupPlan(db);
  const deleted: Record<string, number> = {};

  if (options.dryRun) {
    for (const cat of plan.categories) {
      deleted[cat.table] = cat.eligibleCount;
    }
    return { dryRun: true, deleted };
  }

  for (const cat of plan.categories) {
    if (cat.eligibleCount === 0) {
      deleted[cat.table] = 0;
      continue;
    }

    if (cat.table === "analyticsEvents") {
      await db.delete(analyticsEvents).where(lt(analyticsEvents.createdAt, cat.cutoff));
    } else if (cat.table === "adminAuditLog") {
      await db.delete(adminAuditLog).where(lt(adminAuditLog.createdAt, cat.cutoff));
    } else if (cat.table === "legalDataRequests") {
      await db
        .delete(legalDataRequests)
        .where(
          and(eq(legalDataRequests.status, "completed"), lte(legalDataRequests.resolvedAt, cat.cutoff))
        );
    } else if (cat.table === "resusGPSCases") {
      await db.delete(resusGPSCases).where(lt(resusGPSCases.createdAt, cat.cutoff));
    }

    deleted[cat.table] = cat.eligibleCount;
  }

  return { dryRun: false, deleted };
}
