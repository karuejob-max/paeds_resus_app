import { and, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  globalEntitlements,
  globalEntitlementRedemptions,
} from "../../drizzle/schema";

export const GLOBAL_ENTITLEMENT_PROGRAM_TYPES = [
  "ierp",
  "nerp",
  "paeds_resus_ils",
  "self_pay",
  "bls",
  "acls",
  "pals",
  "heartsaver",
  "nrp",
  "instructor",
] as const;
export type GlobalEntitlementProgramType =
  (typeof GLOBAL_ENTITLEMENT_PROGRAM_TYPES)[number];
export const GLOBAL_ENTITLEMENT_BENEFIT_TYPES = [
  "free",
  "percentage_discount",
] as const;
export type GlobalEntitlementBenefitType =
  (typeof GLOBAL_ENTITLEMENT_BENEFIT_TYPES)[number];

export type EntitlementPrice = {
  originalAmountKes: number;
  discountAmountKes: number;
  effectiveAmountKes: number;
};

export function calculateEntitlementPrice(
  originalAmountKes: number,
  benefitType: GlobalEntitlementBenefitType,
  discountPercent?: number | null
): EntitlementPrice {
  const original = Math.max(0, Math.round(Number(originalAmountKes) || 0));
  if (benefitType === "free") {
    return {
      originalAmountKes: original,
      discountAmountKes: original,
      effectiveAmountKes: 0,
    };
  }
  const percent = Math.max(
    1,
    Math.min(99, Math.round(Number(discountPercent) || 0))
  );
  const effective = Math.max(0, Math.round((original * (100 - percent)) / 100));
  return {
    originalAmountKes: original,
    discountAmountKes: original - effective,
    effectiveAmountKes: effective,
  };
}

export function isEntitlementActive(
  entitlement: {
    status: string;
    expiresAt: Date;
    redemptionCount: number;
    maxRedemptions: number;
  },
  now: Date = new Date()
) {
  return (
    entitlement.status === "active" &&
    entitlement.redemptionCount < entitlement.maxRedemptions &&
    entitlement.expiresAt.getTime() > now.getTime()
  );
}

export async function findActiveGlobalEntitlement(
  db: any,
  target: {
    programType: GlobalEntitlementProgramType;
    userId?: number;
    institutionalAccountId?: number;
    selfPayCourseId?: string;
  },
  now: Date = new Date()
) {
  const conditions = [
    eq(globalEntitlements.programType, target.programType),
    eq(globalEntitlements.status, "active"),
    gt(globalEntitlements.expiresAt, now),
    lt(globalEntitlements.redemptionCount, globalEntitlements.maxRedemptions),
  ];
  if (target.userId != null)
    conditions.push(eq(globalEntitlements.targetUserId, target.userId) as any);
  if (target.institutionalAccountId != null)
    conditions.push(
      eq(
        globalEntitlements.targetInstitutionalAccountId,
        target.institutionalAccountId
      ) as any
    );
  if (target.selfPayCourseId != null)
    conditions.push(
      eq(globalEntitlements.selfPayCourseId, target.selfPayCourseId) as any
    );
  const rows = await db
    .select()
    .from(globalEntitlements)
    .where(and(...conditions))
    .orderBy(globalEntitlements.expiresAt)
    .limit(1);
  return rows[0] ?? null;
}

export async function consumeGlobalEntitlement(
  db: any,
  input: {
    entitlementId: number;
    targetUserId?: number | null;
    targetInstitutionalAccountId?: number | null;
    selfPayCourseId?: string | null;
    programType: GlobalEntitlementProgramType;
    resourceReference: string;
    originalAmountKes: number;
    redeemedByUserId: number;
  }
) {
  const now = new Date();
  return db.transaction(async (tx: any) => {
    const rows = await tx
      .select()
      .from(globalEntitlements)
      .where(eq(globalEntitlements.id, input.entitlementId))
      .limit(1);
    const entitlement = rows[0];
    if (!entitlement || !isEntitlementActive(entitlement, now)) return null;
    if (entitlement.programType !== input.programType) return null;
    if (entitlement.targetUserId !== (input.targetUserId ?? null)) return null;
    if (
      entitlement.targetInstitutionalAccountId !==
      (input.targetInstitutionalAccountId ?? null)
    )
      return null;
    if (entitlement.selfPayCourseId !== (input.selfPayCourseId ?? null))
      return null;

    const claim = await tx
      .update(globalEntitlements)
      .set({
        redemptionCount: sql`${globalEntitlements.redemptionCount} + 1`,
        status: sql`CASE WHEN ${globalEntitlements.redemptionCount} + 1 >= ${globalEntitlements.maxRedemptions} THEN 'exhausted' ELSE 'active' END`,
        updatedAt: now,
      })
      .where(
        and(
          eq(globalEntitlements.id, input.entitlementId),
          eq(globalEntitlements.status, "active"),
          gt(globalEntitlements.expiresAt, now),
          lt(
            globalEntitlements.redemptionCount,
            globalEntitlements.maxRedemptions
          )
        )
      );
    const affectedRows = Number(
      (claim as any)?.[0]?.affectedRows ?? (claim as any)?.affectedRows ?? 0
    );
    if (affectedRows !== 1) return null;

    const price = calculateEntitlementPrice(
      input.originalAmountKes,
      entitlement.benefitType,
      entitlement.discountPercent
    );
    await tx.insert(globalEntitlementRedemptions).values({
      entitlementId: entitlement.id,
      targetUserId: input.targetUserId ?? null,
      targetInstitutionalAccountId: input.targetInstitutionalAccountId ?? null,
      programType: input.programType,
      resourceReference: input.resourceReference,
      originalAmountKes: price.originalAmountKes,
      discountAmountKes: price.discountAmountKes,
      effectiveAmountKes: price.effectiveAmountKes,
      redeemedByUserId: input.redeemedByUserId,
      redeemedAt: now,
    });
    return {
      entitlement,
      ...price,
      redemptionReference: `${entitlement.grantReference}:${input.resourceReference}`,
    };
  });
}

export function newEntitlementReference() {
  return `ENT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** Generate a human-shareable code. Only its SHA-256 hash is persisted. */
export function createAccessCode() {
  const code = `PAEDS-${randomBytes(5).toString("hex").toUpperCase()}`;
  return { code, hash: hashAccessCode(code), prefix: code.slice(0, 12) };
}

export function hashAccessCode(code: string) {
  return createHash("sha256")
    .update(code.trim().toUpperCase(), "utf8")
    .digest("hex");
}

export function normalizeRecipientEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashRecipientEmail(email: string) {
  return createHash("sha256")
    .update(normalizeRecipientEmail(email), "utf8")
    .digest("hex");
}

export async function findActiveShareableEntitlement(
  db: any,
  code: string,
  selfPayCourseId: string,
  programType: GlobalEntitlementProgramType = "self_pay",
  now: Date = new Date(),
  recipientEmail: string | null
) {
  const [row] = await db
    .select()
    .from(globalEntitlements)
    .where(
      and(
        eq(globalEntitlements.accessCodeHash, hashAccessCode(code)),
        eq(globalEntitlements.programType, programType),
        eq(globalEntitlements.selfPayCourseId, selfPayCourseId),
        eq(globalEntitlements.status, "active"),
        gt(globalEntitlements.expiresAt, now),
        lt(globalEntitlements.redemptionCount, globalEntitlements.maxRedemptions),
        recipientEmail
          ? or(
              isNull(globalEntitlements.recipientEmailHash),
              eq(globalEntitlements.recipientEmailHash, hashRecipientEmail(recipientEmail))
            )
          : isNull(globalEntitlements.recipientEmailHash),
        isNull(globalEntitlements.targetUserId),
        isNull(globalEntitlements.targetInstitutionalAccountId)
      )
    )
    .limit(1);
  return row ?? null;
}

export function entitlementTargetLabel(input: {
  userName?: string | null;
  userEmail?: string | null;
  institutionName?: string | null;
}) {
  return (
    input.institutionName ||
    input.userName ||
    input.userEmail ||
    "Named account"
  );
}
