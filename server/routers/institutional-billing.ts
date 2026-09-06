import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  institutionalPaymentProviderEvents,
  institutionalPricingAuditEvents,
  institutionalSubscriptionInvoices,
  institutionProductSubscriptions,
  institutionalProducts,
} from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { assertInstitutionProductRole } from "../lib/institution-product-roles";
import { buildInstitutionalQuote, buildInvoiceNumber, paymentProviderFor, renewalPolicyFor } from "../lib/institutional-billing";
import { createInstitutionalCheckoutAction } from "../lib/institutional-payment-adapter";
import { DEFAULT_KES_PER_USD, type DataSharingStatus, type FacilityLevel, type PricingTier } from "@shared/institutional-pricing";

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

const productSchema = z.enum(["iers", "cpd_portal"]);

async function assertBillingAdmin(db: Awaited<ReturnType<typeof dbOrThrow>>, user: { id: number; role: string; email: string | null }, institutionId: number, product: "iers" | "cpd_portal") {
  await assertInstitutionProductRole(db, user as never, institutionId, product, product === "iers" ? ["iers_chair", "iers_governance", "iers_coordinator"] : ["cpd_coordinator", "cpd_reviewer"]);
}

async function getProductId(db: Awaited<ReturnType<typeof dbOrThrow>>, productKey: "iers" | "cpd_portal") {
  const [product] = await db.select({ id: institutionalProducts.id }).from(institutionalProducts).where(eq(institutionalProducts.productKey, productKey)).limit(1);
  if (!product) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Institutional product ${productKey} is not registered.` });
  return product.id;
}

export const institutionalBillingRouter = router({
  getQuote: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), product: productSchema, facilityLevel: z.enum(["level_4", "level_5", "level_6"]).optional(), staffCount: z.number().int().positive().optional(), pricingTier: z.enum(["founding_partner", "standard"]).default("standard"), dataSharingStatus: z.enum(["consented", "consented_anonymous", "private_mode", "lapsed"]).default("private_mode"), fxRateKesPerUsd: z.number().positive().default(DEFAULT_KES_PER_USD), termYears: z.number().int().min(1).max(5).default(1) }))
    .query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      return buildInstitutionalQuote({ product: input.product, facilityLevel: input.facilityLevel as FacilityLevel | undefined, staffCount: input.staffCount, pricingTier: input.pricingTier as PricingTier, dataSharingStatus: input.dataSharingStatus as DataSharingStatus, fxRateKesPerUsd: input.fxRateKesPerUsd, termYears: input.termYears });
    }),

  setConsentAndPricing: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), product: productSchema, facilityLevel: z.enum(["level_4", "level_5", "level_6"]).optional(), verifiedStaffCount: z.number().int().positive().optional(), pricingTier: z.enum(["founding_partner", "standard"]), dataSharingStatus: z.enum(["consented", "consented_anonymous", "private_mode", "lapsed"]), reason: z.string().trim().min(3).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertBillingAdmin(db, ctx.user, input.institutionalAccountId, input.product);
      const productId = await getProductId(db, input.product);
      const [current] = await db.select().from(institutionProductSubscriptions).where(and(eq(institutionProductSubscriptions.institutionalAccountId, input.institutionalAccountId), eq(institutionProductSubscriptions.productId, productId))).limit(1);
      const now = new Date();
      const foundingStart = input.pricingTier === "founding_partner" ? current?.foundingPartnerStartedAt ?? now : current?.foundingPartnerStartedAt ?? null;
      const foundingEnd = input.pricingTier === "founding_partner" ? current?.foundingPartnerEndsAt ?? new Date(Date.UTC(now.getUTCFullYear() + 5, now.getUTCMonth(), now.getUTCDate())) : current?.foundingPartnerEndsAt ?? null;
      const changes = { facilityLevel: input.facilityLevel ?? null, verifiedStaffCount: input.verifiedStaffCount ?? null, pricingTier: input.pricingTier, dataSharingStatus: input.dataSharingStatus, dataSharingConsentedAt: input.dataSharingStatus === "consented" || input.dataSharingStatus === "consented_anonymous" ? now : current?.dataSharingConsentedAt ?? null, dataSharingLapsedAt: input.dataSharingStatus === "lapsed" ? now : null, foundingPartnerStartedAt: foundingStart, foundingPartnerEndsAt: foundingEnd, commitmentTermYears: input.pricingTier === "founding_partner" ? 5 : current?.commitmentTermYears ?? 1, lastStaffCountAttestationAt: input.verifiedStaffCount ? now : current?.lastStaffCountAttestationAt ?? null, updatedAt: now };
      if (current) {
        await db.update(institutionProductSubscriptions).set(changes).where(eq(institutionProductSubscriptions.id, current.id));
      } else {
        await db.insert(institutionProductSubscriptions).values({ institutionalAccountId: input.institutionalAccountId, productId, subscriptionStatus: "trial", source: "contract", ...changes, createdAt: now });
      }
      await db.insert(institutionalPricingAuditEvents).values({ institutionalAccountId: input.institutionalAccountId, subscriptionId: current?.id ?? null, eventType: "pricing_consent_updated", actorUserId: ctx.user.id, previousValue: current ? { pricingTier: current.pricingTier, dataSharingStatus: current.dataSharingStatus } : null, currentValue: { pricingTier: input.pricingTier, dataSharingStatus: input.dataSharingStatus, facilityLevel: input.facilityLevel, verifiedStaffCount: input.verifiedStaffCount }, reason: input.reason });
      return { success: true, pricingTier: input.pricingTier, dataSharingStatus: input.dataSharingStatus, foundingPartnerEndsAt: foundingEnd };
    }),

  issueInvoice: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), product: productSchema, facilityLevel: z.enum(["level_4", "level_5", "level_6"]).optional(), staffCount: z.number().int().positive().optional(), pricingTier: z.enum(["founding_partner", "standard"]).default("standard"), dataSharingStatus: z.enum(["consented", "consented_anonymous", "private_mode", "lapsed"]).default("private_mode"), fxRateKesPerUsd: z.number().positive().default(DEFAULT_KES_PER_USD), termYears: z.number().int().min(1).max(5).default(1), dueAt: z.coerce.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertBillingAdmin(db, ctx.user, input.institutionalAccountId, input.product);
      const productId = await getProductId(db, input.product);
      const [subscription] = await db.select().from(institutionProductSubscriptions).where(and(eq(institutionProductSubscriptions.institutionalAccountId, input.institutionalAccountId), eq(institutionProductSubscriptions.productId, productId))).limit(1);
      const quote = buildInstitutionalQuote({ product: input.product, facilityLevel: input.facilityLevel as FacilityLevel | undefined, staffCount: input.staffCount, pricingTier: input.pricingTier as PricingTier, dataSharingStatus: input.dataSharingStatus as DataSharingStatus, fxRateKesPerUsd: input.fxRateKesPerUsd, termYears: input.termYears });
      const now = new Date();
      const dueAt = input.dueAt ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const [created] = await db.insert(institutionalSubscriptionInvoices).values({ institutionalAccountId: input.institutionalAccountId, productId, subscriptionId: subscription?.id ?? null, invoiceNumber: buildInvoiceNumber(now), baseAmountUsdCents: quote.baseAmountUsdCents, amountCents: quote.amountCents, currency: quote.currency, fxRateKesPerUsd: quote.fxRateKesPerUsd.toString(), status: "issued", issuedAt: now, dueAt, renewalForSubscriptionId: subscription?.id ?? null, metadata: { product: input.product, label: quote.label, termYears: quote.termYears } }).$returningId();
      return { invoiceId: created.id, amountCents: quote.amountCents, currency: quote.currency, dueAt, invoiceStatus: "issued" as const };
    }),

  listInvoices: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), product: productSchema.optional(), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const conditions = [eq(institutionalSubscriptionInvoices.institutionalAccountId, input.institutionalAccountId)];
      if (input.product) conditions.push(eq(institutionalSubscriptionInvoices.productId, await getProductId(db, input.product)));
      return db.select().from(institutionalSubscriptionInvoices).where(and(...conditions)).orderBy(desc(institutionalSubscriptionInvoices.createdAt)).limit(input.limit);
    }),

  createPaymentIntent: protectedProcedure
    .input(z.object({ institutionalAccountId: z.number().int().positive(), invoiceId: z.number().int().positive(), paymentMethod: z.enum(["mpesa", "bank_transfer", "card"]), autoRenewRequested: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const [invoice] = await db.select().from(institutionalSubscriptionInvoices).where(and(eq(institutionalSubscriptionInvoices.id, input.invoiceId), eq(institutionalSubscriptionInvoices.institutionalAccountId, input.institutionalAccountId))).limit(1);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
      await assertInstitutionAccess(db, ctx.user, input.institutionalAccountId);
      const provider = paymentProviderFor(input.paymentMethod);
      const policy = renewalPolicyFor(input.paymentMethod, input.autoRenewRequested);
      await db.update(institutionalSubscriptionInvoices).set({ status: "payment_pending", updatedAt: new Date() }).where(eq(institutionalSubscriptionInvoices.id, invoice.id));
      const checkout = createInstitutionalCheckoutAction({ invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, amountCents: invoice.amountCents, currency: invoice.currency, customerEmail: ctx.user.email ?? "", paymentMethod: input.paymentMethod });
      return { invoiceId: invoice.id, provider, paymentMethod: input.paymentMethod, ...policy, amountCents: invoice.amountCents, currency: invoice.currency, checkout };
    }),

  recordProviderEvent: protectedProcedure
    .input(z.object({ provider: z.enum(["pesapal", "direct_mpesa", "bank_transfer"]), providerEventId: z.string().trim().min(1).max(255), eventType: z.string().trim().min(1).max(128), invoiceId: z.number().int().positive().optional(), paymentId: z.number().int().positive().optional(), payload: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the platform billing administrator may record provider events." });
      const db = await dbOrThrow();
      const [created] = await db.insert(institutionalPaymentProviderEvents).values({ provider: input.provider, providerEventId: input.providerEventId, eventType: input.eventType, invoiceId: input.invoiceId ?? null, paymentId: input.paymentId ?? null, payload: input.payload, status: "received" }).$returningId();
      return { id: created.id, status: "received" as const };
    }),
});
