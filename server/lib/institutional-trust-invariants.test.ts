import { describe, expect, it } from "vitest";
import {
  assertInstitutionalInvoiceTransition,
  canCloseQiReport,
  canTransitionInstitutionalInvoice,
  institutionalLedgerDegradedState,
} from "./institutional-trust-invariants";

describe("institutional trust invariants", () => {
  it("does not treat a provider callback as a settled invoice", () => {
    expect(canTransitionInstitutionalInvoice("payment_received", "reconciled")).toBe(true);
    expect(canTransitionInstitutionalInvoice("payment_received", "paid")).toBe(false);
    expect(() => assertInstitutionalInvoiceTransition("issued", "reconciled")).toThrow();
  });

  it("requires effectiveness evidence before QI closure", () => {
    expect(canCloseQiReport(null)).toBe(false);
    expect(canCloseQiReport({ outcome: "insufficient_evidence", followUpRequired: false })).toBe(false);
    expect(canCloseQiReport({ outcome: "not_effective", followUpRequired: true })).toBe(false);
    expect(canCloseQiReport({ outcome: "partially_effective", followUpRequired: true })).toBe(false);
    expect(canCloseQiReport({ outcome: "effective", followUpRequired: false })).toBe(true);
  });

  it("fails closed when authoritative institutional infrastructure is unavailable", () => {
    expect(institutionalLedgerDegradedState("product ledger unavailable")).toEqual({
      state: "degraded",
      accessDecision: "not_made",
      reason: "product ledger unavailable",
    });
  });
});
