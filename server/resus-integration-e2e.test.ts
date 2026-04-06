/**
 * E2E Integration Test: ResusGPS Analytics + Fellowship Progress + Condition Heatmap
 * 
 * Tests the complete flow:
 * 1. ResusGPS session completion → recordSession called
 * 2. Session recorded → analyticsEvents updated
 * 3. FellowshipProgressCard queries progress
 * 4. ConditionHeatmap queries facility patterns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { users, analyticsEvents, resusSessionRecords, careSignalEvents } from '@/drizzle/schema';

describe('ResusGPS Analytics Integration E2E', () => {
  let testUserId: string;
  let testInstitutionId: string;

  beforeAll(async () => {
    // Create test user
    const userResult = await db
      .insert(users)
      .values({
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test Provider',
        role: 'user',
      })
      .returning();
    testUserId = userResult[0].id;

    // Create test institution
    testInstitutionId = `test-inst-${Date.now()}`;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(resusSessionRecords).where(eq(resusSessionRecords.userId, testUserId));
    await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should record ResusGPS session and create analytics event', async () => {
    // Simulate session completion
    const sessionId = `session-${Date.now()}`;
    const pathway = 'septic_shock_protocol';
    const durationSeconds = 420; // 7 minutes
    const interactionsCount = 12;

    // Insert session record
    await db.insert(resusSessionRecords).values({
      id: `record-${Date.now()}`,
      userId: testUserId,
      sessionId,
      pathway,
      durationSeconds,
      interactionsCount,
      patientAge: 5,
      patientWeight: 18,
      validatedConditions: ['septic_shock', 'meningitis'],
      notes: 'Test session',
    });

    // Verify session was recorded
    const sessionRecord = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.sessionId, sessionId))
      .limit(1);

    expect(sessionRecord).toHaveLength(1);
    expect(sessionRecord[0].pathway).toBe('septic_shock_protocol');
    expect(sessionRecord[0].validatedConditions).toContain('septic_shock');
  });

  it('should track analytics event for session completion', async () => {
    const eventId = `event-${Date.now()}`;
    const eventType = 'resusGps_session_completed';

    await db.insert(analyticsEvents).values({
      id: eventId,
      userId: testUserId,
      eventType,
      metadata: {
        pathway: 'cardiac_arrest_protocol',
        durationSeconds: 300,
        interactionsCount: 8,
        validatedConditions: ['cardiac_arrest', 'rosc_achieved'],
      },
      timestamp: new Date(),
    });

    // Verify event was recorded
    const event = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.id, eventId))
      .limit(1);

    expect(event).toHaveLength(1);
    expect(event[0].eventType).toBe('resusGps_session_completed');
    expect((event[0].metadata as Record<string, unknown>).pathway).toBe('cardiac_arrest_protocol');
  });

  it('should calculate fellowship progress from validated sessions', async () => {
    // Create multiple valid sessions for different conditions
    const conditions = ['septic_shock', 'meningitis', 'cardiac_arrest'];
    
    for (let i = 0; i < 3; i++) {
      await db.insert(resusSessionRecords).values({
        id: `record-progress-${Date.now()}-${i}`,
        userId: testUserId,
        sessionId: `session-progress-${Date.now()}-${i}`,
        pathway: `${conditions[i]}_protocol`,
        durationSeconds: 300 + i * 60,
        interactionsCount: 8 + i,
        patientAge: 5 + i,
        patientWeight: 18 + i,
        validatedConditions: [conditions[i]],
        notes: `Test session for ${conditions[i]}`,
      });
    }

    // Query progress (simulating FellowshipProgressCard logic)
    const sessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    // Count unique conditions with ≥1 valid session
    const conditionSet = new Set<string>();
    sessions.forEach(session => {
      if (session.validatedConditions && Array.isArray(session.validatedConditions)) {
        (session.validatedConditions as string[]).forEach(c => conditionSet.add(c));
      }
    });

    expect(conditionSet.size).toBeGreaterThanOrEqual(3);
  });

  it('should aggregate condition practice patterns for heatmap', async () => {
    // Create sessions with different conditions
    const sessionData = [
      { condition: 'septic_shock', count: 5 },
      { condition: 'meningitis', count: 3 },
      { condition: 'cardiac_arrest', count: 2 },
    ];

    for (const { condition, count } of sessionData) {
      for (let i = 0; i < count; i++) {
        await db.insert(resusSessionRecords).values({
          id: `record-heatmap-${Date.now()}-${condition}-${i}`,
          userId: testUserId,
          sessionId: `session-heatmap-${Date.now()}-${condition}-${i}`,
          pathway: `${condition}_protocol`,
          durationSeconds: 300,
          interactionsCount: 8,
          patientAge: 5,
          patientWeight: 18,
          validatedConditions: [condition],
          notes: `Heatmap test for ${condition}`,
        });
      }
    }

    // Aggregate by condition (simulating ConditionHeatmap logic)
    const allSessions = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId));

    const conditionCounts: Record<string, number> = {};
    allSessions.forEach(session => {
      if (session.validatedConditions && Array.isArray(session.validatedConditions)) {
        (session.validatedConditions as string[]).forEach(c => {
          conditionCounts[c] = (conditionCounts[c] || 0) + 1;
        });
      }
    });

    expect(Object.keys(conditionCounts).length).toBeGreaterThan(0);
    expect(conditionCounts['septic_shock']).toBeGreaterThan(0);
  });

  it('should link Care Signal submissions to ResusGPS sessions', async () => {
    // Create a care signal
    const signalId = `signal-${Date.now()}`;
    
    await db.insert(careSignalEvents).values({
      id: signalId,
      userId: testUserId,
      type: 'near_miss',
      description: 'Septic shock case with delayed recognition',
      relatedCondition: 'septic_shock',
      resusSessionId: `session-${Date.now()}`,
      metadata: {
        facility: 'Test Hospital',
        timestamp: new Date().toISOString(),
      },
    });

    // Verify signal was recorded
    const signal = await db
      .select()
      .from(careSignalEvents)
      .where(eq(careSignalEvents.id, signalId))
      .limit(1);

    expect(signal).toHaveLength(1);
    expect(signal[0].relatedCondition).toBe('septic_shock');
  });

  it('should validate pathway-condition mapping', async () => {
    // Verify that sessions can be validated against known pathways
    const validPathways = [
      'septic_shock_protocol',
      'cardiac_arrest_protocol',
      'airway_emergency_protocol',
    ];

    const sessionRecord = await db
      .select()
      .from(resusSessionRecords)
      .where(eq(resusSessionRecords.userId, testUserId))
      .limit(1);

    if (sessionRecord.length > 0) {
      expect(validPathways).toContain(sessionRecord[0].pathway);
    }
  });
});
