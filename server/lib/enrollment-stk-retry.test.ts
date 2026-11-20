import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  pending: vi.fn(),
  enrolled: vi.fn(),
  create: vi.fn(),
  setCheckout: vi.fn(),
  query: vi.fn(),
  stk: vi.fn(),
  db: vi.fn(),
  admin: vi.fn(),
  cap: vi.fn(),
}));
vi.mock("../db", async orig => ({
  ...(await orig<typeof import("../db")>()),
  getDb: m.db,
}));
vi.mock("./micro-course-catalog", () => ({
  ensureMicroCoursesCatalog: vi.fn(),
}));
vi.mock("../db-enrollment", () => ({
  getCourseDetails: vi
    .fn()
    .mockResolvedValue({
      id: 1,
      courseId: "asthma-i",
      title: "Asthma I",
      price: 20000,
      prerequisiteId: null,
    }),
  isUserEnrolled: m.enrolled,
  getPendingMpesaEnrollment: m.pending,
  createEnrollment: m.create,
  setEnrollmentCheckoutRequestId: m.setCheckout,
  isUserAdmin: m.admin,
  validatePromoCode: vi.fn(),
  calculateFinalPrice: vi.fn(),
  incrementPromoCodeUsage: vi.fn(),
}));
vi.mock("./global-entitlements", async orig => ({
  ...(await orig<typeof import("./global-entitlements")>()),
  findActiveGlobalEntitlement: vi.fn().mockResolvedValue(null),
}));
vi.mock("./micro-course-stk-status", () => ({
  checkOwnedMicroCourseStk: m.query,
}));
vi.mock("./mpesa-config", () => ({ getMpesaConfigReadiness: m.cap }));
vi.mock("../mpesa", () => ({ initiateStkPush: m.stk }));
vi.mock("../services/analytics.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
  trackPaymentInitiation: vi.fn().mockResolvedValue(undefined),
}));
import { enrollmentRouter } from "../routers/enrollment";
const ctx = {
  user: { id: 7, name: "Test", role: "user", userType: "individual" },
  req: { headers: {} },
  res: {},
} as any;
const base = { courseId: "asthma-i", phoneNumber: "0712345678" };
const pending = {
  id: 11,
  userId: 7,
  microCourseId: 1,
  amountPaid: 20000,
  transactionId: "ws_CO_old",
  createdAt: new Date(Date.now() - 180000),
  paymentStatus: "pending",
  paymentMethod: "m-pesa",
  entitlementId: 5,
  promoCodeId: 9,
};
beforeEach(() => {
  vi.clearAllMocks();
  m.stk.mockReset();
  m.setCheckout.mockReset();
  m.db.mockResolvedValue({});
  m.enrolled.mockResolvedValue(false);
  m.admin.mockResolvedValue(false);
  m.pending.mockResolvedValue({ ...pending });
  m.create.mockResolvedValue({ insertId: 12 });
  m.cap.mockReturnValue({ stkPushOffered: true });
  m.stk.mockResolvedValue({ success: true, checkoutRequestID: "ws_CO_new" });
  m.query.mockResolvedValue({
    status: "pending",
    resultCode: "QUERY_TRANSPORT_ERROR",
  });
  m.setCheckout.mockResolvedValue(undefined);
});
describe("provider-checked Fellowship retry", () => {
  it("does not resend an old uncertain payment automatically", async () => {
    const r = await enrollmentRouter.createCaller(ctx).enrollWithPayment(base);
    expect(r).toMatchObject({
      success: true,
      enrollmentId: 11,
      checkoutRequestId: "ws_CO_old",
      previousPaymentUnconfirmed: true,
    });
    expect(m.stk).not.toHaveBeenCalled();
    expect(m.query).toHaveBeenCalledWith({
      enrollmentId: 11,
      userId: 7,
      checkoutRequestId: "ws_CO_old",
    });
  });
  it("marks provider confirmed payment active without another prompt", async () => {
    m.query.mockResolvedValue({ status: "completed" });
    const r = await enrollmentRouter.createCaller(ctx).enrollWithPayment(base);
    expect(r.paymentCompleted).toBe(true);
    expect(m.stk).not.toHaveBeenCalled();
  });
  it.each(["cancelled", "failed"])(
    "uses a new row for terminal %s and retains old checkout",
    async status => {
      m.query.mockResolvedValue({
        status,
        resultCode: status === "cancelled" ? "1032" : "1",
      });
      const r = await enrollmentRouter
        .createCaller(ctx)
        .enrollWithPayment(base);
      expect(r.checkoutRequestId).toBe("ws_CO_new");
      expect(m.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entitlementId: 5,
          promoCodeId: 9,
          amountPaid: 20000,
        })
      );
      expect(m.setCheckout.mock.calls.every(([id]) => id === 12)).toBe(true);
    }
  );
  it("requires explicit retry for old transport uncertainty", async () => {
    const r = await enrollmentRouter
      .createCaller(ctx)
      .enrollWithPayment({ ...base, retryStk: true });
    expect(r).toMatchObject({
      checkoutRequestId: "ws_CO_new",
      previousPaymentUnconfirmed: true,
    });
  });
  it("enforces cooldown on explicit uncertain retry", async () => {
    m.pending.mockResolvedValue({ ...pending, createdAt: new Date() });
    await enrollmentRouter
      .createCaller(ctx)
      .enrollWithPayment({ ...base, retryStk: true });
    expect(m.stk).not.toHaveBeenCalled();
  });
  it("does not resend provider processing2031 even after cooldown", async () => {
    m.query.mockResolvedValue({ status: "pending", resultCode: "2031" });
    await enrollmentRouter
      .createCaller(ctx)
      .enrollWithPayment({ ...base, retryStk: true });
    expect(m.stk).not.toHaveBeenCalled();
  });
  it("does not query reservation or manual receipt as a checkout", async () => {
    m.pending.mockResolvedValue({ ...pending, transactionId: "STK_IN_FLIGHT" });
    const r = await enrollmentRouter.createCaller(ctx).enrollWithPayment(base);
    expect(m.query).not.toHaveBeenCalled();
    expect(m.stk).not.toHaveBeenCalled();
    expect(r.checkoutRequestId).toBeUndefined();
  });
  it("persists reservation before external request", async () => {
    m.pending.mockResolvedValue(null);
    m.stk.mockImplementation(async () => {
      expect(m.setCheckout).toHaveBeenCalledWith(12, "STK_IN_FLIGHT");
      return { success: true, checkoutRequestID: "ws_CO_new" };
    });
    const r = await enrollmentRouter.createCaller(ctx).enrollWithPayment(base);
    expect(r.success).toBe(true);
  });
  it("does not report paid/successful checkout if acceptance lacks ID", async () => {
    m.pending.mockResolvedValue(null);
    m.stk.mockResolvedValue({ success: true });
    const r = await enrollmentRouter.createCaller(ctx).enrollWithPayment(base);
    expect(r).toMatchObject({
      previousPaymentUnconfirmed: true,
      paymentCompleted: false,
    });
    expect(r.checkoutRequestId).toBeUndefined();
  });
  it("propagates persistence failure as enrollment failure", async () => {
    m.pending.mockResolvedValue(null);
    m.setCheckout.mockImplementation(async (_id, id) => {
      if (id === "ws_CO_new") throw new Error("persist failed");
    });
    const r = await enrollmentRouter.createCaller(ctx).enrollWithPayment(base);
    expect(r).toMatchObject({ success: false, error: "persist failed" });
  });
  it("does not send when pending-history read fails", async () => {
    m.pending.mockRejectedValue(new Error("db failed"));
    expect(
      (await enrollmentRouter.createCaller(ctx).enrollWithPayment(base)).success
    ).toBe(false);
    expect(m.stk).not.toHaveBeenCalled();
  });
  it("rejects malformed phone before creating an attempt", async () => {
    const r = await enrollmentRouter
      .createCaller(ctx)
      .enrollWithPayment({ ...base, phoneNumber: "07123abc4567" });
    expect(r.success).toBe(false);
    expect(m.create).not.toHaveBeenCalled();
  });
});
