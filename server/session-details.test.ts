import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { cprSessions, cprEvents, cprTeamMembers } from '../drizzle/schema';

describe('Session Details', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testSessionId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test session with unique code (max 8 chars)
    const uniqueCode = `T${Date.now().toString().slice(-6)}`;
    const [session] = await db.insert(cprSessions).values({
      sessionCode: uniqueCode,
      status: 'completed',
      outcome: 'ROSC',
      startTime: new Date(),
      totalDuration: 600, // 10 minutes
      patientWeight: '20',
      patientAgeMonths: 60,
    }).$returningId();

    testSessionId = session.id;

    // Add test events
    await db.insert(cprEvents).values([
      {
        cprSessionId: testSessionId,
        eventType: 'compression_cycle',
        eventTime: 0,
        description: 'CPR started',
      },
      {
        cprSessionId: testSessionId,
        eventType: 'medication',
        eventTime: 120,
        description: 'Epinephrine 0.2mg IV',
        value: '0.2mg',
      },
      {
        cprSessionId: testSessionId,
        eventType: 'defibrillation',
        eventTime: 240,
        description: 'Shock delivered 40J',
        value: '40J',
      },
    ]);

    // Add test team members
    await db.insert(cprTeamMembers).values([
      {
        sessionId: testSessionId,
        providerName: 'Dr. Test Provider',
        role: 'team_leader',
      },
      {
        sessionId: testSessionId,
        providerName: 'Nurse Test',
        role: 'airway',
      },
    ]);
  });

  it('should fetch complete session details with events and team members', async () => {
    if (!db) throw new Error('Database not available');

    const mockContext = {
      user: {
        id: 1,
        openId: 'test-open-id',
        name: 'Test Provider',
        email: 'test@example.com',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);
    const details = await caller.cprSession.getSessionDetails({ sessionId: testSessionId });

    // Verify session
    expect(details.session).toBeDefined();
    expect(details.session.id).toBe(testSessionId);
    expect(details.session.sessionCode).toBeTruthy();
    expect(details.session.outcome).toBe('ROSC');

    // Verify events
    expect(details.events).toBeDefined();
    expect(details.events.length).toBeGreaterThanOrEqual(3);
    expect(details.events[0].eventType).toBe('compression_cycle');

    // Verify team members
    expect(details.teamMembers).toBeDefined();
    expect(details.teamMembers.length).toBe(2);
    expect(details.teamMembers[0].providerName).toBe('Dr. Test Provider');
  });

  it('should order events by time', async () => {
    if (!db) throw new Error('Database not available');

    const mockContext = {
      user: {
        id: 1,
        openId: 'test-open-id',
        name: 'Test Provider',
        email: 'test@example.com',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);
    const details = await caller.cprSession.getSessionDetails({ sessionId: testSessionId });

    // Verify events are ordered by eventTime
    for (let i = 0; i < details.events.length - 1; i++) {
      const currentTime = details.events[i].eventTime || 0;
      const nextTime = details.events[i + 1].eventTime || 0;
      expect(currentTime).toBeLessThanOrEqual(nextTime);
    }
  });

  it('should throw error for non-existent session', async () => {
    if (!db) throw new Error('Database not available');

    const mockContext = {
      user: {
        id: 1,
        openId: 'test-open-id',
        name: 'Test Provider',
        email: 'test@example.com',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    // Attempt to fetch non-existent session
    await expect(
      caller.cprSession.getSessionDetails({ sessionId: 999999 })
    ).rejects.toThrow('Session not found');
  });

  it('should require authentication to access session details', async () => {
    const unauthContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(unauthContext);

    await expect(
      caller.cprSession.getSessionDetails({ sessionId: testSessionId })
    ).rejects.toThrow();
  });

  it('should calculate quality metrics correctly', async () => {
    if (!db) throw new Error('Database not available');

    const mockContext = {
      user: {
        id: 1,
        openId: 'test-open-id',
        name: 'Test Provider',
        email: 'test@example.com',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);
    const details = await caller.cprSession.getSessionDetails({ sessionId: testSessionId });

    // Verify we can calculate metrics from the data
    const compressionEvents = details.events.filter(e => e.eventType === 'compression_cycle');
    const medicationEvents = details.events.filter(e => e.eventType === 'medication');
    const shockEvents = details.events.filter(e => e.eventType === 'defibrillation');

    expect(compressionEvents.length).toBeGreaterThan(0);
    expect(medicationEvents.length).toBeGreaterThan(0);
    expect(shockEvents.length).toBeGreaterThan(0);

    // Find time to first epinephrine
    const firstEpi = details.events.find(e => 
      e.eventType === 'medication' && 
      e.description?.toLowerCase().includes('epinephrine')
    );
    expect(firstEpi).toBeDefined();
    expect(firstEpi?.eventTime).toBe(120); // 2 minutes

    // Find time to first shock
    const firstShock = details.events.find(e => e.eventType === 'defibrillation');
    expect(firstShock).toBeDefined();
    expect(firstShock?.eventTime).toBe(240); // 4 minutes
  });
});
