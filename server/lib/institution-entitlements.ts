import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  institutionProductEntitlements,
  institutionProductSubscriptions,
  institutionalProductCapabilities,
  institutionalProducts,
} from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { isMissingTableError } from "./is-missing-db-table";

export type InstitutionalProductKey = "iers" | "cpd_portal" | "connected_services";
export type ProductCapabilityClass = "read" | "operate" | "review" | "govern" | "commercial";
export type ProductRenewalPolicy = "full" | "read_only" | "operational_continuity" | "blocked";
export type ProductSubscriptionStatus =
  | "trial"
  | "active"
  | "grace"
  | "past_due"
  | "expired"
  | "suspended"
  | "cancelled"
  | "legacy_unclassified"
  | "not_subscribed";
export type EntitlementStatus = "active" | "grace" | "read_only" | "blocked" | "revoked";
export type ProductAccessMode = "full" | "read_only" | "operational_continuity" | "legacy_fallback";

export interface ProductAccessDecision {
  productKey: InstitutionalProductKey;
  capabilityKey: string;
  subscriptionStatus: ProductSubscriptionStatus;
  entitlementStatus: EntitlementStatus;
  mode: ProductAccessMode;
  legacyFallback: boolean;
}

export function resolveProductAccessMode(input: {
  subscriptionStatus: ProductSubscriptionStatus;
  entitlementStatus: EntitlementStatus;
  capabilityClass: ProductCapabilityClass;
  renewalPolicy: ProductRenewalPolicy;
}): ProductAccessMode | "blocked" {
  if (input.entitlementStatus === "blocked" || input.entitlementStatus === "revoked") {
    return "blocked";
  }

  if (["active", "trial", "grace", "legacy_unclassified"].includes(input.subscriptionStatus)) {
    return input.entitlementStatus === "read_only" ? "read_only" : "full";
  }

  if (input.renewalPolicy === "operational_continuity") {
    return input.capabilityClass === "read" ? "read_only" : "operational_continuity";
  }

  if (input.renewalPolicy === "read_only" && input.capabilityClass === "read") {
    return "read_only";
  }

  return "blocked";
}

function subscriptionStatus(value: string | null | undefined): ProductSubscriptionStatus {
  if (
    value === "trial" ||
    value === "active" ||
    value === "grace" ||
    value === "past_due" ||
    value === "expired" ||
    value === "suspended" ||
    value === "cancelled" ||
    value === "legacy_unclassified" ||
    value === "not_subscribed"
  ) {
    return value;
  }
  return "not_subscribed";
}

function entitlementStatus(value: string | null | undefined): EntitlementStatus {
  if (value === "active" || value === "grace" || value === "read_only" || value === "blocked" || value === "revoked") {
    return value;
  }
  return "blocked";
}

/**
 * Server-side product gate. The missing-table fallback is deliberately limited
 * to deployment order: before migration 0100 exists, current institutions keep
 * their existing access rather than being locked out during a rolling deploy.
 * Once the product tables exist, all decisions come from the persisted ledger.
 */
export async function assertInstitutionProductCapability(
  db: AppDb,
  institutionId: number,
  productKey: InstitutionalProductKey,
  capabilityKey: string,
): Promise<ProductAccessDecision> {
  try {
    const [product] = await db
      .select({ id: institutionalProducts.id })
      .from(institutionalProducts)
      .where(eq(institutionalProducts.productKey, productKey))
      .limit(1);

    if (!product) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Product registry entry is missing for ${productKey}.`,
      });
    }

    const [capability] = await db
      .select({
        capabilityClass: institutionalProductCapabilities.capabilityClass,
        renewalPolicy: institutionalProductCapabilities.renewalPolicy,
      })
      .from(institutionalProductCapabilities)
      .where(
        and(
          eq(institutionalProductCapabilities.productId, product.id),
          eq(institutionalProductCapabilities.capabilityKey, capabilityKey),
          eq(institutionalProductCapabilities.status, "active"),
        ),
      )
      .limit(1);

    if (!capability) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Product capability is not registered: ${capabilityKey}.`,
      });
    }

    const [grant] = await db
      .select({
        entitlementStatus: institutionProductEntitlements.entitlementStatus,
        subscriptionStatus: institutionProductSubscriptions.subscriptionStatus,
      })
      .from(institutionProductEntitlements)
      .leftJoin(
        institutionProductSubscriptions,
        eq(institutionProductSubscriptions.id, institutionProductEntitlements.subscriptionId),
      )
      .where(
        and(
          eq(institutionProductEntitlements.institutionalAccountId, institutionId),
          eq(institutionProductEntitlements.productId, product.id),
          eq(institutionProductEntitlements.capabilityKey, capabilityKey),
        ),
      )
      .limit(1);

    const currentSubscriptionStatus = subscriptionStatus(grant?.subscriptionStatus);
    const currentEntitlementStatus = entitlementStatus(grant?.entitlementStatus);
    const mode = resolveProductAccessMode({
      subscriptionStatus: currentSubscriptionStatus,
      entitlementStatus: currentEntitlementStatus,
      capabilityClass: capability.capabilityClass,
      renewalPolicy: capability.renewalPolicy,
    });

    if (mode === "blocked" || !grant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This institution does not have access to ${productKey}. Renew or activate the product in Administration → Billing & Subscription.`,
      });
    }

    return {
      productKey,
      capabilityKey,
      subscriptionStatus: currentSubscriptionStatus,
      entitlementStatus: currentEntitlementStatus,
      mode,
      legacyFallback: false,
    };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return {
      productKey,
      capabilityKey,
      subscriptionStatus: "legacy_unclassified",
      entitlementStatus: "active",
      mode: "legacy_fallback",
      legacyFallback: true,
    };
  }
}

export function assertWritableProductAccess(decision: ProductAccessDecision): void {
  if (decision.mode === "read_only") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This ${decision.productKey} capability is currently read-only. Renew the product to make changes.`,
    });
  }
}
