/**
 * Fellowship pseudonymous token utilities — Observation Architecture v1.1
 * §5.5, gap-analysis queue item #10.
 *
 * A token is a random UUID the client stores on-device (localStorage/
 * IndexedDB — see client/src/lib/fellowship-token.ts for the storage side).
 * A recovery code is shown to the provider exactly once, at creation time,
 * and only its bcrypt hash is ever persisted — the same trust level this
 * codebase already gives real account passwords (see
 * server/routers/security-integration.ts). If a provider loses their device
 * without having saved the recovery code, the streak is genuinely
 * unrecoverable — that is the accepted, honestly-disclosed trade-off of a
 * pseudonymous system (CEO-agreed, 2026-07-15): the platform cannot help
 * recover something it deliberately never stored a plain link to.
 */
import * as bcrypt from "bcryptjs";
import { randomUUID, randomInt, createHmac } from "node:crypto";
import { ENV } from "../_core/env";

const RECOVERY_CODE_GROUPS = 4;
const RECOVERY_CODE_GROUP_LENGTH = 4;
/** Excludes visually-confusable characters (0/O, 1/I/L) since this is hand-copied. */
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTokenId(): string {
  return randomUUID();
}

/** Human-typeable recovery code, e.g. "WQ4T-9KXH-2MRC-B7VN". Shown once, never stored plaintext. */
export function generateRecoveryCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < RECOVERY_CODE_GROUPS; g++) {
    let group = "";
    for (let i = 0; i < RECOVERY_CODE_GROUP_LENGTH; i++) {
      group += RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(normalizeRecoveryCode(code), 10);
}

export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(normalizeRecoveryCode(code), hash);
}

/**
 * Deterministic, indexable stand-in for the O(n) bcrypt scan (gap-analysis
 * #12, closed 2026-07-20 — see fellowshipTokens' schema doc comment for the
 * full mechanism). This is NEVER the actual authentication decision on its
 * own — it only narrows a full-table scan down to a candidate row, which
 * is then still verified with verifyRecoveryCode()'s real bcrypt check.
 *
 * Keyed by JWT_SECRET (this codebase's existing session-signing secret,
 * see server/_core/env.ts's `cookieSecret`) rather than introducing a new
 * required production secret — a domain-separation label is included in
 * the HMAC input so this can never collide with, or be confused for,
 * JWT_SECRET's other use (session cookies). If JWT_SECRET is ever rotated,
 * every existing recoveryCodeLookupHash becomes unmatchable and every
 * affected token silently falls back to the legacy O(n) scan (safe, just
 * slower) rather than failing recovery outright — see
 * findFellowshipTokenByRecoveryCode's fallback branch.
 */
export function hashRecoveryCodeForLookup(code: string): string {
  return createHmac("sha256", ENV.cookieSecret || "fellowship-recovery-lookup-dev-fallback")
    .update(`fellowship-recovery-code-lookup:${normalizeRecoveryCode(code)}`)
    .digest("hex");
}

/** Case/whitespace/dash-insensitive so copy-paste or re-typing variations still match. */
function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/[\s-]+/g, "");
}
