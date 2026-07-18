/**
 * Facility name string similarity — gap-analysis queue item #11 Phase C.
 *
 * Sørensen–Dice coefficient over character bigrams. Chosen over
 * Levenshtein because it's cheap to compute, handles word-order
 * differences well ("Mathari Consolata Hospital" vs "Consolata Hospital
 * Mathari"), and is a well-understood, simple algorithm — no dependency
 * needed. Not claimed to be state-of-the-art; it's proportionate to the
 * problem (a caregiver's free-text facility name, pre-filtered to
 * facilities in the same country + admin_level_1, per the CEO-approved
 * design decision that made this tractable at all).
 */

/** Lowercase, strip punctuation, collapse whitespace. Common words (hospital, clinic, etc.) are kept — they carry real signal (a "clinic" named the same as a "hospital" nearby is a genuine mismatch). */
export function normalizeFacilityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(s: string): string[] {
  const padded = s.replace(/\s+/g, ""); // bigrams over the whole string, ignoring spaces
  const result: string[] = [];
  for (let i = 0; i < padded.length - 1; i++) {
    result.push(padded.slice(i, i + 2));
  }
  return result;
}

/** Sørensen–Dice coefficient, 0 (no overlap) to 1 (identical). */
export function diceCoefficient(a: string, b: string): number {
  const normA = normalizeFacilityName(a);
  const normB = normalizeFacilityName(b);
  if (normA === normB) return 1;
  if (normA.length < 2 || normB.length < 2) return normA === normB ? 1 : 0;

  const bigramsA = bigrams(normA);
  const bigramsB = bigrams(normB);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const bigramCounts = new Map<string, number>();
  for (const bg of bigramsA) {
    bigramCounts.set(bg, (bigramCounts.get(bg) ?? 0) + 1);
  }

  let matches = 0;
  for (const bg of bigramsB) {
    const count = bigramCounts.get(bg) ?? 0;
    if (count > 0) {
      matches++;
      bigramCounts.set(bg, count - 1);
    }
  }

  return (2 * matches) / (bigramsA.length + bigramsB.length);
}

export type FacilityMatchCandidate = { facilityId: string; internalName: string };

/**
 * Best match above `minScore` (default 0.5 — a CEO-approved-in-spirit
 * threshold: proportionate confidence, not a high bar, since this is a
 * pre-filtered candidate pool already scoped to the same country + county).
 * Returns null if nothing clears the bar — the submission just stays
 * unmatched, to be retried on a future run (e.g. once more facilities are
 * backfilled into the `facilities` table).
 */
export function bestFacilityMatch(
  rawName: string,
  candidates: FacilityMatchCandidate[],
  minScore = 0.5
): { facilityId: string; score: number } | null {
  let best: { facilityId: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = diceCoefficient(rawName, candidate.internalName);
    if (score >= minScore && (!best || score > best.score)) {
      best = { facilityId: candidate.facilityId, score };
    }
  }
  return best;
}
