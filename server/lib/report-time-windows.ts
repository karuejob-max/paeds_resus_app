/**
 * Admin report time windows aligned with PLATFORM_SOURCE_OF_TRUTH.md §8:
 * "Last 7 days" = rolling 7×24 hours from "now" — not calendar midnight.
 */
export function rollingHoursAgo(lastDays: number): Date {
  if (!Number.isFinite(lastDays) || lastDays < 1 || lastDays > 366) {
    throw new Error("lastDays must be between 1 and 366");
  }
  return new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000);
}
