import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("axios", () => ({ default: http }));
let service: typeof import("../mpesa-real");
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  for (const k of [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "DARAJA_SHORTCODE",
    "DARAJA_PASSKEY",
    "CALLBACK_URL",
    "MPESA_CALLBACK_URL",
    "APP_BASE_URL",
  ])
    vi.stubEnv(k, "");
  vi.stubEnv("DARAJA_CONSUMER_KEY", "dummy-key");
  vi.stubEnv("DARAJA_CONSUMER_SECRET", "dummy-secret");
  vi.stubEnv("MPESA_PAYBILL", "4034223");
  vi.stubEnv("MPESA_PASSKEY", "dummy-passkey");
  vi.stubEnv("MPESA_ENVIRONMENT", "production");
  http.get.mockResolvedValue({
    data: { access_token: "dummy-token", expires_in: 3600 },
  });
  http.post.mockResolvedValue({
    data: {
      ResponseCode: "0",
      CheckoutRequestID: "ws_CO_dummy",
      CustomerMessage: "Accepted",
    },
  });
  service = await import("../mpesa-real");
});
afterEach(() => vi.unstubAllEnvs());
const request = {
  phoneNumber: "+254 710 606 854",
  amount: 200,
  accountReference: "LONG-REFERENCE-12345",
  transactionDesc: "Asthma Management I - Paeds Resus Fellowship",
  orderId: "test-order",
};
describe("production STK payload contract (no charges)", () => {
  it("sends normalized phone, live paybill, bounded fields and canonical callback", async () => {
    expect(await service.initiateStkPush(request)).toMatchObject({
      success: true,
      checkoutRequestID: "ws_CO_dummy",
    });
    const [url, payload] = http.post.mock.calls[0];
    expect(url).toBe(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    );
    expect(payload).toMatchObject({
      PhoneNumber: "254710606854",
      PartyA: "254710606854",
      PartyB: "4034223",
      BusinessShortCode: "4034223",
      Amount: 200,
      TransactionType: "CustomerPayBillOnline",
      CallBackURL: "https://www.paedsresus.com/api/payment/callback",
    });
    expect(payload.AccountReference.length).toBeLessThanOrEqual(12);
    expect(payload.TransactionDesc.length).toBeLessThanOrEqual(13);
    expect(http.post.mock.calls[0][2].timeout).toBe(45000);
  });
  it.each([0, -1, 0.5, NaN, Infinity])(
    "rejects invalid amount %s before network",
    async amount => {
      expect(
        (await service.initiateStkPush({ ...request, amount })).success
      ).toBe(false);
      expect(http.post).not.toHaveBeenCalled();
      expect(http.get).not.toHaveBeenCalled();
    }
  );
  it("does not accept response code0 without checkout", async () => {
    http.post.mockResolvedValue({ data: { ResponseCode: "0" } });
    expect((await service.initiateStkPush(request)).success).toBe(false);
  });
  it.each(["07123abc4567", "2547123456789", "+255712345678"])(
    "rejects malformed phone %s",
    async phoneNumber => {
      expect(
        (await service.initiateStkPush({ ...request, phoneNumber })).success
      ).toBe(false);
      expect(http.post).not.toHaveBeenCalled();
    }
  );
  it("supports 01 mobile numbers", async () => {
    await service.initiateStkPush({ ...request, phoneNumber: "0112345678" });
    expect(http.post.mock.calls[0][1].PhoneNumber).toBe("254112345678");
  });
  it("preserves custom callback paths", async () => {
    vi.stubEnv("MPESA_CALLBACK_URL", "https://paedsresus.com/custom/stk");
    await service.initiateStkPush(request);
    expect(http.post.mock.calls[0][1].CallBackURL).toBe(
      "https://paedsresus.com/custom/stk"
    );
  });
  it.each([
    ["1032", "Cancelled by user"],
    ["1", "Insufficient balance"],
  ])("preserves provider %s description", async (resultCode, desc) => {
    http.post.mockResolvedValue({
      data: {
        ResultCode: resultCode,
        ResultDesc: desc,
        CheckoutRequestID: "ws_CO_dummy",
      },
    });
    expect(await service.queryStk("ws_CO_dummy")).toMatchObject({
      resultCode,
      resultDesc: desc,
    });
  });
  it("keeps HTTP404 query unknown rather than cancelled", async () => {
    http.post.mockRejectedValue(
      Object.assign(new Error("not found"), { response: { status: 404 } })
    );
    expect((await service.queryStk("ws_CO_dummy")).resultCode).toBe(
      "QUERY_TRANSPORT_ERROR"
    );
  });
});
