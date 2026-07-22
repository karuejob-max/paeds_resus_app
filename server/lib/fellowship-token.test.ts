/**
 * Unit tests for the Fellowship pseudonymous token utilities
 * (Observation Architecture v1.1 §5.5, gap-analysis queue item #10).
 */
import { describe, it, expect } from "vitest";
import {
  generateTokenId,
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
  hashRecoveryCodeForLookup,
} from "./fellowship-token";

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECOVERY_CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CONFUSABLE_CHARS = /[01ILO]/;

describe("generateTokenId", () => {
  it("returns a valid v4 UUID", () => {
    expect(generateTokenId()).toMatch(UUID_V4_RE);
  });

  it("returns a different value every call", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateTokenId()));
    expect(ids.size).toBe(50);
  });
});

describe("generateRecoveryCode", () => {
  it("has the expected 4x4 grouped format", () => {
    expect(generateRecoveryCode()).toMatch(RECOVERY_CODE_RE);
  });

  it("never contains visually-confusable characters (0/O, 1/I/L)", () => {
    // Run several times since this is randomized.
    for (let i = 0; i < 30; i++) {
      const code = generateRecoveryCode().replace(/-/g, "");
      expect(code).not.toMatch(CONFUSABLE_CHARS);
    }
  });

  it("returns a different value every call", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRecoveryCode()));
    expect(codes.size).toBe(50);
  });
});

describe("hashRecoveryCode / verifyRecoveryCode", () => {
  it("verifies the correct code against its own hash", async () => {
    const code = generateRecoveryCode();
    const hash = await hashRecoveryCode(code);
    expect(await verifyRecoveryCode(code, hash)).toBe(true);
  });

  it("rejects an incorrect code", async () => {
    const hash = await hashRecoveryCode(generateRecoveryCode());
    expect(await verifyRecoveryCode("WRONG-CODE-0000-0000", hash)).toBe(false);
  });

  it("never persists the code in plaintext — the hash never equals the code", async () => {
    const code = generateRecoveryCode();
    const hash = await hashRecoveryCode(code);
    expect(hash).not.toBe(code);
    expect(hash).not.toContain(code);
  });

  it("is case- and dash-insensitive (hand-copied codes vary)", async () => {
    const code = generateRecoveryCode(); // e.g. "WQ4T-9KXH-2MRC-B7VN"
    const hash = await hashRecoveryCode(code);
    const lowerNoDashes = code.toLowerCase().replace(/-/g, "");
    const withSpaces = code.replace(/-/g, " ");
    expect(await verifyRecoveryCode(lowerNoDashes, hash)).toBe(true);
    expect(await verifyRecoveryCode(withSpaces, hash)).toBe(true);
  });
});

describe("hashRecoveryCodeForLookup (gap-analysis #12, closes the O(n) scaling limit from #10)", () => {
  it("is deterministic — same code always produces the same lookup hash", () => {
    const code = generateRecoveryCode();
    expect(hashRecoveryCodeForLookup(code)).toBe(hashRecoveryCodeForLookup(code));
  });

  it("is case- and dash-insensitive, same as the real bcrypt path — must match on the same normalized input or the indexed lookup would silently miss valid codes", () => {
    const code = generateRecoveryCode();
    const lowerNoDashes = code.toLowerCase().replace(/-/g, "");
    const withSpaces = code.replace(/-/g, " ");
    expect(hashRecoveryCodeForLookup(lowerNoDashes)).toBe(hashRecoveryCodeForLookup(code));
    expect(hashRecoveryCodeForLookup(withSpaces)).toBe(hashRecoveryCodeForLookup(code));
  });

  it("produces different hashes for different codes (not a constant or degenerate function)", () => {
    const hashes = new Set(Array.from({ length: 50 }, () => hashRecoveryCodeForLookup(generateRecoveryCode())));
    expect(hashes.size).toBe(50);
  });

  it("is a 64-character hex string (SHA-256 digest, fits the schema's VARCHAR(64) column)", () => {
    const hash = hashRecoveryCodeForLookup(generateRecoveryCode());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never equals the bcrypt hash or the plaintext code — this is a separate, narrower-purpose value, not a substitute for either", async () => {
    const code = generateRecoveryCode();
    const bcryptHash = await hashRecoveryCode(code);
    const lookupHash = hashRecoveryCodeForLookup(code);
    expect(lookupHash).not.toBe(bcryptHash);
    expect(lookupHash).not.toBe(code);
  });
});
