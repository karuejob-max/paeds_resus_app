import { resolveStkCallbackUrlFromEnv } from "./mpesa-callback-path";

export function getMpesaConfigReadiness() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim() || process.env.DARAJA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim() || process.env.DARAJA_CONSUMER_SECRET?.trim();
  const shortcode = process.env.MPESA_SHORTCODE?.trim() || process.env.MPESA_PAYBILL?.trim() || process.env.DARAJA_SHORTCODE?.trim() || null;
  const passkeySet = Boolean(process.env.MPESA_PASSKEY?.trim() || process.env.DARAJA_PASSKEY?.trim());
  let callbackUrl: string | null = null;
  try { callbackUrl = resolveStkCallbackUrlFromEnv("https://www.paedsresus.com"); } catch { /* Invalid callback is explicitly reflected in readiness. */ }
  const disabled = ["1", "true", "yes"].includes(process.env.DISABLE_MPESA_STK?.trim().toLowerCase() || "");
  const mockEnabled = ["1", "true", "yes"].includes(process.env.MPESA_USE_MOCK?.trim().toLowerCase() || "");
  const consumerKeySet = Boolean(consumerKey);
  const consumerSecretSet = Boolean(consumerSecret);
  const shortcodeSet = Boolean(shortcode && /^\d{5,8}$/.test(shortcode));
  const allRequiredForStk = consumerKeySet && consumerSecretSet && shortcodeSet && passkeySet && Boolean(callbackUrl);
  return { consumerKeySet, consumerSecretSet, shortcode, shortcodeSet, passkeySet, callbackUrl,
    callbackUrlSet: Boolean(callbackUrl), disabled, mockEnabled, allRequiredForStk,
    stkPushOffered: allRequiredForStk && !disabled && !mockEnabled };
}
