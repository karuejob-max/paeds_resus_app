import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";
import { appRouter } from "../routers";
import { getDb } from "../db";
import {
  MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
  MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
} from "../../shared/microcourse-exam-policy";
import * as examGate from "./microcourse-exam-gate";
import * as schema from "../../drizzle/schema";
const { quizzes, userProgress } = schema;

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../services/analytics.service", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./sync-micro-course-enrollment-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sync-micro-course-enrollment-progress")>();
  return {
    ...actual,
    isMicroCourseEnrollmentId: vi.fn().mockResolvedValue(true),
    syncMicroCourseEnrollmentProgress: vi.fn().mockResolvedValue(80),
  };
});

const SUMMATIVE_QUIZ_ID = 9001;
const DIAGNOSTIC_QUIZ_ID = 9000;
const SUMMATIVE_MODULE_ID = 701;
const DIAGNOSTIC_MODULE_ID = 700;
const MICRO_ENROLLMENT_ID = 501;
const USER_ID = 42;

function createAuthContext(): TrpcContext {
  const user = {
    id: USER_ID,
    openId: "fellowship-learner",
    email: "learner@test.com",
    name: "Learner",
    loginMethod: "manus",
    role: "user",
    userType: "individual",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as User;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function buildDbMock(
  progressRows: Record<string, unknown>[],
  quizMetaId: number = SUMMATIVE_QUIZ_ID
) {
  const insertValues = vi.fn().mockResolvedValue(undefined);
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));

  const quizRows = [
    {
      id: SUMMATIVE_QUIZ_ID,
      title: MICROCOURSE_SUMMATIVE_QUIZ_TITLE,
      passingScore: 80,
      moduleId: SUMMATIVE_MODULE_ID,
    },
    {
      id: DIAGNOSTIC_QUIZ_ID,
      title: MICROCOURSE_DIAGNOSTIC_QUIZ_TITLE,
      passingScore: 0,
      moduleId: DIAGNOSTIC_MODULE_ID,
    },
  ];

  const mockChain = (data: any) => {
    const chain = {
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      then: (onFullfilled: any) => Promise.resolve(data).then(onFullfilled),
    };
    return chain;
  };

  return {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        if (table === quizzes) {
          const row = quizRows.find((q) => q.id === quizMetaId) ?? quizRows[0];
          return mockChain(row ? [row] : []);
        }
        if (table === userProgress) {
          return mockChain(progressRows);
        }
        if (table === schema.modules) {
          return mockChain([{ id: 1, order: 1 }]);
        }
        if (table === schema.courses) {
          return mockChain([{ id: 1, courseId: "asthma-i" }]);
        }
        return mockChain([]);
      }),
    })),
    query: {
      microCourseEnrollments: {
        findFirst: vi.fn(async () => ({ id: MICRO_ENROLLMENT_ID, userId: USER_ID, microCourseId: 1 })),
      },
      microCourses: {
        findFirst: vi.fn(async () => ({ id: 1, title: "Test Course" })),
      },
      courses: {
        findFirst: vi.fn(async () => ({ id: 1 })),
      },
    },
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
    __insertValues: insertValues,
    __updateWhere: updateWhere,
  };
}

describe("fellowship summative submit (recordQuizAttempt integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(examGate, "computeQuizScoreFromDb").mockResolvedValue({
      score: 100,
      correctCount: 2,
      totalQuestions: 2,
      questionResults: [
        { questionId: 1, correct: true, correctOption: "Option A", userAnswer: "Option A" },
        { questionId: 2, correct: true, correctOption: "Option B", userAnswer: "Option B" },
      ],
    });
  });

  it("returns score, pass/fail, and questionResults for micro-course enrollment", async () => {
    const progressRows: Record<string, unknown>[] = [];
    const mockDb = buildDbMock(progressRows);
    vi.mocked(getDb).mockResolvedValue(mockDb as never);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.recordQuizAttempt({
      enrollmentId: MICRO_ENROLLMENT_ID,
      quizId: SUMMATIVE_QUIZ_ID,
      answers: [
        { questionId: 1, answer: "Option A" },
        { questionId: 2, answer: "Option B" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.passingScore).toBe(80);
    expect(result.examKind).toBe("summative");
    expect(result.questionResults).toHaveLength(2);
    expect(mockDb.__insertValues).toHaveBeenCalled();
  });

  it("accepts diagnostic quiz submit when summativeQuizId differs", async () => {
    const progressRows: Record<string, unknown>[] = [];
    const mockDb = buildDbMock(progressRows, DIAGNOSTIC_QUIZ_ID);
    vi.mocked(getDb).mockResolvedValue(mockDb as never);

    vi.spyOn(examGate, "getMicrocourseExamState").mockResolvedValue({
      diagnosticRequired: true,
      diagnosticCompleted: false,
      summativeRequired: true,
      summativePassed: false,
      summativeQuizId: SUMMATIVE_QUIZ_ID,
      diagnosticQuizId: DIAGNOSTIC_QUIZ_ID,
      summativeAttempts: 0,
      summativeMaxAttempts: 3,
      summativeBlockKind: "none",
      canRetrySummative: true,
      retryAvailableAt: null,
      summativePassPercent: 80,
      capstoneRequired: false,
      capstonePassed: true,
      fellowshipSimPassed: false,
      lastSummativeAttempt: null,
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.recordQuizAttempt({
      enrollmentId: MICRO_ENROLLMENT_ID,
      quizId: DIAGNOSTIC_QUIZ_ID,
      answers: [
        { questionId: 1, answer: "Option A" },
        { questionId: 2, answer: "Option B" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.examKind).toBe("diagnostic");
    expect(result.passed).toBe(true);
    expect(mockDb.__insertValues).toHaveBeenCalled();
  });

  it("replays summative submit idempotently within 30s window", async () => {
    const now = new Date();
    const progressRows: Record<string, unknown>[] = [
      {
        id: 99,
        userId: USER_ID,
        enrollmentId: MICRO_ENROLLMENT_ID,
        moduleId: SUMMATIVE_MODULE_ID,
        quizId: SUMMATIVE_QUIZ_ID,
        score: 40,
        attempts: 1,
        status: "in_progress",
        updatedAt: now,
        completedAt: null,
      },
    ];
    const mockDb = buildDbMock(progressRows);
    vi.mocked(getDb).mockResolvedValue(mockDb as never);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.recordQuizAttempt({
      enrollmentId: MICRO_ENROLLMENT_ID,
      quizId: SUMMATIVE_QUIZ_ID,
      answers: [
        { questionId: 1, answer: "Option A" },
        { questionId: 2, answer: "Wrong" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.idempotentReplay).toBe(true);
    expect(result.score).toBe(40);
  });
});
