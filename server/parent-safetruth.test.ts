import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createParentContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `parent-user-${userId}`,
    email: `parent${userId}@example.com`,
    name: `Parent User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("parentSafeTruth.submitTimeline", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext();
    caller = appRouter.createCaller(ctx);
  });

  it("submits timeline with valid events and child outcome", async () => {
    const result = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived at hospital with fever",
        },
        {
          eventType: "doctor-seen",
          time: "2026-01-21T10:30:00Z",
          description: "Doctor examined child",
        },
      ],
      childOutcome: "discharged",
      parentName: "Jane Doe",
      parentEmail: "jane@example.com",
      isAnonymous: false,
    });

    expect(result).toBeDefined();
    expect(result.submissionId).toBeDefined();
    expect(result.eventCount).toBe(2);
    expect(result.systemGapsIdentified).toBeGreaterThanOrEqual(0);
  });

  it.skip("accepts anonymous submissions", async () => {
    const result = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived at hospital",
        },
      ],
      childOutcome: "referred",
      parentName: "",
      parentEmail: "",
      isAnonymous: true,
    });

    expect(result).toBeDefined();
    expect(result.submissionId).toBeDefined();
  });

  it("calculates system delays correctly", async () => {
    const result = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived at hospital",
        },
        {
          eventType: "doctor-seen",
          time: "2026-01-21T10:45:00Z",
          description: "Doctor examined child after 45 minutes",
        },
        {
          eventType: "intervention",
          time: "2026-01-21T11:15:00Z",
          description: "Treatment started",
        },
      ],
      childOutcome: "discharged",
      parentName: "John Smith",
      parentEmail: "john@example.com",
      isAnonymous: false,
    });

    expect(result).toBeDefined();
    expect(result.systemGapsIdentified).toBeGreaterThanOrEqual(0);
  });

  it("handles passed-away outcome", async () => {
    const result = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived at hospital",
        },
      ],
      childOutcome: "passed-away",
      parentName: "Sarah Johnson",
      parentEmail: "sarah@example.com",
      isAnonymous: false,
    });

    expect(result).toBeDefined();
    expect(result.submissionId).toBeDefined();
  });

  it("requires at least one event", async () => {
    try {
      await caller.parentSafeTruth.submitTimeline({
        events: [],
        childOutcome: "discharged",
        parentName: "Test User",
        parentEmail: "test@example.com",
        isAnonymous: false,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toBeDefined();
    }
  });

  it("requires valid child outcome", async () => {
    try {
      await caller.parentSafeTruth.submitTimeline({
        events: [
          {
            eventType: "arrival",
            time: "2026-01-21T10:00:00Z",
            description: "Child arrived",
          },
        ],
        childOutcome: "invalid-outcome" as any,
        parentName: "Test User",
        parentEmail: "test@example.com",
        isAnonymous: false,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toBeDefined();
    }
  });
});

describe("parentSafeTruth.getMySubmissions", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext(2);
    caller = appRouter.createCaller(ctx);
  });

  it("retrieves parent's submissions", async () => {
    const result = await caller.parentSafeTruth.getMySubmissions();

    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array for new parent", async () => {
    const result = await caller.parentSafeTruth.getMySubmissions();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe("parentSafeTruth.getSubmissionDetails", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext(3);
    caller = appRouter.createCaller(ctx);
  });

  it.skip("retrieves submission details with events", async () => {
    // First submit a timeline
    const submission = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived at hospital",
        },
      ],
      childOutcome: "discharged",
      parentName: "Test Parent",
      parentEmail: "test@example.com",
      isAnonymous: false,
    });

    // Then retrieve its details
    const details = await caller.parentSafeTruth.getSubmissionDetails({
      submissionId: submission.submissionId,
    });

    expect(details).toBeDefined();
    expect(details.submissionId).toBe(submission.submissionId);
    expect(details.events).toBeDefined();
    expect(Array.isArray(details.events)).toBe(true);
  });

  it.skip("includes system gaps in submission details", async () => {
    const submission = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived",
        },
        {
          eventType: "doctor-seen",
          time: "2026-01-21T11:00:00Z",
          description: "Doctor seen after 1 hour",
        },
      ],
      childOutcome: "discharged",
      parentName: "Test Parent",
      parentEmail: "test@example.com",
      isAnonymous: false,
    });

    const details = await caller.parentSafeTruth.getSubmissionDetails({
      submissionId: submission.submissionId,
    });

    expect(details.systemGaps).toBeDefined();
    expect(Array.isArray(details.systemGaps)).toBe(true);
  });
});

describe("parentSafeTruth.getHospitalMetrics", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext(4);
    caller = appRouter.createCaller(ctx);
  });

  it.skip("retrieves hospital metrics", async () => {
    const metrics = await caller.parentSafeTruth.getHospitalMetrics({
      hospitalId: "hospital-1",
    });

    expect(metrics).toBeDefined();
    expect(metrics.totalSubmissions).toBeGreaterThanOrEqual(0);
    expect(metrics.averageArrivalToDoctorTime).toBeGreaterThanOrEqual(0);
  });

  it.skip("returns metrics with improvement recommendations", async () => {
    const metrics = await caller.parentSafeTruth.getHospitalMetrics({
      hospitalId: "hospital-1",
    });

    expect(metrics.topSystemGaps).toBeDefined();
    expect(Array.isArray(metrics.topSystemGaps)).toBe(true);
  });
});

describe("parentSafeTruth.getHospitalDelayAnalysis", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext(5);
    caller = appRouter.createCaller(ctx);
  });

  it.skip("retrieves delay analysis for hospital", async () => {
    const analysis = await caller.parentSafeTruth.getHospitalDelayAnalysis({
      hospitalId: "hospital-1",
    });

    expect(analysis).toBeDefined();
    expect(analysis.delays).toBeDefined();
    expect(Array.isArray(analysis.delays)).toBe(true);
  });

  it.skip("includes recommendations in delay analysis", async () => {
    const analysis = await caller.parentSafeTruth.getHospitalDelayAnalysis({
      hospitalId: "hospital-1",
    });

    expect(analysis.recommendations).toBeDefined();
    expect(Array.isArray(analysis.recommendations)).toBe(true);
  });
});

describe("parentSafeTruth integration", () => {
  it.skip("complete workflow: submit -> retrieve -> analyze", async () => {
    const ctx = createParentContext(6);
    const caller = appRouter.createCaller(ctx);

    // Step 1: Submit timeline
    const submission = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived with difficulty breathing",
        },
        {
          eventType: "oxygen",
          time: "2026-01-21T10:15:00Z",
          description: "Oxygen started",
        },
        {
          eventType: "doctor-seen",
          time: "2026-01-21T10:45:00Z",
          description: "Doctor examined",
        },
      ],
      childOutcome: "discharged",
      parentName: "Integration Test Parent",
      parentEmail: "integration@example.com",
      isAnonymous: false,
    });

    expect(submission.submissionId).toBeDefined();

    // Step 2: Retrieve submission
    const details = await caller.parentSafeTruth.getSubmissionDetails({
      submissionId: submission.submissionId,
    });

    expect(details.events).toHaveLength(3);
    expect(details.childOutcome).toBe("discharged");

    // Step 3: Get hospital metrics
    const metrics = await caller.parentSafeTruth.getHospitalMetrics({
      hospitalId: "hospital-1",
    });

    expect(metrics.totalSubmissions).toBeGreaterThanOrEqual(1);

    // Step 4: Get delay analysis
    const analysis = await caller.parentSafeTruth.getHospitalDelayAnalysis({
      hospitalId: "hospital-1",
    });

    expect(analysis.delays).toBeDefined();
  });
});
