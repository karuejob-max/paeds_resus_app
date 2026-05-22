/** Age group for Safe-Truth forms (parent + provider). */

export type SafeTruthAgeBand = "neonate" | "infant" | "child";

export type PatientAgeInput = {
  ageBand: SafeTruthAgeBand;
  neonateDays?: string;
  infantMonths?: string;
  childYears?: string;
  /** Additional months after whole years (0–11) for children 1 year+. */
  childExtraMonths?: string;
};

/**
 * Maps UI age inputs to a single non-negative integer for `careSignalEvents.logEvent` (`childAge`).
 * Stored value is **total age in months**. Exact breakdown is also stored in v2 `gapDetails.patientAge`.
 */
export function childAgeMonthsForSafeTruth(input: PatientAgeInput): number {
  if (input.ageBand === "neonate") {
    const d = parseInt(String(input.neonateDays ?? "").trim(), 10);
    if (Number.isFinite(d) && d >= 0 && d <= 28) {
      return Math.max(0, Math.round(d / 30.44));
    }
    return 0;
  }
  if (input.ageBand === "infant") {
    const m = parseInt(String(input.infantMonths ?? "").trim(), 10);
    if (Number.isFinite(m) && m >= 1 && m <= 12) return m;
    return 0;
  }
  const y = parseInt(String(input.childYears ?? "").trim(), 10);
  const extraRaw = String(input.childExtraMonths ?? "0").trim();
  const extra = extraRaw === "" ? 0 : parseInt(extraRaw, 10);
  if (Number.isFinite(y) && y >= 1 && y <= 25) {
    const extraM = Number.isFinite(extra) && extra >= 0 && extra <= 11 ? extra : 0;
    return y * 12 + extraM;
  }
  return 0;
}

/** Validate exact age fields for provider Care Signal / Safe-Truth forms. */
export function validatePatientAgeInput(input: PatientAgeInput): string | null {
  if (input.ageBand === "neonate") {
    const d = parseInt(String(input.neonateDays ?? "").trim(), 10);
    if (!Number.isFinite(d) || d < 0 || d > 28) {
      return "Enter the child's age in days (0–28).";
    }
    return null;
  }
  if (input.ageBand === "infant") {
    const m = parseInt(String(input.infantMonths ?? "").trim(), 10);
    if (!Number.isFinite(m) || m < 1 || m > 12) {
      return "Enter the child's age in months (1–12).";
    }
    return null;
  }
  const y = parseInt(String(input.childYears ?? "").trim(), 10);
  if (!Number.isFinite(y) || y < 1 || y > 25) {
    return "Enter the child's age in years (1–25).";
  }
  const extraRaw = String(input.childExtraMonths ?? "0").trim();
  if (extraRaw !== "") {
    const extra = parseInt(extraRaw, 10);
    if (!Number.isFinite(extra) || extra < 0 || extra > 11) {
      return "Additional months must be between 0 and 11.";
    }
  }
  return null;
}

/** Human-readable age for confirmation screens and review UIs. */
export function formatChildAgeFromInput(input: PatientAgeInput): string {
  if (input.ageBand === "neonate") {
    const d = input.neonateDays?.trim();
    if (d) return `${d} day${d === "1" ? "" : "s"} old`;
    return "Neonate";
  }
  if (input.ageBand === "infant") {
    const m = input.infantMonths?.trim();
    if (m) return `${m} month${m === "1" ? "" : "s"} old`;
    return "Infant";
  }
  const y = input.childYears?.trim();
  const extra = input.childExtraMonths?.trim();
  if (y) {
    if (extra && extra !== "0") {
      return `${y} year${y === "1" ? "" : "s"} ${extra} month${extra === "1" ? "" : "s"} old`;
    }
    return `${y} year${y === "1" ? "" : "s"} old`;
  }
  return "Age not specified";
}

/** Format stored total months (e.g. from API) for display. */
export function formatChildAgeMonths(totalMonths: number): string {
  if (!Number.isFinite(totalMonths) || totalMonths < 0) return "Age not specified";
  if (totalMonths === 0) return "Under 1 month old";
  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths === 1 ? "" : "s"} old`;
  }
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (months === 0) {
    return `${years} year${years === 1 ? "" : "s"} old`;
  }
  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"} old`;
}
