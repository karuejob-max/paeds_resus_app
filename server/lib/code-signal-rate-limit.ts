/**
 * Code Signal anti-gaming guard — same shape as Care Signal's
 * (server/lib/care-signal-rate-limit.ts), but keyed on conditionCategory
 * instead of childAge, since Code Signal has no age field.
 */

export const CODE_SIGNAL_MAX_SUBMISSIONS_PER_USER_PER_DAY = 5;
export const CODE_SIGNAL_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export type RecentCodeSignalRow = {
  eventDate: Date;
  conditionCategory: string;
  createdAt: Date;
};

export type CodeSignalSubmissionInput = {
  eventDate: string;
  conditionCategory: string;
};

export type CodeSignalGuardResult =
  | { allowed: true }
  | { allowed: false; reason: "rate_limit" | "duplicate" };

export function startOfTodayEAT(now = new Date()): Date {
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth(), eat.getUTCDate(), -3, 0, 0, 0)
  );
}

export function countSubmissionsSince(rows: RecentCodeSignalRow[], since: Date): number {
  return rows.filter((r) => new Date(r.createdAt) >= since).length;
}

export function isDuplicateCodeSignalSubmission(
  existing: RecentCodeSignalRow,
  input: CodeSignalSubmissionInput,
  now = new Date()
): boolean {
  const createdAt = new Date(existing.createdAt);
  if (now.getTime() - createdAt.getTime() > CODE_SIGNAL_DUPLICATE_WINDOW_MS) return false;
  if (existing.conditionCategory !== input.conditionCategory) return false;
  const existingEventDate = new Date(existing.eventDate).getTime();
  const inputEventDate = new Date(input.eventDate).getTime();
  return Math.abs(existingEventDate - inputEventDate) < 60_000;
}

export function evaluateCodeSignalSubmissionGuard(
  recentRows: RecentCodeSignalRow[],
  input: CodeSignalSubmissionInput,
  now = new Date()
): CodeSignalGuardResult {
  const since = startOfTodayEAT(now);
  if (countSubmissionsSince(recentRows, since) >= CODE_SIGNAL_MAX_SUBMISSIONS_PER_USER_PER_DAY) {
    return { allowed: false, reason: "rate_limit" };
  }
  if (recentRows.some((r) => isDuplicateCodeSignalSubmission(r, input, now))) {
    return { allowed: false, reason: "duplicate" };
  }
  return { allowed: true };
}
