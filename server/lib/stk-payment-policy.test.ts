import { describe, it, expect } from "vitest";
import { normalizeKenyanPhone } from "../../shared/kenyan-phone";
import { classifyStkResult, canStartNewStkAttempt, STK_RETRY_WAIT_MS } from "./stk-payment-policy";

describe("Kenyan payment phones", () => {
  it.each(["0710606854", "710606854", "254710606854", "+254710606854", " +254 710 606 854 ", "0710-606-854"])("normalizes %s", value => expect(normalizeKenyanPhone(value)).toBe("254710606854"));
  it.each(["0112345678", "+254112345678"])("accepts 01 mobile %s", value => expect(normalizeKenyanPhone(value)).toBe("254112345678"));
  it.each(["abc0710606854", "+440710606854", "0201234567", "071060685", "2540710606854", ""])("rejects %s", value => expect(normalizeKenyanPhone(value)).toBeNull());
});
describe("STK outcome and retry policy", () => {
  it.each([["0", "completed"], ["1032", "cancelled"], ["1037", "failed"], ["1", "failed"], ["2001", "failed"], ["QUERY_TRANSPORT_ERROR", "pending"], ["CONFIG_ERROR", "pending"], ["2031", "pending"], ["", "pending"]])("classifies %s", (resultCode, expected) => expect(classifyStkResult({ resultCode })).toBe(expected));
  it("never resends a confirmed checkout", () => expect(canStartNewStkAttempt({outcome:"completed",explicitRetry:true,updatedAt:new Date(0)})).toBe(false));
  it("permits terminal failure retry", () => expect(canStartNewStkAttempt({outcome:"cancelled",explicitRetry:false,updatedAt:new Date()})).toBe(true));
  it("blocks implicit retry while uncertain even if old", () => expect(canStartNewStkAttempt({outcome:"pending",explicitRetry:false,updatedAt:new Date(0)})).toBe(false));
  it("requires explicit retry plus a cooldown while uncertain", () => {
    expect(canStartNewStkAttempt({outcome:"pending",explicitRetry:true,updatedAt:new Date(0),now:STK_RETRY_WAIT_MS-1})).toBe(false);
    expect(canStartNewStkAttempt({outcome:"pending",explicitRetry:true,updatedAt:new Date(0),now:STK_RETRY_WAIT_MS})).toBe(true);
    expect(canStartNewStkAttempt({outcome:"pending",explicitRetry:true,updatedAt:null})).toBe(false);
  });
});
