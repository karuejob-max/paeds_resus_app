/**
 * STK `AccountReference` is what the customer often sees as “Account no. …” on the PIN prompt.
 * Safaricom expects a short alphanumeric string (commonly max **12** characters in production).
 *
 * We encode **who the enrollment is for** (learner’s first name word) plus **enrollment id** so
 * staff can match a payment to a row without relying on the payer’s M-Pesa registered name.
 */

export const DARAJA_ACCOUNT_REFERENCE_MAX_LEN = 12;

/**
 * Strip to A–Z / 0–9 and cap length for Daraja.
 */
export function normalizeDarajaAccountReference(raw: string): string {
  const s = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return s.slice(0, DARAJA_ACCOUNT_REFERENCE_MAX_LEN);
}

/**
 * Build a human-readable account reference: `{namePrefix}{E}{enrollmentId}`.
 * Example: "Mary" + enrollment 42 → `MARYE42` (shown as account reference on the phone).
 */
export function buildStkAccountReference(params: {
  enrollmentId: number;
  /** Profile name of the logged-in learner account (enrollment.userId). */
  learnerName: string | null | undefined;
  /** Fallback if name is empty. */
  userId: number;
}): string {
  const MAX = DARAJA_ACCOUNT_REFERENCE_MAX_LEN;
  const idStr = String(params.enrollmentId);
  const suffix = `E${idStr}`;
  const suffixLen = suffix.length;

  let prefix = "";
  if (params.learnerName?.trim()) {
    const word = params.learnerName.trim().split(/\s+/)[0] ?? "";
    prefix = word.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }
  const maxPrefix = Math.max(0, MAX - suffixLen);
  prefix = prefix.slice(0, maxPrefix);

  if (!prefix) {
    prefix = `U${params.userId}`.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, maxPrefix);
    if (!prefix) prefix = "P";
  }

  let combined = `${prefix}${suffix}`;
  if (combined.length > MAX) {
    combined = suffix.length <= MAX ? suffix : suffix.slice(0, MAX);
  }
  return normalizeDarajaAccountReference(combined);
}
