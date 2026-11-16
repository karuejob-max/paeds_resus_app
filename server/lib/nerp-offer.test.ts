import { describe, expect, it } from "vitest";
import {
  calculateNerpPaymentState,
  deriveNerpPromotionStatus,
  hasConfirmedNerpPayment,
  validateNerpPaymentAmount,
} from "./nerp-offer";

describe("NERP flexible payment validation", () => {
  const base = { amountPaidKes: 0, totalAmountKes: 15000 };

  it("allows a first payment above the suggested KES 2,500 amount", () => {
    expect(validateNerpPaymentAmount({ ...base, amountKes: 11000 })).toMatchObject({
      valid: true,
      amountKes: 11000,
      balanceKes: 15000,
    });
  });

  it("rejects a first payment below KES 2,500", () => {
    expect(validateNerpPaymentAmount({ ...base, amountKes: 1000 })).toMatchObject({
      valid: false,
      reason: expect.stringContaining("2,500"),
    });
  });

  it("allows any positive later payment and the exact remaining balance", () => {
    expect(validateNerpPaymentAmount({ amountKes: 1000, amountPaidKes: 11000, totalAmountKes: 15000 }).valid).toBe(true);
    expect(validateNerpPaymentAmount({ amountKes: 4000, amountPaidKes: 11000, totalAmountKes: 15000 }).valid).toBe(true);
  });

  it("rejects a payment above the remaining balance", () => {
    expect(validateNerpPaymentAmount({ amountKes: 5000, amountPaidKes: 11000, totalAmountKes: 15000 })).toMatchObject({
      valid: false,
      reason: expect.stringContaining("4,000"),
    });
  });
});

describe("NERP offer payment state", () => {
  it("starts at installment one with the full balance", () => {
    expect(calculateNerpPaymentState({ amountPaidKes: 0 })).toMatchObject({
      balanceKes: 15000,
      completedInstallments: 0,
      nextInstallmentNumber: 1,
      nextInstallmentAmountKes: 2500,
      status: "active",
    });
  });

  it("tracks partial payment and completes at the sixth installment", () => {
    expect(calculateNerpPaymentState({ amountPaidKes: 5000 })).toMatchObject({
      balanceKes: 10000,
      completedInstallments: 2,
      nextInstallmentNumber: 3,
      nextInstallmentAmountKes: 2500,
      status: "active",
    });
    expect(calculateNerpPaymentState({ amountPaidKes: 15000 })).toMatchObject({
      balanceKes: 0,
      completedInstallments: 6,
      nextInstallmentNumber: 7,
      nextInstallmentAmountKes: 0,
      status: "completed",
    });
  });

  it("caps overpayment at the offer total", () => {
    expect(
      calculateNerpPaymentState({ amountPaidKes: 16000 }).amountPaidKes
    ).toBe(15000);
  });

  it("preserves payment sequence independently of payment size", () => {
    expect(calculateNerpPaymentState({ amountPaidKes: 11000, nextInstallmentNumber: 2 })).toMatchObject({
      balanceKes: 4000,
      nextInstallmentNumber: 2,
      nextInstallmentAmountKes: 2500,
      status: "active",
    });
  });
});

describe("NERP payment entitlement", () => {
  it("does not treat an empty active offer as a learning entitlement", () => {
    expect(hasConfirmedNerpPayment({ status: "active", amountPaidKes: 0, entitlementId: null })).toBe(false);
  });

  it("accepts a confirmed installment, completed offer, or explicit entitlement", () => {
    expect(hasConfirmedNerpPayment({ status: "active", amountPaidKes: 2500, entitlementId: null })).toBe(true);
    expect(hasConfirmedNerpPayment({ status: "completed", amountPaidKes: 0, entitlementId: null })).toBe(true);
    expect(hasConfirmedNerpPayment({ status: "active", amountPaidKes: 0, entitlementId: 42 })).toBe(true);
  });
});

describe("NERP promotion suppression", () => {
  const base = {
    hasValidEmail: true,
    hasCompletedOffer: false,
    phase2Verified: false,
    phase3Verified: false,
    hasVerifiedBlsAndAcls: false,
    explicitlyExcluded: false,
  };

  it("keeps a valid incomplete learner eligible", () => {
    expect(deriveNerpPromotionStatus(base)).toEqual({
      status: "eligible",
      reason: null,
    });
  });

  it("suppresses completed offers and both verified external phases", () => {
    expect(
      deriveNerpPromotionStatus({ ...base, hasCompletedOffer: true })
    ).toEqual({ status: "suppressed", reason: "nerp_offer_completed" });
    expect(
      deriveNerpPromotionStatus({
        ...base,
        phase2Verified: true,
        phase3Verified: true,
      })
    ).toEqual({
      status: "suppressed",
      reason: "external_nerp_phases_verified",
    });
    expect(
      deriveNerpPromotionStatus({ ...base, hasVerifiedBlsAndAcls: true })
    ).toEqual({
      status: "suppressed",
      reason: "external_bls_and_acls_verified",
    });
  });

  it("requires review when an email is missing", () => {
    expect(
      deriveNerpPromotionStatus({ ...base, hasValidEmail: false })
    ).toEqual({ status: "needs_review", reason: "missing_or_invalid_email" });
  });
});
