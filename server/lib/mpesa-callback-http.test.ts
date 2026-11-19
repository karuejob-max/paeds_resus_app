import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const mocks = vi.hoisted(() => ({
  db: { select: vi.fn() },
  getDb: vi.fn(),
  reconcileMicro: vi.fn(),
  institution: vi.fn(),
  ierp: vi.fn(),
  logging: vi.fn(),
  certificate: vi.fn(),
  ilsComplete: vi.fn(),
  ilsFailure: vi.fn(),
  nerp: vi.fn(),
  analytics: vi.fn(),
}));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("./micro-course-mpesa-callback", async importOriginal => {
  const original =
    await importOriginal<typeof import("./micro-course-mpesa-callback")>();
  return { ...original, reconcileMicroCourseStkCallback: mocks.reconcileMicro };
});
vi.mock("../mpesa-real", () => ({
  queryStk: vi.fn(() => {
    throw new Error("Live provider forbidden");
  }),
}));
vi.mock("./mpesa-webhook-log", () => ({
  attachMpesaWebhookLogging: mocks.logging,
}));
vi.mock("./institution-mpesa-reconciliation", () => ({
  reconcileInstitutionMpesaIntent: mocks.institution,
}));
vi.mock("./ierp-payment-reconciliation", () => ({
  reconcileIerpMpesaPayment: mocks.ierp,
}));
vi.mock("../certificates", () => ({
  issueCertificateForEnrollmentIfEligible: mocks.certificate,
}));
vi.mock("../services/analytics.service", () => ({
  trackPaymentCompletion: mocks.analytics,
}));
vi.mock("./nerp-offer", () => ({ applyNerpPaymentCompletion: mocks.nerp }));
vi.mock("./institutional-life-support-payments", () => ({
  applyInstitutionalLifeSupportPaymentCompletion: mocks.ilsComplete,
  applyInstitutionalLifeSupportPaymentFailure: mocks.ilsFailure,
  validateIlsInstitutionalPaymentAmount: vi.fn(() => ({ valid: true })),
}));

import {
  handleMpesaWebhook,
  handleMpesaTimeoutWebhook,
} from "../webhooks/mpesa-webhook";
import { MpesaCallbackRetryError } from "./micro-course-mpesa-callback";

function request(code: unknown = 0) {
  return {
    headers: {},
    body: {
      Body: {
        stkCallback: {
          CheckoutRequestID: "checkout-stored",
          ResultCode: code,
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 200 },
              { Name: "MpesaReceiptNumber", Value: "ABC123XYZ" },
              { Name: "PhoneNumber", Value: 254712345678 },
            ],
          },
        },
      },
    },
  } as any;
}
function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    on: vi.fn(),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MPESA_REQUIRE_CALLBACK_SIGNATURE", "false");
  mocks.getDb.mockResolvedValue(mocks.db);
  mocks.reconcileMicro.mockResolvedValue(null);
  mocks.institution.mockResolvedValue(null);
  mocks.ierp.mockResolvedValue(null);
  mocks.db.select.mockImplementation(() => {
    const chain = {
      from: () => chain,
      where: () => chain,
      limit: async () => [],
      then: (fn: any) => Promise.resolve([]).then(fn),
    };
    return chain;
  });
});

describe("canonical callback HTTP contract", () => {
  it("accepts unsigned verified micro-course payment and retains webhook log including receipt", async () => {
    mocks.reconcileMicro.mockResolvedValue({
      enrollmentId: 12,
      status: "completed",
      duplicate: false,
      amountCents: 20000,
      receipt: "ABC123XYZ",
    });
    const res = response();
    await handleMpesaWebhook(request("0"), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.reconcileMicro).toHaveBeenCalledWith(
      mocks.db,
      expect.objectContaining({
        resultCode: 0,
        checkoutRequestId: "checkout-stored",
      })
    );
    expect(mocks.logging.mock.calls[0][1]).toMatchObject({
      outcome: "payment_completed",
      enrollmentId: 12,
      amountCents: 20000,
      mpesaReceiptNumber: "ABC123XYZ",
    });
    expect(mocks.institution).not.toHaveBeenCalled();
  });
  it.each([1032, 1037, 1])(
    "handles nested nonzero %s using same micro-course reconciliation",
    async code => {
      mocks.reconcileMicro.mockResolvedValue({
        enrollmentId: 12,
        status: "failed",
        duplicate: false,
        amountCents: 20000,
        receipt: null,
      });
      const res = response();
      await handleMpesaTimeoutWebhook(request(code), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mocks.reconcileMicro).toHaveBeenCalledWith(
        mocks.db,
        expect.objectContaining({ resultCode: code })
      );
      expect(mocks.logging).toHaveBeenCalledTimes(1);
      expect(mocks.logging.mock.calls[0][1].outcome).toBe("payment_failed");
    }
  );
  it("returns retryable 503 for provider processing/verification failure", async () => {
    mocks.reconcileMicro.mockRejectedValue(
      new MpesaCallbackRetryError("Provider still processing")
    );
    const res = response();
    await handleMpesaWebhook(request(2031), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(mocks.logging.mock.calls[0][1].outcome).toBe("error");
  });
  it("returns retryable 503 on persistence failure", async () => {
    mocks.reconcileMicro.mockRejectedValue(new Error("write failed"));
    const res = response();
    await handleMpesaWebhook(request(), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(mocks.logging.mock.calls[0][1].outcome).toBe("persist_error");
  });
  it.each([0, 1032])(
    "does not lose callback-before-checkout-storage race code %s",
    async code => {
      const res = response();
      await handleMpesaWebhook(request(code), res);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(mocks.logging.mock.calls[0][1].outcome).toBe("payment_not_found");
    }
  );
  it("still dispatches existing institutional subscription callbacks", async () => {
    mocks.institution.mockResolvedValue({
      status: "completed",
      paymentId: 55,
      duplicate: false,
    });
    const res = response();
    await handleMpesaWebhook(request(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.institution).toHaveBeenCalledWith(
      mocks.db,
      expect.objectContaining({
        checkoutRequestId: "checkout-stored",
        amount: 200,
      })
    );
    expect(mocks.ierp).not.toHaveBeenCalled();
  });
  it("still dispatches IERP callbacks", async () => {
    mocks.ierp.mockResolvedValue({
      status: "completed",
      paymentId: 22,
      duplicate: false,
    });
    const res = response();
    await handleMpesaWebhook(request(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.ierp).toHaveBeenCalledWith(
      mocks.db,
      expect.objectContaining({ checkoutRequestId: "checkout-stored" })
    );
  });
  it("malformed payloads fail before any DB call", async () => {
    const res = response();
    await handleMpesaWebhook(request("invalid"), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it("preserves ordinary AHA ledger completion and existing certificate/institutional side effects", async () => {
    const payment = {
      id: 10,
      userId: 7,
      enrollmentId: 11,
      status: "pending",
      amount: 20000,
      transactionId: "checkout-stored",
    };
    const selections = [
      [],
      [payment],
      [{ status: "completed" }],
      [{ id: 11, userId: 7 }],
    ];
    mocks.db.select.mockImplementation(() => {
      const rows = selections.shift() ?? [];
      const chain = {
        from: () => chain,
        where: () => chain,
        limit: async () => rows,
        then: (fn: any) => Promise.resolve(rows).then(fn),
      };
      return chain;
    });
    const updates: any[] = [];
    (mocks.db as any).update = vi.fn(() => ({
      set: (values: any) => ({
        where: async () => {
          updates.push(values);
        },
      }),
    }));
    mocks.certificate.mockResolvedValue({ issued: false });
    const res = response();
    await handleMpesaWebhook(request(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(updates[0]).toMatchObject({
      status: "completed",
      idempotencyKey: "checkout-stored",
      mpesaReceiptNumber: "ABC123XYZ",
    });
    expect(updates[1]).toMatchObject({ paymentStatus: "completed" });
    expect(mocks.certificate).toHaveBeenCalledWith(11);
    expect(mocks.ilsComplete).toHaveBeenCalledWith(mocks.db, 10);
    expect(mocks.nerp).toHaveBeenCalledWith(mocks.db, 10);
    expect(mocks.analytics).toHaveBeenCalled();
  });
  it("does not regress generic processing callbacks to terminal failure", async () => {
    const res = response();
    await handleMpesaWebhook(request(2031), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.ilsFailure).not.toHaveBeenCalled();
  });
  it("canonical and legacy paths share all-outcome STK dispatch, with original IP guard", () => {
    const source = readFileSync(
      new URL("../_core/index.ts", import.meta.url),
      "utf8"
    );
    const dispatch = source.slice(
      source.indexOf("const mpesaStkCallbackHandler"),
      source.indexOf("// CPD certificate downloads")
    );
    expect(dispatch).toContain("isMpesaCallbackIpAllowed(req)");
    expect(dispatch).toContain("handleMpesaQueryWebhook");
    expect(dispatch).toContain("return handleMpesaWebhook");
    expect(dispatch).not.toContain("handleMpesaTimeoutWebhook");
    expect(dispatch).not.toContain("code === 0");
    expect(dispatch).toContain("app.post(STK_CALLBACK_PATH,");
    expect(dispatch).toContain("app.post(STK_CALLBACK_PATH_LEGACY,");
  });
});
