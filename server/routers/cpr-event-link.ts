import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  cprEventLinks,
  cprCareSignalLinks,
  cprSessions,
  careSignalEvents,
  cprTeamMembers,
  institutionMemberships,
  iersActivationEvents,
  iersActivationResponders,
  iersActivationTimeline,
} from "../../drizzle/schema";

const outcomeSchema = z.enum(["ROSC", "pCOSCA", "mortality", "transferred", "ongoing", "unknown"]);

async function loadActivationAccess(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, activationEventId: number) {
  const [activation] = await db
    .select()
    .from(iersActivationEvents)
    .where(eq(iersActivationEvents.id, activationEventId))
    .limit(1);
  if (!activation) throw new TRPCError({ code: "NOT_FOUND", message: "IERS activation not found." });

  const [membership] = await db
    .select({ id: institutionMemberships.id })
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, activation.institutionalAccountId),
      eq(institutionMemberships.userId, userId),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "An active institutional membership is required for this IERS case." });
  }

  const [responder] = await db
    .select()
    .from(iersActivationResponders)
    .where(and(
      eq(iersActivationResponders.activationEventId, activationEventId),
      eq(iersActivationResponders.userId, userId),
    ))
    .orderBy(desc(iersActivationResponders.id))
    .limit(1);
  if (!responder) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only an assigned IERS responder can link a CPR-GPS session to this activation." });
  }
  if (["declined", "timed_out", "failed"].includes(responder.notificationStatus)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This responder assignment is not active for the IERS case." });
  }

  return { activation, responder };
}

async function loadCprAccess(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, cprSessionId: number) {
  const [session] = await db.select().from(cprSessions).where(eq(cprSessions.id, cprSessionId)).limit(1);
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "CPR session not found." });

  if (session.createdBy === userId || session.providerId === userId) return session;
  const [member] = await db.select({ id: cprTeamMembers.id }).from(cprTeamMembers).where(and(
    eq(cprTeamMembers.sessionId, cprSessionId),
    eq(cprTeamMembers.userId, userId),
    isNull(cprTeamMembers.leftAt),
  )).limit(1);
  if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this CPR session." });
  return session;
}

async function appendLinkTimeline(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  activation: typeof iersActivationEvents.$inferSelect,
  actorUserId: number,
  eventType: string,
  note: string,
  metadata: Record<string, unknown>,
) {
  await db.insert(iersActivationTimeline).values({
    activationEventId: activation.id,
    institutionalAccountId: activation.institutionalAccountId,
    actorUserId,
    eventType,
    fromStatus: activation.status,
    note,
    metadata: JSON.stringify(metadata),
  });
}

export const cprEventLinkRouter = router({
  /** Bind one authenticated CPR-GPS session to one assigned IERS activation. */
  linkSession: protectedProcedure
    .input(z.object({
      activationEventId: z.number().int().positive(),
      cprSessionId: z.number().int().positive(),
      resusGpsSessionKey: z.string().trim().min(1).max(64).optional(),
      pathwayKey: z.string().trim().min(1).max(32).optional(),
      contentVersion: z.string().trim().min(1).max(32).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      const { activation } = await loadActivationAccess(db, ctx.user.id, input.activationEventId);
      await loadCprAccess(db, ctx.user.id, input.cprSessionId);

      const [byActivation] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.activationEventId, input.activationEventId)).limit(1);
      if (byActivation) {
        if (byActivation.cprSessionId !== input.cprSessionId) {
          throw new TRPCError({ code: "CONFLICT", message: "This IERS activation is already linked to another CPR-GPS session." });
        }
        return { success: true, idempotent: true, linkId: byActivation.id, activationEventId: byActivation.activationEventId, cprSessionId: byActivation.cprSessionId };
      }

      const [bySession] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.cprSessionId, input.cprSessionId)).limit(1);
      if (bySession && bySession.activationEventId !== input.activationEventId) {
        throw new TRPCError({ code: "CONFLICT", message: "This CPR-GPS session is already linked to another IERS activation." });
      }
      if (bySession) {
        return { success: true, idempotent: true, linkId: bySession.id, activationEventId: bySession.activationEventId, cprSessionId: bySession.cprSessionId };
      }

      const [created] = await db.insert(cprEventLinks).values({
        activationEventId: input.activationEventId,
        cprSessionId: input.cprSessionId,
        institutionalAccountId: activation.institutionalAccountId,
        linkedByUserId: ctx.user.id,
        resusGpsSessionKey: input.resusGpsSessionKey ?? null,
        pathwayKey: input.pathwayKey ?? null,
        contentVersion: input.contentVersion ?? null,
        linkStatus: "active",
      }).$returningId();
      if (!created?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The CPR event link could not be created." });

      await appendLinkTimeline(db, activation, ctx.user.id, "resusgps_cpr_linked", "ResusGPS CPR session linked to the IERS activation.", {
        cprSessionId: input.cprSessionId,
        linkId: created.id,
        pathwayKey: input.pathwayKey ?? null,
        contentVersion: input.contentVersion ?? null,
      });

      return { success: true, idempotent: false, linkId: created.id, activationEventId: input.activationEventId, cprSessionId: input.cprSessionId };
    }),

  /** Link the submitting provider's named Care Signal report to the CPR event. */
  linkCareSignal: protectedProcedure
    .input(z.object({
      cprSessionId: z.number().int().positive(),
      careSignalEventId: z.number().int().positive(),
      activationEventId: z.number().int().positive().optional(),
      relationship: z.enum(["post_event_prompt", "manual"]).default("post_event_prompt"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      await loadCprAccess(db, ctx.user.id, input.cprSessionId);
      const [careSignal] = await db.select({ id: careSignalEvents.id, userId: careSignalEvents.userId }).from(careSignalEvents).where(eq(careSignalEvents.id, input.careSignalEventId)).limit(1);
      if (!careSignal) throw new TRPCError({ code: "NOT_FOUND", message: "Care Signal report not found." });
      if (careSignal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the provider who submitted a named Care Signal can link it to CPR-GPS." });
      }

      const [cprLink] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.cprSessionId, input.cprSessionId)).limit(1);
      if (input.activationEventId && (!cprLink || cprLink.activationEventId !== input.activationEventId)) {
        throw new TRPCError({ code: "CONFLICT", message: "The Care Signal context does not match the CPR-GPS IERS activation." });
      }
      const [existing] = await db.select().from(cprCareSignalLinks).where(eq(cprCareSignalLinks.careSignalEventId, input.careSignalEventId)).limit(1);
      if (existing) {
        if (existing.cprSessionId !== input.cprSessionId) {
          throw new TRPCError({ code: "CONFLICT", message: "This Care Signal is already linked to another CPR-GPS session." });
        }
        return { success: true, idempotent: true, linkId: existing.id, cprSessionId: existing.cprSessionId, careSignalEventId: existing.careSignalEventId };
      }

      const [created] = await db.insert(cprCareSignalLinks).values({
        cprSessionId: input.cprSessionId,
        careSignalEventId: input.careSignalEventId,
        activationEventId: cprLink?.activationEventId ?? null,
        institutionalAccountId: cprLink?.institutionalAccountId ?? null,
        linkedByUserId: ctx.user.id,
        relationship: input.relationship,
      }).$returningId();
      if (!created?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The CPR Care Signal link could not be created." });

      if (cprLink) {
        const [activation] = await db.select().from(iersActivationEvents).where(eq(iersActivationEvents.id, cprLink.activationEventId)).limit(1);
        if (activation) {
          await appendLinkTimeline(db, activation, ctx.user.id, "cpr_care_signal_linked", "A named Care Signal report was linked to the CPR-GPS event.", {
            cprSessionId: input.cprSessionId,
            careSignalEventId: input.careSignalEventId,
            careSignalLinkId: created.id,
          });
        }
      }

      return { success: true, idempotent: false, linkId: created.id, cprSessionId: input.cprSessionId, careSignalEventId: input.careSignalEventId };
    }),

  /** Read the current link for an assigned activation; returns null when CPR has not started. */
  getForActivation: protectedProcedure
    .input(z.object({ activationEventId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      await loadActivationAccess(db, ctx.user.id, input.activationEventId);
      const [link] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.activationEventId, input.activationEventId)).limit(1);
      return link ?? null;
    }),

  /** Record a deliberate terminal or interim CPR outcome against the linked activation. */
  recordOutcome: protectedProcedure
    .input(z.object({
      cprSessionId: z.number().int().positive(),
      outcome: outcomeSchema,
      occurredAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      await loadCprAccess(db, ctx.user.id, input.cprSessionId);
      const [link] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.cprSessionId, input.cprSessionId)).limit(1);
      if (!link) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Link the CPR-GPS session to an IERS activation before recording an activation outcome." });
      await loadActivationAccess(db, ctx.user.id, link.activationEventId);

      const recordedAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
      if (Number.isNaN(recordedAt.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "Outcome time is invalid." });
      await db.update(cprEventLinks).set({
        linkStatus: "outcome_recorded",
        terminalOutcome: input.outcome,
        outcomeRecordedAt: recordedAt,
        updatedAt: new Date(),
      }).where(eq(cprEventLinks.id, link.id));

      const [activation] = await db.select().from(iersActivationEvents).where(eq(iersActivationEvents.id, link.activationEventId)).limit(1);
      if (activation) {
        await appendLinkTimeline(db, activation, ctx.user.id, "cpr_outcome_recorded", "A CPR-GPS outcome was recorded against the IERS activation.", {
          cprSessionId: input.cprSessionId,
          outcome: input.outcome,
          occurredAt: recordedAt.toISOString(),
        });
      }
      return { success: true, linkId: link.id, outcome: input.outcome };
    }),

  /** Mark the linked event as awaiting IERS/ERTL debrief after a CPR debrief is submitted. */
  markDebriefSubmitted: protectedProcedure
    .input(z.object({ cprSessionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed." });
      await loadCprAccess(db, ctx.user.id, input.cprSessionId);
      const [link] = await db.select().from(cprEventLinks).where(eq(cprEventLinks.cprSessionId, input.cprSessionId)).limit(1);
      if (!link) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No IERS activation is linked to this CPR-GPS session." });
      await loadActivationAccess(db, ctx.user.id, link.activationEventId);
      const [activation] = await db.select().from(iersActivationEvents).where(eq(iersActivationEvents.id, link.activationEventId)).limit(1);
      const submittedAt = new Date();
      await db.update(cprEventLinks).set({ linkStatus: "debrief_pending", debriefSubmittedAt: submittedAt, updatedAt: submittedAt }).where(eq(cprEventLinks.id, link.id));
      if (activation) {
        await appendLinkTimeline(db, activation, ctx.user.id, "cpr_debrief_submitted", "CPR-GPS debrief submitted; IERS review is pending.", {
          cprSessionId: input.cprSessionId,
          submittedAt: submittedAt.toISOString(),
        });
      }
      return { success: true, linkId: link.id, submittedAt: submittedAt.toISOString() };
    }),
});
