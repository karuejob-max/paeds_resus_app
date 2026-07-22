/**
 * Anti-abuse guard for the no-auth Safe-Truth submission endpoint
 * (gap-analysis queue item #11 Phase A). CEO-approved approach,
 * 2026-07-16: a honeypot field + a generous IP rate limit, not a CAPTCHA —
 * a CAPTCHA adds real friction for a distressed parent, possibly on a
 * low-end phone at 3am, and works poorly in low-literacy/low-connectivity
 * contexts. Heavier defenses are deferred until real abuse is observed.
 *
 * DELIBERATELY IN-MEMORY, NOT PERSISTED: this is a genuinely anonymous
 * health-reporting product — durably storing caregiver IP addresses
 * anywhere, even in a separate table, sits uncomfortably next to that
 * promise. An in-memory counter that resets on deploy/restart is a
 * reasonable trade-off for a single-instance pilot deployment.
 *
 * KNOWN LIMITATION (documented, not hidden): if this ever runs across
 * multiple server instances (horizontal scaling), each instance has its
 * own counter — a determined abuser could get roughly N submissions PER
 * INSTANCE rather than N total. Fine at pilot scale (Render single
 * instance); would need a shared store (e.g. Redis) to hold at scale.
 */
const SAFE_TRUTH_MAX_SUBMISSIONS_PER_IP_PER_DAY = 10;

const submissionsByIp = new Map<string, number[]>();

export function normalizeClientIp(ip: string): string {
  return ip.replace(/^::ffff:/, "").trim();
}

/** Returns true if this IP is still under today's submission limit; records the attempt either way. */
export function checkAndRecordSafeTruthRateLimit(ip: string, now: number = Date.now()): boolean {
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const existing = (submissionsByIp.get(ip) ?? []).filter((t) => t > oneDayAgo);

  if (existing.length >= SAFE_TRUTH_MAX_SUBMISSIONS_PER_IP_PER_DAY) {
    submissionsByIp.set(ip, existing); // prune while we're here, even on reject
    return false;
  }

  existing.push(now);
  submissionsByIp.set(ip, existing);
  return true;
}

/** For tests: reset all in-memory state. */
export function resetSafeTruthRateLimitState(): void {
  submissionsByIp.clear();
}

/** Honeypot check — a real caregiver never sees or fills this field. Non-empty means a bot. */
export function isHoneypotTripped(websiteFieldValue: string | undefined): boolean {
  return Boolean(websiteFieldValue && websiteFieldValue.length > 0);
}
