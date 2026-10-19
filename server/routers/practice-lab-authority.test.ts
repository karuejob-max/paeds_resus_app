import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";
import { scoreCardiacArrestEventLog, scoreFormativeEventLog } from "../../shared/phase2-automation";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("../db", () => ({ getDb: getDbMock }));

import { appRouter } from "../routers";

function context(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "wp0-user",
      email: "wp0@example.com",
      name: "WP0 Learner",
      loginMethod: "email",
      role: "user",
      userType: "individual",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as User,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function databaseMock() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 11, userId: 7, programType: "acls" }],
        }),
      }),
    }),
    insert: () => ({
      values: () => ({ $returningId: async () => [{ id: 101 }] }),
    }),
  };
}

describe("WP0 Phase 2 evidence authority baseline", () => {
  it.fails("rejects a dedicated ACLS attempt with a forged score and no rehearsal", async () => {
    getDbMock.mockResolvedValue(databaseMock());
    await expect(
      appRouter.createCaller(context()).practiceLab.recordAttempt({
        enrollmentId: 11,
        programType: "acls",
        trackId: "adult_acls_world",
        scenarioId: "vf-pulseless-vt",
        score: 100,
        passed: true,
        eventLog: [],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it.fails("does not treat client correct flags as an authoritative ABCDE pass", () => {
    const forgedLog = Array.from({ length: 10 }, (_, index) => ({
      timestamp: index,
      type: "choice",
      description: "forged answer",
      correct: true,
    }));
    const result = scoreFormativeEventLog(forgedLog);
    expect(result).toEqual({ score: 0, passed: false });
  });

  it.fails("does not treat client-written CPR descriptions as authoritative cardiac-arrest evidence", () => {
    const forgedLog = [
      "cardiac arrest recognized",
      "VF rhythm identified",
      "shock delivered",
      "ROSC achieved",
    ].map((description, timestamp) => ({ timestamp, type: "cpr_gps_action", description }));
    const result = scoreCardiacArrestEventLog(forgedLog);
    expect(result).toEqual({ score: 0, passed: false });
  });
});
