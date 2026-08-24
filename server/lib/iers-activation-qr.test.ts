import { describe, expect, it } from "vitest";
import { createActivationQrNonce, createActivationQrToken, parseActivationQrToken } from "./iers-activation-qr";

describe("activation case QR tokens", () => {
  it("round-trips an opaque activation ID and nonce", () => {
    const nonce = createActivationQrNonce();
    const token = createActivationQrToken(42, nonce);
    expect(parseActivationQrToken(token)).toEqual({ activationEventId: 42, nonce });
  });

  it("rejects a tampered activation ID or nonce", () => {
    const token = createActivationQrToken(42, createActivationQrNonce());
    expect(parseActivationQrToken(token.replace("42", "43"))).toBeNull();
    expect(parseActivationQrToken(`${token}x`)).toBeNull();
  });

  it("rejects malformed and empty tokens", () => {
    expect(parseActivationQrToken("")).toBeNull();
    expect(parseActivationQrToken("v1.not-an-id.nonce.signature")).toBeNull();
    expect(parseActivationQrToken("activation:42")).toBeNull();
  });
});
