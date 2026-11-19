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
  const raw = process.env.MPESA_CALLBACK_URL?.trim() || process.env.CALLBACK_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() || appBaseFallback;
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password ||
      /(^|\.)example\.com$|^localhost$|^127\./i.test(url.hostname)) {
    throw new Error("M-Pesa callback must be a public HTTPS URL without credentials");
  }
  if (url.pathname === "/" || !url.pathname) url.pathname = STK_CALLBACK_PATH;
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}
