import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { createInstitutionalCheckoutAction, isInstitutionalPaymentSuccess, resolveInstitutionalProvider, verifyInstitutionalWebhookSignature } from "./institutional-payment-adapter";
import { renewalPolicyFor } from "./institutional-billing";

describe("institutional payment adapters", () => {
  it("routes card checkout through Pesapal and M-Pesa through direct M-Pesa", () => {
    expect(resolveInstitutionalProvider("card")).toBe("pesapal");
    expect(resolveInstitutionalProvider("mpesa")).toBe("direct_mpesa");
    expect(resolveInstitutionalProvider("bank_transfer")).toBe("bank_transfer");
  });

  it("does not enable automatic renewal for M-Pesa or bank transfer", () => {
    expect(renewalPolicyFor("mpesa", true)).toEqual({ autoRenewEnabled: false, renewalApprovalRequired: true });
    expect(renewalPolicyFor("bank_transfer", true)).toEqual({ autoRenewEnabled: false, renewalApprovalRequired: true });
    expect(renewalPolicyFor("card", true)).toEqual({ autoRenewEnabled: true, renewalApprovalRequired: false });
  });

  it("returns provider-neutral checkout actions", () => {
    expect(createInstitutionalCheckoutAction({ invoiceId: 4, invoiceNumber: "PR-2026-123456", amountCents: 4000000, currency: "KES", customerEmail: "admin@example.org", paymentMethod: "card" })).toMatchObject({ kind: "redirect", provider: "pesapal", reference: "PR-PR-2026-123456-4", requiresProviderCredentials: true });
    expect(createInstitutionalCheckoutAction({ invoiceId: 5, invoiceNumber: "PR-2026-123457", amountCents: 4000000, currency: "KES", customerEmail: "admin@example.org", paymentMethod: "mpesa" })).toMatchObject({ kind: "stk_push", provider: "direct_mpesa", reference: "PR-PR-2026-123457-5", requiresProviderCredentials: true });
    expect(createInstitutionalCheckoutAction({ invoiceId: 6, invoiceNumber: "PR-2026-123458", amountCents: 4000000, currency: "KES", customerEmail: "admin@example.org", paymentMethod: "bank_transfer" })).toMatchObject({ kind: "bank_transfer", provider: "bank_transfer" });
  });

  it("verifies HMAC signatures and rejects tampered or missing signatures", () => {
    const body = JSON.stringify({ invoiceId: 4, status: "paid" });
    const secret = "test-webhook-secret";
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyInstitutionalWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyInstitutionalWebhookSignature(`${body}x`, signature, secret)).toBe(false);
    expect(verifyInstitutionalWebhookSignature(body, undefined, secret)).toBe(false);
  });

  it("normalizes success statuses across providers", () => {
    expect(isInstitutionalPaymentSuccess("SUCCESS")).toBe(true);
    expect(isInstitutionalPaymentSuccess("settled")).toBe(true);
    expect(isInstitutionalPaymentSuccess("failed")).toBe(false);
  });
});
