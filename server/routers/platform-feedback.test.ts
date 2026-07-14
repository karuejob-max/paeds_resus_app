import { describe, it, expect, beforeEach, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const { mockCreate, mockListUser, mockListAdmin, mockGetById, mockAnalyze, mockCluster, mockDraft } = vi.hoisted(() => ({
  mockCreate: vi.fn().mockResolvedValue({ success: true, ticketId: 42 }),
  mockListUser: vi.fn().mockResolvedValue([]),
  mockListAdmin: vi.fn().mockResolvedValue([]),
  mockGetById: vi.fn(),
  mockAnalyze: vi.fn(),
  mockCluster: vi.fn(),
  mockDraft: vi.fn(),
}));

vi.mock("../lib/platform-feedback-tickets", () => ({
  createPlatformFeedbackTicket: mockCreate,
  listUserFeedbackTickets: mockListUser,
  listAdminFeedbackTickets: mockListAdmin,
  getFeedbackTicketById: mockGetById,
  listOpenFeedbackTicketsForExport: vi.fn(),
  formatFeedbackExportMarkdown: vi.fn(),
  appendFeedbackStatusHistory: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../db", () => ({ getDb: vi.fn(), insertAdminAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../services/analytics.service", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/feedback-ai-assist", () => ({
  analyzeFeedbackTicket: mockAnalyze,
  clusterFeedbackTickets: mockCluster,
  draftFeedbackReply: mockDraft,
}));

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

  it("feedback.submit accepts issueType and severity", async () => {
    await appRouter.createCaller(ctx()).feedback.submit({
      category: "course_content",
      issueType: "content",
      severity: "high",
      message: "Module 2 is missing escalation section.",
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ issueType: "content", severity: "high" })
    );
  });

  it("adminFeedback.list requires admin", async () => {
    await expect(appRouter.createCaller(ctx()).adminFeedback.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("adminFeedback.list works for admin", async () => {
    mockListAdmin.mockResolvedValue([{ id: 1, priority: "safety", category: "safety_concern", status: "open", message: "x", createdAt: new Date() }]);
    const rows = await appRouter.createCaller(ctx("admin")).adminFeedback.list();
    expect(rows).toHaveLength(1);
  });

  it("adminFeedback.analyzeTicket requires admin and returns suggestion", async () => {
    mockGetById.mockResolvedValue({
      id: 7,
      category: "course_content",
      issueType: "content",
      severity: "medium",
      priority: "normal",
      status: "open",
      message: "Wrong answer key",
      contextJson: { courseSlug: "asthma-i" },
    });
    mockAnalyze.mockResolvedValue({
      summary: "Answer key mismatch",
      suggestedSeverity: "high",
      suggestedIssueType: "content",
      suggestedAssignee: "cursor",
      suggestedTags: ["asthma-i"],
      triageNotes: "Audit seed",
      regressionGuard: "Do not delete module",
      confidence: "high",
    });
    await expect(appRouter.createCaller(ctx()).adminFeedback.analyzeTicket({ ticketId: 7 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const r = await appRouter.createCaller(ctx("admin")).adminFeedback.analyzeTicket({ ticketId: 7 });
    expect(r.suggestion.suggestedAssignee).toBe("cursor");
    expect(mockAnalyze).toHaveBeenCalled();
  });
});
