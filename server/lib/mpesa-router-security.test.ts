import { describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock("../db", async orig => ({
  ...(await orig<typeof import("../db")>()),
  getDb: m.db,
}));
import { mpesaRouter } from "../routers/mpesa";
describe("payment diagnostic security", () => {
  it("removes the arbitrary KES1 STK mutation entirely", () => {
    expect(mpesaRouter._def.procedures).not.toHaveProperty("debugStkPush");
  });
  it("denies statistics to ordinary learners before reading finance data", async () => {
    const ctx = {
      user: { id: 7, role: "user" },
      req: { headers: {} },
      res: {},
    } as any;
    await expect(
      mpesaRouter.createCaller(ctx).getPaymentStats()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(m.db).not.toHaveBeenCalled();
  });
  it("denies unauthenticated status calls", async () => {
    const ctx = { user: null, req: { headers: {} }, res: {} } as any;
    await expect(
      mpesaRouter
        .createCaller(ctx)
        .checkPaymentStatus({
          enrollmentId: 7,
          checkoutRequestId: "ws_CO_other",
        })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
