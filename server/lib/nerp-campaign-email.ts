import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "../_core/env";

export const NERP_CAMPAIGN_KEY = "nerp-acls-2026";
export const NERP_CAMPAIGN_SUBJECT =
  "A practical six-month path to AHA ACLS certification";
export const NERP_CAMPAIGN_TEMPLATE_VERSION = "nerp-acls-2026-v1";

function baseUrl() {
  return (ENV.appBaseUrl || "https://www.paedsresus.com").replace(/\/$/, "");
}

function signingSecret() {
  return process.env.NERP_CAMPAIGN_TOKEN_SECRET?.trim() || ENV.cookieSecret;
}

export function firstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "Provider";
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createUnsubscribeToken(
  campaignKey: string,
  recipientId: number
) {
  const secret = signingSecret();
  if (!secret)
    throw new Error("Campaign unsubscribe signing secret is not configured.");
  const payload = Buffer.from(`${campaignKey}:${recipientId}`, "utf8").toString(
    "base64url"
  );
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string) {
  const secret = signingSecret();
  if (!secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const actualBytes = Buffer.from(signature, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  )
    return null;
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator <= 0) return null;
    const campaignKey = decoded.slice(0, separator);
    const recipientId = Number(decoded.slice(separator + 1));
    if (!campaignKey || !Number.isInteger(recipientId) || recipientId <= 0)
      return null;
    return { campaignKey, recipientId };
  } catch {
    return null;
  }
}

export function createNerpCampaignMessage(input: {
  displayName: string;
  campaignKey?: string;
  enrollmentUrl?: string;
  unsubscribeUrl?: string;
}) {
  const campaignKey = input.campaignKey || NERP_CAMPAIGN_KEY;
  const enrollmentUrl =
    input.enrollmentUrl || `${baseUrl()}/programs/nerp-acls`;
  const unsubscribeUrl =
    input.unsubscribeUrl || `${baseUrl()}/api/nerp/campaign/unsubscribe`;
  const name = firstName(input.displayName);
  const safeName = escapeHtml(name);
  const safeEnrollmentUrl = escapeHtml(enrollmentUrl);
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const subject = NERP_CAMPAIGN_SUBJECT;
  const text = `Hello ${name},

If AHA ACLS is part of your professional development plan, Paeds Resus has introduced a flexible Lipa Mdogo Mdogo option at KSh 2,500 per month for six months.

On successful completion of the programme requirements, you will receive your AHA ACLS certification, together with a free Paeds Resus BLS Certificate.

Learn more and check the next steps: ${enrollmentUrl}

This opportunity is optional and is not an institutional performance assessment. If you would prefer not to receive programme updates, unsubscribe here: ${unsubscribeUrl}

Regards,
Paeds Resus`;
  const html = `<!doctype html>
<html lang="en">
  <body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6">
    <div style="max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#1a4d4d">Paeds Resus</h1>
      <p>Hello ${safeName},</p>
      <p>If AHA ACLS is part of your professional development plan, Paeds Resus has introduced a flexible Lipa Mdogo Mdogo option at <strong>KSh 2,500 per month for six months</strong>.</p>
      <p>On successful completion of the programme requirements, you will receive your AHA ACLS certification, together with a free Paeds Resus BLS Certificate.</p>
      <p><a href="${safeEnrollmentUrl}" style="display:inline-block;background:#ff6633;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px">Learn more and check the next steps</a></p>
      <p>This opportunity is optional and is not an institutional performance assessment.</p>
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#6b7280">If you would prefer not to receive programme updates, <a href="${safeUnsubscribeUrl}">unsubscribe here</a>.</p>
      <p>Regards,<br />Paeds Resus</p>
    </div>
  </body>
</html>`;
  return { subject, html, text, campaignKey };
}
