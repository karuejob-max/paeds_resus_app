import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or } from "drizzle-orm";
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
  institutionProductRoles,
  institutionAccountScopes,
  institutionAccountScopeEvents,
  institutionDataLifecyclePolicies,
  institutionDataLifecycleRequests,
  iersActivationEvents,
  iersEvidenceRecords,
  iersActionItems,
  iersDrills,
  iersImplementationMilestones,
  cpdEvents,
  cpdAttendees,
  institutionSubscriptionPayments,
  institutionSubscriptionPaymentIntents,
  institutionRenewalNotificationPreferences,
  institutionRenewalNotifications,
  institutionConnectedServices,
  institutionConnectedServiceEvents,
  safeTruthGovernancePolicies,
  safeTruthGovernancePolicyEvents,
} from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { assertInstitutionProductCapability, type InstitutionalProductKey, type ProductSubscriptionStatus } from "../lib/institution-entitlements";
import { assertInstitutionProductRole, isKnownProductRole, PRODUCT_ROLE_DEFINITIONS, type InstitutionalProductRoleKey, type InstitutionalProductRoleStatus } from "../lib/institution-product-roles";
import { queueRenewalNotifications } from "../lib/institution-renewal-notifications";
import { getMpesaService } from "../services/mpesa";
import { assertInstitutionAccountScope, INSTITUTION_ACCOUNT_SCOPE_DEFINITIONS, isKnownInstitutionAccountScope, type InstitutionAccountScopeKey, type InstitutionAccountScopeStatus } from "../lib/institution-account-scopes";

const PRODUCT_KEYS: InstitutionalProductKey[] = ["iers", "cpd_portal", "connected_services"];
const LIFECYCLE_PRODUCT_KEYS = ["iers", "cpd_portal"] as const;
type LifecycleProductKey = (typeof LIFECYCLE_PRODUCT_KEYS)[number];
type LifecycleRequestProductKey = LifecycleProductKey | "all";

function validLifecycleProductKey(value: string): LifecycleProductKey {
  if (!LIFECYCLE_PRODUCT_KEYS.includes(value as LifecycleProductKey)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Lifecycle controls are available only for IERS or CPD Portal." });
  }
  return value as LifecycleProductKey;
}

function validLifecycleRequestProductKey(value: string): LifecycleRequestProductKey {
  if (value === "all") return value;
  return validLifecycleProductKey(value);
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\\n\\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  return [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\\r\\n");
}
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

const FALLBACK_SAFE_TRUTH_POLICY = {
  policyKey: "safe_truth_public_submission",
  boundaryStatus: "accountless_public" as const,
  allowedRoute: "/parent-safe-truth",
  institutionalAnalyticsAllowed: false,
  patientIdentifiersAllowed: false,
  providerLinkageAllowed: false,
  policyVersion: "1.0",
  notes: "Accountless public safety reporting. Do not use this route for emergency dispatch, institutional roster access, or patient-identifying analytics.",
};

const FALLBACK_CONNECTED_SERVICES = [
  { serviceKey: "safe_truth", displayName: "Safe Truth", description: "Patient-safety reporting remains separate from institutional analytics while its product boundary is governed.", owner: "Paeds Resus clinical governance", lifecycleStatus: "transitional", privacyClass: "accountless_public", entitlementProductKey: null, routeKey: "/parent-safe-truth", reviewLabel: "Accountless public route; not emergency dispatch", lastReviewedAt: null, nextReviewAt: null, enabled: true },
  { serviceKey: "care_code_signal", displayName: "Care Signal & Code Signal", description: "Clinical learning signals feed institutional quality improvement without copying patient identifiers into IERS evidence.", owner: "IERS quality improvement", lifecycleStatus: "connected", privacyClass: "institutional_aggregate", entitlementProductKey: "iers", routeKey: "/care-signal", reviewLabel: "Connected to IERS QI", lastReviewedAt: null, nextReviewAt: null, enabled: true },
  { serviceKey: "training_certification", displayName: "Training & certification", description: "AHA courses and individual learning remain separate from institutional IERS and CPD Portal subscriptions.", owner: "Training operations", lifecycleStatus: "connected", privacyClass: "individual_learning", entitlementProductKey: null, routeKey: "/aha-courses", reviewLabel: "Separate learner product", lastReviewedAt: null, nextReviewAt: null, enabled: true },
  { serviceKey: "legacy_dashboard", displayName: "Legacy institutional dashboard", description: "The former all-in-one portal remains available only as a compatibility surface while mature workflows are migrated.", owner: "Platform migration", lifecycleStatus: "compatibility", privacyClass: "mixed_review_required", entitlementProductKey: null, routeKey: "/hospital-admin-dashboard", reviewLabel: "Compatibility route — migrate deliberately", lastReviewedAt: null, nextReviewAt: null, enabled: true },
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
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "connected_services", ["connected_services_viewer", "connected_services_manager"]);
      try {
        const services = await db.select().from(institutionConnectedServices).where(eq(institutionConnectedServices.enabled, true)).orderBy(institutionConnectedServices.serviceKey);
        return services.length ? services : FALLBACK_CONNECTED_SERVICES;
      } catch (error) {
        if (isMissingTableError(error)) return FALLBACK_CONNECTED_SERVICES;
        throw error;
      }
    }),

  getSafeTruthGovernancePolicy: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionProductRole(db, ctx.user, input.institutionId, "connected_services", ["connected_services_viewer", "connected_services_manager"]);
      try {
        const [policy] = await db.select().from(safeTruthGovernancePolicies).where(eq(safeTruthGovernancePolicies.policyKey, "safe_truth_public_submission")).limit(1);
        return policy ?? FALLBACK_SAFE_TRUTH_POLICY;
      } catch (error) {
        if (isMissingTableError(error)) return FALLBACK_SAFE_TRUTH_POLICY;
        throw error;
      }
    }),

  listConnectedServiceEvents: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), serviceKey: z.string().trim().min(1).max(64).optional() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (ctx.user.role !== "admin") return [];
      try {
        const services = await db.select({ id: institutionConnectedServices.id, serviceKey: institutionConnectedServices.serviceKey }).from(institutionConnectedServices);
        const serviceIds = input.serviceKey ? services.filter((service) => service.serviceKey === input.serviceKey).map((service) => service.id) : services.map((service) => service.id);
        if (!serviceIds.length) return [];
        return db.select().from(institutionConnectedServiceEvents).where(inArray(institutionConnectedServiceEvents.serviceId, serviceIds)).orderBy(desc(institutionConnectedServiceEvents.occurredAt)).limit(100);
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  updateConnectedService: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      serviceKey: z.string().trim().min(1).max(64),
      lifecycleStatus: z.enum(["connected", "transitional", "compatibility", "pilot", "retired"]),
      privacyClass: z.enum(["institutional_aggregate", "provider_workflow", "accountless_public", "individual_learning", "mixed_review_required"]),
      owner: z.string().trim().min(3).max(255),
      routeKey: z.string().trim().max(255).optional(),
      reviewLabel: z.string().trim().max(255).optional(),
      nextReviewAt: z.coerce.date().optional(),
      enabled: z.boolean(),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform administrators can govern Connected Services." });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [current] = await db.select().from(institutionConnectedServices).where(eq(institutionConnectedServices.serviceKey, input.serviceKey)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Connected Service is not registered." });
      const now = new Date();
      await db.update(institutionConnectedServices).set({ lifecycleStatus: input.lifecycleStatus, privacyClass: input.privacyClass, owner: input.owner, routeKey: input.routeKey ?? null, reviewLabel: input.reviewLabel ?? null, nextReviewAt: input.nextReviewAt ?? null, lastReviewedAt: now, enabled: input.enabled, updatedAt: now }).where(eq(institutionConnectedServices.id, current.id));
      await db.insert(institutionConnectedServiceEvents).values({ serviceId: current.id, eventType: current.lifecycleStatus === input.lifecycleStatus ? "reviewed" : "status_changed", previousStatus: current.lifecycleStatus, currentStatus: input.lifecycleStatus, actorUserId: ctx.user.id, reason: input.reason, occurredAt: now });
      return { success: true as const, serviceKey: input.serviceKey, lifecycleStatus: input.lifecycleStatus };
    }),

  updateSafeTruthGovernancePolicy: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      boundaryStatus: z.enum(["accountless_public", "provider_workflow", "institutional_aggregate", "mixed_review_required"]),
      allowedRoute: z.string().trim().min(1).max(255),
      institutionalAnalyticsAllowed: z.boolean(),
      patientIdentifiersAllowed: z.boolean(),
      providerLinkageAllowed: z.boolean(),
      retentionDays: z.number().int().positive().optional(),
      policyVersion: z.string().trim().min(1).max(32),
      notes: z.string().trim().max(2000).optional(),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform administrators can govern the Safe Truth boundary." });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (input.boundaryStatus === "accountless_public" && (input.institutionalAnalyticsAllowed || input.patientIdentifiersAllowed || input.providerLinkageAllowed)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Accountless public Safe Truth cannot enable institutional analytics, patient identifiers, or provider linkage." });
      }
      const [current] = await db.select().from(safeTruthGovernancePolicies).where(eq(safeTruthGovernancePolicies.policyKey, "safe_truth_public_submission")).limit(1);
      const now = new Date();
      await db.insert(safeTruthGovernancePolicies).values({ policyKey: "safe_truth_public_submission", boundaryStatus: input.boundaryStatus, allowedRoute: input.allowedRoute, institutionalAnalyticsAllowed: input.institutionalAnalyticsAllowed, patientIdentifiersAllowed: input.patientIdentifiersAllowed, providerLinkageAllowed: input.providerLinkageAllowed, retentionDays: input.retentionDays ?? null, policyVersion: input.policyVersion, approvedByUserId: ctx.user.id, approvedAt: now, notes: input.notes ?? null }).onDuplicateKeyUpdate({ set: { boundaryStatus: input.boundaryStatus, allowedRoute: input.allowedRoute, institutionalAnalyticsAllowed: input.institutionalAnalyticsAllowed, patientIdentifiersAllowed: input.patientIdentifiersAllowed, providerLinkageAllowed: input.providerLinkageAllowed, retentionDays: input.retentionDays ?? null, policyVersion: input.policyVersion, approvedByUserId: ctx.user.id, approvedAt: now, notes: input.notes ?? null, updatedAt: now } });
      const [policy] = await db.select({ id: safeTruthGovernancePolicies.id }).from(safeTruthGovernancePolicies).where(eq(safeTruthGovernancePolicies.policyKey, "safe_truth_public_submission")).limit(1);
      await db.insert(safeTruthGovernancePolicyEvents).values({ policyId: policy?.id ?? 0, eventType: current ? "updated" : "created", previousVersion: current?.policyVersion ?? null, currentVersion: input.policyVersion, actorUserId: ctx.user.id, reason: input.reason, occurredAt: now });
      return { success: true as const, policyKey: "safe_truth_public_submission", policyVersion: input.policyVersion, boundaryStatus: input.boundaryStatus };
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
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });
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

  /** Product-role catalog used by Administration → People & roles. */
  getRoleDefinitions: protectedProcedure
    .input(z.object({ productKey: z.string() }))
    .query(({ input }) => {
      const productKey = validProductKey(input.productKey);
      return PRODUCT_ROLE_DEFINITIONS[productKey];
    }),

  /** Shared administration read: active, invited, suspended, and ended product roles. */
  listProductRoles: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), productKey: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      try {
        const predicates = [eq(institutionProductRoles.institutionalAccountId, input.institutionId)];
        if (input.productKey) {
          const productKey = validProductKey(input.productKey);
          const [product] = await db
            .select({ id: institutionalProducts.id })
            .from(institutionalProducts)
            .where(eq(institutionalProducts.productKey, productKey))
            .limit(1);
          if (!product) return [];
          predicates.push(eq(institutionProductRoles.productId, product.id));
        }
        return db
          .select({
            id: institutionProductRoles.id,
            productKey: institutionalProducts.productKey,
            productName: institutionalProducts.displayName,
            userId: institutionProductRoles.userId,
            invitedEmail: institutionProductRoles.invitedEmail,
            roleKey: institutionProductRoles.roleKey,
            roleStatus: institutionProductRoles.roleStatus,
            grantedByUserId: institutionProductRoles.grantedByUserId,
            grantedAt: institutionProductRoles.grantedAt,
            endedAt: institutionProductRoles.endedAt,
          })
          .from(institutionProductRoles)
          .innerJoin(institutionalProducts, eq(institutionalProducts.id, institutionProductRoles.productId))
          .where(and(...predicates))
          .orderBy(desc(institutionProductRoles.updatedAt));
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  /** Institution administrator: grant or reactivate one product role. */
  grantProductRole: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.string(),
      invitedEmail: z.string().trim().email().max(320),
      userId: z.number().int().positive().optional(),
      roleKey: z.string().trim().min(3).max(128),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const productKey = validProductKey(input.productKey);
      if (!isKnownProductRole(productKey, input.roleKey)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Role ${input.roleKey} is not valid for ${productKey}.` });
      }
      const [product] = await db
        .select({ id: institutionalProducts.id })
        .from(institutionalProducts)
        .where(eq(institutionalProducts.productKey, productKey))
        .limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Institutional product is not registered." });

      const invitedEmail = input.invitedEmail.toLowerCase();
      await db
        .insert(institutionProductRoles)
        .values({
          institutionalAccountId: input.institutionId,
          productId: product.id,
          userId: input.userId ?? null,
          invitedEmail,
          roleKey: input.roleKey,
          roleStatus: "active",
          grantedByUserId: ctx.user.id,
          grantedAt: new Date(),
          endedAt: null,
        })
        .onDuplicateKeyUpdate({
          set: {
            userId: input.userId ?? null,
            roleStatus: "active",
            grantedByUserId: ctx.user.id,
            grantedAt: new Date(),
            endedAt: null,
            updatedAt: new Date(),
          },
        });

      await db.insert(institutionEntitlementAuditLog).values({
        institutionalAccountId: input.institutionId,
        productId: product.id,
        capabilityKey: `${productKey}.role.${input.roleKey}`,
        decision: "override",
        userId: ctx.user.id,
        reason: "Product role granted or reactivated by institution administrator.",
        metadata: JSON.stringify({ invitedEmail, userId: input.userId ?? null, roleKey: input.roleKey }),
      });
      return { success: true as const, productKey, roleKey: input.roleKey as InstitutionalProductRoleKey, invitedEmail };
    }),

  /** Institution administrator: suspend or end a product role without deleting its audit history. */
  setProductRoleStatus: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      roleId: z.number().int().positive(),
      roleStatus: z.enum(["invited", "active", "suspended", "ended"]),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const [role] = await db
        .select({ id: institutionProductRoles.id, productId: institutionProductRoles.productId, roleKey: institutionProductRoles.roleKey })
        .from(institutionProductRoles)
        .where(and(eq(institutionProductRoles.id, input.roleId), eq(institutionProductRoles.institutionalAccountId, input.institutionId)))
        .limit(1);
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Product role not found." });

      await db.update(institutionProductRoles).set({
        roleStatus: input.roleStatus as InstitutionalProductRoleStatus,
        endedAt: input.roleStatus === "ended" ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(institutionProductRoles.id, input.roleId));
      await db.insert(institutionEntitlementAuditLog).values({
        institutionalAccountId: input.institutionId,
        productId: role.productId,
        capabilityKey: `role.${role.roleKey}`,
        decision: "override",
        userId: ctx.user.id,
        reason: input.reason,
        metadata: JSON.stringify({ roleId: input.roleId, roleStatus: input.roleStatus }),
      });
      return { success: true as const, roleStatus: input.roleStatus };
    }),

  /** Shared account-scope catalog used by Administration → People & roles. */
  getAccountScopeDefinitions: protectedProcedure
    .query(() => INSTITUTION_ACCOUNT_SCOPE_DEFINITIONS),

  /** Shared administration read: account, finance, QI, accreditation, and reporting scopes. */
  listAccountScopes: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin", "report_viewer"], { allowInstitutionAdmin: true });
      try {
        return await db
          .select()
          .from(institutionAccountScopes)
          .where(eq(institutionAccountScopes.institutionalAccountId, input.institutionId))
          .orderBy(desc(institutionAccountScopes.updatedAt));
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  /** Institution administrator: grant or reactivate one shared account scope. */
  grantAccountScope: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      invitedEmail: z.string().trim().email().max(320),
      userId: z.number().int().positive().optional(),
      scopeKey: z.string().trim().min(3).max(64),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      if (!isKnownInstitutionAccountScope(input.scopeKey)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown institution scope: ${input.scopeKey}.` });
      }
      const invitedEmail = input.invitedEmail.toLowerCase();
      await db
        .insert(institutionAccountScopes)
        .values({
          institutionalAccountId: input.institutionId,
          userId: input.userId ?? null,
          invitedEmail,
          scopeKey: input.scopeKey,
          scopeStatus: "active",
          grantedByUserId: ctx.user.id,
          grantedAt: new Date(),
          endedAt: null,
        })
        .onDuplicateKeyUpdate({
          set: {
            userId: input.userId ?? null,
            scopeStatus: "active",
            grantedByUserId: ctx.user.id,
            grantedAt: new Date(),
            endedAt: null,
            updatedAt: new Date(),
          },
        });
      const [scope] = await db
        .select({ id: institutionAccountScopes.id, scopeStatus: institutionAccountScopes.scopeStatus })
        .from(institutionAccountScopes)
        .where(and(
          eq(institutionAccountScopes.institutionalAccountId, input.institutionId),
          eq(institutionAccountScopes.invitedEmail, invitedEmail),
          eq(institutionAccountScopes.scopeKey, input.scopeKey),
        ))
        .limit(1);
      if (!scope) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Institution scope could not be saved." });
      await db.insert(institutionAccountScopeEvents).values({
        institutionalAccountId: input.institutionId,
        scopeId: scope.id,
        eventType: "granted",
        previousStatus: null,
        currentStatus: scope.scopeStatus,
        actorUserId: ctx.user.id,
        reason: "Shared institution scope granted or reactivated by an institution administrator.",
      });
      return { success: true as const, scopeKey: input.scopeKey as InstitutionAccountScopeKey, invitedEmail };
    }),

  /** Institution administrator: suspend or end a shared account scope without deleting history. */
  setAccountScopeStatus: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      scopeId: z.number().int().positive(),
      scopeStatus: z.enum(["invited", "active", "suspended", "ended"]),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const [scope] = await db
        .select({ id: institutionAccountScopes.id, scopeStatus: institutionAccountScopes.scopeStatus, scopeKey: institutionAccountScopes.scopeKey })
        .from(institutionAccountScopes)
        .where(and(
          eq(institutionAccountScopes.id, input.scopeId),
          eq(institutionAccountScopes.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Institution scope not found." });
      await db.update(institutionAccountScopes).set({
        scopeStatus: input.scopeStatus as InstitutionAccountScopeStatus,
        endedAt: input.scopeStatus === "ended" ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(institutionAccountScopes.id, scope.id));
      await db.insert(institutionAccountScopeEvents).values({
        institutionalAccountId: input.institutionId,
        scopeId: scope.id,
        eventType: "status_changed",
        previousStatus: scope.scopeStatus,
        currentStatus: input.scopeStatus,
        actorUserId: ctx.user.id,
        reason: input.reason,
      });
      return { success: true as const, scopeStatus: input.scopeStatus };
    }),

  /** Platform/institution administrators: view the append-only scope history. */
  listAccountScopeEvents: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), scopeId: z.number().int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin", "report_viewer"], { allowInstitutionAdmin: true });
      try {
        const predicates = [eq(institutionAccountScopeEvents.institutionalAccountId, input.institutionId)];
        if (input.scopeId) predicates.push(eq(institutionAccountScopeEvents.scopeId, input.scopeId));
        return await db.select().from(institutionAccountScopeEvents).where(and(...predicates)).orderBy(desc(institutionAccountScopeEvents.occurredAt)).limit(200);
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  /** Read product-scoped retention policies and the append-only lifecycle request history. */
  getDataLifecycle: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin", "finance_officer", "report_viewer"], { allowInstitutionAdmin: true });
      try {
        const [policies, requests] = await Promise.all([
          db.select().from(institutionDataLifecyclePolicies).where(eq(institutionDataLifecyclePolicies.institutionalAccountId, input.institutionId)).orderBy(institutionDataLifecyclePolicies.productKey),
          db.select().from(institutionDataLifecycleRequests).where(eq(institutionDataLifecycleRequests.institutionalAccountId, input.institutionId)).orderBy(desc(institutionDataLifecycleRequests.createdAt)).limit(100),
        ]);
        return { policies, requests };
      } catch (error) {
        if (isMissingTableError(error)) return { policies: [], requests: [] };
        throw error;
      }
    }),

  /** Institution administrator: change a product retention policy without deleting records. */
  updateDataLifecyclePolicy: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.string(),
      retentionDays: z.number().int().min(30).max(3650),
      legalHold: z.boolean(),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin", "finance_officer"], { allowInstitutionAdmin: true });
      const productKey = validLifecycleProductKey(input.productKey);
      await db.insert(institutionDataLifecyclePolicies).values({
        institutionalAccountId: input.institutionId,
        productKey,
        retentionDays: input.retentionDays,
        legalHold: input.legalHold,
        updatedByUserId: ctx.user.id,
      }).onDuplicateKeyUpdate({
        set: { retentionDays: input.retentionDays, legalHold: input.legalHold, updatedByUserId: ctx.user.id, updatedAt: new Date() },
      });
      await db.insert(institutionDataLifecycleRequests).values({
        institutionalAccountId: input.institutionId,
        productKey,
        requestType: "retention_change",
        status: "completed",
        requestedByUserId: ctx.user.id,
        reviewedByUserId: ctx.user.id,
        reason: input.reason,
        metadata: JSON.stringify({ retentionDays: input.retentionDays, legalHold: input.legalHold }),
        completedAt: new Date(),
      });
      return { success: true as const, productKey, retentionDays: input.retentionDays, legalHold: input.legalHold };
    }),

  /** Create a deliberate, reviewable recovery or offboarding request. No data is deleted automatically. */
  requestDataLifecycle: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.string(),
      requestType: z.enum(["recovery", "offboarding"]),
      reason: z.string().trim().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin"], { allowInstitutionAdmin: true });
      const productKey = validLifecycleRequestProductKey(input.productKey);
      const result = await db.insert(institutionDataLifecycleRequests).values({
        institutionalAccountId: input.institutionId,
        productKey,
        requestType: input.requestType,
        status: "requested",
        requestedByUserId: ctx.user.id,
        reason: input.reason,
        metadata: JSON.stringify({ destructiveAction: false, requiresPlatformReview: true }),
      });
      return { success: true as const, requestId: (result as unknown as { insertId: number }).insertId, status: "requested" as const };
    }),

  /** Platform administrator: review and progress a recovery or offboarding request without deleting data automatically. */
  reviewDataLifecycleRequest: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      requestId: z.number().int().positive(),
      status: z.enum(["approved", "in_progress", "completed", "cancelled"]),
      reviewNote: z.string().trim().min(3).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform administrators can review lifecycle requests." });
      const db = await requireDb();
      const [request] = await db.select({ id: institutionDataLifecycleRequests.id, status: institutionDataLifecycleRequests.status, requestType: institutionDataLifecycleRequests.requestType })
        .from(institutionDataLifecycleRequests)
        .where(and(
          eq(institutionDataLifecycleRequests.id, input.requestId),
          eq(institutionDataLifecycleRequests.institutionalAccountId, input.institutionId),
        ))
        .limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Lifecycle request not found for this institution." });
      if (request.status === "completed" && input.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A completed lifecycle request cannot be reopened or cancelled." });
      }
      const now = new Date();
      await db.update(institutionDataLifecycleRequests).set({
        status: input.status,
        reviewedByUserId: ctx.user.id,
        completedAt: input.status === "completed" ? now : null,
        metadata: JSON.stringify({ reviewed: true, requestType: request.requestType, reviewNote: input.reviewNote }),
        updatedAt: now,
      }).where(and(
        eq(institutionDataLifecycleRequests.id, input.requestId),
        eq(institutionDataLifecycleRequests.institutionalAccountId, input.institutionId),
      ));
      return { success: true as const, status: input.status };
    }),

  /** Institution administrator or explicit product role: export only the selected product’s structured records. */
  exportProductData: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), productKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const productKey = validLifecycleProductKey(input.productKey);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["account_admin", "finance_officer", "accreditation_reviewer", "report_viewer"], { allowInstitutionAdmin: true });
      const rows: Array<Record<string, unknown>> = [];
      if (productKey === "iers") {
        await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.reports.read");
        await assertInstitutionProductRole(db, ctx.user, input.institutionId, "iers", ["iers_viewer", "iers_coordinator", "iers_governance", "iers_reviewer", "iers_responder"]);
        const [events, evidence, actions, drills, milestones] = await Promise.all([
          db.select().from(iersActivationEvents).where(eq(iersActivationEvents.institutionalAccountId, input.institutionId)),
          db.select().from(iersEvidenceRecords).where(eq(iersEvidenceRecords.institutionId, input.institutionId)),
          db.select().from(iersActionItems).where(eq(iersActionItems.institutionId, input.institutionId)),
          db.select().from(iersDrills).where(eq(iersDrills.institutionId, input.institutionId)),
          db.select().from(iersImplementationMilestones).where(eq(iersImplementationMilestones.institutionId, input.institutionId)),
        ]);
        for (const event of events) rows.push({ record_type: "activation", id: event.id, subtype: event.activationType, status: event.status, priority: event.priority, title: "IERS activation", department: event.department, observed_at: event.triggeredAt, scheduled_at: "", source_type: event.source, source_id: "", due_date: "", closed_at: event.closedAt, reviewed_at: "" });
        for (const record of evidence) rows.push({ record_type: "evidence", id: record.id, subtype: record.evidenceType, status: record.status, priority: "", title: record.title, department: record.domain, observed_at: record.observedAt, scheduled_at: "", source_type: record.criterionCode, source_id: "", due_date: "", closed_at: "", reviewed_at: record.reviewedAt });
        for (const action of actions) rows.push({ record_type: "action", id: action.id, subtype: action.sourceType, status: action.status, priority: action.priority, title: action.title, department: "", observed_at: action.createdAt, scheduled_at: "", source_type: action.sourceType, source_id: action.sourceId, due_date: action.dueDate, closed_at: action.closedAt, reviewed_at: "" });
        for (const drill of drills) rows.push({ record_type: "drill", id: drill.id, subtype: drill.scenarioType, status: drill.status, priority: "", title: drill.title, department: "", observed_at: drill.startedAt, scheduled_at: drill.scheduledAt, source_type: "", source_id: "", due_date: "", closed_at: drill.endedAt, reviewed_at: "" });
        for (const milestone of milestones) rows.push({ record_type: "milestone", id: milestone.id, subtype: milestone.phaseName, status: milestone.status, priority: "", title: milestone.objective, department: "", observed_at: milestone.completedAt, scheduled_at: milestone.targetDate, source_type: "evidence", source_id: milestone.evidenceId, due_date: milestone.targetDate, closed_at: milestone.completedAt, reviewed_at: "" });
      } else {
        await assertInstitutionProductCapability(db, input.institutionId, "cpd_portal", "cpd.reports.read");
        await assertInstitutionProductRole(db, ctx.user, input.institutionId, "cpd_portal", ["cpd_viewer", "cpd_reporter", "cpd_coordinator", "cpd_reviewer"]);
        const [events, attendees] = await Promise.all([
          db.select().from(cpdEvents).where(eq(cpdEvents.institutionalAccountId, input.institutionId)),
          db.select().from(cpdAttendees).where(eq(cpdAttendees.institutionalAccountId, input.institutionId)),
        ]);
        for (const event of events) rows.push({ record_type: "cpd_event", id: event.id, subtype: event.eventType, status: event.isOpen ? "open" : "closed", priority: "", title: event.name, department: event.presenterDepartment, observed_at: event.openedAt, scheduled_at: event.eventDate, source_type: "", source_id: "", due_date: "", closed_at: event.closedAt, reviewed_at: "" });
        for (const attendee of attendees) rows.push({ record_type: "cpd_attendee", id: attendee.id, subtype: attendee.roleInEvent, status: attendee.checkInPunctuality, priority: "", title: attendee.fullName, department: attendee.department, observed_at: attendee.submittedAt, scheduled_at: "", source_type: attendee.cadre, source_id: attendee.email, due_date: "", closed_at: "", reviewed_at: "" });
      }

      const now = new Date();
      const content = buildCsv(["record_type", "id", "subtype", "status", "priority", "title", "department", "observed_at", "scheduled_at", "source_type", "source_id", "due_date", "closed_at", "reviewed_at"], rows);
      await db.insert(institutionDataLifecycleRequests).values({
        institutionalAccountId: input.institutionId,
        productKey,
        requestType: "export",
        status: "completed",
        requestedByUserId: ctx.user.id,
        reviewedByUserId: ctx.user.id,
        reason: `Product-scoped ${productKey} export generated by an authorized institution user.`,
        format: "csv",
        metadata: JSON.stringify({ recordCount: rows.length, excludesFreeTextNarrative: true }),
        exportedAt: now,
        completedAt: now,
      });
      return { success: true as const, productKey, recordCount: rows.length, filename: `institution-${input.institutionId}-${productKey}-export-${now.toISOString().slice(0, 10)}.csv`, content };
    }),

  /** Report delivery configuration without returning provider credentials or secrets. */
  getRenewalDeliveryCapabilities: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });
      return {
        inAppConfigured: true,
        emailConfigured: Boolean(process.env.SENDGRID_API_KEY?.trim() || process.env.MAILGUN_API_KEY?.trim() || (process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim())),
        smsConfigured: Boolean(process.env.INSTITUTION_SMS_WEBHOOK_URL?.trim() && process.env.INSTITUTION_SMS_WEBHOOK_TOKEN?.trim()),
        mpesaConfigured: Boolean(
          process.env.MPESA_CONSUMER_KEY?.trim() &&
          process.env.MPESA_CONSUMER_SECRET?.trim() &&
          process.env.MPESA_PASSKEY?.trim() &&
          (process.env.MPESA_SHORTCODE?.trim() || process.env.MPESA_PAYBILL?.trim() || process.env.DARAJA_SHORTCODE?.trim())
        ),
      };
    }),

  /** Institution administrator: read and update opt-in renewal-notification preferences. */
  getRenewalPreferences: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });
      try {
        return db.select().from(institutionRenewalNotificationPreferences).where(eq(institutionRenewalNotificationPreferences.institutionalAccountId, input.institutionId)).orderBy(institutionRenewalNotificationPreferences.productKey);
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  updateRenewalPreferences: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.enum(["iers", "cpd_portal"]),
      inAppEnabled: z.boolean(),
      emailEnabled: z.boolean(),
      smsEnabled: z.boolean(),
      reminderDays: z.array(z.number().int().min(0).max(365)).min(1).max(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });
      const reminderDays = Array.from(new Set(input.reminderDays)).sort((a, b) => b - a).join(",");
      await db.insert(institutionRenewalNotificationPreferences).values({
        institutionalAccountId: input.institutionId,
        productKey: input.productKey,
        inAppEnabled: input.inAppEnabled,
        emailEnabled: input.emailEnabled,
        smsEnabled: input.smsEnabled,
        reminderDays,
        updatedByUserId: ctx.user.id,
      }).onDuplicateKeyUpdate({
        set: { inAppEnabled: input.inAppEnabled, emailEnabled: input.emailEnabled, smsEnabled: input.smsEnabled, reminderDays, updatedByUserId: ctx.user.id, updatedAt: new Date() },
      });
      return { success: true as const, productKey: input.productKey, reminderDays };
    }),

  getRenewalNotifications: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });
      try {
        return db.select().from(institutionRenewalNotifications).where(eq(institutionRenewalNotifications.institutionalAccountId, input.institutionId)).orderBy(desc(institutionRenewalNotifications.createdAt)).limit(input.limit);
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  /** Start a verified Daraja STK payment for one institutional product renewal. */
  initiateInstitutionMpesaPayment: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.enum(["iers", "cpd_portal"]),
      amountCents: z.number().int().positive().max(15_000_000),
      renewsAt: z.coerce.date(),
      expiresAt: z.coerce.date().optional(),
      phoneNumber: z.string().regex(/^254\d{9}$/, "Use Kenyan format 254XXXXXXXXX."),
      idempotencyKey: z.string().trim().min(8).max(255),
      planKey: z.string().trim().max(64).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin"], { allowInstitutionAdmin: true });
      const [existingIntent] = await db.select({ id: institutionSubscriptionPaymentIntents.id, checkoutRequestId: institutionSubscriptionPaymentIntents.checkoutRequestId, status: institutionSubscriptionPaymentIntents.status })
        .from(institutionSubscriptionPaymentIntents)
        .where(and(
          eq(institutionSubscriptionPaymentIntents.institutionalAccountId, input.institutionId),
          eq(institutionSubscriptionPaymentIntents.idempotencyKey, input.idempotencyKey),
        ))
        .limit(1);
      if (existingIntent) return { success: true as const, duplicate: true as const, intentId: existingIntent.id, checkoutRequestId: existingIntent.checkoutRequestId, status: existingIntent.status };
      const [product] = await db.select({ id: institutionalProducts.id, displayName: institutionalProducts.displayName }).from(institutionalProducts).where(eq(institutionalProducts.productKey, input.productKey)).limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Institutional product is not registered." });
      let planId: number | null = null;
      if (input.planKey) {
        const [plan] = await db.select({ id: institutionalProductPlans.id }).from(institutionalProductPlans).where(and(eq(institutionalProductPlans.productId, product.id), eq(institutionalProductPlans.planKey, input.planKey))).limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Product plan is not registered." });
        planId = plan.id;
      }
      const accountReference = `PR${input.institutionId}${input.productKey === "iers" ? "I" : "C"}${Date.now().toString().slice(-8)}`.slice(0, 40);
      const stkResponse = await getMpesaService().initiateSTKPush(
        input.phoneNumber,
        Math.max(1, Math.round(input.amountCents / 100)),
        accountReference,
        `${product.displayName} institutional renewal`,
      );
      const result = await db.insert(institutionSubscriptionPaymentIntents).values({
        institutionalAccountId: input.institutionId,
        productId: product.id,
        planId,
        renewsAt: input.renewsAt,
        expiresAt: input.expiresAt ?? input.renewsAt,
        amountCents: input.amountCents,
        phoneNumber: input.phoneNumber,
        accountReference,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID ?? null,
        idempotencyKey: input.idempotencyKey,
        status: "pending",
        createdByUserId: ctx.user.id,
      });
      return { success: true as const, duplicate: false as const, intentId: (result as unknown as { insertId: number }).insertId, checkoutRequestId: stkResponse.CheckoutRequestID, merchantRequestId: stkResponse.MerchantRequestID, status: "pending" as const, message: stkResponse.CustomerMessage };
    }),

  /** Read one institutional payment intent while it is waiting for the Daraja callback. */
  getInstitutionMpesaPaymentStatus: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), checkoutRequestId: z.string().trim().min(3).max(255) }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await assertInstitutionAccountScope(db, ctx.user, input.institutionId, ["finance_officer", "account_admin", "report_viewer"], { allowInstitutionAdmin: true });
      const [intent] = await db.select({ id: institutionSubscriptionPaymentIntents.id, status: institutionSubscriptionPaymentIntents.status, mpesaReceiptNumber: institutionSubscriptionPaymentIntents.mpesaReceiptNumber, failureReason: institutionSubscriptionPaymentIntents.failureReason, updatedAt: institutionSubscriptionPaymentIntents.updatedAt })
        .from(institutionSubscriptionPaymentIntents)
        .where(and(eq(institutionSubscriptionPaymentIntents.institutionalAccountId, input.institutionId), eq(institutionSubscriptionPaymentIntents.checkoutRequestId, input.checkoutRequestId)))
        .limit(1);
      if (!intent) throw new TRPCError({ code: "NOT_FOUND", message: "Institutional payment intent not found." });
      return intent;
    }),

  /** Platform administrator or an authenticated payment callback adapter: record one idempotent institutional payment and renew a product. */
  confirmInstitutionPayment: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      productKey: z.enum(["iers", "cpd_portal"]),
      paymentMethod: z.enum(["mpesa", "bank_transfer", "card"]),
      amountCents: z.number().int().positive(),
      paymentReference: z.string().trim().min(3).max(255),
      idempotencyKey: z.string().trim().min(8).max(255),
      renewsAt: z.coerce.date(),
      expiresAt: z.coerce.date().optional(),
      planKey: z.string().trim().max(64).optional(),
      quotationId: z.number().int().positive().optional(),
      contractId: z.number().int().positive().optional(),
      reason: z.string().trim().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform administrators can confirm institutional payments." });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [existingPayment] = await db.select({ id: institutionSubscriptionPayments.id, subscriptionId: institutionSubscriptionPayments.subscriptionId }).from(institutionSubscriptionPayments).where(or(eq(institutionSubscriptionPayments.idempotencyKey, input.idempotencyKey), eq(institutionSubscriptionPayments.paymentReference, input.paymentReference))).limit(1);
      if (existingPayment) return { success: true as const, duplicate: true as const, paymentId: existingPayment.id, subscriptionId: existingPayment.subscriptionId };

      const [product] = await db.select({ id: institutionalProducts.id }).from(institutionalProducts).where(eq(institutionalProducts.productKey, input.productKey)).limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Institutional product is not registered." });
      let planId: number | null = null;
      if (input.planKey) {
        const [plan] = await db.select({ id: institutionalProductPlans.id }).from(institutionalProductPlans).where(and(eq(institutionalProductPlans.productId, product.id), eq(institutionalProductPlans.planKey, input.planKey))).limit(1);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Product plan is not registered." });
        planId = plan.id;
      }
      const [previous] = await db.select({ id: institutionProductSubscriptions.id, subscriptionStatus: institutionProductSubscriptions.subscriptionStatus, startsAt: institutionProductSubscriptions.startsAt }).from(institutionProductSubscriptions).where(and(eq(institutionProductSubscriptions.institutionalAccountId, input.institutionId), eq(institutionProductSubscriptions.productId, product.id))).limit(1);
      const now = new Date();
      await db.insert(institutionProductSubscriptions).values({ institutionalAccountId: input.institutionId, productId: product.id, planId, subscriptionStatus: "active", startsAt: previous?.startsAt ?? now, renewsAt: input.renewsAt, expiresAt: input.expiresAt ?? input.renewsAt, graceEndsAt: null, source: "payment", quotationId: input.quotationId ?? null, contractId: input.contractId ?? null, externalReference: input.paymentReference, notes: input.reason }).onDuplicateKeyUpdate({ set: { planId, subscriptionStatus: "active", renewsAt: input.renewsAt, expiresAt: input.expiresAt ?? input.renewsAt, graceEndsAt: null, cancelledAt: null, source: "payment", quotationId: input.quotationId ?? null, contractId: input.contractId ?? null, externalReference: input.paymentReference, notes: input.reason, updatedAt: now } });
      const [subscription] = await db.select({ id: institutionProductSubscriptions.id }).from(institutionProductSubscriptions).where(and(eq(institutionProductSubscriptions.institutionalAccountId, input.institutionId), eq(institutionProductSubscriptions.productId, product.id))).limit(1);
      const capabilityRows = await db.select({ capabilityKey: institutionalProductCapabilities.capabilityKey }).from(institutionalProductCapabilities).where(and(eq(institutionalProductCapabilities.productId, product.id), eq(institutionalProductCapabilities.status, "active")));
      for (const capability of capabilityRows) {
        await db.insert(institutionProductEntitlements).values({ institutionalAccountId: input.institutionId, productId: product.id, subscriptionId: subscription?.id ?? null, capabilityKey: capability.capabilityKey, entitlementStatus: "active", startsAt: now, endsAt: input.expiresAt ?? input.renewsAt }).onDuplicateKeyUpdate({ set: { subscriptionId: subscription?.id ?? null, entitlementStatus: "active", startsAt: now, endsAt: input.expiresAt ?? input.renewsAt, updatedAt: now } });
      }
      const paymentInsert = await db.insert(institutionSubscriptionPayments).values({ institutionalAccountId: input.institutionId, productId: product.id, subscriptionId: subscription?.id ?? null, paymentMethod: input.paymentMethod, amountCents: input.amountCents, paymentReference: input.paymentReference, idempotencyKey: input.idempotencyKey, status: "completed", receivedAt: now, metadata: JSON.stringify({ planKey: input.planKey ?? null, quotationId: input.quotationId ?? null, contractId: input.contractId ?? null }) });
      await db.insert(institutionSubscriptionEvents).values({ institutionalAccountId: input.institutionId, productId: product.id, subscriptionId: subscription?.id ?? null, eventType: previous ? "renewed" : "payment_succeeded", previousStatus: previous?.subscriptionStatus ?? null, currentStatus: "active", actorUserId: ctx.user.id, reason: input.reason, reference: input.paymentReference });
      return { success: true as const, duplicate: false as const, paymentId: (paymentInsert as unknown as { insertId: number }).insertId, subscriptionId: subscription?.id ?? null, productKey: input.productKey, subscriptionStatus: "active" as const };
    }),

  /** Platform administrator or a configured web cron invokes this deterministic processor. */
  processRenewalNotifications: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await requireDb();
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only Paeds Resus platform administrators can process renewal notifications." });
      return queueRenewalNotifications(db);
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
