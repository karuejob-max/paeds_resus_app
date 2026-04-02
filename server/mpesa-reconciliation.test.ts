import { describe, it, expect } from "vitest";
import { shouldMarkPaymentAsFailedFromStkQuery } from "./mpesa-reconciliation";

describe("shouldMarkPaymentAsFailedFromStkQuery", () => {
  it("returns false for pending / early-query codes", () => {
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "2031", resultDesc: "still" })).toBe(false);
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "1037", resultDesc: "not found" })).toBe(false);
    expect(shouldMarkPaymentAsFailedFromStkQuery({ resultCode: "500.001.0", resultDesc: "error" })).toBe(false);
  });

  it("returns false for transport/query errors", () => {
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
