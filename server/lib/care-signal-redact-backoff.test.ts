import { describe, it, expect } from "vitest";
import { isEligibleForRetry, MAX_REDACTION_ATTEMPTS, BASE_BACKOFF_MINUTES, MAX_BACKOFF_MINUTES } from "./care-signal-redact";

/**
 * Tests the exponential backoff logic added 2026-07-29 to close a gap
 * found in code review: before this, a permanently-failing narrative
 * retried every single 10-minute cron tick forever. These are pure
 * function tests, no database needed -- see care-signal-redact-pause.test.ts
 * for the kill-switch path and care-signal-redact.test.ts for the
 * DB-dependent end-to-end processing tests.
 */
describe("isEligibleForRetry", () => {
  it("is always eligible for a narrative that has never been attempted", () => {
    expect(isEligibleForRetry(0, null, new Date())).toBe(true);
  });

  it("is eligible immediately after one prior attempt if BASE_BACKOFF_MINUTES have already passed", () => {
    const lastAttemptAt = new Date("2026-07-29T10:00:00Z");
    const now = new Date(lastAttemptAt.getTime() + BASE_BACKOFF_MINUTES * 60_000);
    expect(isEligibleForRetry(1, lastAttemptAt, now)).toBe(true);
  });

  it("is NOT eligible one minute before the first backoff window closes", () => {
    const lastAttemptAt = new Date("2026-07-29T10:00:00Z");
    const now = new Date(lastAttemptAt.getTime() + (BASE_BACKOFF_MINUTES - 1) * 60_000);
    expect(isEligibleForRetry(1, lastAttemptAt, now)).toBe(false);
  });

  it("doubles the backoff window on each successive attempt (exponential, not flat)", () => {
    const lastAttemptAt = new Date("2026-07-29T10:00:00Z");

    // attempt=2 -> 20 minute window: not yet eligible at +19m, eligible at +20m
    const at19 = new Date(lastAttemptAt.getTime() + 19 * 60_000);
    const at20 = new Date(lastAttemptAt.getTime() + 20 * 60_000);
    expect(isEligibleForRetry(2, lastAttemptAt, at19)).toBe(false);
    expect(isEligibleForRetry(2, lastAttemptAt, at20)).toBe(true);

    // attempt=3 -> 40 minute window
    const at39 = new Date(lastAttemptAt.getTime() + 39 * 60_000);
    const at40 = new Date(lastAttemptAt.getTime() + 40 * 60_000);
    expect(isEligibleForRetry(3, lastAttemptAt, at39)).toBe(false);
    expect(isEligibleForRetry(3, lastAttemptAt, at40)).toBe(true);
  });

  it("caps the backoff window at MAX_BACKOFF_MINUTES rather than growing unbounded", () => {
    const lastAttemptAt = new Date("2026-07-29T10:00:00Z");
    // isEligibleForRetry itself doesn't enforce MAX_REDACTION_ATTEMPTS --
    // that ceiling is applied separately, by the caller's SQL query. So
    // to test the cap in isolation, use an attempt count high enough that
    // 10 * 2^(attempts-1) would mathematically exceed MAX_BACKOFF_MINUTES
    // (at MAX_REDACTION_ATTEMPTS itself, 10 * 2^7 = 1280min, which is
    // still under the 1440min cap -- the real ceiling in practice is
    // "give up at attempt 8", not "hit the 24h cap", since the exponential
    // curve doesn't reach the cap within that many attempts).
    const highAttemptCount = 20;
    const justUnderCap = new Date(lastAttemptAt.getTime() + (MAX_BACKOFF_MINUTES - 1) * 60_000);
    const atCap = new Date(lastAttemptAt.getTime() + MAX_BACKOFF_MINUTES * 60_000);
    expect(isEligibleForRetry(highAttemptCount, lastAttemptAt, justUnderCap)).toBe(false);
    expect(isEligibleForRetry(highAttemptCount, lastAttemptAt, atCap)).toBe(true);
  });

  it("MAX_REDACTION_ATTEMPTS's exponential curve stays under MAX_BACKOFF_MINUTES throughout -- the cap is a safety net for a hypothetically higher limit, not something attempt 8 itself reaches", () => {
    const finalBackoff = BASE_BACKOFF_MINUTES * Math.pow(2, MAX_REDACTION_ATTEMPTS - 1 - 1);
    expect(finalBackoff).toBeLessThan(MAX_BACKOFF_MINUTES);
  });

  it("MAX_REDACTION_ATTEMPTS is a sensible, deliberately-chosen value, not left at zero or absurdly high", () => {
    expect(MAX_REDACTION_ATTEMPTS).toBeGreaterThan(0);
    expect(MAX_REDACTION_ATTEMPTS).toBeLessThan(100);
  });
});
