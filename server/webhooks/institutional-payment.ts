import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { institutionalPaymentAttempts, institutionalPaymentProviderEvents, institutionalSubscriptionInvoices } from "../../drizzle/schema";
import { isInstitutionalPaymentSuccess, verifyInstitutionalWebhookSignature, type InstitutionalProvider } from "../lib/institutional-payment-adapter";

const providers = new Set<InstitutionalProvider>(["pesapal", "direct_mpesa", "bank_transfer"]);

function bodyValue(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (body[key] !== undefined && body[key] !== null) return body[key];
  return undefined;
}

function positiveInteger(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function handleInstitutionalPaymentWebhook(req: Request, res: Response) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  const signature = typeof req.headers["x-institutional-signature"] === "string" ? req.headers["x-institutional-signature"] : undefined;
  if (!verifyInstitutionalWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Unauthorized webhook" });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const provider = String(req.headers["x-institutional-provider"] ?? bodyValue(body, "provider") ?? "");
  if (!providers.has(provider as InstitutionalProvider)) return res.status(400).json({ error: "Unsupported provider" });
  const providerEventId = String(req.headers["x-provider-event-id"] ?? bodyValue(body, "eventId", "event_id", "id") ?? "");
  if (!providerEventId) return res.status(400).json({ error: "Missing provider event id" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });
  const [existing] = await db.select({ id: institutionalPaymentProviderEvents.id, status: institutionalPaymentProviderEvents.status }).from(institutionalPaymentProviderEvents).where(and(eq(institutionalPaymentProviderEvents.provider, provider), eq(institutionalPaymentProviderEvents.providerEventId, providerEventId))).limit(1);
  if (existing) return res.status(200).json({ accepted: true, idempotent: true, eventId: existing.id, status: existing.status });

  const invoiceId = positiveInteger(bodyValue(body, "invoiceId", "invoice_id"));
  const paymentReference = String(bodyValue(body, "paymentReference", "payment_reference", "transactionId", "transaction_id", "reference") ?? providerEventId);
  const amountCents = positiveInteger(bodyValue(body, "amountCents", "amount_cents")) ?? Math.round(Number(bodyValue(body, "amount") ?? 0) * 100);
  const currency = String(bodyValue(body, "currency") ?? "KES").toUpperCase();
  const status = String(bodyValue(body, "status", "paymentStatus", "payment_status", "eventType") ?? "pending").toLowerCase();
  const [event] = await db.insert(institutionalPaymentProviderEvents).values({ provider, providerEventId, eventType: String(bodyValue(body, "eventType", "event_type") ?? status), invoiceId: invoiceId ?? null, paymentId: null, status: "received", signatureVerified: true, signatureAlgorithm: "hmac-sha256", processingAttempts: 1, lastAttemptAt: new Date(), payload: body }).$returningId();

  if (!invoiceId) {
    await db.update(institutionalPaymentProviderEvents).set({ status: "ignored", processedAt: new Date(), errorMessage: "No invoice reference supplied" }).where(eq(institutionalPaymentProviderEvents.id, event.id));
    return res.status(202).json({ accepted: true, eventId: event.id, status: "ignored" });
  }

  const [invoice] = await db.select().from(institutionalSubscriptionInvoices).where(eq(institutionalSubscriptionInvoices.id, invoiceId)).limit(1);
  if (!invoice) {
    await db.update(institutionalPaymentProviderEvents).set({ status: "failed", processedAt: new Date(), errorMessage: "Invoice not found" }).where(eq(institutionalPaymentProviderEvents.id, event.id));
    return res.status(422).json({ error: "Invoice not found", eventId: event.id });
  }

  const amountMatches = amountCents === invoice.amountCents && currency === invoice.currency;
  const success = isInstitutionalPaymentSuccess(status);
  const attemptStatus = success && amountMatches ? "succeeded" : success ? "disputed" : "failed";
  const reconciliationStatus = success && amountMatches ? "matched" : success ? "mismatch" : "unreconciled";
  const [attempt] = await db.insert(institutionalPaymentAttempts).values({ institutionalAccountId: invoice.institutionalAccountId, invoiceId, provider, paymentMethod: provider === "direct_mpesa" ? "mpesa" : provider === "bank_transfer" ? "bank_transfer" : "card", idempotencyKey: `${provider}:${providerEventId}`, providerPaymentReference: paymentReference, amountCents, currency, status: attemptStatus, failureReason: amountMatches ? null : `Settlement mismatch: expected ${invoice.amountCents} ${invoice.currency}, received ${amountCents} ${currency}`, reconciliationStatus, initiatedAt: new Date(), settledAt: success && amountMatches ? new Date() : null, metadata: body }).$returningId();

  await db.update(institutionalPaymentProviderEvents).set({ paymentId: attempt.id, status: success && amountMatches ? "processed" : success ? "failed" : "processed", processedAt: new Date(), errorMessage: amountMatches ? null : "Settlement mismatch requires finance review" }).where(eq(institutionalPaymentProviderEvents.id, event.id));
  await db.update(institutionalSubscriptionInvoices).set({ provider, providerPaymentReference: paymentReference, paymentMethod: provider === "direct_mpesa" ? "mpesa" : provider === "bank_transfer" ? "bank_transfer" : "card", paymentAttemptCount: (invoice.paymentAttemptCount ?? 0) + 1, lastPaymentAttemptAt: new Date(), status: success && amountMatches ? "paid" : invoice.status, paidAt: success && amountMatches ? new Date() : invoice.paidAt, settledAt: success && amountMatches ? new Date() : invoice.settledAt, reconciliationStatus, reconciliationNote: amountMatches ? null : "Finance review required before access activation" }).where(eq(institutionalSubscriptionInvoices.id, invoiceId));

  return res.status(200).json({ accepted: true, eventId: event.id, paymentAttemptId: attempt.id, status: attemptStatus, requiresFinanceReview: !amountMatches });
}
