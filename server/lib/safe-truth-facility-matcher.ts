/**
 * Safe-Truth v1 Phase C — gap-analysis queue item #11.
 *
 * Two related, idempotent, dry-run-by-default jobs:
 *
 * 1. Facility fuzzy-matching: resolves `facilityIdMatched` /
 *    `visitFacilityIdMatched` for submissions whose caregiver typed a
 *    facility name as free text (Phase B has no autocomplete — see
 *    SafeTruthV1.tsx's scope note). Candidates are pre-filtered to the
 *    same country + admin_level_1 as the submission, which is what makes
 *    a simple string-similarity match (see facility-name-similarity.ts)
 *    tractable at all — this was the CEO-approved design decision that
 *    avoided deferring matching indefinitely.
 *
 * 2. Event-code linkage: resolves `eventCodeResolvedCareSignalEventId`
 *    when a caregiver's entered code matches a real
 *    `careSignalEvents.eventId`. Both jobs are safe to re-run repeatedly —
 *    already-matched rows are skipped, and a code that doesn't match yet
 *    (e.g. the provider hasn't submitted their Care Signal report yet)
 *    will resolve automatically on a future run once it does.
 *
 * KNOWN DEPENDENCY, documented not hidden: facility-matching quality is
 * bounded by how complete the `facilities` table is (Facility Phase 4's
 * ongoing backfill work, a separate gap-analysis item) — a facility that
 * simply isn't in that table yet cannot be matched, no matter how good
 * the string similarity is. Submissions just stay unmatched until then,
 * safe to retry on every future run.
 */
import { eq, and, isNull, isNotNull, inArray } from "drizzle-orm";
import {
  safeTruthSubmissions,
  safeTruthFacilityVisits,
  facilities,
  careSignalEvents,
} from "../../drizzle/schema";
import { bestFacilityMatch, type FacilityMatchCandidate } from "./facility-name-similarity";

type Db = Awaited<ReturnType<typeof import("../db").getDb>>;

export type FacilityMatchingResult = {
  submissionsScanned: number;
  submissionsMatched: number;
  visitsScanned: number;
  visitsMatched: number;
};

export async function runSafeTruthFacilityMatching(
  db: NonNullable<Db>,
  opts: { dryRun: boolean }
): Promise<FacilityMatchingResult> {
  const result: FacilityMatchingResult = {
    submissionsScanned: 0,
    submissionsMatched: 0,
    visitsScanned: 0,
    visitsMatched: 0,
  };

  // Cache candidate facility lists per (country, adminLevel1) pair — many
  // submissions share the same locality, no need to re-query per row.
  const candidateCache = new Map<string, FacilityMatchCandidate[]>();
  async function candidatesFor(country: string, adminLevel1: string): Promise<FacilityMatchCandidate[]> {
    const key = `${country}::${adminLevel1}`;
    if (candidateCache.has(key)) return candidateCache.get(key)!;
    const rows = await db
      .select({ facilityId: facilities.facilityId, internalName: facilities.internalName })
      .from(facilities)
      .where(and(eq(facilities.countryCode, country), eq(facilities.adminLevel1, adminLevel1)));
    candidateCache.set(key, rows);
    return rows;
  }

  // ── 1. safeTruthSubmissions.facilityIdMatched ────────────────────────────
  const unmatchedSubmissions = await db
    .select({
      id: safeTruthSubmissions.id,
      country: safeTruthSubmissions.country,
      adminLevel1: safeTruthSubmissions.adminLevel1,
      facilityNameRaw: safeTruthSubmissions.facilityNameRaw,
    })
    .from(safeTruthSubmissions)
    .where(isNull(safeTruthSubmissions.facilityIdMatched));

  result.submissionsScanned = unmatchedSubmissions.length;

  for (const submission of unmatchedSubmissions) {
    const candidates = await candidatesFor(submission.country, submission.adminLevel1);
    const match = bestFacilityMatch(submission.facilityNameRaw, candidates);
    if (match) {
      result.submissionsMatched++;
      if (!opts.dryRun) {
        await db
          .update(safeTruthSubmissions)
          .set({ facilityIdMatched: match.facilityId })
          .where(eq(safeTruthSubmissions.id, submission.id));
      }
    }
  }

  // ── 2. safeTruthFacilityVisits.visitFacilityIdMatched ────────────────────
  // Visits don't store their own country/admin_level_1 — inherited from the
  // parent submission via submissionId.
  const unmatchedVisits = await db
    .select({
      id: safeTruthFacilityVisits.id,
      submissionId: safeTruthFacilityVisits.submissionId,
      visitFacilityNameRaw: safeTruthFacilityVisits.visitFacilityNameRaw,
    })
    .from(safeTruthFacilityVisits)
    .where(isNull(safeTruthFacilityVisits.visitFacilityIdMatched));

  result.visitsScanned = unmatchedVisits.length;

  if (unmatchedVisits.length > 0) {
    const submissionIds = [...new Set(unmatchedVisits.map((v) => v.submissionId))];
    const parentSubmissions = await db
      .select({
        id: safeTruthSubmissions.id,
        country: safeTruthSubmissions.country,
        adminLevel1: safeTruthSubmissions.adminLevel1,
      })
      .from(safeTruthSubmissions)
      .where(inArray(safeTruthSubmissions.id, submissionIds));
    const parentById = new Map(parentSubmissions.map((p) => [p.id, p]));

    for (const visit of unmatchedVisits) {
      const parent = parentById.get(visit.submissionId);
      if (!parent) continue; // orphaned row — shouldn't happen, skip defensively
      const candidates = await candidatesFor(parent.country, parent.adminLevel1);
      const match = bestFacilityMatch(visit.visitFacilityNameRaw, candidates);
      if (match) {
        result.visitsMatched++;
        if (!opts.dryRun) {
          await db
            .update(safeTruthFacilityVisits)
            .set({ visitFacilityIdMatched: match.facilityId })
            .where(eq(safeTruthFacilityVisits.id, visit.id));
        }
      }
    }
  }

  return result;
}

export type EventCodeLinkageResult = {
  codesScanned: number;
  codesResolved: number;
};

export async function runSafeTruthEventCodeLinkage(
  db: NonNullable<Db>,
  opts: { dryRun: boolean }
): Promise<EventCodeLinkageResult> {
  const result: EventCodeLinkageResult = { codesScanned: 0, codesResolved: 0 };

  const unresolvedCodes = await db
    .select({ id: safeTruthSubmissions.id, eventCodeEntered: safeTruthSubmissions.eventCodeEntered })
    .from(safeTruthSubmissions)
    .where(
      and(
        isNotNull(safeTruthSubmissions.eventCodeEntered),
        isNull(safeTruthSubmissions.eventCodeResolvedCareSignalEventId)
      )
    );

  result.codesScanned = unresolvedCodes.length;

  for (const row of unresolvedCodes) {
    if (!row.eventCodeEntered) continue;
    const [matchedEvent] = await db
      .select({ id: careSignalEvents.id })
      .from(careSignalEvents)
      .where(eq(careSignalEvents.eventId, row.eventCodeEntered))
      .limit(1);

    if (matchedEvent) {
      result.codesResolved++;
      if (!opts.dryRun) {
        await db
          .update(safeTruthSubmissions)
          .set({ eventCodeResolvedCareSignalEventId: matchedEvent.id })
          .where(eq(safeTruthSubmissions.id, row.id));
      }
    }
  }

  return result;
}
