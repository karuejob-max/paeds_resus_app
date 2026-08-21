import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  institutionEntitlementAuditLog,
  institutionProductEntitlements,
  institutionalProductPlans,
  institutionProductSubscriptions,
  institutionSubscriptionEvents,
  institutionalProductCapabilities,
  institutionalProducts,
} from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { isMissingTableError } from "../lib/is-missing-db-table";
import type { InstitutionalProductKey, ProductSubscriptionStatus } from "../lib/institution-entitlements";

const PRODUCT_KEYS: InstitutionalProductKey[] = ["iers", "cpd_portal", "connected_services"];
const SUBSCRIPTION_STATUSES: ProductSubscriptionStatus[] = [
  "trial",
  "active",
  "grace",
  "past_due",
  "expired",
  "suspended",
  "cancelled",
  "legacy_unclassified",
  "not_subscribed",
];

const CONNECTED_SERVICES = [
  { serviceKey: "safe_truth", displayName: "Safe Truth", description: "Patient-safety reporting remains available through the provider workflow while its institutional product boundary is reviewed.", owner: "Paeds Resus clinical governance", lifecycleStatus: "transitional", routeKey: "/safe-truth", reviewLabel: "Review product home before pilot expansion" },
  { serviceKey: "care_code_signal", displayName: "Care Signal & Code Signal", description: "Clinical learning signals feed institutional quality improvement without copying patient identifiers into IERS evidence.", owner: "IERS quality improvement", lifecycleStatus: "connected", routeKey: "/care-signal", reviewLabel: "Connected to IERS QI" },
  { serviceKey: "training_certification", displayName: "Training & certification", description: "AHA courses and individual learning remain separate from institutional IERS and CPD Portal subscriptions.", owner: "Training operations", lifecycleStatus: "connected", routeKey: "/aha-courses", reviewLabel: "Separate learner product" },
  { serviceKey: "legacy_dashboard", displayName: "Legacy institutional dashboard", description: "The former all-in-one portal remains available during migration so mature workflows are not orphaned.", owner: "Platform migration", lifecycleStatus: "compatibility", routeKey: "/hospital-admin-dashboard", reviewLabel: "Compatibility route — migrate deliberately" },
] as const;

const FALLBACK_CATALOG = [
  {
    productKey: "iers" as const,
    displayName: "Institutional Emergency Readiness System",
    description: "Emergency readiness, team response, evidence, and institutional learning.",
    productKind: "core",
    lifecycleStatus: "active",
    routeKey: "/institution/iers",
    subscriptionStatus: "legacy_unclassified" as const,
    planName: null,
    startsAt: null,
    renewsAt: null,
    expiresAt: null,
    graceEndsAt: null,
    accessLabel: "Continuity access — product ledger pending",
    capabilityCount: 0,
  },
  {
    productKey: "cpd_portal" as const,
    displayName: "CPD Portal",
    description: "Staff professional development, certificates, points, and decision intelligence.",
    productKind: "core",
    lifecycleStatus: "active",
    routeKey: "/institution/cpd",
    subscriptionStatus: "legacy_unclassified" as const,
    planName: null,
    startsAt: null,
    renewsAt: null,
    expiresAt: null,
    graceEndsAt: null,
    accessLabel: "Continuity access — product ledger pending",
    capabilityCount: 0,
  },
  {
    productKey: "connected_services" as const,
    displayName: "Connected Services",
    description: "Adjacent and transitional Paeds Resus services under managed review.",
    productKind: "transitional",
    lifecycleStatus: "pilot",
    routeKey: "/institution/connected",
    subscriptionStatus: "not_subscribed" as const,
    planName: null,
    startsAt: null,
    renewsAt: null,
    expiresAt: null,
    graceEndsAt: null,
    accessLabel: "Available services are reviewed individually",
    capabilityCount: 0,
  },
];

function statusLabel(status: ProductSubscriptionStatus): string {
  switch (status) {
    case "active": return "Active";
    case "trial": return "Trial";
    case "grace": return "Renewal due — grace period";
    case "past_due": return "Payment past due";
    case "expired": return "Expired — history preserved";
    case "suspended": return "Suspended";
    case "cancelled": return "Cancelled";
    case "not_subscribed": return "Not subscribed";
    case "legacy_unclassified": return "Legacy access pending review";
  }
}

function validProductKey(value: string): InstitutionalProductKey {
  if (!PRODUCT_KEYS.includes(value as InstitutionalProductKey)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown institutional product: ${value}` });
  }
  return value as InstitutionalProductKey;
}

function validSubscriptionStatus(value: string): ProductSubscriptionStatus {
  if (!SUBSCRIPTION_STATUSES.includes(value as ProductSubscriptionStatus)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown subscription status: ${value}` });
  }
  return value as ProductSubscriptionStatus;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

export const institutionProductsRouter = router({
  /** Transitional portfolio read: every non-core service has an owner and an explicit lifecycle state. */
  getConnectedServices: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      return CONNECTED_SERVICES;
    }),

  /** Shared administration read: product status is visible even when one product is not subscribed. */
  getCatalog: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);

      try {
        const products = await db
          .select({
            productId: institutionalProducts.id,
            productKey: institutionalProducts.productKey,
            displayName: institutionalProducts.displayName,
            description: institutionalProducts.description,
            productKind: institutionalProducts.productKind,
            lifecycleStatus: institutionalProducts.lifecycleStatus,
            routeKey: institutionalProducts.routeKey,
            subscriptionStatus: institutionProductSubscriptions.subscriptionStatus,
            planName: institutionalProductPlans.displayName,
            startsAt: institutionProductSubscriptions.startsAt,
            renewsAt: institutionProductSubscriptions.renewsAt,
            expiresAt: institutionProductSubscriptions.expiresAt,
            graceEndsAt: institutionProductSubscriptions.graceEndsAt,
          })
          .from(institutionalProducts)
          .leftJoin(
            institutionProductSubscriptions,
            and(
              eq(institutionProductSubscriptions.productId, institutionalProducts.id),
              eq(institutionProductSubscriptions.institutionalAccountId, input.institutionId),
            ),
          )
          .leftJoin(institutionalProductPlans, eq(institutionalProductPlans.id, institutionProductSubscriptions.planId))
          .orderBy(institutionalProducts.id);

        const capabilityRows = await db
          .select({ productId: institutionalProductCapabilities.productId })
          .from(institutionalProductCapabilities)
          .where(eq(institutionalProductCapabilities.status, "active"));
        const capabilityCounts = new Map<number, number>();
        for (const row of capabilityRows) capabilityCounts.set(row.productId, (capabilityCounts.get(row.productId) ?? 0) + 1);

        return products.map((product) => {
          const productKey = validProductKey(product.productKey);
          const subscriptionStatus = validSubscriptionStatus(product.subscriptionStatus ?? "not_subscribed");
          return {
            ...product,
            productKey,
            subscriptionStatus,
            accessLabel: statusLabel(subscriptionStatus),
            capabilityCount: capabilityCounts.get(product.productId) ?? 0,
          };
        });
      } catch (error) {
        if (!isMissingTableError(error)) throw error;
        return FALLBACK_CATALOG;
      }
    }),

  /** Shared administration read: immutable subscription history for billing and support. */
  listSubscriptionEvents: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), productKey: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      try {
        const predicates = [eq(institutionSubscriptionEvents.institutionalAccountId, input.institutionId)];
        if (input.productKey) {
          const productKey = validProductKey(input.productKey);
          const [product] = await db
            .select({ id: institutionalProducts.id })
            .from(institutionalProducts)
            .where(eq(institutionalProducts.productKey, productKey))
            .limit(1);
          if (!product) return [];
          predicates.push(eq(institutionSubscriptionEvents.productId, product.id));
        }
        return db
          .select()
          .from(institutionSubscriptionEvents)
          .where(and(...predicates))
          .orderBy(desc(institutionSubscriptionEvents.occurredAt))
          .limit(100);
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  /** Shared administration mutation: change a subscription only through an auditable status event. */
  setSubscriptionStatus: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.string(),
      subscriptionStatus: z.string(),
      planKey: z.string().trim().max(64).optional(),
      startsAt: z.coerce.date().optional(),
      renewsAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
      graceEndsAt: z.coerce.date().optional(),
      reason: z.string().trim().min(3).max(1000),
      reference: z.string().trim().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform administrators can change subscription status." });
      }
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const productKey = validProductKey(input.productKey);
      const subscriptionStatus = validSubscriptionStatus(input.subscriptionStatus);

      const [product] = await db
        .select({ id: institutionalProducts.id })
        .from(institutionalProducts)
        .where(eq(institutionalProducts.productKey, productKey))
        .limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Institutional product is not registered." });

      let planId: number | null = null;
      if (input.planKey) {
        const [plan] = await db
          .select({ id: institutionalProductPlans.id })
          .from(institutionalProductPlans)
          .where(and(eq(institutionalProductPlans.productId, product.id), eq(institutionalProductPlans.planKey, input.planKey)))
          .limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Product plan is not registered." });
        planId = plan.id;
      }

      const [previous] = await db
        .select({ id: institutionProductSubscriptions.id, subscriptionStatus: institutionProductSubscriptions.subscriptionStatus })
        .from(institutionProductSubscriptions)
        .where(and(eq(institutionProductSubscriptions.institutionalAccountId, input.institutionId), eq(institutionProductSubscriptions.productId, product.id)))
        .limit(1);

      await db
        .insert(institutionProductSubscriptions)
        .values({
          institutionalAccountId: input.institutionId,
          productId: product.id,
          planId,
          subscriptionStatus,
          startsAt: input.startsAt ?? null,
          renewsAt: input.renewsAt ?? null,
          expiresAt: input.expiresAt ?? null,
          graceEndsAt: input.graceEndsAt ?? null,
          source: "manual_override",
          externalReference: input.reference ?? null,
          notes: input.reason,
        })
        .onDuplicateKeyUpdate({
          set: {
            planId,
            subscriptionStatus,
            startsAt: input.startsAt ?? null,
            renewsAt: input.renewsAt ?? null,
            expiresAt: input.expiresAt ?? null,
            graceEndsAt: input.graceEndsAt ?? null,
            source: "manual_override",
            externalReference: input.reference ?? null,
            notes: input.reason,
            updatedAt: new Date(),
          },
        });

      const [subscription] = await db
        .select({ id: institutionProductSubscriptions.id })
        .from(institutionProductSubscriptions)
        .where(and(eq(institutionProductSubscriptions.institutionalAccountId, input.institutionId), eq(institutionProductSubscriptions.productId, product.id)))
        .limit(1);

      const capabilityRows = await db
        .select({ id: institutionalProductCapabilities.id, capabilityKey: institutionalProductCapabilities.capabilityKey })
        .from(institutionalProductCapabilities)
        .where(and(eq(institutionalProductCapabilities.productId, product.id), eq(institutionalProductCapabilities.status, "active")));
      for (const capability of capabilityRows) {
        await db
          .insert(institutionProductEntitlements)
          .values({
            institutionalAccountId: input.institutionId,
            productId: product.id,
            subscriptionId: subscription?.id ?? null,
            capabilityKey: capability.capabilityKey,
            entitlementStatus: "active",
          })
          .onDuplicateKeyUpdate({ set: { subscriptionId: subscription?.id ?? null, updatedAt: new Date() } });
      }

      await db.insert(institutionSubscriptionEvents).values({
        institutionalAccountId: input.institutionId,
        productId: product.id,
        subscriptionId: subscription?.id ?? null,
        eventType: previous ? "manual_override" : "created",
        previousStatus: previous?.subscriptionStatus ?? null,
        currentStatus: subscriptionStatus,
        actorUserId: ctx.user.id,
        reason: input.reason,
        reference: input.reference ?? null,
      });

      await db.insert(institutionEntitlementAuditLog).values({
        institutionalAccountId: input.institutionId,
        productId: product.id,
        capabilityKey: `${productKey}.*`,
        decision: "override",
        userId: ctx.user.id,
        reason: input.reason,
        metadata: JSON.stringify({ subscriptionStatus, planKey: input.planKey ?? null }),
      });

      return { success: true as const, productKey, subscriptionStatus };
    }),
});
