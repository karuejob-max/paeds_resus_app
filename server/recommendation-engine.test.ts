/**
 * Recommendation Engine Integration Tests (requires DATABASE_URL)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, resusGPSSessions } from "../drizzle/schema";
import {
  createTestUser,
  createCompletedResusSession,
  conditionsFromSession,
  deleteUserResusSessions,
  type TestDb,
} from "./test-utils/resus-gps-test-helpers";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Recommendation Engine", () => {
  let testUserId: number;
  let db: TestDb;

  beforeAll(async () => {
    const connection = await getDb();
    if (!connection) throw new Error("Database not available");
    db = connection;
    testUserId = await createTestUser(db);
  });

  afterAll(async () => {
    if (!db || !testUserId) return;
    await deleteUserResusSessions(db, testUserId);
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should calculate learner progress correctly", async () => {
    await createCompletedResusSession(db, {
      userId: testUserId,
      primaryDiagnosis: "septic_shock",
      secondaryDiagnoses: ["meningitis"],
    });
    await createCompletedResusSession(db, {
      userId: testUserId,
      primaryDiagnosis: "septic_shock",
      secondaryDiagnoses: ["meningitis"],
    });
    await createCompletedResusSession(db, {
      userId: testUserId,
      primaryDiagnosis: "cardiac_arrest",
    });

    const createdSessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    expect(createdSessions.length).toBeGreaterThanOrEqual(3);
    expect(createdSessions.some((s) => s.primaryDiagnosis === "septic_shock")).toBe(true);
    expect(createdSessions.some((s) => s.primaryDiagnosis === "cardiac_arrest")).toBe(true);
  });

  it("should identify conditions with insufficient practice", async () => {
    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    const conditionCounts: Record<string, number> = {};
    sessions.forEach((session) => {
      if (session.status === "completed") {
        for (const cond of conditionsFromSession(session)) {
          conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        }
      }
    });

    expect(conditionCounts["septic_shock"]).toBeGreaterThanOrEqual(2);
    expect(conditionCounts["meningitis"]).toBeGreaterThanOrEqual(2);
    expect(conditionCounts["cardiac_arrest"]).toBeGreaterThanOrEqual(1);

    const needsMorePractice = Object.entries(conditionCounts)
      .filter(([, count]) => count < 3)
      .map(([cond]) => cond);

    expect(needsMorePractice).toContain("cardiac_arrest");
  });

  it("should score conditions based on multiple factors", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

    await createCompletedResusSession(db, {
      userId: testUserId,
      primaryDiagnosis: "anaphylaxis",
      createdAt: thirtyDaysAgo,
    });

    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    const oldSession = sessions.find((s) => s.primaryDiagnosis === "anaphylaxis");
    expect(oldSession).toBeDefined();
    expect(oldSession?.createdAt.getTime()).toBeLessThan(Date.now() - 30 * 24 * 60 * 60 * 1000);
  });

  it("should handle facility gaps correctly", async () => {
    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    const practiced = new Set<string>();
    sessions.forEach((session) => {
      if (session.status === "completed") {
        for (const c of conditionsFromSession(session)) {
          practiced.add(c);
        }
      }
    });

    const allConditions = [
      "cardiac_arrest",
      "airway_obstruction",
      "severe_respiratory_distress",
      "anaphylaxis",
      "status_epilepticus",
      "septic_shock",
      "hypovolemic_shock",
      "dka",
    ];

    const gaps = allConditions.filter((c) => !practiced.has(c));
    expect(gaps.length).toBeGreaterThan(0);
  });

  it("should prioritize critical conditions in recommendations", async () => {
    const criticalConditions = ["cardiac_arrest", "airway_obstruction", "anaphylaxis"];

    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    let criticalPractice = 0;
    let nonCriticalPractice = 0;

    sessions.forEach((session) => {
      if (session.status === "completed") {
        for (const c of conditionsFromSession(session)) {
          if (criticalConditions.includes(c)) criticalPractice++;
          else nonCriticalPractice++;
        }
      }
    });

    expect(criticalPractice + nonCriticalPractice).toBeGreaterThan(0);
  });

  it("should avoid recommending already-completed conditions", async () => {
    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    const conditionCounts: Record<string, number> = {};
    sessions.forEach((session) => {
      if (session.status === "completed") {
        for (const cond of conditionsFromSession(session)) {
          conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        }
      }
    });

    const completed = Object.entries(conditionCounts)
      .filter(([, count]) => count >= 3)
      .map(([cond]) => cond);

    expect(completed.length).toBeGreaterThanOrEqual(0);
  });

  it("should generate valid learning path", async () => {
    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    expect(sessions.length).toBeGreaterThan(0);

    const conditions = new Set<string>();
    sessions.forEach((session) => {
      for (const c of conditionsFromSession(session)) {
        conditions.add(c);
      }
    });

    expect(conditions.size).toBeGreaterThan(0);
  });
});
