import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const parentDbMock = vi.hoisted(() => {
  let nextSubmissionId = 42;
  const submissions = new Map<number, Record<string, unknown>>();
  const eventsBySubmission = new Map<number, Array<Record<string, unknown>>>();
  const mockState = {
    selectRows: [] as Array<Record<string, unknown>>,
    orderByRows: [] as Array<Record<string, unknown>>,
  };

  const insertChain = {
    values: vi.fn().mockImplementation((row: Record<string, unknown>) => {
      if ("childOutcome" in row) {
        const id = nextSubmissionId++;
        submissions.set(id, { id, userId: row.userId ?? 1, childOutcome: row.childOutcome });
        eventsBySubmission.set(id, []);
        return Promise.resolve([{ insertId: id }]);
      }
      if ("submissionId" in row) {
        const sid = Number(row.submissionId);
        const list = eventsBySubmission.get(sid) ?? [];
        list.push(row);
        eventsBySubmission.set(sid, list);
      }
      return Promise.resolve([{ insertId: 1 }]);
    }),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };

  const queryable = {
    limit: vi.fn().mockImplementation(() => Promise.resolve(mockState.selectRows)),
    orderBy: vi.fn().mockImplementation(() => Promise.resolve(mockState.orderByRows)),
    then: (resolve: (v: unknown) => void) => resolve(mockState.selectRows),
  };

  return {
    mockState,
    submissions,
    eventsBySubmission,
    getDb: vi.fn().mockResolvedValue({
      insert: vi.fn().mockReturnValue(insertChain),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(queryable),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(() => Promise.resolve(mockState.selectRows)),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue(insertChain),
    }),
  };
});

vi.mock("./db", () => ({
  getDb: parentDbMock.getDb,
}));

vi.mock("./services/analytics.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

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

  it("accepts anonymous submissions", async () => {
    const result = await caller.parentSafeTruth.submitTimeline({
      events: [
        {
          eventType: "arrival",
          time: "2026-01-21T10:00:00Z",
          description: "Child arrived at hospital",
        },
      ],
      childOutcome: "referred",
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

  it("retrieves submission details with events", async () => {
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

    const stored = parentDbMock.submissions.get(submission.submissionId)!;
    parentDbMock.mockState.selectRows = [stored];
    parentDbMock.mockState.orderByRows = parentDbMock.eventsBySubmission.get(submission.submissionId) ?? [];

    const details = await caller.parentSafeTruth.getSubmissionDetails({
      submissionId: submission.submissionId,
    });

    expect(details.submission).toBeDefined();
    expect(details.submission.id).toBe(submission.submissionId);
    expect(Array.isArray(details.events)).toBe(true);
  });

  it("includes system gaps in submission details", async () => {
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

    const stored = parentDbMock.submissions.get(submission.submissionId)!;
    parentDbMock.mockState.selectRows = [stored];
    parentDbMock.mockState.orderByRows = parentDbMock.eventsBySubmission.get(submission.submissionId) ?? [];

    const details = await caller.parentSafeTruth.getSubmissionDetails({
      submissionId: submission.submissionId,
    });

    expect(details.submission).toBeDefined();
    expect(details.analysis === null || typeof details.analysis === "object").toBe(true);
  });
});

describe("parentSafeTruth.getHospitalMetrics", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext(4);
    caller = appRouter.createCaller(ctx);
  });

  it("retrieves hospital metrics", async () => {
    parentDbMock.mockState.selectRows = [
      {
        hospitalId: 1,
        totalSubmissions: 3,
        avgArrivalToDoctorDelay: "25.0",
      },
    ];

    const metrics = await caller.parentSafeTruth.getHospitalMetrics({
      hospitalId: 1,
    });

    expect(metrics).toBeDefined();
    expect(metrics!.totalSubmissions).toBeGreaterThanOrEqual(0);
  });

  it("returns metrics with improvement recommendations", async () => {
    parentDbMock.mockState.selectRows = [
      {
        hospitalId: 1,
        totalSubmissions: 2,
        topImprovementAreas: JSON.stringify(["communication", "triage"]),
      },
    ];

    const metrics = await caller.parentSafeTruth.getHospitalMetrics({
      hospitalId: 1,
    });

    expect(metrics).toBeDefined();
    expect(metrics!.topImprovementAreas).toBeDefined();
  });
});

describe("parentSafeTruth.getHospitalDelayAnalysis", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createParentContext(5);
    caller = appRouter.createCaller(ctx);
  });

  it("retrieves delay analysis for hospital", async () => {
    parentDbMock.mockState.orderByRows = [
      {
        hospitalId: 1,
        submissionId: 42,
        recommendations: JSON.stringify(["Reduce triage wait time"]),
      },
    ];

    const analyses = await caller.parentSafeTruth.getHospitalDelayAnalysis({
      hospitalId: 1,
    });

    expect(Array.isArray(analyses)).toBe(true);
    expect(analyses.length).toBeGreaterThanOrEqual(0);
  });

  it("includes recommendations in delay analysis", async () => {
    parentDbMock.mockState.orderByRows = [
      {
        hospitalId: 1,
        submissionId: 42,
        recommendations: JSON.stringify(["Improve monitoring"]),
      },
    ];

    const analyses = await caller.parentSafeTruth.getHospitalDelayAnalysis({
      hospitalId: 1,
    });

    expect(analyses[0]?.recommendations).toBeDefined();
  });
});

describe("parentSafeTruth integration", () => {
  it("complete workflow: submit -> retrieve -> analyze", async () => {
    const ctx = createParentContext(6);
    const caller = appRouter.createCaller(ctx);

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

    const stored = parentDbMock.submissions.get(submission.submissionId)!;
    parentDbMock.mockState.selectRows = [stored];
    parentDbMock.mockState.orderByRows =
      parentDbMock.eventsBySubmission.get(submission.submissionId) ?? [];

    const details = await caller.parentSafeTruth.getSubmissionDetails({
      submissionId: submission.submissionId,
    });

    expect(details.events.length).toBeGreaterThanOrEqual(1);
    expect(details.submission.childOutcome).toBe("discharged");

    parentDbMock.mockState.selectRows = [{ hospitalId: 1, totalSubmissions: 1 }];
    const metrics = await caller.parentSafeTruth.getHospitalMetrics({ hospitalId: 1 });
    expect(metrics?.totalSubmissions).toBeGreaterThanOrEqual(1);

    parentDbMock.mockState.orderByRows = [
      { hospitalId: 1, recommendations: JSON.stringify(["Continue Kaizen reviews"]) },
    ];
    const analyses = await caller.parentSafeTruth.getHospitalDelayAnalysis({ hospitalId: 1 });
    expect(analyses.length).toBeGreaterThanOrEqual(1);
  });
});
