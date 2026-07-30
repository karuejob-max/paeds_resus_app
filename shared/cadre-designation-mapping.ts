/**
 * Maps a general platform `users.cadre` value (from the deep cadre
 * taxonomy, `client/src/lib/cadre-taxonomy.ts`) onto a cohort-program
 * `designation` bucket, where the mapping is genuinely unambiguous
 * (CEO decision, 2026-07-21).
 *
 * Deliberately narrow: the cohort program's designation is a small,
 * closed set of business-rule buckets (who gets subsidised pricing, which
 * payment gate applies) — it isn't meant to carry the taxonomy's full
 * depth, and a future program with different eligibility rules may bucket
 * cadres differently. This mapping exists to remove *redundant re-entry*
 * for the clear cases, not to replace `designation` as the thing that
 * actually gates money and access.
 *
 * NOTE ON DRIFT: the RN-family leaf list below is hand-maintained, not
 * imported from `cadre-taxonomy.ts` — that file lives in `client/src/lib/`
 * and importing a client-only path from `shared/`/`server/` is fragile
 * across build targets. If the taxonomy's RN branch changes (a new
 * sub-cadre or sub-specialty added under Staff > RN), this list needs a
 * matching update. Same category of drift risk as `client/src/legal/
 * terms-of-use.ts` vs `docs/legal/TERMS_OF_USE_FULL.md` — flagged, not
 * hidden.
 */

// Every leaf value under Staff > RN in CPD_CADRE_TAXONOMY, regardless of
// level (MSN/HND/Undergraduate/Diploma/Certificate) or sub-specialty —
// CEO: "it should apply automatically... not bothering which subspecialty."
const RN_FAMILY_CADRE_VALUES: readonly string[] = [
  "MSN",
  "HND",
  "BSN",
  "BSM",
  "Other Undergraduate",
  "KRCHN",
  "KRNM",
  "KRN",
  "KRM",
  "Other Diploma RN",
  "KECHN",
  "Other Certificate RN",
  "Other RN",
];

// Intern-group leaves that map 1:1 onto a cohort designation. "COI" is
// deliberately excluded — the taxonomy's Intern group has one flat "COI"
// value with no BSc/Diploma split, but the cohort program's designation
// enum splits `coi_bsc`/`coi_diploma`. Guessing which one would be a
// silent, possibly-wrong eligibility decision, so COI interns still pick
// manually rather than being auto-mapped incorrectly.
const INTERN_CADRE_TO_DESIGNATION: Record<string, "noi" | "moi"> = {
  NOI: "noi",
  MOI: "moi",
};

export type InferredDesignation = "permanent_nurse" | "noi" | "moi";

/**
 * Returns the designation this cadre value unambiguously implies, or null
 * if it's genuinely ambiguous (e.g., "COI") or unrelated (doctor, student,
 * consultant, etc.) — callers should fall back to "other" or a manual
 * prompt, never guess further than this function already does.
 */
export function inferDesignationFromCadre(cadre: string | null | undefined): InferredDesignation | null {
  if (!cadre) return null;
  if (RN_FAMILY_CADRE_VALUES.includes(cadre)) return "permanent_nurse";
  if (cadre in INTERN_CADRE_TO_DESIGNATION) return INTERN_CADRE_TO_DESIGNATION[cadre];
  return null;
}
