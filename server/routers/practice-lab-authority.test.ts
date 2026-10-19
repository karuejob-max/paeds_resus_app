import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";
import { scoreAuthoritativeChoiceAttempt, scoreCardiacArrestEventLog } from "../../shared/phase2-automation";

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
  it("rejects a dedicated ACLS attempt with a forged score and no rehearsal", async () => {
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

  it("does not treat client correct flags as an authoritative ABCDE pass", () => {
    const forgedLog = Array.from({ length: 10 }, (_, index) => ({
      timestamp: index,
      type: "abcde_action",
      description: "Action: observe",
      correct: true,
    }));
    const result = scoreAuthoritativeChoiceAttempt("abcde", "unstable_brady_infant", forgedLog);
    expect(result).toEqual({ score: 0, passed: false });
  });

  it("scores a submitted ABCDE choice against the server-held answer key", () => {
    const result = scoreAuthoritativeChoiceAttempt("abcde", "unstable_brady_infant", [
      { timestamp: 1, type: "abcde_action", description: "Action: epinephrine", correct: false },
    ]);
    expect(result).toEqual({ score: 100, passed: true });
  });

  it("scores shock and rhythm choices against server-held keys", () => {
    expect(scoreAuthoritativeChoiceAttempt("shock_no_shock", "pea_hypovolemia", [
      { timestamp: 1, type: "action", description: "Selected: cpr", correct: false },
    ])).toEqual({ score: 100, passed: true });
    expect(scoreAuthoritativeChoiceAttempt("rhythm_recognition", "vf_identify_action", [
      { timestamp: 1, type: "identify", description: "Rhythm: Ventricular Fibrillation (VF)", correct: false },
      { timestamp: 1, type: "action", description: "Action: CPR + defibrillate 2 J/kg (peds) or 120-200 J (adult)", correct: false },
    ])).toEqual({ score: 100, passed: true });
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
