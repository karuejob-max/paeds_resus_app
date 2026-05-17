import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

const { trackEventMock } = vi.hoisted(() => ({
  trackEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/analytics.service", () => ({
  trackEvent: trackEventMock,
  trackPageView: vi.fn(),
  trackButtonClick: vi.fn(),
  trackFormSubmission: vi.fn(),
  trackCourseEnrollment: vi.fn(),
  trackPaymentCompletion: vi.fn(),
  calculateAnalyticsMetrics: vi.fn(),
}));

import { appRouter } from "../routers";

function createAuthContext(overrides?: Partial<User>): TrpcContext {
  const user: User = {
    id: 42,
    openId: "analytics-test",
    email: "analytics@test.com",
    name: "Analytics Test",
    loginMethod: "manus",
    role: "admin",
    userType: "individual",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("events.trackEvent", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it("accepts Sprint 1 resus_* event types", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const res = await caller.events.trackEvent({
      eventType: "resus_session",
      eventName: "ResusGPS workspace entered",
      pageUrl: "/resus",
      sessionId: "test-session-1",
      eventData: { product: "ResusGPS" },
    });
    expect(res.success).toBe(true);
    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "resus_session",
        userId: 42,
      })
    );
  });

  it("accepts course_enrollment-shaped payloads", async () => {
    const caller = appRouter.createCaller(createAuthContext({ id: 7 }));
    await caller.events.trackEvent({
      eventType: "course_enrollment",
      eventName: "Micro-course enrolled",
      sessionId: "s2",
      eventData: { courseId: "asthma-i" },
    });
    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "course_enrollment", userId: 7 })
    );
  });
});
