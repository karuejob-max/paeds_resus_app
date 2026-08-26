import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { z } from "zod";
import {
  facilityDepartments,
  facilityPoles,
  inAppNotifications,
  institutionDepartmentResponseCoordinators,
  institutionMemberships,
  institutionalStaffMembers,
  iersShiftRoleAssignments,
  iersShiftRoleEvents,
  iersShiftRoleRecommendations,
  iersShiftTeams,
  shiftUtlRosters,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertInstitutionProductCapability } from "../lib/institution-entitlements";
import { assertInstitutionProductRole, type InstitutionalProductRoleKey } from "../lib/institution-product-roles";
import { isRegisteredRnProfile } from "../lib/iers-provider-eligibility";
import { validateShiftInterval } from "../lib/iers-shift-times";
import { derivePoleRotationDepartmentId } from "../lib/iers-pole-rotation";
import { classifyShiftInterval, currentShiftSortWeight, shiftSortKey, type ShiftState } from "../lib/iers-shift-current";
import { assertShiftRoleTransition, normalizeShiftRoleKey, type ShiftRoleAssignmentStatus } from "../lib/iers-shift-role-state";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { ensurePublishedTeamForLegacyUtlRoster, projectShiftRoleDecisionToLegacyUtlRoster, requestErtlAcceptance } from "../services/iers-utl-sync.service";

const IERS_PROVIDER_ROLES: InstitutionalProductRoleKey[] = ["iers_coordinator", "iers_responder", "iers_reviewer", "iers_governance", "iers_viewer"];
const ERT_MEMBER_ROLES = new Set([
  "airway_lead",
  "breathing_lead",
  "circulation_lead",
  "medications_lead",
  "documentation_lead",
  "runner",
  "safety_observer",
  "resus_recorder",
]);

const roleScopeSchema = z.enum(["utl", "ertl", "ert_member"]);
const roleStatusSchema = z.enum(["proposed", "approved", "pending_acceptance", "accepted", "declined", "expired", "superseded", "ended"]);

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type ContextUser = { id: number; role?: string | null; email?: string | null };

async function requireActiveMembership(db: DbClient, user: ContextUser, institutionId: number) {
  const [membership] = await db
    .select()
    .from(institutionMemberships)
    .where(and(
      eq(institutionMemberships.institutionalAccountId, institutionId),
      eq(institutionMemberships.userId, user.id),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active provider member of this institution." });
  return membership;
}

async function requireProviderOperator(db: DbClient, user: ContextUser, institutionId: number) {
  const membership = await requireActiveMembership(db, user, institutionId);
  await assertInstitutionProductRole(db, user as any, institutionId, "iers", IERS_PROVIDER_ROLES);
  return membership;
}

async function requireTeam(db: DbClient, teamId: number) {
  const [team] = await db.select().from(iersShiftTeams).where(eq(iersShiftTeams.id, teamId)).limit(1);
  if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "IERS shift team not found." });
  return team;
}

async function requireErtlForTeam(db: DbClient, user: ContextUser, teamId: number) {
  const team = await requireTeam(db, teamId);
  if (!["published", "active"].includes(team.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only the current published ERT team can be coordinated." });
  await requireActiveMembership(db, user, team.institutionId);
  const [ertl] = await db
    .select()
    .from(iersShiftRoleAssignments)
    .where(and(
      eq(iersShiftRoleAssignments.teamId, team.id),
      eq(iersShiftRoleAssignments.providerUserId, user.id),
      eq(iersShiftRoleAssignments.roleScope, "ertl"),
      eq(iersShiftRoleAssignments.assignmentStatus, "accepted"),
    ))
    .limit(1);
  if (!ertl) throw new TRPCError({ code: "FORBIDDEN", message: "Only the accepted ERTL can coordinate this shift team." });
  return { team, ertl };
}

async function recordRoleEvent(
  db: DbClient,
  input: {
    assignmentId: number;
    teamId: number;
    institutionId: number;
    actorUserId: number | null;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    fromRoleKey?: string | null;
    toRoleKey?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(iersShiftRoleEvents).values({
    assignmentId: input.assignmentId,
    teamId: input.teamId,
    institutionId: input.institutionId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    fromRoleKey: input.fromRoleKey ?? null,
    toRoleKey: input.toRoleKey ?? null,
    reason: input.reason ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

async function notifyUser(db: DbClient, userId: number, title: string, body: string, relatedId: number, actionUrl = "/home") {
  await db.insert(inAppNotifications).values({
    userId,
    type: "iers_shift_team",
    title,
    body,
    actionUrl,
    relatedId,
    read: false,
  });
}

type ShiftRoleRecommendationView = typeof iersShiftRoleRecommendations.$inferSelect;
type ShiftTeamAssignmentView = {
  id: number;
  providerUserId: number;
  providerName: string;
  departmentName: string | null;
  institutionId: number;
  poleId: number;
  departmentId: number | null;
  shiftUtlRosterId: number | null;
  roleScope: "utl" | "ertl" | "ert_member";
  roleKey: string;
  assignmentStatus: "proposed" | "pending_acceptance" | "approved" | "accepted" | "declined" | "superseded" | "expired" | "ended";
  acceptedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  isCurrentUser: boolean;
  recommendations: ShiftRoleRecommendationView[];
};
type ShiftTeamView = {
  teamId: number;
  institutionId: number;
  poleId: number;
  poleName: string;
  shiftDate: Date;
  shiftType: "morning" | "evening" | "night";
  shiftStartTime: string;
  shiftEndTime: string;
  shiftEndDayOffset: number;
  teamVersion: number;
  teamStatus: "draft" | "published" | "active" | "closed" | "superseded";
  teamState: ShiftState;
  assignments: ShiftTeamAssignmentView[];
};

async function notifyDepartmentErco(db: DbClient, institutionId: number, departmentId: number, title: string, body: string, relatedId: number) {
  const [coordinator] = await db
    .select({ coordinatorUserId: institutionDepartmentResponseCoordinators.coordinatorUserId, backupUserId: institutionDepartmentResponseCoordinators.backupUserId })
    .from(institutionDepartmentResponseCoordinators)
    .where(and(
      eq(institutionDepartmentResponseCoordinators.institutionId, institutionId),
      eq(institutionDepartmentResponseCoordinators.departmentId, departmentId),
      eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"),
    ))
    .limit(1);
  if (!coordinator) return;
  for (const userId of new Set([coordinator.coordinatorUserId, coordinator.backupUserId].filter((id): id is number => id !== null))) {
    await notifyUser(db, userId, title, body, relatedId, "/institution?section=iers&iersTab=workforce&workforceTab=roster");
  }
}

export const iersShiftTeamRouter = router({
  /** IERS Lead/governance publishes one versioned team with explicit provider nominations. */
  publishShiftTeam: protectedProcedure
    .input(z.object({
      institutionId: z.number().int().positive(),
      poleId: z.number().int().positive(),
      shiftDate: z.coerce.date(),
      shiftType: z.enum(["morning", "evening", "night"]),
      shiftStartTime: z.string().trim(),
      shiftEndTime: z.string().trim(),
      shiftEndDayOffset: z.number().int().min(0).max(1),
      assignments: z.array(z.object({
        providerUserId: z.number().int().positive(),
        departmentId: z.number().int().positive().optional(),
        roleScope: roleScopeSchema,
        roleKey: z.string().trim().min(2).max(64),
        shiftUtlRosterId: z.number().int().positive().optional(),
      })).min(1).max(32),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await requireActiveMembership(db, ctx.user, input.institutionId);
      await assertInstitutionProductRole(db, ctx.user as any, input.institutionId, "iers", ["iers_coordinator", "iers_governance"]);
      const interval = validateShiftInterval({ startTime: input.shiftStartTime, endTime: input.shiftEndTime, endDayOffset: input.shiftEndDayOffset });
      const [pole] = await db.select().from(facilityPoles).where(and(eq(facilityPoles.id, input.poleId), eq(facilityPoles.institutionId, input.institutionId))).limit(1);
      if (!pole) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected pole does not belong to this institution." });
      const rotationDepartments = await db.select({ id: facilityDepartments.id, poleSequence: facilityDepartments.poleSequence, createdAt: facilityDepartments.createdAt }).from(facilityDepartments).where(and(
        eq(facilityDepartments.institutionId, input.institutionId),
        eq(facilityDepartments.poleId, input.poleId),
        eq(facilityDepartments.isActive, true),
        isNotNull(facilityDepartments.confirmedAt),
        eq(facilityDepartments.requiresPole, true),
      )).orderBy(asc(facilityDepartments.poleSequence), asc(facilityDepartments.createdAt), asc(facilityDepartments.id));
      const leadingDepartmentId = derivePoleRotationDepartmentId(rotationDepartments, pole.rotationAnchorDate, input.shiftDate);
      if (leadingDepartmentId == null) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected pole has no confirmed operational department available for automatic ERTL rotation." });
      const roleKeys = input.assignments.map((assignment) => normalizeRoleKey(assignment.roleKey));
      const assignmentsByProvider = new Map<number, typeof input.assignments>();
      for (const assignment of input.assignments) {
        const existing = assignmentsByProvider.get(assignment.providerUserId) ?? [];
        existing.push(assignment);
        assignmentsByProvider.set(assignment.providerUserId, existing);
      }
      for (const providerAssignments of assignmentsByProvider.values()) {
        const scopes = new Set(providerAssignments.map((assignment) => assignment.roleScope));
        const mayHoldUtlAndErtl = providerAssignments.length === 2 && scopes.has("utl") && scopes.has("ertl");
        if (!mayHoldUtlAndErtl && providerAssignments.length > 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A provider can only hold one role in a published team unless the designated UTL is also the dated ERTL/Scene Commander." });
        }
      }
      if (input.assignments.filter((assignment) => assignment.roleScope === "ertl").length !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Each published team must have exactly one nominated ERTL." });
      if (input.assignments.filter((assignment) => assignment.roleScope === "utl").length !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Each published team must have exactly one nominated UTL." });
      const memberRoleKeys = roleKeys.filter((_, index) => input.assignments[index]?.roleScope === "ert_member");
      if (new Set(memberRoleKeys).size !== memberRoleKeys.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Each ERT member role may be assigned only once." });
      if (memberRoleKeys.some((roleKey) => !ERT_MEMBER_ROLES.has(roleKey))) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a supported ERT member role." });

      const validatedAssignments: Array<{ providerUserId: number; departmentId: number; roleScope: "utl" | "ertl" | "ert_member"; roleKey: string; shiftUtlRosterId: number | null }> = [];
      for (const assignment of input.assignments) {
        const [provider] = await db
          .select({ userId: users.id, providerType: users.providerType, cadre: users.cadre, cadreOther: users.cadreOther, staffRole: institutionalStaffMembers.staffRole, facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId, departmentName: facilityDepartments.departmentName, poleId: facilityDepartments.poleId })
          .from(users)
          .innerJoin(institutionalStaffMembers, and(eq(institutionalStaffMembers.userId, users.id), eq(institutionalStaffMembers.institutionalAccountId, input.institutionId), isNull(institutionalStaffMembers.removedAt)))
          .innerJoin(institutionMemberships, and(eq(institutionMemberships.userId, users.id), eq(institutionMemberships.institutionalAccountId, input.institutionId), eq(institutionMemberships.membershipStatus, "active")))
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionalStaffMembers.facilityDepartmentId))
          .where(eq(users.id, assignment.providerUserId))
          .limit(1);
        if (!provider || !isRegisteredRnProfile(provider)) throw new TRPCError({ code: "BAD_REQUEST", message: "Every nominated ERT provider must be an active linked Staff/RN profile." });
        if (provider.poleId !== input.poleId) throw new TRPCError({ code: "BAD_REQUEST", message: `${provider.departmentName ?? "The provider"} is not assigned to the selected pole.` });
        const departmentId = assignment.departmentId ?? provider.facilityDepartmentId;
        if (!departmentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Every nominated provider must have a canonical department." });
        validatedAssignments.push({ providerUserId: assignment.providerUserId, departmentId, roleScope: assignment.roleScope, roleKey: normalizeRoleKey(assignment.roleKey), shiftUtlRosterId: assignment.shiftUtlRosterId ?? null });
      }
      const validatedUtl = validatedAssignments.find((assignment) => assignment.roleScope === "utl");
      const validatedErtl = validatedAssignments.find((assignment) => assignment.roleScope === "ertl");
      if (!validatedUtl || !validatedErtl || validatedUtl.providerUserId !== validatedErtl.providerUserId || validatedUtl.departmentId !== leadingDepartmentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The ERTL / Scene Commander is automatic: publish the accepted UTL from this week's leading department as both UTL and ERTL." });
      }

      const latest = await db.select().from(iersShiftTeams).where(and(eq(iersShiftTeams.institutionId, input.institutionId), eq(iersShiftTeams.poleId, input.poleId), eq(iersShiftTeams.shiftDate, input.shiftDate), eq(iersShiftTeams.shiftType, input.shiftType))).orderBy(desc(iersShiftTeams.teamVersion)).limit(1);
      const previous = latest[0];
      const teamVersion = (previous?.teamVersion ?? 0) + 1;
      if (previous && ["published", "active"].includes(previous.status)) {
        await db.update(iersShiftTeams).set({ status: "superseded" }).where(eq(iersShiftTeams.id, previous.id));
      }
      const teamInsert = await db.insert(iersShiftTeams).values({ institutionId: input.institutionId, poleId: input.poleId, shiftDate: input.shiftDate, shiftType: input.shiftType, shiftStartTime: interval.startTime, shiftEndTime: interval.endTime, shiftEndDayOffset: interval.endDayOffset, teamVersion, status: "published", createdByUserId: ctx.user.id, publishedAt: new Date() });
      const teamId = Number((teamInsert as unknown as { insertId: number }).insertId);

      for (const assignment of validatedAssignments) {
        const inserted = await db.insert(iersShiftRoleAssignments).values({ teamId, institutionId: input.institutionId, poleId: input.poleId, departmentId: assignment.departmentId, providerUserId: assignment.providerUserId, shiftUtlRosterId: assignment.shiftUtlRosterId, roleScope: assignment.roleScope, roleKey: assignment.roleKey, assignmentStatus: "pending_acceptance", proposedByUserId: ctx.user.id });
        const assignmentId = Number((inserted as unknown as { insertId: number }).insertId);
        await recordRoleEvent(db, { assignmentId, teamId, institutionId: input.institutionId, actorUserId: ctx.user.id, eventType: "role_published", fromStatus: "proposed", toStatus: "pending_acceptance", toRoleKey: assignment.roleKey });
        await notifyUser(db, assignment.providerUserId, "New IERS shift role requires acceptance", `You were nominated as ${assignment.roleKey.replaceAll("_", " ")} for the ${input.shiftType} shift on ${input.shiftDate.toISOString().slice(0, 10)}. Review and accept or decline.`, assignmentId, "/home");
      }
      return { success: true, teamId, teamVersion };
    }),

  /** All active nurses with institution membership can read the current team for their pole. */
  listMyShiftTeams: protectedProcedure
    .input(z.object({ horizonDays: z.number().int().min(0).max(14).default(7) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const horizonDays = input?.horizonDays ?? 7;
      try {
      const memberships = await db
        .select({ institutionId: institutionMemberships.institutionalAccountId })
        .from(institutionMemberships)
        .where(and(eq(institutionMemberships.userId, ctx.user.id), eq(institutionMemberships.membershipStatus, "active")));
      const result: ShiftTeamView[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const windowStart = new Date(today);
      windowStart.setDate(windowStart.getDate() - 1);
      const horizon = new Date(today);
      horizon.setDate(horizon.getDate() + horizonDays);

      for (const { institutionId } of memberships) {
        await assertInstitutionProductCapability(db, institutionId, "iers", "iers.workspace.read");
        const staffRows = await db
          .select({ poleId: facilityDepartments.poleId })
          .from(institutionalStaffMembers)
          .innerJoin(facilityDepartments, eq(institutionalStaffMembers.facilityDepartmentId, facilityDepartments.id))
          .where(and(
            eq(institutionalStaffMembers.institutionalAccountId, institutionId),
            eq(institutionalStaffMembers.userId, ctx.user.id),
            isNull(institutionalStaffMembers.removedAt),
            eq(facilityDepartments.isActive, true),
          ));
        const staffPoleIds = [...new Set(staffRows.flatMap((row) => row.poleId === null ? [] : [row.poleId]))];
        const legacyRosters = await db
          .select()
          .from(shiftUtlRosters)
          .where(and(
            eq(shiftUtlRosters.institutionId, institutionId),
            eq(shiftUtlRosters.utlUserId, ctx.user.id),
            gte(shiftUtlRosters.shiftDate, windowStart),
            lte(shiftUtlRosters.shiftDate, horizon),
            eq(shiftUtlRosters.status, "active"),
            inArray(shiftUtlRosters.assignmentStatus, ["pending_acceptance", "active"]),
          ));
        const poleIds = [...new Set([...staffPoleIds, ...legacyRosters.map((roster) => roster.poleId)])];
        if (poleIds.length === 0) continue;
        const loadTeams = () => db
          .select({
            team: iersShiftTeams,
            poleName: facilityPoles.poleName,
          })
          .from(iersShiftTeams)
          .innerJoin(facilityPoles, eq(facilityPoles.id, iersShiftTeams.poleId))
          .where(and(
            eq(iersShiftTeams.institutionId, institutionId),
            inArray(iersShiftTeams.poleId, poleIds),
            gte(iersShiftTeams.shiftDate, windowStart),
            lte(iersShiftTeams.shiftDate, horizon),
            inArray(iersShiftTeams.status, ["published", "active"]),
          ))
          .orderBy(iersShiftTeams.shiftDate, iersShiftTeams.shiftType, desc(iersShiftTeams.teamVersion));
        let teams = await loadTeams();
        const rosterKey = (roster: { institutionId: number; poleId: number; shiftDate: Date; shiftType: string; shiftStartTime: string; shiftEndTime: string; shiftEndDayOffset: number }) => [
          roster.institutionId,
          roster.poleId,
          roster.shiftDate.toISOString().slice(0, 10),
          roster.shiftType,
          roster.shiftStartTime,
          roster.shiftEndTime,
          roster.shiftEndDayOffset,
        ].join("|");
        const teamKeysMissingErtl = new Set<string>();
        if (teams.length > 0) {
          const teamIds = teams.map(({ team }) => team.id);
          const existingRoles = await db
            .select({ teamId: iersShiftRoleAssignments.teamId, roleScope: iersShiftRoleAssignments.roleScope, assignmentStatus: iersShiftRoleAssignments.assignmentStatus })
            .from(iersShiftRoleAssignments)
            .where(inArray(iersShiftRoleAssignments.teamId, teamIds));
          const teamsWithErtl = new Set(existingRoles.filter((role) => role.roleScope === "ertl" && ["proposed", "approved", "pending_acceptance", "accepted", "declined"].includes(role.assignmentStatus)).map((role) => role.teamId));
          for (const { team } of teams) {
            if (!teamsWithErtl.has(team.id)) teamKeysMissingErtl.add(rosterKey(team));
          }
        }
        const repairRosters = new Map<string, typeof shiftUtlRosters.$inferSelect>();
        if (teams.length === 0 || teamKeysMissingErtl.size > 0) {
          const candidateRosters = await db.select().from(shiftUtlRosters).where(and(
            eq(shiftUtlRosters.institutionId, institutionId),
            inArray(shiftUtlRosters.poleId, poleIds),
            gte(shiftUtlRosters.shiftDate, windowStart),
            lte(shiftUtlRosters.shiftDate, horizon),
            eq(shiftUtlRosters.status, "active"),
            inArray(shiftUtlRosters.assignmentStatus, ["pending_acceptance", "active"]),
          ));
          for (const roster of candidateRosters) {
            const key = rosterKey(roster);
            if (teams.length === 0 || teamKeysMissingErtl.has(key)) repairRosters.set(key, roster);
          }
        }
        for (const roster of repairRosters.values()) {
          await ensurePublishedTeamForLegacyUtlRoster(db, { roster, actorUserId: ctx.user.id });
        }
        if (repairRosters.size > 0) {
          teams = await loadTeams();
        }
        if (teams.length === 0) continue;
        const teamIds = teams.map(({ team }) => team.id);
        const assignments = await db
          .select({ assignment: iersShiftRoleAssignments, providerName: users.name, providerEmail: users.email, departmentName: facilityDepartments.departmentName })
          .from(iersShiftRoleAssignments)
          .leftJoin(users, eq(users.id, iersShiftRoleAssignments.providerUserId))
          .leftJoin(facilityDepartments, eq(facilityDepartments.id, iersShiftRoleAssignments.departmentId))
          .where(and(
            inArray(iersShiftRoleAssignments.teamId, teamIds),
            inArray(iersShiftRoleAssignments.assignmentStatus, ["proposed", "approved", "pending_acceptance", "accepted", "declined"]),
          ));
        const recommendations = await db
          .select()
          .from(iersShiftRoleRecommendations)
          .where(and(inArray(iersShiftRoleRecommendations.teamId, teamIds), eq(iersShiftRoleRecommendations.status, "pending")));
        for (const { team, poleName } of teams) {
          const teamAssignments = assignments.filter(({ assignment }) => assignment.teamId === team.id);
          result.push({
            teamId: team.id,
            institutionId: team.institutionId,
            poleId: team.poleId,
            poleName,
            shiftDate: team.shiftDate,
            shiftType: team.shiftType,
            shiftStartTime: team.shiftStartTime,
            shiftEndTime: team.shiftEndTime,
            shiftEndDayOffset: team.shiftEndDayOffset,
            teamVersion: team.teamVersion,
                          teamStatus: team.status,
              teamState: classifyShiftInterval(team, new Date(), "Africa/Nairobi"),
            assignments: teamAssignments.map(({ assignment, providerName, providerEmail, departmentName }) => ({
              id: assignment.id,
              providerUserId: assignment.providerUserId,
              providerName: providerName ?? providerEmail ?? "Provider",
              departmentName: departmentName ?? null,
              institutionId: assignment.institutionId,
              poleId: assignment.poleId,
              departmentId: assignment.departmentId,
              shiftUtlRosterId: assignment.shiftUtlRosterId,
              roleScope: assignment.roleScope,
              roleKey: assignment.roleKey,
              assignmentStatus: assignment.assignmentStatus,
              acceptedAt: assignment.acceptedAt,
              declinedAt: assignment.declinedAt,
              declineReason: assignment.declineReason,
              isCurrentUser: assignment.providerUserId === ctx.user.id,
              recommendations: recommendations.filter((recommendation) => recommendation.assignmentId === assignment.id),
            })),
          });
        }
      }
      result.sort((left, right) => {
        const leftWeight = currentShiftSortWeight(left.teamState);
        const rightWeight = currentShiftSortWeight(right.teamState);
        if (leftWeight !== rightWeight) return leftWeight - rightWeight;
        const byStart = shiftSortKey(left).localeCompare(shiftSortKey(right));
        if (byStart !== 0) return byStart;
        return left.teamId - right.teamId;
      });
      return result;
      } catch (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
    }),

  /** Assigned provider accepts or declines a dated UTL, ERTL, or ERT-member role. */
  respondToRole: protectedProcedure
    .input(z.object({ assignmentId: z.number().int().positive(), decision: z.enum(["accepted", "declined"]), reason: z.string().trim().min(3).max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [row] = await db
        .select({ assignment: iersShiftRoleAssignments, team: iersShiftTeams })
        .from(iersShiftRoleAssignments)
        .innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleAssignments.teamId))
        .where(and(eq(iersShiftRoleAssignments.id, input.assignmentId), eq(iersShiftRoleAssignments.providerUserId, ctx.user.id)))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Assigned shift role not found." });
      if (row.assignment.roleScope === "utl") {
        // UTL is a dated operational duty for any eligible linked Staff/RN provider;
        // standing IERS product roles govern coordination/reviewer operations, not acceptance of this assignment.
        await requireActiveMembership(db, ctx.user, row.assignment.institutionId);
      } else {
        // Dated ERTL and ERT-member assignments are explicit team duties;
        // active institutional membership is sufficient to accept or decline.
        await requireActiveMembership(db, ctx.user, row.assignment.institutionId);
      }
      if (!["pending_acceptance", "approved"].includes(row.assignment.assignmentStatus)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This role is not awaiting your response." });
      }
      if (input.decision === "declined" && !input.reason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A reason is required when declining a shift role." });
      }
      const nextStatus = input.decision as ShiftRoleAssignmentStatus;
      assertShiftRoleTransition(row.assignment.assignmentStatus as ShiftRoleAssignmentStatus, nextStatus);
      const now = new Date();
      await db.update(iersShiftRoleAssignments).set({
        assignmentStatus: nextStatus,
        acceptedAt: input.decision === "accepted" ? now : null,
        declinedAt: input.decision === "declined" ? now : null,
        declineReason: input.decision === "declined" ? input.reason ?? null : null,
      }).where(eq(iersShiftRoleAssignments.id, row.assignment.id));
      if (row.assignment.roleScope === "utl") {
        await projectShiftRoleDecisionToLegacyUtlRoster(db, {
          assignment: row.assignment,
          team: row.team,
          actorUserId: ctx.user.id,
          decision: input.decision,
          reason: input.reason ?? null,
        });
        if (input.decision === "accepted") {
          const [ertlAssignment] = await db.select().from(iersShiftRoleAssignments).where(and(
            eq(iersShiftRoleAssignments.teamId, row.team.id),
            eq(iersShiftRoleAssignments.providerUserId, row.assignment.providerUserId),
            eq(iersShiftRoleAssignments.roleScope, "ertl"),
            eq(iersShiftRoleAssignments.assignmentStatus, "pending_acceptance"),
          )).limit(1);
          if (ertlAssignment) {
            await requestErtlAcceptance(db, {
              assignmentId: ertlAssignment.id,
              team: row.team,
              institutionId: row.team.institutionId,
              providerUserId: ertlAssignment.providerUserId,
              actorUserId: ctx.user.id,
              reason: "The exact dated leading-department UTL accepted; the separate Scene Commander duty now awaits provider acceptance.",
            });
          }
        }
      }
      await recordRoleEvent(db, {
        assignmentId: row.assignment.id,
        teamId: row.team.id,
        institutionId: row.assignment.institutionId,
        actorUserId: ctx.user.id,
        eventType: input.decision === "accepted" ? "role_accepted" : "role_declined",
        fromStatus: row.assignment.assignmentStatus,
        toStatus: nextStatus,
        fromRoleKey: row.assignment.roleKey,
        toRoleKey: row.assignment.roleKey,
        reason: input.reason ?? null,
      });
      if (input.decision === "declined" && row.assignment.roleScope === "utl" && row.assignment.departmentId) {
        await notifyDepartmentErco(
          db,
          row.assignment.institutionId,
          row.assignment.departmentId,
          "UTL duty declined — replacement required",
          `The assigned UTL declined the ${row.team.shiftType} duty on ${row.team.shiftDate.toISOString().slice(0, 10)}. Confirm a replacement before the shift. Reason: ${input.reason}`,
          row.assignment.id,
        );
      }
      return { success: true, assignmentStatus: nextStatus };
    }),

  /** An accepted/pending ERT member recommends a different operational role. */
  recommendRole: protectedProcedure
    .input(z.object({ assignmentId: z.number().int().positive(), requestedRoleKey: z.string().trim().min(2).max(64), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [assignment] = await db.select().from(iersShiftRoleAssignments).where(and(eq(iersShiftRoleAssignments.id, input.assignmentId), eq(iersShiftRoleAssignments.providerUserId, ctx.user.id))).limit(1);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assigned ERT role not found." });
      await requireActiveMembership(db, ctx.user, assignment.institutionId);
      const requestedRoleKey = normalizeRoleKey(input.requestedRoleKey);
      if (assignment.roleScope !== "ert_member" || !ERT_MEMBER_ROLES.has(requestedRoleKey)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a supported ERT member role." });
      if (!["pending_acceptance", "accepted"].includes(assignment.assignmentStatus)) throw new TRPCError({ code: "BAD_REQUEST", message: "Only an active or awaiting ERT member role can be changed." });
      const team = await requireTeam(db, assignment.teamId);
      const [ertl] = await db.select({ providerUserId: iersShiftRoleAssignments.providerUserId }).from(iersShiftRoleAssignments).where(and(eq(iersShiftRoleAssignments.teamId, team.id), eq(iersShiftRoleAssignments.roleScope, "ertl"), eq(iersShiftRoleAssignments.assignmentStatus, "accepted"))).limit(1);
      if (!ertl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An accepted ERTL must exist before role changes can be proposed." });
      await db.insert(iersShiftRoleRecommendations).values({ assignmentId: assignment.id, teamId: team.id, institutionId: assignment.institutionId, requestedByUserId: ctx.user.id, requestedRoleKey, reason: input.reason, status: "pending" });
      const [createdRecommendation] = await db.select({ id: iersShiftRoleRecommendations.id }).from(iersShiftRoleRecommendations).where(and(
        eq(iersShiftRoleRecommendations.assignmentId, assignment.id),
        eq(iersShiftRoleRecommendations.teamId, team.id),
        eq(iersShiftRoleRecommendations.institutionId, assignment.institutionId),
        eq(iersShiftRoleRecommendations.requestedByUserId, ctx.user.id),
        eq(iersShiftRoleRecommendations.requestedRoleKey, requestedRoleKey),
        eq(iersShiftRoleRecommendations.status, "pending"),
      )).orderBy(desc(iersShiftRoleRecommendations.id)).limit(1);
      if (!createdRecommendation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The ERT role recommendation could not be confirmed." });
      await notifyUser(db, ertl.providerUserId, "ERT role recommendation needs review", `A team member recommends ${requestedRoleKey.replaceAll("_", " ")}. Review and approve or decline the change.`, createdRecommendation.id, "/home");
      return { success: true, recommendationId: createdRecommendation.id };
    }),

  /** Accepted ERTL approves or declines a member recommendation. */
  decideRoleRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.number().int().positive(), decision: z.enum(["approved", "declined"]), note: z.string().trim().min(3).max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [row] = await db
        .select({ recommendation: iersShiftRoleRecommendations, assignment: iersShiftRoleAssignments, team: iersShiftTeams })
        .from(iersShiftRoleRecommendations)
        .innerJoin(iersShiftRoleAssignments, eq(iersShiftRoleAssignments.id, iersShiftRoleRecommendations.assignmentId))
        .innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleRecommendations.teamId))
        .where(eq(iersShiftRoleRecommendations.id, input.recommendationId))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Role recommendation not found." });
      await requireErtlForTeam(db, ctx.user, row.team.id);
      if (row.recommendation.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "This role recommendation has already been decided." });
      const now = new Date();
      await db.update(iersShiftRoleRecommendations).set({ status: input.decision, decidedByUserId: ctx.user.id, decisionNote: input.note ?? null, decidedAt: now }).where(eq(iersShiftRoleRecommendations.id, row.recommendation.id));
      if (input.decision === "declined") {
        await notifyUser(db, row.assignment.providerUserId, "ERT role recommendation declined", `The ERTL declined your proposed role change.${input.note ? ` Note: ${input.note}` : ""}`, row.assignment.id, "/home");
        return { success: true, status: "declined" as const };
      }
      const fromStatus = row.assignment.assignmentStatus as ShiftRoleAssignmentStatus;
      assertShiftRoleTransition(fromStatus, "pending_acceptance");
      await db.update(iersShiftRoleAssignments).set({ roleKey: row.recommendation.requestedRoleKey, assignmentStatus: "pending_acceptance", assignmentVersion: row.assignment.assignmentVersion + 1, acceptedAt: null, declinedAt: null, declineReason: null }).where(eq(iersShiftRoleAssignments.id, row.assignment.id));
      await recordRoleEvent(db, { assignmentId: row.assignment.id, teamId: row.team.id, institutionId: row.assignment.institutionId, actorUserId: ctx.user.id, eventType: "role_recommendation_approved", fromStatus, toStatus: "pending_acceptance", fromRoleKey: row.assignment.roleKey, toRoleKey: row.recommendation.requestedRoleKey, reason: input.note ?? row.recommendation.reason });
      await notifyUser(db, row.assignment.providerUserId, "ERT role changed — acceptance required", `The ERTL approved your requested role change to ${row.recommendation.requestedRoleKey.replaceAll("_", " ")}. Accept or decline the new role.`, row.assignment.id, "/home");
      return { success: true, status: "approved" as const };
    }),

  /** Accepted ERTL lists eligible active linked Staff/RN providers in the team pole who are not already assigned to this team. */
  listErtMemberCandidates: protectedProcedure
    .input(z.object({ teamId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { team } = await requireErtlForTeam(db, ctx.user, input.teamId);
      const existing = await db.select({ providerUserId: iersShiftRoleAssignments.providerUserId }).from(iersShiftRoleAssignments).where(and(
        eq(iersShiftRoleAssignments.teamId, team.id),
        inArray(iersShiftRoleAssignments.assignmentStatus, ["proposed", "approved", "pending_acceptance", "accepted"]),
      ));
      const assignedProviderIds = new Set(existing.map((row) => row.providerUserId));
      const candidates = await db.select({
        providerUserId: users.id,
        providerName: users.name,
        providerEmail: users.email,
        providerType: users.providerType,
        cadre: users.cadre,
        cadreOther: users.cadreOther,
        staffRole: institutionalStaffMembers.staffRole,
        departmentId: institutionalStaffMembers.facilityDepartmentId,
        departmentName: facilityDepartments.departmentName,
      }).from(users)
        .innerJoin(institutionalStaffMembers, and(
          eq(institutionalStaffMembers.userId, users.id),
          eq(institutionalStaffMembers.institutionalAccountId, team.institutionId),
          eq(institutionalStaffMembers.facilityLinkStatus, "linked"),
          isNull(institutionalStaffMembers.removedAt),
        ))
        .innerJoin(institutionMemberships, and(
          eq(institutionMemberships.userId, users.id),
          eq(institutionMemberships.institutionalAccountId, team.institutionId),
          eq(institutionMemberships.membershipStatus, "active"),
        ))
        .innerJoin(facilityDepartments, and(
          eq(facilityDepartments.id, institutionalStaffMembers.facilityDepartmentId),
          eq(facilityDepartments.institutionId, team.institutionId),
          eq(facilityDepartments.poleId, team.poleId),
          eq(facilityDepartments.isActive, true),
        ));
      return candidates
        .filter((candidate) => !assignedProviderIds.has(candidate.providerUserId) && isRegisteredRnProfile(candidate))
        .map((candidate) => ({
          providerUserId: candidate.providerUserId,
          providerName: candidate.providerName ?? candidate.providerEmail ?? "Provider",
          departmentId: candidate.departmentId,
          departmentName: candidate.departmentName,
        }))
        .sort((left, right) => left.providerName.localeCompare(right.providerName));
    }),

  /** Accepted ERTL nominates an eligible provider as a new ERT member; the provider must accept or decline. */
  nominateMemberRole: protectedProcedure
    .input(z.object({ teamId: z.number().int().positive(), providerUserId: z.number().int().positive(), roleKey: z.string().trim().min(2).max(64), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { team } = await requireErtlForTeam(db, ctx.user, input.teamId);
      const roleKey = normalizeRoleKey(input.roleKey);
      if (!ERT_MEMBER_ROLES.has(roleKey)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a supported ERT member role." });
      const [provider] = await db.select({
        userId: users.id,
        providerName: users.name,
        providerEmail: users.email,
        providerType: users.providerType,
        cadre: users.cadre,
        cadreOther: users.cadreOther,
        staffRole: institutionalStaffMembers.staffRole,
        departmentId: institutionalStaffMembers.facilityDepartmentId,
        departmentName: facilityDepartments.departmentName,
        poleId: facilityDepartments.poleId,
      }).from(users)
        .innerJoin(institutionalStaffMembers, and(
          eq(institutionalStaffMembers.userId, users.id),
          eq(institutionalStaffMembers.institutionalAccountId, team.institutionId),
          eq(institutionalStaffMembers.facilityLinkStatus, "linked"),
          isNull(institutionalStaffMembers.removedAt),
        ))
        .innerJoin(institutionMemberships, and(
          eq(institutionMemberships.userId, users.id),
          eq(institutionMemberships.institutionalAccountId, team.institutionId),
          eq(institutionMemberships.membershipStatus, "active"),
        ))
        .innerJoin(facilityDepartments, and(
          eq(facilityDepartments.id, institutionalStaffMembers.facilityDepartmentId),
          eq(facilityDepartments.institutionId, team.institutionId),
          eq(facilityDepartments.isActive, true),
        ))
        .where(eq(users.id, input.providerUserId))
        .limit(1);
      if (!provider || !isRegisteredRnProfile(provider)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active linked Staff/RN provider from this institution." });
      if (provider.poleId !== team.poleId) throw new TRPCError({ code: "FORBIDDEN", message: "The provider is outside this team’s pole scope." });
      const [alreadyAssigned] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).where(and(
        eq(iersShiftRoleAssignments.teamId, team.id),
        eq(iersShiftRoleAssignments.providerUserId, input.providerUserId),
        inArray(iersShiftRoleAssignments.assignmentStatus, ["proposed", "approved", "pending_acceptance", "accepted"]),
      )).limit(1);
      if (alreadyAssigned) throw new TRPCError({ code: "CONFLICT", message: "This provider is already assigned to the selected ERT." });
      const [roleCollision] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).where(and(
        eq(iersShiftRoleAssignments.teamId, team.id),
        eq(iersShiftRoleAssignments.roleScope, "ert_member"),
        eq(iersShiftRoleAssignments.roleKey, roleKey),
        inArray(iersShiftRoleAssignments.assignmentStatus, ["proposed", "approved", "pending_acceptance", "accepted"]),
      )).limit(1);
      if (roleCollision) throw new TRPCError({ code: "CONFLICT", message: "That ERT member role is already assigned for this shift." });
      await db.insert(iersShiftRoleAssignments).values({
        teamId: team.id,
        institutionId: team.institutionId,
        poleId: team.poleId,
        departmentId: provider.departmentId,
        providerUserId: input.providerUserId,
        shiftUtlRosterId: null,
        roleScope: "ert_member",
        roleKey,
        assignmentStatus: "pending_acceptance",
        proposedByUserId: ctx.user.id,
      });
      const [createdAssignment] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).where(and(
        eq(iersShiftRoleAssignments.teamId, team.id),
        eq(iersShiftRoleAssignments.institutionId, team.institutionId),
        eq(iersShiftRoleAssignments.providerUserId, input.providerUserId),
        eq(iersShiftRoleAssignments.roleScope, "ert_member"),
        eq(iersShiftRoleAssignments.roleKey, roleKey),
        eq(iersShiftRoleAssignments.assignmentStatus, "pending_acceptance"),
      )).orderBy(desc(iersShiftRoleAssignments.id)).limit(1);
      if (!createdAssignment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ERT member assignment could not be confirmed." });
      const assignmentId = createdAssignment.id;
      await recordRoleEvent(db, {
        assignmentId,
        teamId: team.id,
        institutionId: team.institutionId,
        actorUserId: ctx.user.id,
        eventType: "role_assigned_by_ertl",
        fromStatus: "proposed",
        toStatus: "pending_acceptance",
        fromRoleKey: null,
        toRoleKey: roleKey,
        reason: input.reason,
      });
      await notifyUser(db, input.providerUserId, "ERT member role assigned — acceptance required", `The ERTL assigned you ${roleKey.replaceAll("_", " ")}. Accept or decline the dated responsibility.`, assignmentId, "/home");
      return { success: true, assignmentId, status: "pending_acceptance" as const };
    }),

  /** Accepted ERTL assigns an operational role to an existing ERT member. */
  assignMemberRole: protectedProcedure
    .input(z.object({ teamId: z.number().int().positive(), assignmentId: z.number().int().positive(), roleKey: z.string().trim().min(2).max(64), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const { team } = await requireErtlForTeam(db, ctx.user, input.teamId);
      const roleKey = normalizeRoleKey(input.roleKey);
      if (!ERT_MEMBER_ROLES.has(roleKey)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a supported ERT member role." });
      const [assignment] = await db.select().from(iersShiftRoleAssignments).where(and(eq(iersShiftRoleAssignments.id, input.assignmentId), eq(iersShiftRoleAssignments.teamId, team.id))).limit(1);
      if (!assignment || assignment.roleScope !== "ert_member") throw new TRPCError({ code: "NOT_FOUND", message: "ERT member assignment not found." });
      if (!["pending_acceptance", "accepted"].includes(assignment.assignmentStatus)) throw new TRPCError({ code: "BAD_REQUEST", message: "Only an active or awaiting ERT member role can be reassigned." });
      if (assignment.roleKey === roleKey) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a different ERT member role." });
      const [collision] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).where(and(
        eq(iersShiftRoleAssignments.teamId, team.id),
        eq(iersShiftRoleAssignments.roleScope, "ert_member"),
        eq(iersShiftRoleAssignments.roleKey, roleKey),
        inArray(iersShiftRoleAssignments.assignmentStatus, ["pending_acceptance", "accepted"]),
      )).limit(1);
      if (collision) throw new TRPCError({ code: "CONFLICT", message: "That ERT member role is already assigned for this shift." });
      await db.update(iersShiftRoleAssignments).set({
        roleKey,
        assignmentStatus: "pending_acceptance",
        assignmentVersion: assignment.assignmentVersion + 1,
        acceptedAt: null,
        declinedAt: null,
        declineReason: null,
      }).where(eq(iersShiftRoleAssignments.id, assignment.id));
      await recordRoleEvent(db, {
        assignmentId: assignment.id,
        teamId: team.id,
        institutionId: assignment.institutionId,
        actorUserId: ctx.user.id,
        eventType: "role_assigned_by_ertl",
        fromStatus: assignment.assignmentStatus,
        toStatus: "pending_acceptance",
        fromRoleKey: assignment.roleKey,
        toRoleKey: roleKey,
        reason: input.reason,
      });
      await notifyUser(db, assignment.providerUserId, "ERT role assigned — acceptance required", `The ERTL assigned you ${roleKey.replaceAll("_", " ")}. Accept or decline the new role.`, assignment.id, "/home");
      return { success: true, status: "pending_acceptance" as const };
    }),

  /** Accepted ERTL can switch operational roles between two ERT members. */
  switchMemberRoles: protectedProcedure
    .input(z.object({ firstAssignmentId: z.number().int().positive(), secondAssignmentId: z.number().int().positive(), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      if (input.firstAssignmentId === input.secondAssignmentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose two different ERT members." });
      const rows = await db.select().from(iersShiftRoleAssignments).where(inArray(iersShiftRoleAssignments.id, [input.firstAssignmentId, input.secondAssignmentId]));
      if (rows.length !== 2 || rows.some((row) => row.roleScope !== "ert_member")) throw new TRPCError({ code: "BAD_REQUEST", message: "Only ERT member roles can be switched here." });
      if (rows[0].teamId !== rows[1].teamId) throw new TRPCError({ code: "BAD_REQUEST", message: "Both roles must belong to the same shift team." });
      const { team } = await requireErtlForTeam(db, ctx.user, rows[0].teamId);
      for (const row of rows) {
        if (!["pending_acceptance", "accepted"].includes(row.assignmentStatus)) throw new TRPCError({ code: "BAD_REQUEST", message: "Both roles must be active or awaiting acceptance." });
      }
      const [first, second] = rows[0].id === input.firstAssignmentId ? rows : [rows[1], rows[0]];
      const now = new Date();
      for (const [row, newRoleKey] of [[first, second.roleKey], [second, first.roleKey]] as const) {
        assertShiftRoleTransition(row.assignmentStatus as ShiftRoleAssignmentStatus, "pending_acceptance");
        await db.update(iersShiftRoleAssignments).set({ roleKey: newRoleKey, assignmentStatus: "pending_acceptance", assignmentVersion: row.assignmentVersion + 1, acceptedAt: null, declinedAt: null, declineReason: null }).where(eq(iersShiftRoleAssignments.id, row.id));
        await recordRoleEvent(db, { assignmentId: row.id, teamId: team.id, institutionId: row.institutionId, actorUserId: ctx.user.id, eventType: "role_switched_by_ertl", fromStatus: row.assignmentStatus, toStatus: "pending_acceptance", fromRoleKey: row.roleKey, toRoleKey: newRoleKey, reason: input.reason, metadata: { switchedAt: now.toISOString() } });
        await notifyUser(db, row.providerUserId, "ERT role switched — acceptance required", `The ERTL assigned you ${newRoleKey.replaceAll("_", " ")}. Accept or decline the new role.`, row.id, "/home");
      }
      return { success: true, status: "pending_acceptance" as const };
    }),
});

function normalizeRoleKey(value: string): string {
  return normalizeShiftRoleKey(value);
}
