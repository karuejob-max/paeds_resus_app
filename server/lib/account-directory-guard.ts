/**
 * Guards for the platform-wide account search (institution.searchPlatformAccounts).
 *
 * The search exists so an institution creator or admin can pick a colleague as a
 * co-admin. It was open to every signed-in user and returned full names and emails,
 * which made it a directory-harvesting tool. This module (a) rate-limits it per
 * user and (b) masks email addresses unless the caller typed the complete address.
 *
 * Rate limiting is DELIBERATELY IN-MEMORY (same trade-off as safe-truth-rate-limit.ts:
 * single-instance deployment; each instance would keep its own counter if scaled out).
 * It raises the cost of harvesting but does not stop someone with many accounts.
 * The permanent fix is to stop offering a directory at all and invite by exact email
 * with the invitee's acceptance (tracked as a follow-up in docs/INSTITUTION_ONBOARDING_HARDENING.md).
 */

export const ACCOUNT_SEARCH_MAX_PER_MINUTE = 40;
export const ACCOUNT_SEARCH_MAX_PER_DAY = 400;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const searchesByUser = new Map<number, number[]>();

/** Returns true if the user is under both limits; records the attempt only when allowed. */
export function checkAccountSearchRateLimit(userId: number, now: number = Date.now()): boolean {
  const recent = (searchesByUser.get(userId) ?? []).filter((t) => t > now - DAY_MS);
  const lastMinute = recent.filter((t) => t > now - MINUTE_MS).length;
  if (lastMinute >= ACCOUNT_SEARCH_MAX_PER_MINUTE || recent.length >= ACCOUNT_SEARCH_MAX_PER_DAY) {
    searchesByUser.set(userId, recent);
    return false;
  }
  recent.push(now);
  searchesByUser.set(userId, recent);
  return true;
}

/** For tests: reset all in-memory state. */
export function resetAccountSearchRateLimitState(): void {
  searchesByUser.clear();
}

/** "jane.doe@example.com" -> "j***@example.com". Leaves unusable values unchanged. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return email;
  return `${email[0]}***${email.slice(at)}`;
}

/** True when the query is a complete email address (the caller already knows it). */
export function isCompleteEmailQuery(query: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(query.trim());
}

export type AccountSearchRow = { id: number; name: string; email: string };

/**
 * Shape search results for the caller. The full email is returned only for an
 * exact match on a complete address the caller typed; everything else is masked.
 */
export function shapeAccountSearchResults(rows: AccountSearchRow[], query: string): AccountSearchRow[] {
  const typed = query.trim().toLowerCase();
  const exact = isCompleteEmailQuery(typed);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: exact && row.email.toLowerCase() === typed ? row.email : maskEmail(row.email),
  }));
}
