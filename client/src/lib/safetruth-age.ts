/** Age group for Safe-Truth forms (parent + provider). */

export type SafeTruthAgeBand = "neonate" | "infant" | "child";

/**
 * Maps UI age inputs to a single non-negative integer for `careSignalEvents.logEvent` (`childAge`).
 * Stored value is **approximate age in months** (0 = neonate / unknown; 1–12 = infant; 12+ = child years × 12).
 * Full detail stays in `presentation` JSON (`ageBand`, days, months, years).
 */
export function childAgeMonthsForSafeTruth(input: {
  ageBand: SafeTruthAgeBand;
  neonateDays?: string;
  infantMonths?: string;
  childYears?: string;
}): number {
  if (input.ageBand === "neonate") {
    return 0;
  }
  if (input.ageBand === "infant") {
    const m = parseInt(String(input.infantMonths ?? "").trim(), 10);
    if (Number.isFinite(m) && m >= 1 && m <= 12) return m;
    return 1;
  }
  const y = parseInt(String(input.childYears ?? "").trim(), 10);
  if (Number.isFinite(y) && y >= 1 && y <= 25) return y * 12;
  return 0;
}
