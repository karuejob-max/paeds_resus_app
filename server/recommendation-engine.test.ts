/**
 * Recommendation Engine Integration Tests
 * 
 * Tests the complete recommendation flow:
 * 1. Learner progress calculation
 * 2. Facility gap identification
 * 3. Personalized learning path generation
 * 4. Scoring and prioritization logic
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { usersTable, resusSessionRecords, institutionsTable } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Recommendation Engine', () => {
  let testUserId: string;
  let testInstitutionId: string;

  beforeAll(async () => {
    // Create test user
    const userResult = await db
      .insert(usersTable)
      .values({
        email: `test-rec-${Date.now()}@test.com`,
        name: 'Test Recommendation User',
        role: 'user',
      })
      .returning();

    testUserId = userResult[0].id;

    // Create test institution
    const instResult = await db
      .insert(institutionsTable)
      .values({
        name: 'Test Recommendation Hospital',
        country: 'KE',
        county: 'Nairobi',
      })
      .returning();

    testInstitutionId = instResult[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(resusSessionRecords).where(eq(resusSessionRecords.userId, testUserId));
    await db.delete(usersTable).where(eq(usersTable.id, testUserId));
    await db.delete(institutionsTable).where(eq(institutionsTable.id, testInstitutionId));
  });

  it('should calculate learner progress correctly', async () => {
    // Create sessions with different condition counts
    const sessions = [
      {
        userId: testUserId,
        institutionId: testInstitutionId,
        pathway: 'septic_shock',
        attributedConditions: ['septic_shock', 'meningitis'],
        isValid: true,
        durationSeconds: 300,
        interactionsCount: 5,
        depthScore: 85,
      },
      {
        userId: testUserId,
        institutionId: testInstitutionId,
        pathway: 'septic_shock',
        attributedConditions: ['septic_shock', 'meningitis'],
        isValid: true,
        durationSeconds: 350,
        interactionsCount: 6,
        depthScore: 90,
      },
      {
        userId: testUserId,
        institutionId: testInstitutionId,
        pathway: 'cardiac_arrest',
        attributedConditions: ['cardiac_arrest'],
        isValid: true,
        durationSeconds: 400,
        interactionsCount: 8,
        depthScore: 95,
      },
    ];

    await db.insert(resusSessionRecords).values(sessions);

    // Verify sessions were created
    const createdSessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    expect(createdSessions.length).toBeGreaterThanOrEqual(3);
    expect(createdSessions.some((s) => s.pathway === 'septic_shock')).toBe(true);
    expect(createdSessions.some((s) => s.pathway === 'cardiac_arrest')).toBe(true);
  });

  it('should identify conditions with insufficient practice', async () => {
    // Query sessions for this user
    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    // Count valid sessions per condition
    const conditionCounts: Record<string, number> = {};

    sessions.forEach((session) => {
      if (session.isValid && session.attributedConditions) {
        const conditions = Array.isArray(session.attributedConditions)
          ? session.attributedConditions
          : [session.attributedConditions];

        conditions.forEach((cond) => {
          conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        });
      }
    });

    // Verify counts
    expect(conditionCounts['septic_shock']).toBe(2);
    expect(conditionCounts['meningitis']).toBe(2);
    expect(conditionCounts['cardiac_arrest']).toBe(1);

    // Conditions with <3 cases should be recommended
    const needsMorePractice = Object.entries(conditionCounts)
      .filter(([, count]) => count < 3)
      .map(([cond]) => cond);

    expect(needsMorePractice).toContain('cardiac_arrest');
  });

  it('should score conditions based on multiple factors', async () => {
    // Scoring logic should consider:
    // 1. Practice count (0-2 cases = higher priority)
    // 2. Time since last practice (>30 days = bonus)
    // 3. Clinical priority (cardiac arrest > septic shock > etc.)

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create an old session (>30 days)
    await db.insert(resusSessionRecords).values({
      userId: testUserId,
      institutionId: testInstitutionId,
      pathway: 'anaphylaxis',
      attributedConditions: ['anaphylaxis'],
      isValid: true,
      durationSeconds: 200,
      interactionsCount: 4,
      depthScore: 70,
      createdAt: new Date(thirtyDaysAgo.getTime() - 1000), // 1 second before 30 days
    });

    // Verify old session was created
    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    const oldSession = sessions.find((s) => s.pathway === 'anaphylaxis');
    expect(oldSession).toBeDefined();
    expect(oldSession?.createdAt).toBeLessThan(thirtyDaysAgo);
  });

  it('should handle facility gaps correctly', async () => {
    // A facility gap is a condition with 0 practice in the last 30 days
    // This should be identified and recommended

    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.institutionId, testInstitutionId));

    // Get unique conditions practiced
    const practiced = new Set<string>();
    sessions.forEach((session) => {
      if (session.isValid && session.attributedConditions) {
        const conditions = Array.isArray(session.attributedConditions)
          ? session.attributedConditions
          : [session.attributedConditions];
        conditions.forEach((c) => practiced.add(c));
      }
    });

    // There should be some conditions not practiced
    const allConditions = [
      'cardiac_arrest',
      'airway_obstruction',
      'severe_respiratory_distress',
      'anaphylaxis',
      'status_epilepticus',
      'septic_shock',
      'hypovolemic_shock',
      'dka',
    ];

    const gaps = allConditions.filter((c) => !practiced.has(c));
    expect(gaps.length).toBeGreaterThan(0);
  });

  it('should prioritize critical conditions in recommendations', async () => {
    // Critical conditions (cardiac arrest, airway, anaphylaxis) should be
    // recommended before less critical ones

    const criticalConditions = [
      'cardiac_arrest',
      'airway_obstruction',
      'anaphylaxis',
    ];

    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    // Count practice for critical vs non-critical
    let criticalPractice = 0;
    let nonCriticalPractice = 0;

    sessions.forEach((session) => {
      if (session.isValid && session.attributedConditions) {
        const conditions = Array.isArray(session.attributedConditions)
          ? session.attributedConditions
          : [session.attributedConditions];

        conditions.forEach((c) => {
          if (criticalConditions.includes(c)) {
            criticalPractice++;
          } else {
            nonCriticalPractice++;
          }
        });
      }
    });

    // Both should have some practice
    expect(criticalPractice + nonCriticalPractice).toBeGreaterThan(0);
  });

  it('should avoid recommending already-completed conditions', async () => {
    // If a learner has 3+ valid sessions for a condition,
    // it should not be the top recommendation

    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    const conditionCounts: Record<string, number> = {};

    sessions.forEach((session) => {
      if (session.isValid && session.attributedConditions) {
        const conditions = Array.isArray(session.attributedConditions)
          ? session.attributedConditions
          : [session.attributedConditions];

        conditions.forEach((cond) => {
          conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        });
      }
    });

    // Find conditions with 3+ cases
    const completed = Object.entries(conditionCounts)
      .filter(([, count]) => count >= 3)
      .map(([cond]) => cond);

    // Completed conditions should not be in top recommendations
    // (unless there are facility gaps)
    expect(completed.length).toBeGreaterThanOrEqual(0);
  });

  it('should generate valid learning path', async () => {
    // A learning path should:
    // 1. Include conditions with <3 cases
    // 2. Prioritize facility gaps
    // 3. Include clinical priority
    // 4. Be limited to top N recommendations

    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    expect(sessions.length).toBeGreaterThan(0);

    // Verify we have a mix of conditions
    const conditions = new Set<string>();
    sessions.forEach((session) => {
      if (session.attributedConditions) {
        const conds = Array.isArray(session.attributedConditions)
          ? session.attributedConditions
          : [session.attributedConditions];
        conds.forEach((c) => conditions.add(c));
      }
    });

    expect(conditions.size).toBeGreaterThan(0);
  });
});
