/** Matches `users.phone` varchar length in drizzle schema. */
export const USER_PHONE_MAX_LEN = 20;

export type PhoneCountryMode = "ke" | "intl";

/**
 * Normalize optional mobile for storage. Returns null if empty after trim.
 * Kenya: 9 digits (often entered as 07… or 7…). International: E.164-style starting with +.
 */
export function normalizeUserPhone(input: {
  mode: PhoneCountryMode;
  value: string;
}): string | null {
  const raw = input.value.trim();
  if (!raw) return null;

  if (input.mode === "ke") {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("254")) digits = digits.slice(3);
    else if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length !== 9) return null;
    const e164 = `+254${digits}`;
    return e164.length <= USER_PHONE_MAX_LEN ? e164 : null;
  }

  let s = raw.replace(/\s/g, "");
  if (!s.startsWith("+")) {
    const digits = s.replace(/\D/g, "");
    if (!digits) return null;
    s = `+${digits}`;
  }
  if (s.length > USER_PHONE_MAX_LEN) return null;
  return s;
}
