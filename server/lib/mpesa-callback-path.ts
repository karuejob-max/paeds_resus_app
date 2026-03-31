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
