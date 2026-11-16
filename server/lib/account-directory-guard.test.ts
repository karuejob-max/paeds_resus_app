import { beforeEach, describe, expect, it } from "vitest";
import {
  ACCOUNT_SEARCH_MAX_PER_DAY,
  ACCOUNT_SEARCH_MAX_PER_MINUTE,
  checkAccountSearchRateLimit,
  isCompleteEmailQuery,
  maskEmail,
  resetAccountSearchRateLimitState,
  shapeAccountSearchResults,
} from "./account-directory-guard";

describe("account directory guard", () => {
  beforeEach(() => resetAccountSearchRateLimitState());

  it("masks the local part of an email and keeps the domain", () => {
    expect(maskEmail("jane.doe@example.com")).toBe("j***@example.com");
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });

  it("recognises only complete addresses as exact-email queries", () => {
    expect(isCompleteEmailQuery("jane@example.com")).toBe(true);
    expect(isCompleteEmailQuery(" jane@example.com ")).toBe(true);
    expect(isCompleteEmailQuery("jane")).toBe(false);
    expect(isCompleteEmailQuery("jane@exa")).toBe(false);
    expect(isCompleteEmailQuery("@example.com")).toBe(false);
  });

  it("returns a full email only for an exact match on the address the caller typed", () => {
    const rows = [
      { id: 1, name: "Jane Doe", email: "jane@example.com" },
      { id: 2, name: "Janet Roe", email: "janet@example.com" },
    ];
    // Name search: everything masked.
    expect(shapeAccountSearchResults(rows, "jan").map((r) => r.email)).toEqual(["j***@example.com", "j***@example.com"]);
    // Complete address: only the exact match is unmasked.
    const exact = shapeAccountSearchResults(rows, "Jane@Example.com");
    expect(exact.find((r) => r.id === 1)?.email).toBe("jane@example.com");
    expect(exact.find((r) => r.id === 2)?.email).toBe("j***@example.com");
  });

  it("limits searches per minute per user, independently for each user", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < ACCOUNT_SEARCH_MAX_PER_MINUTE; i++) {
      expect(checkAccountSearchRateLimit(10, t0 + i)).toBe(true);
    }
    expect(checkAccountSearchRateLimit(10, t0 + 100)).toBe(false);
    expect(checkAccountSearchRateLimit(11, t0 + 100)).toBe(true);
    // A minute later the window has cleared.
    expect(checkAccountSearchRateLimit(10, t0 + 61_000)).toBe(true);
  });

  it("caps total searches per day", () => {
    const t0 = 5_000_000;
    let allowed = 0;
    // Spread calls so the per-minute limit never binds.
    for (let i = 0; i < ACCOUNT_SEARCH_MAX_PER_DAY + 50; i++) {
      if (checkAccountSearchRateLimit(20, t0 + i * 61_000 / 2)) allowed++;
    }
    expect(allowed).toBeLessThanOrEqual(ACCOUNT_SEARCH_MAX_PER_DAY);
    expect(checkAccountSearchRateLimit(20, t0 + 20 * 60 * 60 * 1000)).toBe(false);
    // After a full day the budget returns.
    expect(checkAccountSearchRateLimit(20, t0 + 26 * 60 * 60 * 1000 + 61_000 * ACCOUNT_SEARCH_MAX_PER_DAY)).toBe(true);
  });
});
