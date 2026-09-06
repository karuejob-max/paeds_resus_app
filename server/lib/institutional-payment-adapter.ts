import crypto from "node:crypto";

export type InstitutionalProvider = "pesapal" | "direct_mpesa" | "bank_transfer";
export type InstitutionalPaymentMethod = "card" | "mpesa" | "bank_transfer";

export type InstitutionalCheckoutRequest = {
  invoiceId: number;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: InstitutionalPaymentMethod;
  returnUrl?: string;
};

export type InstitutionalCheckoutAction =
  | { kind: "redirect"; provider: "pesapal"; reference: string; requiresProviderCredentials: true }
  | { kind: "stk_push"; provider: "direct_mpesa"; reference: string; requiresProviderCredentials: true }
  | { kind: "bank_transfer"; provider: "bank_transfer"; reference: string; instructions: string };

export function resolveInstitutionalProvider(method: InstitutionalPaymentMethod): InstitutionalProvider {
  if (method === "card") return "pesapal";
  if (method === "mpesa") return "direct_mpesa";
  return "bank_transfer";
}

export function createInstitutionalCheckoutAction(input: InstitutionalCheckoutRequest): InstitutionalCheckoutAction {
  const provider = resolveInstitutionalProvider(input.paymentMethod);
  const reference = `PR-${input.invoiceNumber}-${input.invoiceId}`;
  if (provider === "pesapal") return { kind: "redirect", provider, reference, requiresProviderCredentials: true };
  if (provider === "direct_mpesa") return { kind: "stk_push", provider, reference, requiresProviderCredentials: true };
  return { kind: "bank_transfer", provider, reference, instructions: "Use the invoice number as the bank-transfer reference. Upload or submit the remittance advice for reconciliation." };
}

export function verifyInstitutionalWebhookSignature(rawBody: string, signature: string | undefined, secret = process.env.INSTITUTIONAL_PAYMENT_WEBHOOK_SECRET): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature.trim().replace(/^sha256=/, ""), "utf8");
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function isInstitutionalPaymentSuccess(status: string | undefined): boolean {
  return ["paid", "succeeded", "success", "completed", "complete", "settled"].includes((status ?? "").toLowerCase());
}

export function normalizeProviderEvent(input: { provider: InstitutionalProvider; providerEventId: string; eventType: string; invoiceId?: number; status: "received" | "processed" | "ignored" | "failed"; payload: Record<string, unknown>; signatureVerified?: boolean; signatureAlgorithm?: string }) {
  return {
    provider: input.provider,
    providerEventId: input.providerEventId,
    eventType: input.eventType,
    invoiceId: input.invoiceId ?? null,
    status: input.status,
    signatureVerified: input.signatureVerified ?? false,
    signatureAlgorithm: input.signatureAlgorithm ?? null,
    payload: input.payload,
    receivedAt: new Date(),
  };
}
