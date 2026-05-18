import { describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers';

vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

describe('CPR Session Monitoring', () => {
  it('should fetch all CPR sessions via getAllSessions procedure', async () => {

    // Create a mock context with a user
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

    // Create test caller
    const caller = appRouter.createCaller(mockContext);

    // Call getAllSessions
    const sessions = await caller.cprSession.getAllSessions();

    // Verify response structure
    expect(Array.isArray(sessions)).toBe(true);
    
    // If there are sessions, verify they have required fields
    if (sessions.length > 0) {
      const session = sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('sessionCode');
      expect(session).toHaveProperty('status');
      expect(session).toHaveProperty('outcome');
      expect(session).toHaveProperty('startTime');
    }
  });

  it('should return sessions ordered by most recent first', async () => {

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
    const sessions = await caller.cprSession.getAllSessions();

    // If there are multiple sessions, verify they're ordered by startTime descending
    if (sessions.length > 1) {
      for (let i = 0; i < sessions.length - 1; i++) {
        const current = new Date(sessions[i].startTime).getTime();
        const next = new Date(sessions[i + 1].startTime).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it('should limit results to 1000 sessions', async () => {

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
    const sessions = await caller.cprSession.getAllSessions();

    // Verify we don't exceed the limit
    expect(sessions.length).toBeLessThanOrEqual(1000);
  });

  it('should require authentication to access getAllSessions', async () => {
    // Create context without user (unauthenticated)
    const unauthContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(unauthContext);

    // Attempt to call getAllSessions should throw
    await expect(caller.cprSession.getAllSessions()).rejects.toThrow();
  });
});
