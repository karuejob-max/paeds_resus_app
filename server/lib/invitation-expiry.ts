/**
 * Invitations expire. A pending invitation is only as trustworthy as the moment it was sent:
 * the person may have changed roles, left the institution, or lost control of the mailbox.
 *
 * Expiry is derived from the time the invitation was sent (`invitedAt` for institution
 * membership, `createdAt` for administrator grants), so no stored expiry column is needed.
 * Re-sending an invitation resets its clock. An expired invitation cannot be accepted and is
 * no longer listed as actionable; the institution sends a new one.
 */
export const INVITATION_TTL_DAYS = 14;
/** Recovery grants wait through a 7-day cooling-off first, so they get a longer window. */
export const RECOVERY_INVITATION_TTL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function invitationTtlDays(source?: string | null): number {
  return source === "recovery_approval" ? RECOVERY_INVITATION_TTL_DAYS : INVITATION_TTL_DAYS;
}

/** When an invitation sent at `sentAt` stops being acceptable. A missing send time fails closed (already expired). */
export function invitationExpiresAt(sentAt: Date | string | null | undefined, ttlDays = INVITATION_TTL_DAYS): Date {
  if (!sentAt) return new Date(0);
  return new Date(new Date(sentAt).getTime() + ttlDays * DAY_MS);
}

export function isInvitationExpired(
  sentAt: Date | string | null | undefined,
  ttlDays = INVITATION_TTL_DAYS,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= invitationExpiresAt(sentAt, ttlDays).getTime();
}

export const INVITATION_EXPIRED_MESSAGE =
  "This invitation has expired. Ask the institution to send you a new one.";

/** True when an UPDATE matched no rows (mysql2 returns [ResultSetHeader] for drizzle updates). */
export function updateMatchedNoRows(result: unknown): boolean {
  const header = Array.isArray(result) ? result[0] : result;
  const affected = (header as { affectedRows?: number } | undefined)?.affectedRows;
  return affected === 0;
}
