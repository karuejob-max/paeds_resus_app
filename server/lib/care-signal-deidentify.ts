/**
 * Raw narrative de-identification (CEO decision 2026-07-12, resolving the
 * "delete rows OR anonymise per counsel" open question in
 * docs/legal/DSAR_PROCEDURE.md and the Observation-Architecture-vs-
 * retention-schedule conflict flagged in docs/WORK_STATUS.md queue item 13).
 *
 * Standing decision: careSignalEvents rows are anonymised (userId → null +
 * this redaction pass on raw_narrative), never hard-deleted, whether
 * triggered by a DSAR erasure request or by the 7-year retention window
 * lapsing. Aggregates and FPKB patterns/recommendations already derived from
 * a narrative persist regardless — that's where "permanently preserved"
 * (Observation Architecture Layer 0) actually lives; the raw sentence itself
 * doesn't need to survive forever for the mission to hold.
 *
 * IMPORTANT — pattern-based redaction has a known, documented limit: it
 * reliably strips structured identifiers (facility names we can cross-
 * reference, phone numbers, emails, explicitly-labeled ID/passport numbers,
 * date-like strings) but it does NOT reliably catch free-text mentions of
 * people's names (e.g. "the patient, John, was..." or a colleague's name
 * used in a narrative). That is a real residual re-identification risk for
 * small-population contexts (a specific rural facility + a rare condition +
 * a specific week can already narrow things down even without a name). A
 * stronger pass (e.g. an LLM-based redaction step) is a legitimate future
 * enhancement but is a new external dependency + cost decision that hasn't
 * been made — this ships the dependency-free baseline now rather than
 * blocking the whole anonymisation decision on that separate choice.
 */

const DATE_PATTERNS: RegExp[] = [
  // 2026-07-12, 12/07/2026, 12-07-2026, 12.07.2026
  /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g,
  /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g,
  // 12 July 2026, July 12 2026, 12th July 2026
  /\b\d{1,2}(st|nd|rd|th)?\s+(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(t|tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\.?\s+\d{2,4}\b/gi,
  /\b(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(t|tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\.?\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{2,4}\b/gi,
];

const PHONE_PATTERN = /\b(\+?254|0)?[17]\d{8}\b/g;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
/** Only redacts numbers explicitly labeled as an ID/passport — avoids false
 *  positives against clinical numbers (doses, vitals, weights). */
const LABELED_ID_PATTERN = /\b(ID|National ID|Passport)\s*(No\.?|Number)?\s*[:#]?\s*\d{5,10}\b/gi;

export interface DeidentifyResult {
  text: string;
  redactionCounts: {
    facilityNames: number;
    dates: number;
    phones: number;
    emails: number;
    labeledIds: number;
  };
}

/**
 * Redacts structured identifiers from a raw Care Signal narrative.
 * `knownFacilityNames` should be every careFacilities.name / facilities
 * .internalName in the system — an exact (case-insensitive) match is
 * replaced with "[FACILITY]".
 */
export function deidentifyRawNarrative(text: string, knownFacilityNames: string[]): DeidentifyResult {
  let result = text;
  const counts = { facilityNames: 0, dates: 0, phones: 0, emails: 0, labeledIds: 0 };

  // Longest names first, so a longer facility name isn't partially masked
  // by a shorter one that happens to be a substring of it.
  const sortedNames = [...knownFacilityNames].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const name of sortedNames) {
    if (name.trim().length < 4) continue; // too short — high false-positive risk
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const before = result;
    result = result.replace(re, "[FACILITY]");
    if (result !== before) counts.facilityNames++;
  }

  for (const pattern of DATE_PATTERNS) {
    const matches = result.match(pattern);
    if (matches) counts.dates += matches.length;
    result = result.replace(pattern, "[DATE]");
  }

  const phoneMatches = result.match(PHONE_PATTERN);
  if (phoneMatches) counts.phones += phoneMatches.length;
  result = result.replace(PHONE_PATTERN, "[PHONE]");

  const emailMatches = result.match(EMAIL_PATTERN);
  if (emailMatches) counts.emails += emailMatches.length;
  result = result.replace(EMAIL_PATTERN, "[EMAIL]");

  const idMatches = result.match(LABELED_ID_PATTERN);
  if (idMatches) counts.labeledIds += idMatches.length;
  result = result.replace(LABELED_ID_PATTERN, "[ID]");

  return { text: result, redactionCounts: counts };
}
