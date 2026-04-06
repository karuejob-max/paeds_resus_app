/**
 * Single source of truth for Daraja sandbox vs production.
 *
 * Prefer **MPESA_ENVIRONMENT** (documented in `.env.example` and deployment guides).
 * **MPESA_ENV** is supported for backward compatibility with `mpesa-real.ts` history.
 *
 * If both are set, **MPESA_ENVIRONMENT** wins.
 */

export type MpesaDeploymentMode = "production" | "sandbox";

export type MpesaEnvironmentSource = "MPESA_ENVIRONMENT" | "MPESA_ENV" | "default";

function normalizeMode(raw: string | undefined): MpesaDeploymentMode | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (v === "production" || v === "prod" || v === "live") return "production";
  if (v === "sandbox" || v === "dev" || v === "development" || v === "test") return "sandbox";
  return null;
}

export function getMpesaEnvironmentSource(): MpesaEnvironmentSource {
  if (process.env.MPESA_ENVIRONMENT?.trim()) return "MPESA_ENVIRONMENT";
  if (process.env.MPESA_ENV?.trim()) return "MPESA_ENV";
  return "default";
}

export function getMpesaDeploymentMode(): MpesaDeploymentMode {
  const fromDoc = normalizeMode(process.env.MPESA_ENVIRONMENT);
  if (fromDoc) return fromDoc;
  const fromLegacy = normalizeMode(process.env.MPESA_ENV);
  if (fromLegacy) return fromLegacy;
  return "sandbox";
}

export function isMpesaProduction(): boolean {
  return getMpesaDeploymentMode() === "production";
}
