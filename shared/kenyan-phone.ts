/**
 * Normalize Kenyan mobile numbers to the Daraja-safe 2547XXXXXXXX form.
 *
 * Accepted inputs include:
 * - 254712345678
 * - +254712345678
 * - 0712345678
 * - 712345678 (convenient local mobile form)
 * - 00 254 712 345 678
 */
export function normalizeKenyanPhoneNumber(
  value: string | null | undefined
): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  let normalized = digits;

  if (normalized.startsWith("00")) {
    normalized = normalized.slice(2);
  }
  if (normalized.startsWith("0")) {
    normalized = `254${normalized.slice(1)}`;
  } else if (normalized.length === 9 && normalized.startsWith("7")) {
    normalized = `254${normalized}`;
  }

  return /^2547\d{8}$/.test(normalized) ? normalized : null;
}

export function isValidKenyanPhoneNumber(
  value: string | null | undefined
): boolean {
  return normalizeKenyanPhoneNumber(value) !== null;
}

export function formatKenyanPhoneForDisplay(
  value: string | null | undefined
): string {
  return normalizeKenyanPhoneNumber(value) ?? String(value ?? "").trim();
}
