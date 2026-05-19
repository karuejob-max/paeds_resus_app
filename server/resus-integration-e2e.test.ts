/**
 * E2E Integration Test: ResusGPS Analytics (requires DATABASE_URL)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, analyticsEvents, resusGPSSessions, careSignalEvents } from "../drizzle/schema";
import {
  createTestUser,
  createCompletedResusSession,
  conditionsFromSession,
  deleteUserResusSessions,
  type TestDb,
} from "./test-utils/resus-gps-test-helpers";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("ResusGPS Analytics Integration E2E", () => {
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
    await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should record ResusGPS session in resusGPSSessions", async () => {
    const sessionId = await createCompletedResusSession(db, {
      userId: testUserId,
      primaryDiagnosis: "septic_shock",
      secondaryDiagnoses: ["meningitis"],
      durationSeconds: 420,
      interventionCount: 12,
    });

    const sessionRecord = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.sessionId, sessionId))
      .limit(1);

    expect(sessionRecord).toHaveLength(1);
    expect(sessionRecord[0].primaryDiagnosis).toBe("septic_shock");
    expect(conditionsFromSession(sessionRecord[0])).toContain("meningitis");
  });

  it("should track analytics event for session completion", async () => {
    await db.insert(analyticsEvents).values({
      userId: testUserId,
      eventType: "resusGps_session_completed",
      eventName: "resus_gps_session_completed",
      eventData: JSON.stringify({
        pathway: "cardiac_arrest_protocol",
        durationSeconds: 300,
        interactionsCount: 8,
        validatedConditions: ["cardiac_arrest", "rosc_achieved"],
      }),
    });

    const events = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, testUserId));

    expect(events.some((e) => e.eventType === "resusGps_session_completed")).toBe(true);
  });

  it("should calculate fellowship progress from completed sessions", async () => {
    const conditions = ["septic_shock", "meningitis", "cardiac_arrest"];

    for (const condition of conditions) {
      await createCompletedResusSession(db, {
        userId: testUserId,
        primaryDiagnosis: condition,
        durationSeconds: 300,
        interventionCount: 8,
      });
    }

    const sessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    const conditionSet = new Set<string>();
    sessions.forEach((session) => {
      if (session.status === "completed") {
        for (const c of conditionsFromSession(session)) {
          conditionSet.add(c);
        }
      }
    });

    expect(conditionSet.size).toBeGreaterThanOrEqual(3);
  });

  it("should aggregate condition practice patterns for heatmap", async () => {
    const sessionData = [
      { condition: "septic_shock", count: 2 },
      { condition: "meningitis", count: 2 },
      { condition: "cardiac_arrest", count: 1 },
    ];

    for (const { condition, count } of sessionData) {
      for (let i = 0; i < count; i++) {
        await createCompletedResusSession(db, {
          userId: testUserId,
          primaryDiagnosis: condition,
        });
      }
    }

    const allSessions = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId));

    const conditionCounts: Record<string, number> = {};
    allSessions.forEach((session) => {
      for (const c of conditionsFromSession(session)) {
        conditionCounts[c] = (conditionCounts[c] || 0) + 1;
      }
    });

    expect(Object.keys(conditionCounts).length).toBeGreaterThan(0);
    expect(conditionCounts["septic_shock"]).toBeGreaterThan(0);
  });

  it("should access careSignalEvents table for linkage workflows", async () => {
    const rows = await db.select().from(careSignalEvents).limit(1);
    expect(rows).toBeDefined();
  });

  it("should validate recorded sessions use known primary diagnoses", async () => {
    const validDiagnoses = ["septic_shock", "cardiac_arrest", "meningitis", "anaphylaxis"];

    const sessionRecord = await db
      .select()
      .from(resusGPSSessions)
      .where(eq(resusGPSSessions.userId, testUserId))
      .limit(1);

    if (sessionRecord.length > 0) {
      expect(validDiagnoses).toContain(sessionRecord[0].primaryDiagnosis);
    }
  });
});
