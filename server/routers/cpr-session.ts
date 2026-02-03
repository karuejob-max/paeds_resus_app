import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { cprSessions, cprTeamMembers, cprEvents } from "../../drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

// Generate random 6-character session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const cprSessionRouter = router({
  // Create new CPR session
  createSession: protectedProcedure
    .input(z.object({
      patientWeight: z.number().positive(),
      patientAgeMonths: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const sessionCode = generateSessionCode();
      
      // Create session
      const [session] = await db.insert(cprSessions).values({
        sessionCode,
        patientWeight: input.patientWeight.toString(),
        patientAgeMonths: input.patientAgeMonths,
        startTime: new Date(),
        status: 'active',
        outcome: 'ongoing',
        createdBy: ctx.user.id,
        providerId: ctx.user.id,
      }).$returningId();

      // Add creator as first team member (team leader by default)
      await db.insert(cprTeamMembers).values({
        sessionId: session.id,
        userId: ctx.user.id,
        providerName: ctx.user.name || 'Provider',
        role: 'team_leader',
      });

      return {
        sessionId: session.id,
        sessionCode,
      };
    }),

  // Join existing session by code
  joinSession: protectedProcedure
    .input(z.object({
      sessionCode: z.string().length(6),
      providerName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Find session
      const sessions = await db.select().from(cprSessions).where(eq(cprSessions.sessionCode, input.sessionCode)).limit(1);
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'active') {
        throw new Error('Session is no longer active');
      }

      // Check if already joined
      const existingMembers = await db.select().from(cprTeamMembers).where(
        and(
          eq(cprTeamMembers.sessionId, session.id),
          eq(cprTeamMembers.userId, ctx.user.id)
        )
      ).limit(1);
      const existingMember = existingMembers[0];

      if (existingMember) {
        return {
          sessionId: session.id,
          memberId: existingMember.id,
          alreadyJoined: true,
        };
      }

      // Add as team member
      const [member] = await db.insert(cprTeamMembers).values({
        sessionId: session.id,
        userId: ctx.user.id,
        providerName: input.providerName || ctx.user.name || 'Provider',
        role: 'observer', // Default role, can be changed later
      }).$returningId();

      return {
        sessionId: session.id,
        memberId: member.id,
        alreadyJoined: false,
      };
    }),

  // Get session details
  getSession: publicProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const sessions = await db.select().from(cprSessions).where(eq(cprSessions.id, input.sessionId)).limit(1);
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      // Get team members
      const teamMembers = await db.select().from(cprTeamMembers).where(
        and(
          eq(cprTeamMembers.sessionId, input.sessionId),
          isNull(cprTeamMembers.leftAt)
        )
      );

      // Get recent events
      const events = await db.select().from(cprEvents)
        .where(eq(cprEvents.cprSessionId, input.sessionId))
        .orderBy(desc(cprEvents.createdAt))
        .limit(20);

      return {
        session,
        teamMembers,
        events,
      };
    }),

  // Update team member role
  updateRole: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      role: z.enum(['team_leader', 'compressions', 'airway', 'iv_access', 'medications', 'recorder', 'observer']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify member belongs to user
      const members = await db.select().from(cprTeamMembers).where(eq(cprTeamMembers.id, input.memberId)).limit(1);
      const member = members[0];

      if (!member) {
        throw new Error('Team member not found');
      }

      if (member.userId !== ctx.user.id) {
        throw new Error('Cannot update another user\'s role');
      }

      await db.update(cprTeamMembers)
        .set({ role: input.role })
        .where(eq(cprTeamMembers.id, input.memberId));

      return { success: true };
    }),

  // Log event
  logEvent: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      memberId: z.number().optional(),
      eventType: z.enum(['compression_cycle', 'medication', 'defibrillation', 'airway', 'note', 'outcome']),
      eventTime: z.number(), // seconds since arrest start
      description: z.string().optional(),
      value: z.string().optional(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.insert(cprEvents).values({
        cprSessionId: input.sessionId,
        memberId: input.memberId,
        eventType: input.eventType,
        eventTime: input.eventTime,
        description: input.description,
        value: input.value,
        metadata: input.metadata,
      });

      return { success: true };
    }),

  // End session
  endSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      outcome: z.enum(['ROSC', 'pCOSCA', 'mortality', 'ongoing']),
      totalDuration: z.number(), // seconds
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify session belongs to user
      const sessions = await db.select().from(cprSessions).where(eq(cprSessions.id, input.sessionId)).limit(1);
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.createdBy !== ctx.user.id) {
        throw new Error('Only session creator can end the session');
      }

      await db.update(cprSessions)
        .set({
          status: 'completed',
          outcome: input.outcome,
          endTime: new Date(),
          totalDuration: input.totalDuration,
        })
        .where(eq(cprSessions.id, input.sessionId));

      // Mark all team members as left
      await db.update(cprTeamMembers)
        .set({ leftAt: new Date() })
        .where(and(
          eq(cprTeamMembers.sessionId, input.sessionId),
          isNull(cprTeamMembers.leftAt)
        ));

      return { success: true };
    }),

  // Leave session
  leaveSession: protectedProcedure
    .input(z.object({
      memberId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify member belongs to user
      const members = await db.select().from(cprTeamMembers).where(eq(cprTeamMembers.id, input.memberId)).limit(1);
      const member = members[0];

      if (!member) {
        throw new Error('Team member not found');
      }

      if (member.userId !== ctx.user.id) {
        throw new Error('Cannot leave as another user');
      }

      await db.update(cprTeamMembers)
        .set({ leftAt: new Date() })
        .where(eq(cprTeamMembers.id, input.memberId));

      return { success: true };
    }),
});
