import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { cprSessions, cprTeamMembers, cprEvents, cprEventLinks, iersActivationTimeline, iersActivationResponders } from "../../drizzle/schema";
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
      const [creatorMember] = await db.insert(cprTeamMembers).values({
        sessionId: session.id,
        userId: ctx.user.id,
        providerName: ctx.user.name || 'Provider',
        role: 'team_leader',
      }).$returningId();

      return {
        sessionId: session.id,
        sessionCode,
        memberId: creatorMember.id,
      };
    }),

  // Join existing session by code
  joinSession: publicProcedure
    .input(z.object({
      sessionCode: z.string().min(6).max(8),
      providerName: z.string(),
      // Public joiners cannot self-assign team leadership; the creator/current
      // team leader must assign or approve that role.
      role: z.enum(['compressions', 'airway', 'iv_access', 'medications', 'recorder', 'observer']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Find session
      const sessions = await db.select().from(cprSessions).where(eq(cprSessions.sessionCode, input.sessionCode.toUpperCase())).limit(1);
      const session = sessions[0];

      if (!session) {
        return {
          success: false,
          message: 'Session not found. Please check the code and try again.',
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          message: 'This session has ended and is no longer accepting new members.',
        };
      }

      // Add as team member (allow multiple joins, guest providers)
      const [member] = await db.insert(cprTeamMembers).values({
        sessionId: session.id,
        userId: null, // Guest provider for now
        providerName: input.providerName,
        role: input.role,
      }).$returningId();

      return {
        success: true,
        sessionId: session.id,
        memberId: member.id,
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

      // A participant may change their own role. Assigning another person is
      // reserved for the session creator or currently assigned team leader.
      const members = await db.select().from(cprTeamMembers).where(eq(cprTeamMembers.id, input.memberId)).limit(1);
      const member = members[0];

      if (!member) {
        throw new Error('Team member not found');
      }

      if (member.userId !== ctx.user.id) {
        const sessions = await db.select({ createdBy: cprSessions.createdBy })
          .from(cprSessions)
          .where(eq(cprSessions.id, member.sessionId))
          .limit(1);
        const session = sessions[0];
        const leaders = await db.select({ id: cprTeamMembers.id })
          .from(cprTeamMembers)
          .where(and(
            eq(cprTeamMembers.sessionId, member.sessionId),
            eq(cprTeamMembers.userId, ctx.user.id),
            eq(cprTeamMembers.role, 'team_leader'),
            isNull(cprTeamMembers.leftAt),
          ))
          .limit(1);
        const canAssign = session?.createdBy === ctx.user.id || leaders.length > 0;
        if (!canAssign) {
          throw new Error('Only the session creator or current team leader can assign another member\'s role');
        }
      }

      if (input.role === 'team_leader' && member.role !== 'team_leader') {
        const existingLeaders = await db.select({ id: cprTeamMembers.id })
          .from(cprTeamMembers)
          .where(and(
            eq(cprTeamMembers.sessionId, member.sessionId),
            eq(cprTeamMembers.role, 'team_leader'),
            isNull(cprTeamMembers.leftAt),
          ))
          .limit(1);
        if (existingLeaders.length > 0) {
          throw new Error('A team leader is already assigned. Reassign the current leader first.');
        }
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
      clientRequestId: z.string().trim().min(8).max(96).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [session] = await db.select({ id: cprSessions.id, createdBy: cprSessions.createdBy })
        .from(cprSessions)
        .where(eq(cprSessions.id, input.sessionId))
        .limit(1);
      if (!session) throw new Error('Session not found');

      const [actor] = await db.select({ id: cprTeamMembers.id, role: cprTeamMembers.role })
        .from(cprTeamMembers)
        .where(and(
          eq(cprTeamMembers.sessionId, input.sessionId),
          eq(cprTeamMembers.userId, ctx.user.id),
          isNull(cprTeamMembers.leftAt),
        ))
        .limit(1);
      const canWrite = session.createdBy === ctx.user.id || Boolean(actor);
      if (!canWrite) throw new Error('Only the session creator or an active team member can log CPR events');
      if (input.memberId !== undefined) {
        const [targetMember] = await db.select({ id: cprTeamMembers.id, userId: cprTeamMembers.userId })
          .from(cprTeamMembers)
          .where(and(eq(cprTeamMembers.id, input.memberId), eq(cprTeamMembers.sessionId, input.sessionId), isNull(cprTeamMembers.leftAt)))
          .limit(1);
        if (!targetMember) throw new Error('The event member does not belong to this active CPR team');
        if (session.createdBy !== ctx.user.id && targetMember.userId !== ctx.user.id && actor?.role !== 'team_leader') {
          throw new Error('Only the session creator or team leader can log an event for another member');
        }
      }

      if (input.clientRequestId) {
        const [existing] = await db.select({ id: cprEvents.id })
          .from(cprEvents)
          .where(and(eq(cprEvents.cprSessionId, input.sessionId), eq(cprEvents.idempotencyKey, input.clientRequestId)))
          .limit(1);
        if (existing) return { success: true, eventId: existing.id, idempotent: true };
      }

      const [created] = await db.insert(cprEvents).values({
        cprSessionId: input.sessionId,
        memberId: input.memberId ?? actor?.id,
        eventType: input.eventType,
        eventTime: input.eventTime,
        description: input.description,
        value: input.value,
        metadata: input.metadata,
        idempotencyKey: input.clientRequestId,
      }).$returningId();

      return { success: true, eventId: created.id, idempotent: false };
    }),

  // End session
  endSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      outcome: z.enum(['ROSC', 'pCOSCA', 'mortality', 'transferred', 'unknown', 'ongoing']),
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

      const completedAt = new Date();
      await db.update(cprSessions)
        .set({
          status: 'completed',
          outcome: input.outcome,
          endTime: completedAt,
          totalDuration: input.totalDuration,
        })
        .where(eq(cprSessions.id, input.sessionId));

      const [linkedEvent] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.cprSessionId, input.sessionId)).limit(1);
      if (linkedEvent) {
        await db.update(cprEventLinks).set({
          linkStatus: 'outcome_recorded',
          terminalOutcome: input.outcome,
          outcomeRecordedAt: completedAt,
          updatedAt: completedAt,
        }).where(eq(cprEventLinks.id, linkedEvent.id));
        await db.insert(iersActivationTimeline).values({
          activationEventId: linkedEvent.activationEventId,
          institutionalAccountId: linkedEvent.institutionalAccountId,
          actorUserId: ctx.user.id,
          eventType: 'cpr_outcome_recorded',
          note: 'CPR session completed with a recorded outcome.',
          metadata: JSON.stringify({ cprSessionId: input.sessionId, outcome: input.outcome, totalDuration: input.totalDuration }),
          occurredAt: completedAt,
          createdAt: completedAt,
        });
      }

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

  // Submit an ERTL/team-leader debrief without adding a schema migration.
  submitDebrief: protectedProcedure
    .input(z.object({
      sessionId: z.number().int().positive(),
      narrative: z.string().trim().min(20).max(12000),
      outcome: z.enum(['ROSC', 'pCOSCA', 'mortality', 'transferred', 'unknown', 'ongoing', 'discontinued']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [session] = await db.select().from(cprSessions).where(eq(cprSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error('Session not found');

      const [linkedEventForAuth] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.cprSessionId, input.sessionId)).limit(1);
      const [activationErtl] = linkedEventForAuth ? await db.select({ id: iersActivationResponders.id }).from(iersActivationResponders).where(and(
        eq(iersActivationResponders.activationEventId, linkedEventForAuth.activationEventId),
        eq(iersActivationResponders.userId, ctx.user.id),
        eq(iersActivationResponders.responsibilityRole, 'ert_leader'),
      )).limit(1) : [];

      const [member] = await db.select().from(cprTeamMembers).where(and(
        eq(cprTeamMembers.sessionId, input.sessionId),
        eq(cprTeamMembers.userId, ctx.user.id),
        isNull(cprTeamMembers.leftAt),
      )).limit(1);
      const isCreator = session.createdBy === ctx.user.id;
      const isTeamLeader = member?.role === 'team_leader';
      const isActivationErtl = Boolean(activationErtl);
      if (!isCreator && !isTeamLeader && !isActivationErtl) {
        throw new Error('Only the session creator, current team leader, or assigned ERTL can submit the debrief.');
      }

      const submittedAt = new Date();
      await db.update(cprSessions).set({
        notes: `ERTL debrief submitted ${submittedAt.toISOString()}\\nOutcome: ${input.outcome}\\n${input.narrative}`,
        outcome: input.outcome === 'discontinued' ? 'mortality' : input.outcome,
        updatedAt: submittedAt,
      }).where(eq(cprSessions.id, input.sessionId));
      await db.insert(cprEvents).values({
        cprSessionId: input.sessionId,
        memberId: member?.id,
        eventType: 'note',
        eventTime: session.totalDuration ?? 0,
        description: 'ERTL/team-leader debrief submitted for QI review',
        value: input.outcome,
        metadata: JSON.stringify({ submittedAt: submittedAt.toISOString() }),
      });

      const linkedEvent = linkedEventForAuth;
      if (linkedEvent) {
        await db.update(cprEventLinks).set({ linkStatus: 'debrief_pending', debriefSubmittedAt: submittedAt, updatedAt: submittedAt }).where(eq(cprEventLinks.id, linkedEvent.id));
        await db.insert(iersActivationTimeline).values({
          activationEventId: linkedEvent.activationEventId,
          institutionalAccountId: linkedEvent.institutionalAccountId,
          actorUserId: ctx.user.id,
          eventType: 'cpr_debrief_submitted',
          note: 'CPR-GPS debrief submitted; IERS review is pending.',
          metadata: JSON.stringify({ cprSessionId: input.sessionId, submittedAt: submittedAt.toISOString() }),
          occurredAt: submittedAt,
          createdAt: submittedAt,
        });
      }

      return { success: true, submittedAt: submittedAt.toISOString() };
    }),

  // Generate AI insights for debriefing
  generateInsights: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      metrics: z.object({
        totalDuration: z.number(),
        shockCount: z.number(),
        epiDoses: z.number(),
        outcome: z.string(),
        compressionFraction: z.number(),
        timeToFirstEpi: z.number().nullable(),
        timeToFirstShock: z.number().nullable(),
        criticalDelays: z.array(z.string()),
      }),
      events: z.array(z.object({
        timestamp: z.number(),
        action: z.string(),
        performedBy: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import('../_core/llm');

      const prompt = `You are a pediatric resuscitation expert providing post-arrest debriefing insights based on AHA PALS guidelines.

Resuscitation Summary:
- Total Duration: ${Math.floor(input.metrics.totalDuration / 60)} minutes ${input.metrics.totalDuration % 60} seconds
- Outcome: ${input.metrics.outcome}
- Shocks Delivered: ${input.metrics.shockCount}
- Epinephrine Doses: ${input.metrics.epiDoses}
- Compression Fraction: ${input.metrics.compressionFraction.toFixed(1)}%
- Time to First Epinephrine: ${input.metrics.timeToFirstEpi ? `${Math.floor(input.metrics.timeToFirstEpi / 60)}:${(input.metrics.timeToFirstEpi % 60).toString().padStart(2, '0')}` : 'N/A'}
- Time to First Shock: ${input.metrics.timeToFirstShock ? `${Math.floor(input.metrics.timeToFirstShock / 60)}:${(input.metrics.timeToFirstShock % 60).toString().padStart(2, '0')}` : 'N/A'}

Critical Delays:
${input.metrics.criticalDelays.length > 0 ? input.metrics.criticalDelays.map(d => `- ${d}`).join('\n') : '- None identified'}

Event Timeline:
${input.events.slice(0, 10).map(e => `${Math.floor(e.timestamp / 60)}:${(e.timestamp % 60).toString().padStart(2, '0')} - ${e.action}${e.performedBy ? ` (${e.performedBy})` : ''}`).join('\n')}

Provide:
1. **Key Strengths**: What did the team do well? (2-3 specific points)
2. **Areas for Improvement**: What could be improved? (2-3 actionable recommendations)
3. **Learning Points**: Key takeaways for future resuscitations (2-3 evidence-based points)
4. **Next Steps**: Specific training or protocol adjustments to consider

Keep the tone supportive and constructive. Focus on actionable insights.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a pediatric resuscitation expert providing evidence-based debriefing insights.' },
            { role: 'user', content: prompt },
          ],
        });

        const insights = response.choices[0]?.message?.content || 'Unable to generate insights at this time.';
        return { insights };
      } catch (error) {
        console.error('[AI Insights] Error:', error);
        return { insights: 'Unable to generate insights. Please review the metrics manually and consult with your team.' };
      }
    }),

  // Get all CPR sessions (for monitoring dashboard)
  getAllSessions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get all sessions, ordered by most recent first
      const sessions = await db.select().from(cprSessions).orderBy(desc(cprSessions.startTime)).limit(1000);

      return sessions;
    }),

  // Get detailed session information with events and team members
  getSessionDetails: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get session
      const sessions = await db.select().from(cprSessions).where(eq(cprSessions.id, input.sessionId)).limit(1);
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      // Get all events for this session, ordered by time
      const events = await db.select().from(cprEvents)
        .where(eq(cprEvents.cprSessionId, input.sessionId))
        .orderBy(cprEvents.eventTime);

      // Get team members
      const teamMembers = await db.select().from(cprTeamMembers)
        .where(eq(cprTeamMembers.sessionId, input.sessionId));

      return {
        session,
        events,
        teamMembers,
      };
    }),
});

