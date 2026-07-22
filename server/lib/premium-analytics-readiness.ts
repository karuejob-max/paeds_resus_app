/**
 * Premium Analytics launch-gate readiness check.
 *
 * Gap-analysis (2026-07-19, structural gap flagged during a platform-wide
 * audit): FINANCIAL_STRATEGY_V1.md §4.2 sets an explicit precondition
 * before Business 2's Premium Analytics add-on can launch — "10+
 * facilities contributing Care Signal data consistently for 6+ months."
 * Gap-analysis queue item #12(b) correctly parked the paywall itself
 * against this threshold (CEO decision, 2026-07-17), but until now there
 * was no code anywhere that actually counted contributing facilities or
 * checked the 6-month consistency window — the threshold lived only in a
 * human's judgment call, re-derived from memory each time someone asked.
 *
 * This is a read-only query, not a gate. It doesn't block or unlock
 * anything by itself — Business 2(b) stays parked until the CEO revisits
 * it. What this removes is the need to re-derive "are we there yet?" from
 * memory each time; it's now an actual, checkable fact.
 *
 * DEFINITIONAL CHOICE, FLAGGED NOT HIDDEN: §4.2's own text does not define
 * "contributing ... consistently" precisely — it names the two numbers
 * (10 facilities, 6 months) but not what counts as a qualifying month for
 * a given facility. This implementation defines "consistent" as: the
 * facility has at least one Care Signal event in every one of the last 6
 * complete calendar months (the current partial month is excluded from
 * the streak calculation, so a facility can't get credit for a single
 * event on the 1st of the current month). This is the most literal reading
 * of "contributing ... for 6+ months" available without further guidance;
 * if the CEO or a future financial-strategy revision wants a different
 * definition (e.g. a rolling 6-month window regardless of calendar-month
 * boundaries, or a minimum event count per month rather than "any"), this
 * is the one function to change — `isConsistentContributor` below.
 *
 * Deliberately excludes: facility identity/ownership disclosure (this
 * mirrors the existing ≥5-event anonymisation convention used elsewhere in
 * this codebase for platform-wide aggregates — ANONYMIZATION_THRESHOLD in
 * admin-stats.ts) is not applied here because this query is admin-only and
 * internal (strategic readiness, not a public or institutional-facing
 * metric) — full facility names are shown to the CEO/admin caller only.
 */
import { and, gte, isNull, sql } from "drizzle-orm";
import type { DbClient } from "../db";
import { careFacilities, careSignalEvents } from "../../drizzle/schema";

/** §4.2's literal launch-gate numbers. */
export const PREMIUM_ANALYTICS_FACILITY_COUNT_THRESHOLD = 10;
export const PREMIUM_ANALYTICS_CONSISTENCY_MONTHS = 6;

export interface FacilityContributionRow {
  facilityId: number;
  facilityName: string;
  /** Distinct calendar months (of the last N) with at least one event. */
  monthsWithActivity: number;
  /** True only if every one of the last N complete calendar months has ≥1 event. */
  isConsistentContributor: boolean;
  totalEventsInWindow: number;
  firstEventAt: Date | null;
  lastEventAt: Date | null;
}

export interface PremiumAnalyticsReadiness {
  ready: boolean;
  facilityCountThreshold: number;
  consistencyMonths: number;
  consistentContributorCount: number;
  totalContributingFacilityCount: number;
  facilities: FacilityContributionRow[];
  checkedAt: Date;
  windowStart: Date;
  windowEnd: Date;
  /** Human-readable one-line summary, safe to surface directly in a UI or WORK_STATUS entry. */
  summary: string;
}

/**
 * Returns the start of the current calendar month (local server time) —
 * the boundary excluding the in-progress partial month from the
 * consistency streak, per the definitional choice documented above.
 */
function startOfCurrentMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export async function getPremiumAnalyticsReadiness(
  db: DbClient,
  opts: { now?: Date } = {}
): Promise<PremiumAnalyticsReadiness> {
  const now = opts.now ?? new Date();
  const windowEnd = startOfCurrentMonth(now); // exclude the current partial month
  const windowStart = new Date(windowEnd);
  windowStart.setMonth(windowStart.getMonth() - PREMIUM_ANALYTICS_CONSISTENCY_MONTHS);

  // One query: every non-merged facility with ≥1 Care Signal event inside
  // the window, plus a per-calendar-month distinct-activity count computed
  // in SQL (portable via DATE_FORMAT, avoids pulling every row into JS).
  const rows = await db
    .select({
      facilityId: careSignalEvents.facilityId,
      facilityName: careFacilities.name,
      monthsWithActivity: sql<number>`COUNT(DISTINCT DATE_FORMAT(${careSignalEvents.createdAt}, '%Y-%m'))`,
      totalEventsInWindow: sql<number>`COUNT(*)`,
      firstEventAt: sql<Date | null>`MIN(${careSignalEvents.createdAt})`,
      lastEventAt: sql<Date | null>`MAX(${careSignalEvents.createdAt})`,
    })
    .from(careSignalEvents)
    .innerJoin(careFacilities, sql`${careSignalEvents.facilityId} = ${careFacilities.id}`)
    .where(
      and(
        gte(careSignalEvents.createdAt, windowStart),
        sql`${careSignalEvents.createdAt} < ${windowEnd}`,
        isNull(careFacilities.mergedIntoId)
      )
    )
    .groupBy(careSignalEvents.facilityId, careFacilities.name);

  const facilities: FacilityContributionRow[] = rows
    .filter((r) => r.facilityId !== null)
    .map((r) => ({
      facilityId: r.facilityId as number,
      facilityName: r.facilityName,
      monthsWithActivity: Number(r.monthsWithActivity),
      // "Every one of the last N complete calendar months" — a facility
      // that only shows up in 4 of the 6 months (e.g. skipped two) does
      // NOT count, even though its raw total-months-with-activity could
      // coincidentally equal N if it started reporting mid-window. This
      // check is deliberately the count itself, since the window is fixed
      // at exactly N calendar months and a facility can appear in at most
      // one row per month by construction of the GROUP BY.
      isConsistentContributor: Number(r.monthsWithActivity) >= PREMIUM_ANALYTICS_CONSISTENCY_MONTHS,
      totalEventsInWindow: Number(r.totalEventsInWindow),
      firstEventAt: r.firstEventAt ? new Date(r.firstEventAt) : null,
      lastEventAt: r.lastEventAt ? new Date(r.lastEventAt) : null,
    }))
    .sort((a, b) => b.monthsWithActivity - a.monthsWithActivity || b.totalEventsInWindow - a.totalEventsInWindow);

  const consistentContributorCount = facilities.filter((f) => f.isConsistentContributor).length;
  const ready = consistentContributorCount >= PREMIUM_ANALYTICS_FACILITY_COUNT_THRESHOLD;

  const summary = ready
    ? `Ready: ${consistentContributorCount} facilities have contributed Care Signal data in every one of the last ${PREMIUM_ANALYTICS_CONSISTENCY_MONTHS} months (threshold: ${PREMIUM_ANALYTICS_FACILITY_COUNT_THRESHOLD}). §4.2's launch precondition is met — this does not auto-launch anything; it's a CEO decision to revisit item #12(b).`
    : `Not yet: ${consistentContributorCount} of ${PREMIUM_ANALYTICS_FACILITY_COUNT_THRESHOLD} needed facilities have contributed Care Signal data in every one of the last ${PREMIUM_ANALYTICS_CONSISTENCY_MONTHS} months. ${facilities.length} facilities have contributed at least once in the window.`;

  return {
    ready,
    facilityCountThreshold: PREMIUM_ANALYTICS_FACILITY_COUNT_THRESHOLD,
    consistencyMonths: PREMIUM_ANALYTICS_CONSISTENCY_MONTHS,
    consistentContributorCount,
    totalContributingFacilityCount: facilities.length,
    facilities,
    checkedAt: now,
    windowStart,
    windowEnd,
    summary,
  };
}
