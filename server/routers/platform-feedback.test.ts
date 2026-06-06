import { describe, it, expect, beforeEach, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const { mockCreate, mockListUser, mockListAdmin } = vi.hoisted(() => ({
  mockCreate: vi.fn().mockResolvedValue({ success: true, ticketId: 42 }),
  mockListUser: vi.fn().mockResolvedValue([]),
  mockListAdmin: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/platform-feedback-tickets", () => ({
  createPlatformFeedbackTicket: mockCreate,
  listUserFeedbackTickets: mockListUser,
  listAdminFeedbackTickets: mockListAdmin,
  getFeedbackTicketById: vi.fn(),
  listOpenFeedbackTicketsForExport: vi.fn(),
  formatFeedbackExportMarkdown: vi.fn(),
}));
vi.mock("../db", () => ({ getDb: vi.fn(), insertAdminAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../services/analytics.service", () => ({ trackEvent: vi.fn() }));

import { appRouter } from "../routers";

function ctx(role = "user"): TrpcContext {
  return {
    user: { id: 1, openId: "t", email: "t@t.com", name: "T", loginMethod: "email", role, userType: "individual", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as User,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("platform feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("feedback.submit returns ticketId", async () => {
    const r = await appRouter.createCaller(ctx()).feedback.submit({ category: "other", message: "Long enough message here." });
    expect(r).toEqual({ success: true, ticketId: 42 });
  });

  it("adminFeedback.list requires admin", async () => {
    await expect(appRouter.createCaller(ctx()).adminFeedback.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("adminFeedback.list works for admin", async () => {
    mockListAdmin.mockResolvedValue([{ id: 1, priority: "safety", category: "safety_concern", status: "open", message: "x", createdAt: new Date() }]);
    const rows = await appRouter.createCaller(ctx("admin")).adminFeedback.list();
    expect(rows).toHaveLength(1);
  });
});
