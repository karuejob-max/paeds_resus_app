/**
 * Daraja STK callback URL path. Safaricom naming guidance: avoid brand words like "mpesa" in the public URL.
 * Register this exact path in the Daraja developer portal.
 *
 * `/api/mpesa/callback` remains mounted as a legacy alias for existing configs.
 */
export const STK_CALLBACK_PATH = "/api/payment/callback";

/** @deprecated Prefer STK_CALLBACK_PATH; still served for backward compatibility */
export const STK_CALLBACK_PATH_LEGACY = "/api/mpesa/callback";

export function defaultStkCallbackUrl(appBase: string): string {
  return `${appBase.replace(/\/$/, "")}${STK_CALLBACK_PATH}`;
}

/**
 * Resolves `MPESA_CALLBACK_URL` for STK `CallBackURL`.
 * If env is only the site origin (e.g. `https://paedsresus.com`), Daraja often returns **HTTP 400** —
 * Safaricom expects a full URL including the callback path. We append `/api/payment/callback` in that case.
 */
export function resolveStkCallbackUrlFromEnv(appBaseFallback: string): string {
  const raw = process.env.MPESA_CALLBACK_URL?.trim();
  const base = appBaseFallback.replace(/\/$/, "");
  if (!raw) {
    return defaultStkCallbackUrl(base);
  }
  const u = raw.replace(/\/$/, "");
  if (/\/api\/(payment|mpesa)\/callback$/i.test(u)) {
    return u;
  }
  return `${u}${STK_CALLBACK_PATH}`;
}
