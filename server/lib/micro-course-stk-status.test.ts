import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  query: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  row: {} as any,
}));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../mpesa", () => ({ queryStk: mocks.query }));
import { checkOwnedMicroCourseStk } from "./micro-course-stk-status";
const input = { enrollmentId: 11, userId: 7, checkoutRequestId: "ws_CO_ours" };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.row = {
    id: 11,
    userId: 7,
    transactionId: "ws_CO_ours",
    amountPaid: 20000,
    paymentStatus: "pending",
  };
  mocks.where.mockResolvedValue(undefined);
  mocks.set.mockReturnValue({ where: mocks.where });
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.getDb.mockResolvedValue({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (mocks.row ? [mocks.row] : []) }),
      }),
    }),
    update: mocks.update,
  });
  mocks.query.mockResolvedValue({
    resultCode: "0",
    checkoutRequestID: "ws_CO_ours",
  });
});
describe("learner bound STK status", () => {
  it("rejects an unrelated successful checkout before querying", async () => {
    await expect(
      checkOwnedMicroCourseStk({
        ...input,
        checkoutRequestId: "ws_CO_someone_else",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("rejects nonexistent or unowned enrollment", async () => {
    mocks.row = null;
    await expect(checkOwnedMicroCourseStk(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("activates only provider confirmed success and retains checkout", async () => {
    expect((await checkOwnedMicroCourseStk(input)).status).toBe("completed");
    expect(mocks.query).toHaveBeenCalledWith("ws_CO_ours");
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "completed",
        enrollmentStatus: "active",
      })
    );
    expect(mocks.set.mock.calls[0][0]).not.toHaveProperty("transactionId");
  });
  it("rejects mismatched provider checkout", async () => {
    mocks.query.mockResolvedValue({
      resultCode: "0",
      checkoutRequestID: "ws_CO_other",
    });
    await expect(checkOwnedMicroCourseStk(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects mismatched amount", async () => {
    mocks.query.mockResolvedValue({
      resultCode: "0",
      checkoutRequestID: "ws_CO_ours",
      amount: 1,
    });
    await expect(checkOwnedMicroCourseStk(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([
    ["1032", "cancelled"],
    ["1", "failed"],
    ["1037", "failed"],
    ["2031", "pending"],
    ["QUERY_TRANSPORT_ERROR", "pending"],
  ])("classifies %s as %s without activation", async (code, outcome) => {
    mocks.query.mockResolvedValue({
      resultCode: code,
      resultDesc: "Provider description",
    });
    expect(await checkOwnedMicroCourseStk(input)).toMatchObject({
      status: outcome,
      errorMessage: expect.stringContaining("Provider description"),
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("never downgrades a previously completed row", async () => {
    mocks.row.paymentStatus = "completed";
    expect((await checkOwnedMicroCourseStk(input)).status).toBe("completed");
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("propagates persistence failure rather than reporting completion", async () => {
    mocks.where.mockRejectedValue(new Error("db unavailable"));
    await expect(checkOwnedMicroCourseStk(input)).rejects.toThrow(
      "db unavailable"
    );
  });
  it("fails closed without database", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(checkOwnedMicroCourseStk(input)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
