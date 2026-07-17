/**
 * Waitlist priority algorithm tests.
 *
 * The algorithm selects candidates from the waitlist in order of:
 *   1. Higher payment percentage first (paid more → higher priority).
 *   2. Earlier waitlist registration time as a tiebreaker.
 *
 * These tests cover the three critical invariants that must hold for fair
 * allocation when a new slot opens in a fully-booked online simulation session.
 */
import { describe, it, expect } from "vitest";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaitlistCandidate {
  staffMemberId: number;
  totalPaidAmount: number; // KES
  subsidisedFee: number;   // KES — always 15000 for cohort members
  waitlistedAt: Date;
}

// ─── Algorithm under test ─────────────────────────────────────────────────────

/**
 * Sorts waitlist candidates by:
 *   1. Payment percentage descending (most paid gets priority).
 *   2. Earliest waitlist timestamp ascending (first-come tiebreaker).
 *
 * Returns the top-N candidates who should be promoted to "registered".
 */
function selectFromWaitlist(
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
    .slice(0, slotsAvailable);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Waitlist Priority Algorithm", () => {
  const now = new Date("2026-07-17T10:00:00Z");
  const later = new Date("2026-07-17T11:00:00Z");
  const latest = new Date("2026-07-17T12:00:00Z");

  it("selects the candidate with the highest payment percentage first", () => {
    const candidates: WaitlistCandidate[] = [
      { staffMemberId: 1, totalPaidAmount: 5000, subsidisedFee: 15000, waitlistedAt: now },
      { staffMemberId: 2, totalPaidAmount: 12000, subsidisedFee: 15000, waitlistedAt: later },
      { staffMemberId: 3, totalPaidAmount: 3000, subsidisedFee: 15000, waitlistedAt: later },
    ];

    const selected = selectFromWaitlist(candidates, 1);
    expect(selected).toHaveLength(1);
    expect(selected[0].staffMemberId).toBe(2); // 12000/15000 = 80% — highest
  });

  it("uses earlier waitlist time as tiebreaker when payment percentage is equal", () => {
    const candidates: WaitlistCandidate[] = [
      { staffMemberId: 10, totalPaidAmount: 7500, subsidisedFee: 15000, waitlistedAt: latest },
      { staffMemberId: 11, totalPaidAmount: 7500, subsidisedFee: 15000, waitlistedAt: now },
      { staffMemberId: 12, totalPaidAmount: 7500, subsidisedFee: 15000, waitlistedAt: later },
    ];

    const selected = selectFromWaitlist(candidates, 1);
    expect(selected[0].staffMemberId).toBe(11); // same 50%, but earliest time
  });

  it("returns all candidates when slots exceed waitlist length", () => {
    const candidates: WaitlistCandidate[] = [
      { staffMemberId: 20, totalPaidAmount: 15000, subsidisedFee: 15000, waitlistedAt: now },
      { staffMemberId: 21, totalPaidAmount: 10000, subsidisedFee: 15000, waitlistedAt: now },
    ];

    const selected = selectFromWaitlist(candidates, 5);
    expect(selected).toHaveLength(2);
  });

  it("returns empty array when candidates list is empty", () => {
    const selected = selectFromWaitlist([], 3);
    expect(selected).toHaveLength(0);
  });

  it("correctly ranks fully-paid candidates above partial payers", () => {
    const candidates: WaitlistCandidate[] = [
      { staffMemberId: 30, totalPaidAmount: 0, subsidisedFee: 15000, waitlistedAt: now },
      { staffMemberId: 31, totalPaidAmount: 15000, subsidisedFee: 15000, waitlistedAt: later },
      { staffMemberId: 32, totalPaidAmount: 8000, subsidisedFee: 15000, waitlistedAt: now },
    ];

    const selected = selectFromWaitlist(candidates, 2);
    expect(selected[0].staffMemberId).toBe(31); // 100%
    expect(selected[1].staffMemberId).toBe(32); // 53%
  });

  it("does not mutate the original candidates array", () => {
    const candidates: WaitlistCandidate[] = [
      { staffMemberId: 40, totalPaidAmount: 5000, subsidisedFee: 15000, waitlistedAt: now },
      { staffMemberId: 41, totalPaidAmount: 12000, subsidisedFee: 15000, waitlistedAt: now },
    ];
    const original = [...candidates];
    selectFromWaitlist(candidates, 1);
    expect(candidates).toEqual(original);
  });
});
