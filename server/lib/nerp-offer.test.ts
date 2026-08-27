import { describe, expect, it } from "vitest";
import {
  calculateNerpPaymentState,
  deriveNerpPromotionStatus,
} from "./nerp-offer";

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
