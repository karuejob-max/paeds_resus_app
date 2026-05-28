import { describe, it, expect } from "vitest";
import { shouldMarkPaymentAsFailedFromStkQuery, STALE_PAYMENT_MS } from "./mpesa-reconciliation";

describe("shouldMarkPaymentAsFailedFromStkQuery", () => {
  const staleAge = STALE_PAYMENT_MS + 60_000;

  it("returns false for pending / early-query codes on fresh payments", () => {
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "2031", resultDesc: "still" })).toBe(false);
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "1037", resultDesc: "not found" })).toBe(false);
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "1032", resultDesc: "timeout" })).toBe(false);
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "500.001.0", resultDesc: "error" })).toBe(false);
  });

  it("returns true for any non-success code when payment is stale (>24h)", () => {
    expect(
      shouldMarkPaymentAsFailedFromStkQuery(
        { resultCode: "1037", resultDesc: "not found" },
        { paymentAgeMs: staleAge }
      )
    ).toBe(true);
    expect(
      shouldMarkPaymentAsFailedFromStkQuery(
        { resultCode: "1032", resultDesc: "Request timeout" },
        { paymentAgeMs: staleAge }
      )
    ).toBe(true);
    expect(
      shouldMarkPaymentAsFailedFromStkQuery(
        { resultCode: "QUERY_TRANSPORT_ERROR", resultDesc: "Request failed with status code 500" },
        { paymentAgeMs: staleAge }
      )
    ).toBe(true);
    expect(
      shouldMarkPaymentAsFailedFromStkQuery(
        { resultCode: "2031", resultDesc: "still processing" },
        { paymentAgeMs: staleAge }
      )
    ).toBe(true);
  });

  it("returns false for transport/query errors on fresh payments", () => {
    expect(
      shouldMarkPaymentAsFailedFromStkQuery({
        resultCode: "QUERY_TRANSPORT_ERROR",
        resultDesc: "socket hang up",
      })
    ).toBe(false);
    expect(
      shouldMarkPaymentAsFailedFromStkQuery({
        resultCode: "1",
        resultDesc: "axios error ECONNRESET",
      })
    ).toBe(false);
  });

  it("returns true for explicit user cancel (code 1, real message)", () => {
    expect(
      shouldMarkPaymentAsFailedFromStkQuery({
        resultCode: "1",
        resultDesc: "The transaction was cancelled by the user",
      })
    ).toBe(true);
  });
});
