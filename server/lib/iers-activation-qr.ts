import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ENV } from "../_core/env";

const TOKEN_VERSION = "v1";
const FALLBACK_DEV_SECRET = "paeds-resus-local-activation-qr";

function signingSecret() {
  if (ENV.cookieSecret) return ENV.cookieSecret;
  if (ENV.isProduction) throw new Error("JWT_SECRET is required for activation QR tokens in production.");
  return FALLBACK_DEV_SECRET;
}

function signatureFor(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createActivationQrToken(activationEventId: number, nonce: string) {
  const payload = `${TOKEN_VERSION}.${activationEventId}.${nonce}`;
  return `${payload}.${signatureFor(payload)}`;
}

export function createActivationQrNonce() {
  return randomBytes(24).toString("base64url");
}

export function parseActivationQrToken(token: string): { activationEventId: number; nonce: string } | null {
  const parts = token.trim().split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;
  const activationEventId = Number(parts[1]);
  const nonce = parts[2];
  const signature = parts[3];
  if (!Number.isInteger(activationEventId) || activationEventId <= 0 || !nonce || !signature) return null;
  const payload = `${TOKEN_VERSION}.${activationEventId}.${nonce}`;
  const expected = signatureFor(payload);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  return { activationEventId, nonce };
}
