import { describe, expect, it } from "vitest";
import { validateInstitutionMpesaAmount } from "./institution-mpesa-reconciliation";

describe("institutional M-Pesa reconciliation safety", () => {
  it("accepts an exact callback amount", () => {
    expect(validateInstitutionMpesaAmount(125000, 1250)).toEqual({ valid: true, receivedCents: 125000 });
  });

  it("rejects an underpayment or overpayment", () => {
    expect(validateInstitutionMpesaAmount(125000, 1249)).toEqual({
      valid: false,
      reason: "M-Pesa amount mismatch: expected 125000 cents, received 124900 cents.",
    });
  });

  it("does not invent an amount when the callback has no metadata", () => {
    expect(validateInstitutionMpesaAmount(125000, null)).toEqual({ valid: true, receivedCents: null });
  });
});
