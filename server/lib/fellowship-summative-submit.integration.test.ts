import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { MICROCOURSE_SUMMATIVE_QUIZ_TITLE } from "../../shared/microcourse-exam-policy";
import * as examGate from "./microcourse-exam-gate";
import { quizzes, userProgress } from "../../drizzle/schema";

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
const SUMMATIVE_MODULE_ID = 701;
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

function buildDbMock(progressRows: Record<string, unknown>[]) {
  const insertValues = vi.fn().mockResolvedValue(undefined);
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));

  return {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        if (table === quizzes) {
          return {
            where: vi.fn(() => ({
              limit: vi.fn(async () => [{ title: MICROCOURSE_SUMMATIVE_QUIZ_TITLE, passingScore: 80 }]),
            })),
          };
        }
        if (table === userProgress) {
          return {
            where: vi.fn(async () => progressRows),
          };
        }
        return {
          where: vi.fn(async () => []),
        };
      }),
    })),
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
      moduleId: SUMMATIVE_MODULE_ID,
      quizId: SUMMATIVE_QUIZ_ID,
      score: 0,
      answers: { 1: "Option A", 2: "Option B" },
    });

    expect(result.success).toBe(true);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.passingScore).toBe(80);
    expect(result.examKind).toBe("summative");
    expect(result.questionResults).toHaveLength(2);
    expect(mockDb.__insertValues).toHaveBeenCalled();
  });

  it("replays idempotently within 30s without writing progress again", async () => {
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
        updatedAt: new Date(),
        completedAt: null,
      },
    ];
    const mockDb = buildDbMock(progressRows);
    vi.mocked(getDb).mockResolvedValue(mockDb as never);

    vi.spyOn(examGate, "computeQuizScoreFromDb").mockResolvedValue({
      score: 50,
      correctCount: 1,
      totalQuestions: 2,
      questionResults: [
        { questionId: 1, correct: true, correctOption: "Option A", userAnswer: "Option A" },
        { questionId: 2, correct: false, correctOption: "Option B", userAnswer: "Wrong" },
      ],
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.recordQuizAttempt({
      enrollmentId: MICRO_ENROLLMENT_ID,
      moduleId: SUMMATIVE_MODULE_ID,
      quizId: SUMMATIVE_QUIZ_ID,
      score: 0,
      answers: { 1: "Option A", 2: "Wrong" },
    });

    expect(result.idempotentReplay).toBe(true);
    expect(result.score).toBe(40);
    expect(result.passed).toBe(false);
    expect(result.questionResults).toHaveLength(2);
    expect(mockDb.__insertValues).not.toHaveBeenCalled();
    expect(mockDb.__updateWhere).not.toHaveBeenCalled();
  });
});
