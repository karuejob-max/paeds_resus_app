/** Trim and lowercase for consistent login / lookup (avoids Zod failures on padded autofill). */
export function normalizeEmailForAuth(email: string): string {
  return email.trim().toLowerCase();
}
