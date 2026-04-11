/**
 * Care Signal pillar (Pillar C) — consecutive qualifying months toward 24 (PSoT §17.3).
 * Walks a forward timeline (oldest → newest) so grace/catch-up pairs follow calendar order.
 */

export function monthKeyEAT(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Last `count` calendar months ending at (anchorYear, anchorMonth), oldest first. */
export function enumerateMonthsEndingAt(
  anchorYear: number,
  anchorMonth: number,
  count: number
): string[] {
  const keys: string[] = [];
  let y = anchorYear;
  let m = anchorMonth;
  for (let i = 0; i < count; i++) {
    keys.unshift(monthKeyEAT(y, m));
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return keys;
}

export type FellowshipGraceRow = { year: number; month: number };

/**
 * Current Care Signal streak: consecutive qualifying months at the end of the window,
 * capped at 24. Qualifying rules (PSoT §17.3 / FELLOWSHIP doc §7):
 * - Normal month: ≥1 eligible event.
 * - Recorded grace month (0 events, counted in DB): streak continues; next month must be catch-up (≥3).
 * - Unrecorded 0-event month: first/second failure may consume an implicit grace if &lt;2 graces used that calendar year; then next month is catch-up.
 * - Third failure in a row without recovery → streak resets to 0.
 */
export function computeCareSignalStreak(params: {
  eventsByMonth: Record<string, number>;
  graceUsage: FellowshipGraceRow[];
  anchorYear: number;
  anchorMonth: number;
  /** Default 24 (rolling fellowship window). Use a smaller value only in unit tests. */
  windowMonths?: number;
}): number {
  const {
    eventsByMonth,
    graceUsage,
    anchorYear,
    anchorMonth,
    windowMonths = 24,
  } = params;

  const recordedGraceKey = new Set(
    graceUsage.map((g) => monthKeyEAT(g.year, g.month))
  );
  const dbGraceCountByYear: Record<number, number> = {};
  for (const g of graceUsage) {
    dbGraceCountByYear[g.year] = (dbGraceCountByYear[g.year] ?? 0) + 1;
  }

  const keys = enumerateMonthsEndingAt(anchorYear, anchorMonth, windowMonths);
  const implicitByYear: Record<number, number> = {};

  function gracesForYear(y: number): number {
    return (dbGraceCountByYear[y] ?? 0) + (implicitByYear[y] ?? 0);
  }

  let pendingCatchUp = false;
  let failureCount = 0;
  let streak = 0;

  for (const key of keys) {
    const y = Number(key.slice(0, 4));
    const ev = eventsByMonth[key] ?? 0;
    const recorded = recordedGraceKey.has(key);

    if (pendingCatchUp) {
      if (ev >= 3) {
        streak += 1;
        pendingCatchUp = false;
        failureCount = 0;
      } else {
        streak = 0;
        pendingCatchUp = false;
      }
      continue;
    }

    if (recorded) {
      streak += 1;
      pendingCatchUp = true;
      failureCount = 0;
      continue;
    }

    if (ev >= 1) {
      streak += 1;
      failureCount = 0;
      continue;
    }

    // 0 events, no recorded grace row for this month
    failureCount += 1;
    if (failureCount >= 3) {
      streak = 0;
      failureCount = 0;
      continue;
    }

    if (gracesForYear(y) < 2) {
      streak += 1;
      pendingCatchUp = true;
      implicitByYear[y] = (implicitByYear[y] ?? 0) + 1;
      failureCount = 0;
    } else {
      streak = 0;
    }
  }

  return Math.min(streak, 24);
}
