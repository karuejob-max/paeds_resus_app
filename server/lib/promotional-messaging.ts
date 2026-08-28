import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  ierpInternProfiles,
  institutionalStaffMembers,
  promotionalMessagePreferences,
  promotionalMessageSuppressions,
  promotionalPreferenceAuditEvents,
  users,
} from "../../drizzle/schema";

export const PROMOTIONAL_TEMPLATE_VERSION =
  "promotional-message-v1-optout-footer";

export const PROMOTIONAL_CADRES = [
  "nurse",
  "doctor",
  "pharmacist",
  "paramedic",
  "lab_tech",
  "respiratory_therapist",
  "midwife",
  "support_staff",
  "other",
  "intern",
] as const;
export type PromotionalCadre = (typeof PROMOTIONAL_CADRES)[number];

export type PromotionalAudienceFilter = {
  cadres: PromotionalCadre[];
  includeUsersWithoutInstitutionStaffRow?: boolean;
};

export type PromotionalRecipientCandidate = {
  userId: number;
  email: string;
  displayName: string;
  cadre: string | null;
  department: string | null;
  consentStatus: "unknown" | "opted_in" | "opted_out";
  suppressed: boolean;
  suppressionReason: string | null;
  eligible: boolean;
  reasons: string[];
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validEmail(value: string | null | undefined): value is string {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

function deriveCadre(input: {
  providerType: string | null;
  cadre: string | null;
  cadreOther: string | null;
  intern: boolean;
}): PromotionalCadre {
  if (input.intern) return "intern";
  const value = normalize(
    input.providerType || input.cadre || input.cadreOther
  );
  if (value.includes("nurs")) return "nurse";
  if (value.includes("doctor") || value === "mo") return "doctor";
  if (value.includes("pharmac")) return "pharmacist";
  if (value.includes("paramed")) return "paramedic";
  if (value.includes("lab")) return "lab_tech";
  if (value.includes("respiratory")) return "respiratory_therapist";
  if (value.includes("midwi")) return "midwife";
  if (value.includes("support")) return "support_staff";
  return "other";
}

export async function getPromotionalPreference(db: any, userId: number) {
  const rows = await db
    .select({
      consentStatus: promotionalMessagePreferences.consentStatus,
      consentSource: promotionalMessagePreferences.consentSource,
      consentedAt: promotionalMessagePreferences.consentedAt,
      optedOutAt: promotionalMessagePreferences.optedOutAt,
    })
    .from(promotionalMessagePreferences)
    .where(eq(promotionalMessagePreferences.userId, userId))
    .limit(1);
  return (
    rows[0] ?? {
      consentStatus: "unknown" as const,
      consentSource: null,
      consentedAt: null,
      optedOutAt: null,
    }
  );
}

export async function setPromotionalPreference(
  db: any,
  input: {
    userId: number;
    status: "unknown" | "opted_in" | "opted_out";
    source: string;
    actorUserId?: number | null;
  }
) {
  const previous = await getPromotionalPreference(db, input.userId);
  const now = new Date();
  const values = {
    consentStatus: input.status,
    consentSource: input.source,
    consentedAt: input.status === "opted_in" ? now : previous.consentedAt,
    optedOutAt: input.status === "opted_out" ? now : null,
    updatedAt: now,
  } as const;
  await db
    .insert(promotionalMessagePreferences)
    .values({ userId: input.userId, ...values })
    .onDuplicateKeyUpdate({ set: values });
  await db.insert(promotionalPreferenceAuditEvents).values({
    userId: input.userId,
    previousStatus: previous.consentStatus,
    nextStatus: input.status,
    source: input.source,
    actorUserId: input.actorUserId ?? null,
  });
  return { previousStatus: previous.consentStatus, nextStatus: input.status };
}

export async function getActivePromotionalSuppressions(db: any) {
  return db
    .select({
      email: promotionalMessageSuppressions.email,
      reason: promotionalMessageSuppressions.reason,
    })
    .from(promotionalMessageSuppressions)
    .where(eq(promotionalMessageSuppressions.isActive, true));
}

export async function loadPromotionalAudience(
  db: any,
  filter: PromotionalAudienceFilter,
  limit = 5000,
  consentPolicy: "opt_in" | "opt_out" = "opt_in"
): Promise<{
  candidates: PromotionalRecipientCandidate[];
  counts: Record<string, number>;
}> {
  const userRows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      providerType: users.providerType,
      cadre: users.cadre,
      cadreOther: users.cadreOther,
      staffRole: institutionalStaffMembers.staffRole,
      department: institutionalStaffMembers.department,
      internId: ierpInternProfiles.id,
    })
    .from(users)
    .leftJoin(
      institutionalStaffMembers,
      and(
        eq(institutionalStaffMembers.userId, users.id),
        isNull(institutionalStaffMembers.removedAt)
      )
    )
    .leftJoin(ierpInternProfiles, eq(ierpInternProfiles.userId, users.id))
    .where(eq(users.role, "user"))
    .limit(limit);
  const suppressions = await getActivePromotionalSuppressions(db);
  const suppressionMap = new Map<string, string>(
    suppressions.map(
      (row: { email: string; reason: string }) =>
        [normalize(row.email), row.reason] as [string, string]
    )
  );
  const userIds = userRows.map((row: any) => row.userId);
  const preferences = userIds.length
    ? await db
        .select({
          userId: promotionalMessagePreferences.userId,
          consentStatus: promotionalMessagePreferences.consentStatus,
        })
        .from(promotionalMessagePreferences)
        .where(inArray(promotionalMessagePreferences.userId, userIds))
    : [];
  const preferenceMap = new Map<number, "unknown" | "opted_in" | "opted_out">(
    preferences.map(
      (row: {
        userId: number;
        consentStatus: "unknown" | "opted_in" | "opted_out";
      }) =>
        [row.userId, row.consentStatus] as [
          number,
          "unknown" | "opted_in" | "opted_out",
        ]
    )
  );
  const seenEmails = new Set<string>();
  const candidates: PromotionalRecipientCandidate[] = [];
  for (const row of userRows) {
    const intern =
      row.internId != null ||
      /intern/i.test(`${row.cadre ?? ""} ${row.cadreOther ?? ""}`);
    const cadre = deriveCadre({
      providerType: row.providerType,
      cadre: row.cadre,
      cadreOther: row.cadreOther,
      intern,
    });
    const email = row.email?.trim().toLowerCase() ?? "";
    const consentStatus = preferenceMap.get(row.userId) ?? "unknown";
    const suppressionReason = email
      ? (suppressionMap.get(email) ?? null)
      : null;
    const reasons: string[] = [];
    if (!validEmail(email)) reasons.push("missing_or_invalid_email");
    if (!filter.cadres.includes(cadre)) reasons.push("cadre_filter");
    if (!filter.includeUsersWithoutInstitutionStaffRow && row.staffRole == null)
      reasons.push("no_institution_staff_row");
    if (consentPolicy === "opt_in" && consentStatus !== "opted_in")
      reasons.push("promotional_consent_required");
    if (consentPolicy === "opt_out" && consentStatus === "opted_out")
      reasons.push("promotional_opt_out");
    if (suppressionReason) reasons.push(`suppressed:${suppressionReason}`);
    if (email && seenEmails.has(email)) reasons.push("duplicate_email");
    if (email) seenEmails.add(email);
    candidates.push({
      userId: row.userId,
      email,
      displayName: row.name?.trim() || "Paeds Resus user",
      cadre,
      department: row.department ?? null,
      consentStatus,
      suppressed: suppressionReason != null,
      suppressionReason,
      eligible: reasons.length === 0,
      reasons,
    });
  }
  return {
    candidates,
    counts: {
      total: candidates.length,
      eligible: candidates.filter(row => row.eligible).length,
      optedIn: candidates.filter(row => row.consentStatus === "opted_in")
        .length,
      consentRequired: candidates.filter(row =>
        row.reasons.includes("promotional_consent_required")
      ).length,
      suppressed: candidates.filter(row => row.suppressed).length,
      invalidEmail: candidates.filter(row =>
        row.reasons.includes("missing_or_invalid_email")
      ).length,
      duplicates: candidates.filter(row =>
        row.reasons.includes("duplicate_email")
      ).length,
    },
  };
}

export function renderPromotionalMessage(input: {
  subject: string;
  displayName: string;
  bodyText: string;
  unsubscribeUrl: string;
}) {
  const name = input.displayName.trim().split(/\s+/)[0] || "Provider";
  const safeName = escapeHtml(name);
  const safeBody = escapeHtml(input.bodyText.trim())
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />");
  const safeUnsubscribeUrl = escapeHtml(input.unsubscribeUrl);
  return {
    subject: input.subject.trim(),
    text: `Hello ${name},\n\n${input.bodyText.trim()}\n\nIf you would prefer not to receive optional Paeds Resus programme messages, unsubscribe here: ${input.unsubscribeUrl}\n\nRegards,\nPaeds Resus`,
    html: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6"><div style="max-width:600px;margin:0 auto;padding:24px"><h1 style="color:#1a4d4d">Paeds Resus</h1><p>Hello ${safeName},</p><p>${safeBody}</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" /><p style="font-size:12px;color:#6b7280">If you would prefer not to receive optional Paeds Resus programme messages, <a href="${safeUnsubscribeUrl}">unsubscribe here</a>.</p><p>Regards,<br />Paeds Resus</p></div></body></html>`,
  };
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "../_core/env";

function promotionalSigningSecret() {
  return process.env.NERP_CAMPAIGN_TOKEN_SECRET?.trim() || ENV.cookieSecret;
}

export function createPromotionalUnsubscribeToken(
  campaignKey: string,
  recipientId: number
) {
  const secret = promotionalSigningSecret();
  if (!secret)
    throw new Error(
      "Promotional unsubscribe signing secret is not configured."
    );
  const payload = Buffer.from(`${campaignKey}:${recipientId}`, "utf8").toString(
    "base64url"
  );
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPromotionalUnsubscribeToken(token: string) {
  const secret = promotionalSigningSecret();
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
  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator <= 0) return null;
  const campaignKey = decoded.slice(0, separator);
  const recipientId = Number(decoded.slice(separator + 1));
  return campaignKey && Number.isInteger(recipientId) && recipientId > 0
    ? { campaignKey, recipientId }
    : null;
}
