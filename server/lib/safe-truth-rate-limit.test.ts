/**
 * Tests for the no-auth Safe-Truth anti-abuse guard
 * (gap-analysis queue item #11 Phase A).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkAndRecordSafeTruthRateLimit,
  isHoneypotTripped,
  normalizeClientIp,
  resetSafeTruthRateLimitState,
} from "./safe-truth-rate-limit";

describe("isHoneypotTripped", () => {
  it("is false when the honeypot field is empty or undefined", () => {
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped("")).toBe(false);
  });

  it("is true when a bot fills the honeypot field", () => {
    expect(isHoneypotTripped("http://spam.example")).toBe(true);
  });
});

describe("normalizeClientIp", () => {
  it("strips the IPv4-mapped IPv6 prefix", () => {
    expect(normalizeClientIp("::ffff:41.90.64.1")).toBe("41.90.64.1");
  });

  it("leaves a plain IPv4 address unchanged", () => {
    expect(normalizeClientIp("41.90.64.1")).toBe("41.90.64.1");
  });
});

describe("checkAndRecordSafeTruthRateLimit", () => {
  beforeEach(() => {
    resetSafeTruthRateLimitState();
  });

  it("allows submissions under the daily limit", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      expect(checkAndRecordSafeTruthRateLimit("41.90.64.1", now)).toBe(true);
    }
  });

  it("blocks the 11th submission from the same IP within a day", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      checkAndRecordSafeTruthRateLimit("41.90.64.1", now);
    }
    expect(checkAndRecordSafeTruthRateLimit("41.90.64.1", now)).toBe(false);
  });

  it("tracks different IPs independently", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      checkAndRecordSafeTruthRateLimit("41.90.64.1", now);
    }
    expect(checkAndRecordSafeTruthRateLimit("41.90.64.2", now)).toBe(true);
  });

  it("allows submissions again after the 24-hour window passes", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      checkAndRecordSafeTruthRateLimit("41.90.64.1", now);
    }
    const tomorrow = now + 25 * 60 * 60 * 1000;
    expect(checkAndRecordSafeTruthRateLimit("41.90.64.1", tomorrow)).toBe(true);
  });
});
