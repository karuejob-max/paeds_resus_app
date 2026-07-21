/**
 * Waitlist priority algorithm for the Subsidised ACLS/BLS Cohort Program.
 *
 * Wired in 2026-07-20 (INST-21 follow-up): this algorithm existed, tested,
 * since PR #303 but was never called from any booking mutation — there was
 * also no cancellation path at all, so no slot ever actually freed up for it
 * to promote anyone into. `cancelHandsOnSession` in `courses.ts` is the first
 * real caller.
 *
 * Selects candidates from a session's waitlist in order of:
 *   1. Higher payment percentage first (paid more -> higher priority).
 *   2. Earlier waitlist registration time as a tiebreaker.
 */

export interface WaitlistCandidate {
  staffMemberId: number;
  totalPaidAmount: number; // KES
  subsidisedFee: number;   // KES — always 15000 for cohort members
  waitlistedAt: Date;
}

/**
 * Sorts waitlist candidates by:
 *   1. Payment percentage descending (most paid gets priority).
 *   2. Earliest waitlist timestamp ascending (first-come tiebreaker).
 *
 * Returns the top-N candidates who should be promoted to "registered".
 */
export function selectFromWaitlist(
  candidates: WaitlistCandidate[],
  slotsAvailable: number
): WaitlistCandidate[] {
  return [...candidates]
    .sort((a, b) => {
      const pctA = a.totalPaidAmount / a.subsidisedFee;
      const pctB = b.totalPaidAmount / b.subsidisedFee;
      if (pctB !== pctA) return pctB - pctA; // higher payment % first
      return a.waitlistedAt.getTime() - b.waitlistedAt.getTime(); // earlier first
    })
    .slice(0, Math.max(0, slotsAvailable));
}
