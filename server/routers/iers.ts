import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  inAppNotifications,
  institutionMemberships,
  iersActivationEvents,
  iersActivationResponders,
  iersActivationTimeline,
  institutionalAccounts,
} from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { canAdvanceIersActivation } from "../lib/iers-state";

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type ActivationStatus =
  | "draft"
  | "triggered"
  | "notifying"
  | "acknowledged"
  | "responding"
  | "at_scene"
  | "stabilized"
  | "recovered"
  | "debrief_pending"
  | "closed"
  | "cancelled"
  | "false_alarm"
  | "downtime_pending_sync"
  | "failed_escalation";

type ResponsibilityRole =
  | "executive"
  | "erc_chair"
  | "erc_member"
  | "er_coordinator"
  | "unit_team_leader"
  | "ert_leader"
  | "ert_responder"
  | "general_staff";

const LEAD_ROLES: ResponsibilityRole[] = ["ert_leader", "unit_team_leader", "er_coordinator", "erc_chair"];
const RESPONDER_ROLES: ResponsibilityRole[] = ["ert_leader", "ert_responder", "unit_team_leader", "er_coordinator", "erc_member"];

async function getMembership(db: DbClient, userId: number, institutionId: number) {
  const [membership] = await db
    .select()
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.userId, userId),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  return membership ?? null;
}

async function assertProviderCanOperate(db: DbClient, userId: number, institutionId: number) {
  const membership = await getMembership(db, userId, institutionId);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active provider member of this institution." });
  }
  return membership;
}

async function assertInstitutionOrMember(
  db: DbClient,
  user: { id: number; role?: string | null },
  institutionId: number,
) {
  try {
    await assertInstitutionAccess(db, user as any, institutionId);
    return { kind: "institution_admin" as const, membership: null };
  } catch (error) {
    const membership = await assertProviderCanOperate(db, user.id, institutionId);
    return { kind: "provider" as const, membership };
  }
}

async function appendTimeline(
  db: DbClient,
  input: {
    activationEventId: number;
    institutionalAccountId: number;
    actorUserId: number | null;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(iersActivationTimeline).values({
    activationEventId: input.activationEventId,
    institutionalAccountId: input.institutionalAccountId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    note: input.note ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

const activationInput = z.object({
  institutionId: z.number().int().positive(),
  activationType: z.enum(["code_blue", "code_yellow", "neonatal", "sepsis", "anaphylaxis", "trauma", "other"]),
  location: z.string().trim().min(2).max(255),
  department: z.string().trim().max(255).optional(),
  priority: z.enum(["critical", "high", "routine"]).default("critical"),
  notes: z.string().trim().max(2000).optional(),
});

export const iersRouter = router({
  /** Provider or institution operator: trigger a durable emergency activation. */
  triggerActivation: protectedProcedure
    .input(activationInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);

      const eventInsert = await db.insert(iersActivationEvents).values({
        institutionalAccountId: input.institutionId,
        activatedByUserId: ctx.user.id,
        activationType: input.activationType,
        priority: input.priority,
        location: input.location,
        department: input.department || null,
        source: access.kind === "institution_admin"
          ? "institution_admin"
          : access.membership?.responsibilityRole === "ert_leader"
            ? "ert_leader"
            : access.membership?.responsibilityRole === "unit_team_leader"
              ? "unit_team_leader"
              : "provider",
        status: "notifying",
        notes: input.notes || null,
      });
      const activationEventId = (eventInsert as unknown as { insertId: number }).insertId;
      if (!activationEventId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Activation could not be created." });

      await appendTimeline(db, {
        activationEventId,
        institutionalAccountId: input.institutionId,
        actorUserId: ctx.user.id,
        eventType: "activation_triggered",
        fromStatus: "draft",
        toStatus: "notifying",
        note: input.notes || null,
        metadata: { activationType: input.activationType, location: input.location },
      });

      const responders = await db
        .select({
          membershipId: institutionMemberships.id,
          userId: institutionMemberships.userId,
          responsibilityRole: institutionMemberships.responsibilityRole,
        })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          eq(institutionMemberships.membershipStatus, "active"),
          inArray(institutionMemberships.responsibilityRole, RESPONDER_ROLES),
        ));

      let notifiedCount = 0;
      for (const responder of responders) {
        if (!responder.userId) continue;
        const responderRole = RESPONDER_ROLES.includes(responder.responsibilityRole as ResponsibilityRole)
          ? responder.responsibilityRole as "ert_leader" | "ert_responder" | "unit_team_leader" | "er_coordinator" | "erc_member"
          : "ert_responder";
        const assignmentType = responderRole === "ert_leader" || responderRole === "er_coordinator"
          ? "primary"
          : "backup";
        await db.insert(iersActivationResponders).values({
          activationEventId,
          institutionalAccountId: input.institutionId,
          membershipId: responder.membershipId,
          userId: responder.userId,
          assignmentType,
          responsibilityRole: responderRole,
          notificationStatus: "sent",
          notifiedAt: new Date(),
        });
        await db.insert(inAppNotifications).values({
          userId: responder.userId,
          type: "iers_activation",
          title: `${input.activationType.replaceAll("_", " ")} activation — ${input.location}`,
          body: `A ${input.priority} IERS activation requires your ${responderRole.replaceAll("_", " ")} responsibility. Acknowledge immediately if you can respond.`,
          actionUrl: `/provider/iers/activations/${activationEventId}`,
          relatedId: activationEventId,
        });
        notifiedCount += 1;
      }

      await db
        .update(iersActivationEvents)
        .set({
          status: responders.length > 0 ? "notifying" : "failed_escalation",
          updatedAt: new Date(),
        })
        .where(eq(iersActivationEvents.id, activationEventId));

      if (responders.length === 0) {
        await appendTimeline(db, {
          activationEventId,
          institutionalAccountId: input.institutionId,
          actorUserId: ctx.user.id,
          eventType: "escalation_failed",
          fromStatus: "notifying",
          toStatus: "failed_escalation",
          note: "No active ERT responder membership was available for notification.",
        });
      }

      return { success: true, activationEventId, notifiedCount, escalationFailed: responders.length === 0 };
    }),

  /** Institution admin/coordinator: monitor active and recent activations for the facility. */
  listInstitutionActivations: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(25) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      try {
        return await db
          .select()
          .from(iersActivationEvents)
          .where(eq(iersActivationEvents.institutionalAccountId, input.institutionId))
          .orderBy(desc(iersActivationEvents.triggeredAt))
          .limit(input.limit);
      } catch (error) {
        if (isMissingTableError(error, "iersActivationEvents")) return [];
        throw error;
      }
    }),

  /** Provider: list activations they must acknowledge or respond to. */
  getMyActivations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    try {
      const rows = await db
        .select({
          id: iersActivationEvents.id,
          institutionalAccountId: iersActivationEvents.institutionalAccountId,
          activationType: iersActivationEvents.activationType,
          priority: iersActivationEvents.priority,
          location: iersActivationEvents.location,
          department: iersActivationEvents.department,
          status: iersActivationEvents.status,
          triggeredAt: iersActivationEvents.triggeredAt,
          firstAcknowledgedAt: iersActivationEvents.firstAcknowledgedAt,
          atSceneAt: iersActivationEvents.atSceneAt,
          membershipId: iersActivationResponders.membershipId,
          responderStatus: iersActivationResponders.notificationStatus,
          acknowledgedAt: iersActivationResponders.acknowledgedAt,
          responseAt: iersActivationResponders.responseAt,
          atSceneResponderAt: iersActivationResponders.atSceneAt,
          companyName: institutionalAccounts.companyName,
        })
        .from(iersActivationResponders)
        .innerJoin(iersActivationEvents, eq(iersActivationEvents.id, iersActivationResponders.activationEventId))
        .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, iersActivationEvents.institutionalAccountId))
        .where(and(
          eq(iersActivationResponders.userId, ctx.user.id),
          inArray(iersActivationEvents.status, ["notifying", "acknowledged", "responding", "at_scene", "stabilized", "debrief_pending"]),
        ))
        .orderBy(desc(iersActivationEvents.triggeredAt));
      return rows;
    } catch (error) {
      if (isMissingTableError(error, "iersActivationEvents")) return [];
      throw error;
    }
  }),

  /** Provider: acknowledge or decline their responder assignment. */
  acknowledge: protectedProcedure
    .input(z.object({ activationEventId: z.number().int().positive(), accept: z.boolean(), reason: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const [assignment] = await db
        .select({ responder: iersActivationResponders, event: iersActivationEvents })
        .from(iersActivationResponders)
        .innerJoin(iersActivationEvents, eq(iersActivationEvents.id, iersActivationResponders.activationEventId))
        .where(and(
          eq(iersActivationResponders.activationEventId, input.activationEventId),
          eq(iersActivationResponders.userId, ctx.user.id),
        ))
        .limit(1);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "No responder assignment found for this activation." });

      const now = new Date();
      if (input.accept) {
        await db
          .update(iersActivationResponders)
          .set({ notificationStatus: "acknowledged", acknowledgedAt: now, responseAt: now, updatedAt: now })
          .where(eq(iersActivationResponders.id, assignment.responder.id));
        await db
          .update(iersActivationEvents)
          .set({ status: "acknowledged", firstAcknowledgedAt: assignment.event.firstAcknowledgedAt ?? now, updatedAt: now })
          .where(and(eq(iersActivationEvents.id, input.activationEventId), inArray(iersActivationEvents.status, ["notifying", "failed_escalation"])));
        await appendTimeline(db, {
          activationEventId: input.activationEventId,
          institutionalAccountId: assignment.event.institutionalAccountId,
          actorUserId: ctx.user.id,
          eventType: "responder_acknowledged",
          fromStatus: assignment.event.status,
          toStatus: "acknowledged",
        });
      } else {
        await db
          .update(iersActivationResponders)
          .set({ notificationStatus: "declined", declinedAt: now, declineReason: input.reason || "No reason provided", updatedAt: now })
          .where(eq(iersActivationResponders.id, assignment.responder.id));
        await appendTimeline(db, {
          activationEventId: input.activationEventId,
          institutionalAccountId: assignment.event.institutionalAccountId,
          actorUserId: ctx.user.id,
          eventType: "responder_declined",
          fromStatus: assignment.event.status,
          note: input.reason || "No reason provided",
        });
      }
      return { success: true, status: input.accept ? "acknowledged" : "declined" };
    }),

  /** Provider: record that they are responding or have arrived at the scene. */
  markResponse: protectedProcedure
    .input(z.object({ activationEventId: z.number().int().positive(), state: z.enum(["responding", "at_scene"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [assignment] = await db
        .select({ responder: iersActivationResponders, event: iersActivationEvents })
        .from(iersActivationResponders)
        .innerJoin(iersActivationEvents, eq(iersActivationEvents.id, iersActivationResponders.activationEventId))
        .where(and(
          eq(iersActivationResponders.activationEventId, input.activationEventId),
          eq(iersActivationResponders.userId, ctx.user.id),
        ))
        .limit(1);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "No responder assignment found for this activation." });
      if (assignment.responder.notificationStatus !== "acknowledged") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Acknowledge the responder assignment before recording response." });
      }
      if (!canAdvanceIersActivation(assignment.event.status, input.state)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot move activation from ${assignment.event.status} to ${input.state}.` });
      }

      const now = new Date();
      await db
        .update(iersActivationResponders)
        .set({
          responseAt: assignment.responder.responseAt ?? now,
          atSceneAt: input.state === "at_scene" ? now : assignment.responder.atSceneAt,
          updatedAt: now,
        })
        .where(eq(iersActivationResponders.id, assignment.responder.id));
      await db
        .update(iersActivationEvents)
        .set({
          status: input.state,
          firstResponderAt: assignment.event.firstResponderAt ?? now,
          atSceneAt: input.state === "at_scene" ? assignment.event.atSceneAt ?? now : assignment.event.atSceneAt,
          updatedAt: now,
        })
        .where(eq(iersActivationEvents.id, input.activationEventId));
      await appendTimeline(db, {
        activationEventId: input.activationEventId,
        institutionalAccountId: assignment.event.institutionalAccountId,
        actorUserId: ctx.user.id,
        eventType: input.state === "at_scene" ? "responder_at_scene" : "responder_responding",
        fromStatus: assignment.event.status,
        toStatus: input.state,
      });
      return { success: true, status: input.state };
    }),

  /** ERTL/coordinator or institution admin: advance the activation loop. */
  advance: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      activationEventId: z.number().int().positive(),
      state: z.enum(["notifying", "stabilized", "recovered", "debrief_pending", "closed", "cancelled", "false_alarm"]),
      note: z.string().trim().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      if (access.kind === "provider" && !LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an ERTL, UTL, coordinator, or institution admin can advance this activation." });
      }

      const [event] = await db
        .select()
        .from(iersActivationEvents)
        .where(and(eq(iersActivationEvents.id, input.activationEventId), eq(iersActivationEvents.institutionalAccountId, input.institutionId)))
        .limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Activation not found." });
      if (!canAdvanceIersActivation(event.status, input.state)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot move activation from ${event.status} to ${input.state}.` });
      }

      const now = new Date();
      const timestamps: Record<string, Date> = {};
      if (input.state === "stabilized") timestamps.stabilizedAt = now;
      if (input.state === "closed") timestamps.closedAt = now;
      await db
        .update(iersActivationEvents)
        .set({
          status: input.state as ActivationStatus,
          ...timestamps,
          closedByUserId: input.state === "closed" ? ctx.user.id : event.closedByUserId,
          updatedAt: now,
        })
        .where(eq(iersActivationEvents.id, event.id));
      await appendTimeline(db, {
        activationEventId: event.id,
        institutionalAccountId: event.institutionalAccountId,
        actorUserId: ctx.user.id,
        eventType: `activation_${input.state}`,
        fromStatus: event.status,
        toStatus: input.state,
        note: input.note || null,
      });
      return { success: true, status: input.state };
    }),

  /** Institution admin, coordinator, or assigned responder: inspect the immutable timeline. */
  getTimeline: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), activationEventId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      return db
        .select()
        .from(iersActivationTimeline)
        .where(and(
          eq(iersActivationTimeline.institutionalAccountId, input.institutionId),
          eq(iersActivationTimeline.activationEventId, input.activationEventId),
        ))
        .orderBy(iersActivationTimeline.occurredAt);
    }),
});
