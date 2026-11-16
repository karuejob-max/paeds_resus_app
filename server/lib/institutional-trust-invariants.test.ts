import { describe, expect, it } from "vitest";
import {
  assertInstitutionalInvoiceTransition,
  canCloseQiReport,
  canTransitionQiAction,
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
    expect(canCloseQiReport({ outcome: "effective", followUpRequired: false }, 1)).toBe(false);
    expect(canCloseQiReport({ outcome: "effective", followUpRequired: false }, 1, "Action remains open because replacement supplies are on order.")).toBe(true);
  });

  it("allows only forward QI action completion or cancellation", () => {
    expect(canTransitionQiAction("open", "in_progress")).toBe(true);
    expect(canTransitionQiAction("in_progress", "completed")).toBe(true);
    expect(canTransitionQiAction("open", "cancelled")).toBe(true);
    expect(canTransitionQiAction("completed", "open")).toBe(false);
    expect(canTransitionQiAction("cancelled", "in_progress")).toBe(false);
  });

  it("fails closed when authoritative institutional infrastructure is unavailable", () => {
    expect(institutionalLedgerDegradedState("product ledger unavailable")).toEqual({
      state: "degraded",
      accessDecision: "not_made",
      reason: "product ledger unavailable",
    });
  });
});
