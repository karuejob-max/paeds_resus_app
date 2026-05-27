/**
 * Care Signal anti-gaming guards (PSOT / CARE_SIGNAL_STRATEGY §9.5).
 * Max 5 eligible submissions per user per EAT calendar day; duplicate detection within 10 minutes.
 */

export const CARE_SIGNAL_MAX_SUBMISSIONS_PER_USER_PER_DAY = 5;
export const CARE_SIGNAL_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export type RecentCareSignalRow = {
  eventDate: Date;
  eventType: string;
  childAge: number | null;
  createdAt: Date;
};

export type CareSignalSubmissionInput = {
  eventDate: string;
  eventType: string;
  childAge: number;
};

export type CareSignalGuardResult =
  | { allowed: true }
  | { allowed: false; reason: "rate_limit" | "duplicate" };

/** Start of the current calendar day in EAT (UTC+3), as a UTC Date. */
export function startOfTodayEAT(now = new Date()): Date {
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth(), eat.getUTCDate(), -3, 0, 0, 0)
  );
}

export function countSubmissionsSince(
  rows: RecentCareSignalRow[],
  since: Date
): number {
  return rows.filter((r) => new Date(r.createdAt) >= since).length;
}

export function isDuplicateCareSignalSubmission(
  existing: RecentCareSignalRow,
  input: CareSignalSubmissionInput,
  now = new Date()
): boolean {
  const createdAt = new Date(existing.createdAt);
  if (now.getTime() - createdAt.getTime() > CARE_SIGNAL_DUPLICATE_WINDOW_MS) {
    return false;
  }
  if (existing.eventType !== input.eventType) return false;
  if ((existing.childAge ?? -1) !== input.childAge) return false;
  const existingEventDate = new Date(existing.eventDate).getTime();
  const inputEventDate = new Date(input.eventDate).getTime();
  return Math.abs(existingEventDate - inputEventDate) < 60_000;
}

export function evaluateCareSignalSubmissionGuard(
  recentRows: RecentCareSignalRow[],
  input: CareSignalSubmissionInput,
  now = new Date()
): CareSignalGuardResult {
  const todayStart = startOfTodayEAT(now);
  const todayCount = countSubmissionsSince(recentRows, todayStart);
  if (todayCount >= CARE_SIGNAL_MAX_SUBMISSIONS_PER_USER_PER_DAY) {
    return { allowed: false, reason: "rate_limit" };
  }

  const duplicate = recentRows.some((row) => isDuplicateCareSignalSubmission(row, input, now));
  if (duplicate) {
    return { allowed: false, reason: "duplicate" };
  }

  return { allowed: true };
}
