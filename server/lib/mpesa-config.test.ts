import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMpesaConfigReadiness } from "./mpesa-config";
import { resolveStkCallbackUrlFromEnv } from "./mpesa-callback-path";
const keys = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "DARAJA_CONSUMER_KEY",
  "DARAJA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PAYBILL",
  "DARAJA_SHORTCODE",
  "MPESA_PASSKEY",
  "DARAJA_PASSKEY",
  "MPESA_CALLBACK_URL",
  "CALLBACK_URL",
  "APP_BASE_URL",
  "DISABLE_MPESA_STK",
  "MPESA_USE_MOCK",
];
beforeEach(() => {
  keys.forEach(k => vi.stubEnv(k, ""));
  vi.stubEnv("DARAJA_CONSUMER_KEY", "test-key");
  vi.stubEnv("DARAJA_CONSUMER_SECRET", "test-secret");
  vi.stubEnv("MPESA_PASSKEY", "test-passkey");
  vi.stubEnv("MPESA_PAYBILL", "4034223");
});
afterEach(() => vi.unstubAllEnvs());
describe("Daraja readiness shares actual config", () => {
  it("accepts native MPESA_PASSKEY and Daraja consumer pair", () =>
    expect(getMpesaConfigReadiness()).toMatchObject({
      stkPushOffered: true,
      shortcode: "4034223",
      passkeySet: true,
    }));
  it("uses APP_BASE_URL fallback", () => {
    vi.stubEnv("APP_BASE_URL", "https://www.paedsresus.com");
    expect(getMpesaConfigReadiness().callbackUrl).toBe(
      "https://www.paedsresus.com/api/payment/callback"
    );
  });
  it("accepts compatibility shortcode/passkey", () => {
    vi.stubEnv("MPESA_PAYBILL", "");
    vi.stubEnv("MPESA_PASSKEY", "");
    vi.stubEnv("DARAJA_SHORTCODE", "4034223");
    vi.stubEnv("DARAJA_PASSKEY", "test-key");
    expect(getMpesaConfigReadiness().stkPushOffered).toBe(true);
  });
  it("does not offer simulated STK as real checkout", () => {
    vi.stubEnv("MPESA_USE_MOCK", "true");
    expect(getMpesaConfigReadiness().stkPushOffered).toBe(false);
  });
  it("honors disabled flag", () => {
    vi.stubEnv("DISABLE_MPESA_STK", "YES");
    expect(getMpesaConfigReadiness().stkPushOffered).toBe(false);
  });
  it("does not expose credentials", () => {
    const s = JSON.stringify(getMpesaConfigReadiness());
    expect(s).not.toContain("test-secret");
    expect(s).not.toContain("test-passkey");
  });
});
describe("callback normalization", () => {
  it("preserves an explicitly configured callback path", () => {
    vi.stubEnv("MPESA_CALLBACK_URL", "https://example.org/custom/stk");
    expect(resolveStkCallbackUrlFromEnv("https://fallback.org")).toBe(
      "https://example.org/custom/stk"
    );
  });
  it("supports legacy CALLBACK_URL origin", () => {
    vi.stubEnv("CALLBACK_URL", "https://www.paedsresus.com/");
    expect(resolveStkCallbackUrlFromEnv("https://fallback.org")).toBe(
      "https://www.paedsresus.com/api/payment/callback"
    );
  });
  it.each([
    "http://example.org",
    "https://example.com",
    "not-a-url",
    "https://user:password@example.org",
  ])("rejects unsafe callback %s", v => {
    vi.stubEnv("MPESA_CALLBACK_URL", v);
    expect(getMpesaConfigReadiness().stkPushOffered).toBe(false);
  });
});
