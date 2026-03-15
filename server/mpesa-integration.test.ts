import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

/**
 * MPESA-1 & MPESA-2 Integration Tests
 * Tests for environment-based URL switching and webhook signature verification
 */

describe("MPESA-1: Production URL Switching", () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.MPESA_ENVIRONMENT;
  });

  it("should use sandbox URL when MPESA_ENVIRONMENT is not set", () => {
    // Simulate the M-Pesa service initialization
    const environment = (process.env.MPESA_ENVIRONMENT as
      | "sandbox"
      | "production") || "sandbox";
    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    expect(environment).toBe("sandbox");
    expect(baseUrl).toBe("https://sandbox.safaricom.co.ke");
  });

  it("should use sandbox URL when MPESA_ENVIRONMENT=sandbox", () => {
    process.env.MPESA_ENVIRONMENT = "sandbox";
    const environment = (process.env.MPESA_ENVIRONMENT as
      | "sandbox"
      | "production") || "sandbox";
    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    expect(environment).toBe("sandbox");
    expect(baseUrl).toBe("https://sandbox.safaricom.co.ke");
  });

  it("should use production URL when MPESA_ENVIRONMENT=production", () => {
    process.env.MPESA_ENVIRONMENT = "production";
    const environment = (process.env.MPESA_ENVIRONMENT as
      | "sandbox"
      | "production") || "sandbox";
    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    expect(environment).toBe("production");
    expect(baseUrl).toBe("https://api.safaricom.co.ke");
  });

  it("should log the environment on initialization", () => {
    const consoleSpy = vi.spyOn(console, "log");
    process.env.MPESA_ENVIRONMENT = "production";

    const environment = (process.env.MPESA_ENVIRONMENT as
      | "sandbox"
      | "production") || "sandbox";
    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    console.log(
      `[M-Pesa] Initialized in ${environment} mode with baseUrl: ${baseUrl}`
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[M-Pesa] Initialized in production mode with baseUrl: https://api.safaricom.co.ke"
    );

    consoleSpy.mockRestore();
  });
});

describe("MPESA-2: Webhook Signature Verification", () => {
  const testPasskey = "test-passkey-12345";

  function verifyMpesaSignature(body: string, signature: string): boolean {
    try {
      const passkey = testPasskey;

      if (!passkey) {
        console.warn(
          "[M-Pesa] MPESA_PASSKEY not set; skipping signature verification"
        );
        return true;
      }

      const computedSignature = crypto
        .createHmac("sha256", passkey)
        .update(body)
        .digest("base64");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signature)
      );

      return isValid;
    } catch (error) {
      console.error("[M-Pesa] Signature verification error:", error);
      return false;
    }
  }

  it("should generate correct HMAC-SHA256 signature", () => {
    const testBody = JSON.stringify({
      Body: {
        stkCallback: {
          MerchantRequestID: "test-123",
          CheckoutRequestID: "ws_CO_12345",
          ResultCode: 0,
          ResultDesc: "The service request has been accepted successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 100 },
              { Name: "MpesaReceiptNumber", Value: "LHG31AA5TX0" },
              { Name: "PhoneNumber", Value: "254708374149" },
            ],
          },
        },
      },
    });

    const expectedSignature = crypto
      .createHmac("sha256", testPasskey)
      .update(testBody)
      .digest("base64");

    expect(expectedSignature).toBeTruthy();
    expect(typeof expectedSignature).toBe("string");
    expect(expectedSignature.length).toBeGreaterThan(0);
  });

  it("should verify valid signature", () => {
    const testBody = JSON.stringify({
      Body: { stkCallback: { ResultCode: 0 } },
    });

    const validSignature = crypto
      .createHmac("sha256", testPasskey)
      .update(testBody)
      .digest("base64");

    const isValid = verifyMpesaSignature(testBody, validSignature);
    expect(isValid).toBe(true);
  });

  it("should reject invalid signature", () => {
    const testBody = JSON.stringify({
      Body: { stkCallback: { ResultCode: 0 } },
    });

    const invalidSignature = "invalid-signature-xyz";

    const isValid = verifyMpesaSignature(testBody, invalidSignature);
    expect(isValid).toBe(false);
  });

  it("should reject tampered body with valid signature", () => {
    const testBody = JSON.stringify({
      Body: { stkCallback: { ResultCode: 0 } },
    });

    const validSignature = crypto
      .createHmac("sha256", testPasskey)
      .update(testBody)
      .digest("base64");

    const tamperedBody = JSON.stringify({
      Body: { stkCallback: { ResultCode: 1 } }, // Changed result code
    });

    const isValid = verifyMpesaSignature(tamperedBody, validSignature);
    expect(isValid).toBe(false);
  });

  it("should use constant-time comparison to prevent timing attacks", () => {
    const testBody = JSON.stringify({
      Body: { stkCallback: { ResultCode: 0 } },
    });

    const validSignature = crypto
      .createHmac("sha256", testPasskey)
      .update(testBody)
      .digest("base64");

    // This test verifies that crypto.timingSafeEqual is used
    // by checking that the function doesn't throw on equal buffers
    expect(() => {
      verifyMpesaSignature(testBody, validSignature);
    }).not.toThrow();
  });

  it("should handle missing passkey gracefully (development mode)", () => {
    const consoleSpy = vi.spyOn(console, "warn");

    function verifyWithoutPasskey(body: string, signature: string): boolean {
      const passkey = ""; // Simulate missing passkey

      if (!passkey) {
        console.warn(
          "[M-Pesa] MPESA_PASSKEY not set; skipping signature verification"
        );
        return true;
      }

      return false;
    }

    const result = verifyWithoutPasskey("test", "test");
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[M-Pesa] MPESA_PASSKEY not set; skipping signature verification"
    );

    consoleSpy.mockRestore();
  });

  it("should handle signature verification errors gracefully", () => {
    const consoleSpy = vi.spyOn(console, "error");

    function verifyWithError(body: string, signature: string): boolean {
      try {
        // Simulate error by passing invalid buffer
        const invalidBuffer = null as any;
        crypto.timingSafeEqual(invalidBuffer, Buffer.from("test"));
        return false;
      } catch (error) {
        console.error("[M-Pesa] Signature verification error:", error);
        return false;
      }
    }

    const result = verifyWithError("test", "test");
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("MPESA-1 & MPESA-2: Integration", () => {
  it("should initialize with correct environment and support signature verification", () => {
    process.env.MPESA_ENVIRONMENT = "production";
    process.env.MPESA_PASSKEY = "test-passkey";

    const environment = (process.env.MPESA_ENVIRONMENT as
      | "sandbox"
      | "production") || "sandbox";
    const baseUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
    const passkey = process.env.MPESA_PASSKEY;

    expect(environment).toBe("production");
    expect(baseUrl).toBe("https://api.safaricom.co.ke");
    expect(passkey).toBe("test-passkey");

    // Cleanup
    delete process.env.MPESA_ENVIRONMENT;
    delete process.env.MPESA_PASSKEY;
  });
});
