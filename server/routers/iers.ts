import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  inAppNotifications,
  institutionMemberships,
  iersActivationEvents,
  iersActivationResponders,
  iersActivationTimeline,
  iersEvidenceRecords,
  iersActionItems,
  iersDrills,
  iersDrillParticipants,
  iersImplementationMilestones,
  institutionalAccounts,
  institutionalAccountAdmins,
  institutionalProducts,
  institutionProductRoles,
  shiftUtlRosters,
  facilityPoles,
  facilityDepartments,
} from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import { assertIersActivationContinuity, assertInstitutionProductCapability } from "../lib/institution-entitlements";
import { assertInstitutionProductRole, type InstitutionalProductRoleKey } from "../lib/institution-product-roles";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { canAdvanceIersActivation } from "../lib/iers-state";
import { buildIersEvidenceScorecard } from "../lib/iers-criteria";
import { evaluateIersPilotReadiness } from "../lib/iers-pilot-readiness";
import { assertInstitutionProcedureAccess } from "../lib/institution-capabilities";

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
const IERS_PROVIDER_ROLES: InstitutionalProductRoleKey[] = ["iers_coordinator", "iers_responder", "iers_reviewer", "iers_governance", "iers_viewer"];

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

async function assertProviderCanOperate(db: DbClient, user: { id: number; role?: string | null; email?: string | null }, institutionId: number) {
  const membership = await getMembership(db, user.id, institutionId);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active provider member of this institution." });
  }
  await assertInstitutionProductRole(db, user as any, institutionId, "iers", IERS_PROVIDER_ROLES);
  return membership;
}

async function assertInstitutionOrMember(
  db: DbClient,
  user: { id: number; role?: string | null; email?: string | null },
  institutionId: number,
) {
  try {
    await assertInstitutionAccess(db, user as any, institutionId);
    return { kind: "institution_admin" as const, membership: null };
  } catch (error) {
    const code = error instanceof TRPCError
      ? error.code
      : error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    if (code !== "FORBIDDEN") throw error;
    const membership = await assertProviderCanOperate(db, user, institutionId);
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
      const continuityDecision = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.activation.operate");
      assertIersActivationContinuity(continuityDecision);
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

  /** Institution/provider leaders: list scheduled and completed drills. */
  listDrills: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      return db.select().from(iersDrills).where(eq(iersDrills.institutionId, input.institutionId)).orderBy(desc(iersDrills.scheduledAt)).limit(input.limit);
    }),

  /**
   * Pilot preflight: expose explicit acceptance gates before a drill is started.
   * This is advisory for navigation but intentionally truthful about missing evidence.
   */
  getPilotReadiness: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProcedureAccess(db, ctx.user, input.institutionId, "iers", "getPilotReadiness");
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);

      const activeMemberships = await db
        .select({ userId: institutionMemberships.userId })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          eq(institutionMemberships.membershipStatus, "active"),
        ));
      const activeProviderIds = new Set(activeMemberships.flatMap((row) => row.userId === null ? [] : [row.userId]));

      const [iersProduct] = await db
        .select({ id: institutionalProducts.id })
        .from(institutionalProducts)
        .where(eq(institutionalProducts.productKey, "iers"))
        .limit(1);
      const roleRows = iersProduct
        ? await db
            .select({ userId: institutionProductRoles.userId, roleKey: institutionProductRoles.roleKey })
            .from(institutionProductRoles)
            .where(and(
              eq(institutionProductRoles.institutionalAccountId, input.institutionId),
              eq(institutionProductRoles.productId, iersProduct.id),
              eq(institutionProductRoles.roleStatus, "active"),
            ))
        : [];
      const activeProviderRoleCount = roleRows.filter((row) => row.userId !== null && activeProviderIds.has(row.userId) && IERS_PROVIDER_ROLES.includes(row.roleKey as InstitutionalProductRoleKey)).length;

      const adminRows = await db
        .select({ userId: institutionalAccountAdmins.userId })
        .from(institutionalAccountAdmins)
        .where(eq(institutionalAccountAdmins.institutionalAccountId, input.institutionId));
      const reviewerIds = new Set<number>(adminRows.map((row) => row.userId));
      for (const row of roleRows) {
        if (row.userId !== null && ["iers_reviewer", "iers_governance"].includes(row.roleKey)) reviewerIds.add(row.userId);
      }
      const independentReviewerCount = [...reviewerIds].filter((userId) => !activeProviderIds.has(userId)).length;

      const completedDrills = await db
        .select({ id: iersDrills.id })
        .from(iersDrills)
        .where(and(eq(iersDrills.institutionId, input.institutionId), eq(iersDrills.status, "completed")));
      const completedDrillIds = completedDrills.map((drill) => drill.id);
      const participantRows = completedDrillIds.length
        ? await db
            .select({ drillId: iersDrillParticipants.drillId, userId: iersDrillParticipants.userId })
            .from(iersDrillParticipants)
            .where(inArray(iersDrillParticipants.drillId, completedDrillIds))
        : [];
      const completedDrillWithProviderIds = new Set(
        participantRows
          .filter((row) => activeProviderIds.has(row.userId))
          .map((row) => row.drillId),
      );

      const acceptedEvidence = await db
        .select({ id: iersEvidenceRecords.id })
        .from(iersEvidenceRecords)
        .where(and(eq(iersEvidenceRecords.institutionId, input.institutionId), eq(iersEvidenceRecords.status, "accepted")));
      const closedActions = await db
        .select({ createdByUserId: iersActionItems.createdByUserId, closedByUserId: iersActionItems.closedByUserId, closureEvidenceId: iersActionItems.closureEvidenceId })
        .from(iersActionItems)
        .where(and(eq(iersActionItems.institutionId, input.institutionId), eq(iersActionItems.status, "closed")));
      const verifiedActionCount = closedActions.filter((row) => row.closureEvidenceId !== null && row.closedByUserId !== null && row.closedByUserId !== row.createdByUserId).length;

      let simulationSafetyEnforced = false;
      try {
        await db.select({ isSimulation: iersDrills.isSimulation }).from(iersDrills).limit(1);
        simulationSafetyEnforced = true;
      } catch (error) {
        if (!isMissingTableError(error)) simulationSafetyEnforced = false;
      }

      const readiness = evaluateIersPilotReadiness({
        activeProviderCount: activeProviderIds.size,
        activeProviderRoleCount,
        independentReviewerCount,
        completedDrillWithProviderCount: completedDrillWithProviderIds.size,
        acceptedEvidenceCount: acceptedEvidence.length,
        verifiedActionCount,
        simulationSafetyEnforced,
      });
      return {
        ...readiness,
        counts: {
          activeProviderCount: activeProviderIds.size,
          activeProviderRoleCount,
          independentReviewerCount,
          completedDrillWithProviderCount: completedDrillWithProviderIds.size,
          acceptedEvidenceCount: acceptedEvidence.length,
          verifiedActionCount,
        },
      };
    }),

  /** Institution leader or ERTL: schedule a no-patient-identifier readiness drill. */
  createDrill: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      title: z.string().trim().min(3).max(255),
      scenarioType: z.enum(["code_blue", "code_yellow", "neonatal", "sepsis", "anaphylaxis", "trauma", "other"]),
      scheduledAt: z.coerce.date(),
      targetResponseSeconds: z.number().int().min(30).max(1800).default(180),
      facilitatorUserId: z.number().int().positive().optional(),
      isNotRealEmergency: z.literal(true),
      noPatientIdentifiers: z.literal(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.drills.operate");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      if (access.kind === "provider" && !LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution leader can schedule an IERS drill." });
      }
      const result = await db.insert(iersDrills).values({
        institutionId: input.institutionId,
        title: input.title,
        scenarioType: input.scenarioType,
        isSimulation: true,
        simulationLabel: "NOT A REAL EMERGENCY",
        simulationAcknowledgedAt: new Date(),
        noPatientIdentifiersAcknowledged: true,
        noPatientIdentifiersAcknowledgedAt: new Date(),
        scheduledAt: input.scheduledAt,
        targetResponseSeconds: input.targetResponseSeconds,
        facilitatorUserId: input.facilitatorUserId ?? ctx.user.id,
        createdByUserId: ctx.user.id,
      });
      return { success: true, drillId: (result as unknown as { insertId: number }).insertId };
    }),

  /** Facilitator/leader: start a planned drill and create an auditable start time. */
  startDrill: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), drillId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.drills.operate");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      if (access.kind === "provider" && !LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution leader can start an IERS drill." });
      }
      const [drill] = await db.select().from(iersDrills).where(and(eq(iersDrills.id, input.drillId), eq(iersDrills.institutionId, input.institutionId))).limit(1);
      if (!drill) throw new TRPCError({ code: "NOT_FOUND", message: "Drill not found." });
      if (drill.status !== "planned") throw new TRPCError({ code: "BAD_REQUEST", message: "Only planned drills can be started." });
      if (!drill.isSimulation || drill.simulationLabel !== "NOT A REAL EMERGENCY" || !drill.noPatientIdentifiersAcknowledged) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This drill is not safety-attested. Schedule a new drill and confirm NOT A REAL EMERGENCY with no patient identifiers." });
      }
      const activeProviderCount = await db
        .select({ userId: institutionMemberships.userId })
        .from(institutionMemberships)
        .where(and(
          eq(institutionMemberships.institutionalAccountId, input.institutionId),
          eq(institutionMemberships.membershipStatus, "active"),
        ));
      if (!activeProviderCount.some((row) => row.userId !== null)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Link at least one active provider before starting an IERS pilot drill." });
      }
      await db.update(iersDrills).set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() }).where(eq(iersDrills.id, drill.id));
      return { success: true, status: "in_progress" as const };
    }),

  /** Provider: join a drill as a named role, creating participation evidence. */
  joinDrill: protectedProcedure
    .input(z.object({ drillId: z.number().int().positive(), role: z.string().trim().min(2).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [drill] = await db.select().from(iersDrills).where(eq(iersDrills.id, input.drillId)).limit(1);
      if (!drill) throw new TRPCError({ code: "NOT_FOUND", message: "Drill not found." });
      await assertInstitutionProductCapability(db, drill.institutionId, "iers", "iers.drills.operate");
      await assertProviderCanOperate(db, ctx.user, drill.institutionId);
      if (drill.status !== "in_progress") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Providers can join only an in-progress IERS drill." });
      }
      await db.insert(iersDrillParticipants).values({
        drillId: drill.id,
        institutionId: drill.institutionId,
        userId: ctx.user.id,
        role: input.role,
        joinedAt: new Date(),
      }).catch(() => undefined);
      return { success: true };
    }),

  /** Facilitator/leader: complete the debrief and create activation evidence. */
  submitDrillDebrief: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      drillId: z.number().int().positive(),
      debriefNote: z.string().trim().min(5).max(5000),
      lessonsLearned: z.string().trim().min(5).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.drills.operate");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      if (access.kind === "provider" && !LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution leader can close a drill debrief." });
      }
      const [drill] = await db.select().from(iersDrills).where(and(eq(iersDrills.id, input.drillId), eq(iersDrills.institutionId, input.institutionId))).limit(1);
      if (!drill) throw new TRPCError({ code: "NOT_FOUND", message: "Drill not found." });
      if (drill.status !== "in_progress") throw new TRPCError({ code: "BAD_REQUEST", message: "Only an in-progress drill can be debriefed." });
      if (!drill.isSimulation || drill.simulationLabel !== "NOT A REAL EMERGENCY" || !drill.noPatientIdentifiersAcknowledged) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This drill lacks the required safety attestation and cannot be completed as pilot evidence." });
      }
      const participants = await db
        .select({ userId: iersDrillParticipants.userId })
        .from(iersDrillParticipants)
        .where(and(eq(iersDrillParticipants.drillId, drill.id), eq(iersDrillParticipants.institutionId, input.institutionId)));
      if (participants.length === 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A linked provider must join the drill before the debrief can be closed." });
      }
      const endedAt = new Date();
      await db.update(iersDrills).set({ status: "completed", endedAt, debriefNote: input.debriefNote, lessonsLearned: input.lessonsLearned, updatedAt: endedAt }).where(eq(iersDrills.id, drill.id));
      await db.insert(iersEvidenceRecords).values({
        institutionId: input.institutionId,
        domain: "activation",
        criterionCode: "ACT-01",
        title: `IERS drill debrief #${drill.id}`,
        evidenceType: "drill",
        description: `${input.debriefNote} Lessons learned: ${input.lessonsLearned}`,
        observedAt: endedAt,
        submittedByUserId: ctx.user.id,
        status: "submitted",
      });
      return { success: true, status: "completed" as const };
    }),

  /** Institution leaders: get or initialize the 30/60/90-day IERS implementation plan. */
  getImplementationPlan: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProcedureAccess(db, ctx.user, input.institutionId, "iers", "getImplementationPlan");
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      let milestones = await db.select().from(iersImplementationMilestones).where(eq(iersImplementationMilestones.institutionId, input.institutionId)).orderBy(iersImplementationMilestones.phaseOrder);
      if (milestones.length === 0) {
        await db.insert(iersImplementationMilestones).values([
          { institutionId: input.institutionId, phaseOrder: 30, phaseName: "First 30 days", objective: "Confirm governance, provider membership, ERT coverage, baseline equipment gaps, and activation escalation routes.", createdByUserId: ctx.user.id },
          { institutionId: input.institutionId, phaseOrder: 60, phaseName: "First 60 days", objective: "Run a controlled drill, review criterion evidence, assign action owners, and correct the highest-risk readiness gaps.", createdByUserId: ctx.user.id },
          { institutionId: input.institutionId, phaseOrder: 90, phaseName: "First 90 days", objective: "Complete repeat drill evidence, verify closed actions, review response trends, and prepare a human certification review pack.", createdByUserId: ctx.user.id },
        ]);
        milestones = await db.select().from(iersImplementationMilestones).where(eq(iersImplementationMilestones.institutionId, input.institutionId)).orderBy(iersImplementationMilestones.phaseOrder);
      }
      return milestones;
    }),

  /** Institution leader: update an implementation milestone and require proof before completion. */
  updateImplementationMilestone: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      milestoneId: z.number().int().positive(),
      status: z.enum(["not_started", "in_progress", "at_risk", "complete"]),
      targetDate: z.coerce.date().optional(),
      ownerUserId: z.number().int().positive().optional(),
      riskNote: z.string().trim().max(2000).optional(),
      evidenceId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.implementation.govern");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      if (access.kind === "provider" && !LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution leader can update the implementation plan." });
      }
      const [milestone] = await db.select().from(iersImplementationMilestones).where(and(eq(iersImplementationMilestones.id, input.milestoneId), eq(iersImplementationMilestones.institutionId, input.institutionId))).limit(1);
      if (!milestone) throw new TRPCError({ code: "NOT_FOUND", message: "Implementation milestone not found." });
      if (input.status === "complete" && !input.evidenceId && !milestone.evidenceId) throw new TRPCError({ code: "BAD_REQUEST", message: "Attach accepted evidence before marking a milestone complete." });
      await db.update(iersImplementationMilestones).set({ status: input.status, targetDate: input.targetDate ?? milestone.targetDate, ownerUserId: input.ownerUserId ?? milestone.ownerUserId, riskNote: input.riskNote ?? milestone.riskNote, evidenceId: input.evidenceId ?? milestone.evidenceId, completedAt: input.status === "complete" ? new Date() : null, updatedAt: new Date() }).where(eq(iersImplementationMilestones.id, milestone.id));
      return { success: true, status: input.status };
    }),

  /** Institution admin/coordinator: reconcile an activation recorded during downtime. */
  recordDowntimeActivation: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      activationType: z.enum(["code_blue", "code_yellow", "neonatal", "sepsis", "anaphylaxis", "trauma", "other"]),
      location: z.string().trim().min(2).max(255),
      department: z.string().trim().max(255).optional(),
      triggeredAt: z.coerce.date(),
      notes: z.string().trim().min(2).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const continuityDecision = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.activation.respond");
      assertIersActivationContinuity(continuityDecision);
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const eventInsert = await db.insert(iersActivationEvents).values({
        institutionalAccountId: input.institutionId,
        activatedByUserId: ctx.user.id,
        activationType: input.activationType,
        priority: "critical",
        location: input.location,
        department: input.department || null,
        source: "downtime_reconciliation",
        status: "downtime_pending_sync",
        triggeredAt: input.triggeredAt,
        notes: input.notes,
      });
      const activationEventId = (eventInsert as unknown as { insertId: number }).insertId;
      await appendTimeline(db, {
        activationEventId,
        institutionalAccountId: input.institutionId,
        actorUserId: ctx.user.id,
        eventType: "downtime_activation_reconciled",
        fromStatus: "downtime_pending_sync",
        toStatus: "downtime_pending_sync",
        note: input.notes,
        metadata: { triggeredAt: input.triggeredAt.toISOString() },
      });
      return { success: true, activationEventId, status: "downtime_pending_sync" as const };
    }),

  /** Provider: see upcoming assigned shifts and whether readiness has been signed off. */
  getMyShiftReadiness: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 7);
    try {
      return await db
        .select({
          id: shiftUtlRosters.id,
          institutionId: shiftUtlRosters.institutionId,
          poleId: shiftUtlRosters.poleId,
          departmentId: shiftUtlRosters.departmentId,
          shiftDate: shiftUtlRosters.shiftDate,
          shiftType: shiftUtlRosters.shiftType,
          isShiftErtl: shiftUtlRosters.isShiftErtl,
          readinessSignOffAt: shiftUtlRosters.readinessSignOffAt,
          readinessNote: shiftUtlRosters.readinessNote,
          status: shiftUtlRosters.status,
          poleName: facilityPoles.poleName,
          departmentName: facilityDepartments.departmentName,
        })
        .from(shiftUtlRosters)
        .innerJoin(facilityPoles, eq(facilityPoles.id, shiftUtlRosters.poleId))
        .innerJoin(facilityDepartments, eq(facilityDepartments.id, shiftUtlRosters.departmentId))
        .where(and(
          eq(shiftUtlRosters.utlUserId, ctx.user.id),
          eq(shiftUtlRosters.status, "active"),
          gte(shiftUtlRosters.shiftDate, today),
          lte(shiftUtlRosters.shiftDate, horizon),
        ))
        .orderBy(shiftUtlRosters.shiftDate);
    } catch (error) {
      if (isMissingTableError(error)) return [];
      throw error;
    }
  }),

  /** Provider/UTL: sign off their own assigned shift readiness. */
  signOffShiftReadiness: protectedProcedure
    .input(z.object({ shiftRosterId: z.number().int().positive(), note: z.string().trim().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [roster] = await db
        .select()
        .from(shiftUtlRosters)
        .where(and(eq(shiftUtlRosters.id, input.shiftRosterId), eq(shiftUtlRosters.utlUserId, ctx.user.id)))
        .limit(1);
      if (!roster) throw new TRPCError({ code: "NOT_FOUND", message: "Assigned shift not found." });
      await assertInstitutionProductCapability(db, roster.institutionId, "iers", "iers.team_readiness.operate");
      await assertProviderCanOperate(db, ctx.user, roster.institutionId);
      if (roster.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Only active shifts can be signed off." });

      const signedOffAt = new Date();
      await db
        .update(shiftUtlRosters)
        .set({ readinessSignOffAt: signedOffAt, readinessSignedOffByUserId: ctx.user.id, readinessNote: input.note || null })
        .where(eq(shiftUtlRosters.id, input.shiftRosterId));
      await db.insert(iersEvidenceRecords).values({
        institutionId: roster.institutionId,
        domain: "workforce",
        criterionCode: "WF-02",
        title: `Shift readiness sign-off #${roster.id}`,
        evidenceType: "attestation",
        description: `Assigned provider confirmed shift readiness for ${roster.shiftType} shift on ${roster.shiftDate.toISOString().slice(0, 10)}.${input.note ? ` Note: ${input.note}` : ""}`,
        observedAt: signedOffAt,
        submittedByUserId: ctx.user.id,
        status: "submitted",
      });
      return { success: true, signedOffAt };
    }),

  /** Institution/provider: calculate readiness from accepted criterion evidence. */
  getEvidenceScorecard: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      const evidence = await db
        .select({ criterionCode: iersEvidenceRecords.criterionCode, status: iersEvidenceRecords.status })
        .from(iersEvidenceRecords)
        .where(eq(iersEvidenceRecords.institutionId, input.institutionId));
      return buildIersEvidenceScorecard(evidence);
    }),

  /** Providers and institution leaders: submit criterion-level readiness evidence. */
  submitEvidence: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      domain: z.enum(["leadership", "workforce", "activation", "equipment", "clinical_governance", "quality_improvement", "resusgps", "training"]),
      criterionCode: z.string().trim().min(2).max(64),
      title: z.string().trim().min(3).max(255),
      evidenceType: z.enum(["checklist", "document", "photo", "drill", "activation", "audit", "metric", "attestation", "external"]),
      description: z.string().trim().min(5).max(5000),
      evidenceUrl: z.string().url().max(2000).optional(),
      observedAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.evidence.submit");
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      const result = await db.insert(iersEvidenceRecords).values({
        institutionId: input.institutionId,
        domain: input.domain,
        criterionCode: input.criterionCode,
        title: input.title,
        evidenceType: input.evidenceType,
        description: input.description,
        evidenceUrl: input.evidenceUrl || null,
        observedAt: input.observedAt ?? new Date(),
        expiresAt: input.expiresAt ?? null,
        submittedByUserId: ctx.user.id,
        status: "submitted",
      });
      return { success: true, evidenceId: (result as unknown as { insertId: number }).insertId };
    }),

  /** Providers and institution leaders: inspect the shared evidence record. */
  listEvidence: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      domain: z.enum(["leadership", "workforce", "activation", "equipment", "clinical_governance", "quality_improvement", "resusgps", "training"]).optional(),
      status: z.enum(["draft", "submitted", "accepted", "rejected", "expired", "superseded"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      const predicates = [eq(iersEvidenceRecords.institutionId, input.institutionId)];
      if (input.domain) predicates.push(eq(iersEvidenceRecords.domain, input.domain));
      if (input.status) predicates.push(eq(iersEvidenceRecords.status, input.status));
      return db
        .select()
        .from(iersEvidenceRecords)
        .where(and(...predicates))
        .orderBy(desc(iersEvidenceRecords.createdAt));
    }),

  /** Institution leaders: accept or reject evidence; providers cannot self-approve. */
  reviewEvidence: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      evidenceId: z.number().int().positive(),
      status: z.enum(["accepted", "rejected", "expired", "superseded"]),
      reviewNote: z.string().trim().min(2).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.evidence.review");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      if (access.kind === "provider" && !LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution leader can review evidence." });
      }
      const [evidence] = await db
        .select({ id: iersEvidenceRecords.id })
        .from(iersEvidenceRecords)
        .where(and(eq(iersEvidenceRecords.id, input.evidenceId), eq(iersEvidenceRecords.institutionId, input.institutionId)))
        .limit(1);
      if (!evidence) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence record not found." });
      await db
        .update(iersEvidenceRecords)
        .set({ status: input.status, reviewedByUserId: ctx.user.id, reviewedAt: new Date(), reviewNote: input.reviewNote, updatedAt: new Date() })
        .where(eq(iersEvidenceRecords.id, input.evidenceId));
      return { success: true, status: input.status };
    }),

  /** Providers and institution leaders: create a named action from any readiness gap. */
  createAction: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      sourceType: z.enum(["evidence", "activation", "equipment", "care_signal", "code_signal", "incident", "drill", "manual"]).default("manual"),
      sourceId: z.number().int().positive().optional(),
      title: z.string().trim().min(3).max(255),
      gapDescription: z.string().trim().min(5).max(5000),
      ownerUserId: z.number().int().positive().optional(),
      priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
      dueDate: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.actions.operate");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      const ownerUserId = access.kind === "provider" ? ctx.user.id : input.ownerUserId ?? null;
      const result = await db.insert(iersActionItems).values({
        institutionId: input.institutionId,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        title: input.title,
        gapDescription: input.gapDescription,
        ownerUserId,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
        createdByUserId: ctx.user.id,
      });
      return { success: true, actionId: (result as unknown as { insertId: number }).insertId };
    }),

  /** Shared action queue; providers see their own work, leaders see the institution queue. */
  listActions: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), status: z.enum(["open", "in_progress", "blocked", "awaiting_verification", "closed", "cancelled"]).optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      const predicates = [eq(iersActionItems.institutionId, input.institutionId)];
      if (input.status) predicates.push(eq(iersActionItems.status, input.status));
      if (access.kind === "provider") {
        predicates.push(or(eq(iersActionItems.ownerUserId, ctx.user.id), eq(iersActionItems.createdByUserId, ctx.user.id)) as any);
      }
      return db.select().from(iersActionItems).where(and(...predicates)).orderBy(desc(iersActionItems.updatedAt));
    }),

  /** Owner or institution leader updates progress and documents closure evidence. */
  updateAction: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      actionId: z.number().int().positive(),
      status: z.enum(["open", "in_progress", "blocked", "awaiting_verification", "closed", "cancelled"]),
      closureNote: z.string().trim().max(2000).optional(),
      closureEvidenceId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.actions.operate");
      const access = await assertInstitutionOrMember(db, ctx.user, input.institutionId);
      const [action] = await db.select().from(iersActionItems).where(and(eq(iersActionItems.id, input.actionId), eq(iersActionItems.institutionId, input.institutionId))).limit(1);
      if (!action) throw new TRPCError({ code: "NOT_FOUND", message: "Action item not found." });
      const isLeader = access.kind === "institution_admin" || LEAD_ROLES.includes(access.membership?.responsibilityRole as ResponsibilityRole);
      if (!isLeader && action.ownerUserId !== ctx.user.id && action.createdByUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the action owner or institution leader can update this action." });
      }
      const closed = input.status === "closed";
      if (closed && !isLeader) throw new TRPCError({ code: "FORBIDDEN", message: "Only an institution leader can verify and close an action." });
      if (closed && !input.closureNote?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Document closure evidence before closing an action." });
      await db.update(iersActionItems).set({
        status: input.status,
        closureNote: input.closureNote || action.closureNote,
        closureEvidenceId: input.closureEvidenceId ?? action.closureEvidenceId,
        closedByUserId: closed ? ctx.user.id : action.closedByUserId,
        closedAt: closed ? new Date() : action.closedAt,
        updatedAt: new Date(),
      }).where(eq(iersActionItems.id, action.id));
      return { success: true, status: input.status };
    }),

  /** Institution admin/coordinator: monitor active and recent activations for the facility. */
  listInstitutionActivations: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(25) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
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
      const continuityDecision = await assertInstitutionProductCapability(db, assignment.event.institutionalAccountId, "iers", "iers.activation.respond");
      assertIersActivationContinuity(continuityDecision);

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
      const continuityDecision = await assertInstitutionProductCapability(db, assignment.event.institutionalAccountId, "iers", "iers.activation.respond");
      assertIersActivationContinuity(continuityDecision);
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
      const continuityDecision = await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.activation.operate");
      assertIersActivationContinuity(continuityDecision);
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
      if (input.state === "closed" && !input.note?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Document the debrief finding before closing the activation." });
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
      if (input.state === "closed") {
        await db.insert(iersEvidenceRecords).values({
          institutionId: event.institutionalAccountId,
          domain: "activation",
          criterionCode: "ACT-02",
          title: `Activation response and debrief #${event.id}`,
          evidenceType: "activation",
          description: `Activation ${event.id} completed with status closed. Triggered at ${event.triggeredAt.toISOString()}; first acknowledgement ${event.firstAcknowledgedAt?.toISOString() ?? "not recorded"}; first responder ${event.firstResponderAt?.toISOString() ?? "not recorded"}; arrival ${event.atSceneAt?.toISOString() ?? "not recorded"}. Debrief: ${input.note}`,
          observedAt: now,
          submittedByUserId: ctx.user.id,
          status: "submitted",
        });
      }
      return { success: true, status: input.state };
    }),

  /** Institution admin, coordinator, or assigned responder: inspect the immutable timeline. */
  getTimeline: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), activationEventId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await assertInstitutionProductCapability(db, input.institutionId, "iers", "iers.workspace.read");
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
