import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import {
  ertlWeeklyRotations,
  facilityDepartments,
  iersShiftRoleAssignments,
  iersShiftRoleEvents,
  iersShiftTeams,
  inAppNotifications,
  institutionDepartmentResponseCoordinators,
  institutionMemberships,
  institutionalStaffMembers,
  shiftUtlRosters,
  users,
} from "../../drizzle/schema";
import type { DbClient } from "../db";
import { assertShiftRoleTransition, type ShiftRoleAssignmentStatus } from "../lib/iers-shift-role-state";
import { isRegisteredRnProfile } from "../lib/iers-provider-eligibility";

type DbExecutor = Pick<DbClient, "select" | "update" | "insert">;

export type ShiftTeamIdentity = {
  id: number;
  institutionId: number;
  poleId: number;
  shiftDate: Date;
  shiftType: "morning" | "evening" | "night";
  shiftStartTime: string;
  shiftEndTime: string;
  shiftEndDayOffset: number;
  status: "draft" | "published" | "active" | "closed" | "superseded";
};

type ShiftRoleIdentity = {
  id: number;
  teamId: number;
  institutionId: number;
  poleId: number;
  departmentId: number | null;
  providerUserId: number;
  shiftUtlRosterId: number | null;
  roleScope: "utl" | "ertl" | "ert_member";
  roleKey: string;
  assignmentStatus: ShiftRoleAssignmentStatus;
};

type LegacyUtlDecision = "accepted" | "declined";

function currentPublishedTeamStatus(team: ShiftTeamIdentity) {
  return team.status === "published" || team.status === "active";
}

export async function requestErtlAcceptance(
  db: DbExecutor,
  input: { assignmentId: number; team: ShiftTeamIdentity; institutionId: number; providerUserId: number; actorUserId: number; reason: string },
) {
  const [existingRequest] = await db
    .select({ id: iersShiftRoleEvents.id })
    .from(iersShiftRoleEvents)
    .where(and(
      eq(iersShiftRoleEvents.assignmentId, input.assignmentId),
      eq(iersShiftRoleEvents.eventType, "ertl_acceptance_requested"),
    ))
    .limit(1);
  if (existingRequest) return false;
  await db.insert(iersShiftRoleEvents).values({
    assignmentId: input.assignmentId,
    teamId: input.team.id,
    institutionId: input.institutionId,
    actorUserId: input.actorUserId,
    eventType: "ertl_acceptance_requested",
    fromStatus: "proposed",
    toStatus: "pending_acceptance",
    fromRoleKey: null,
    toRoleKey: "ertl",
    reason: input.reason,
  });
  await db.insert(inAppNotifications).values({
    userId: input.providerUserId,
    type: "iers_shift_team",
    title: "ERTL / Scene Commander acceptance required",
    body: `You are the Scene Commander for the ${input.team.shiftType} shift on ${input.team.shiftDate.toISOString().slice(0, 10)}. Accept this separate ERTL role before coordinating the dated ERT.`,
    actionUrl: "/my-shift?tab=team",
    relatedId: input.assignmentId,
    read: false,
  });
  return true;
}

async function recordProjectionEvent(
  db: DbExecutor,
  input: {
    assignment: ShiftRoleIdentity;
    actorUserId: number;
    decision: LegacyUtlDecision;
    reason?: string | null;
    rosterId: number;
  },
) {
  const nextStatus: ShiftRoleAssignmentStatus = input.decision === "accepted" ? "accepted" : "declined";
  await db.insert(iersShiftRoleEvents).values({
    assignmentId: input.assignment.id,
    teamId: input.assignment.teamId,
    institutionId: input.assignment.institutionId,
    actorUserId: input.actorUserId,
    eventType: input.decision === "accepted" ? "legacy_utl_roster_accepted" : "legacy_utl_roster_declined",
    fromStatus: input.assignment.assignmentStatus,
    toStatus: nextStatus,
    fromRoleKey: input.assignment.roleKey,
    toRoleKey: input.assignment.roleKey,
    reason: input.reason ?? null,
    metadata: JSON.stringify({ source: "institution.respondToShiftUtlRoster", rosterId: input.rosterId }),
  });
}

async function getLinkedRnProvider(
  db: DbExecutor,
  input: { institutionId: number; poleId: number; departmentId: number; providerUserId: number },
) {
  const [provider] = await db
    .select({
      userId: users.id,
      providerType: users.providerType,
      cadre: users.cadre,
      cadreOther: users.cadreOther,
      facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
      facilityLinkStatus: institutionalStaffMembers.facilityLinkStatus,
      removedAt: institutionalStaffMembers.removedAt,
      membershipStatus: institutionMemberships.membershipStatus,
      departmentPoleId: facilityDepartments.poleId,
    })
    .from(users)
    .innerJoin(institutionalStaffMembers, and(
      eq(institutionalStaffMembers.userId, users.id),
      eq(institutionalStaffMembers.institutionalAccountId, input.institutionId),
      eq(institutionalStaffMembers.facilityDepartmentId, input.departmentId),
    ))
    .innerJoin(institutionMemberships, and(
      eq(institutionMemberships.userId, users.id),
      eq(institutionMemberships.institutionalAccountId, input.institutionId),
      eq(institutionMemberships.membershipStatus, "active"),
    ))
    .innerJoin(facilityDepartments, and(
      eq(facilityDepartments.id, input.departmentId),
      eq(facilityDepartments.institutionId, input.institutionId),
      eq(facilityDepartments.poleId, input.poleId),
      eq(facilityDepartments.isActive, true),
    ))
    .where(and(
      eq(users.id, input.providerUserId),
      eq(institutionalStaffMembers.facilityLinkStatus, "linked"),
      isNull(institutionalStaffMembers.removedAt),
    ))
    .limit(1);
  return provider && isRegisteredRnProfile(provider) && provider.facilityDepartmentId === input.departmentId && provider.departmentPoleId === input.poleId
    ? provider
    : null;
}

/**
 * Materialize an explicitly assigned legacy UTL roster into the current versioned
 * ERT read model. This is a projection of an existing institution-authored duty,
 * not automatic staffing: the UTL remains pending until the provider accepts it.
 * Rows with the same pole/date/shift/exact interval are grouped into one team.
 * If no explicit leading-department UTL exists for the exact shift, the published
 * team is intentionally partial and the UI can show the missing governance assignment rather than hiding
 * an otherwise valid UTL duty and its crash-cart checklist.
 */
export async function ensurePublishedTeamForLegacyUtlRoster(
  db: DbExecutor,
  input: { roster: typeof shiftUtlRosters.$inferSelect; actorUserId: number },
) {
  const roster = input.roster;
  if (roster.status !== "active" || !["pending_acceptance", "active"].includes(roster.assignmentStatus)) {
    return { projected: false as const, reason: "roster_not_current" };
  }

  const relatedRosters = await db
    .select()
    .from(shiftUtlRosters)
    .where(and(
      eq(shiftUtlRosters.institutionId, roster.institutionId),
      eq(shiftUtlRosters.poleId, roster.poleId),
      eq(shiftUtlRosters.shiftDate, roster.shiftDate),
      eq(shiftUtlRosters.shiftType, roster.shiftType),
      eq(shiftUtlRosters.shiftStartTime, roster.shiftStartTime),
      eq(shiftUtlRosters.shiftEndTime, roster.shiftEndTime),
      eq(shiftUtlRosters.shiftEndDayOffset, roster.shiftEndDayOffset),
      eq(shiftUtlRosters.status, "active"),
      inArray(shiftUtlRosters.assignmentStatus, ["pending_acceptance", "active"]),
    ))
    .orderBy(asc(shiftUtlRosters.id));
  if (relatedRosters.length === 0) return { projected: false as const, reason: "no_current_roster_group" };
  const validRosters: typeof relatedRosters = [];
  for (const relatedRoster of relatedRosters) {
    const provider = await getLinkedRnProvider(db, {
      institutionId: relatedRoster.institutionId,
      poleId: relatedRoster.poleId,
      departmentId: relatedRoster.departmentId,
      providerUserId: relatedRoster.utlUserId,
    });
    if (provider) validRosters.push(relatedRoster);
  }
  if (validRosters.length === 0) return { projected: false as const, reason: "no_valid_linked_rn_roster" };

  const currentTeams = await db
    .select()
    .from(iersShiftTeams)
    .where(and(
      eq(iersShiftTeams.institutionId, roster.institutionId),
      eq(iersShiftTeams.poleId, roster.poleId),
      eq(iersShiftTeams.shiftDate, roster.shiftDate),
      eq(iersShiftTeams.shiftType, roster.shiftType),
      eq(iersShiftTeams.shiftStartTime, roster.shiftStartTime),
      eq(iersShiftTeams.shiftEndTime, roster.shiftEndTime),
      eq(iersShiftTeams.shiftEndDayOffset, roster.shiftEndDayOffset),
      inArray(iersShiftTeams.status, ["published", "active"]),
    ))
    .orderBy(desc(iersShiftTeams.teamVersion), desc(iersShiftTeams.id));
  if (currentTeams.length > 1) return { projected: false as const, reason: "ambiguous_current_team" };

  let team = currentTeams[0];
  let teamCreated = false;
  if (!team) {
    const allCurrentTeams = await db
      .select()
      .from(iersShiftTeams)
      .where(and(
        eq(iersShiftTeams.institutionId, roster.institutionId),
        eq(iersShiftTeams.poleId, roster.poleId),
        eq(iersShiftTeams.shiftDate, roster.shiftDate),
        eq(iersShiftTeams.shiftType, roster.shiftType),
        inArray(iersShiftTeams.status, ["published", "active"]),
      ));
    if (allCurrentTeams.length > 0) {
      const currentTeamIds = allCurrentTeams.map((currentTeam) => currentTeam.id);
      const linkedAssignments = await db
        .select({ teamId: iersShiftRoleAssignments.teamId })
        .from(iersShiftRoleAssignments)
        .where(and(
          inArray(iersShiftRoleAssignments.teamId, currentTeamIds),
          inArray(iersShiftRoleAssignments.shiftUtlRosterId, validRosters.map((row) => row.id)),
          eq(iersShiftRoleAssignments.roleScope, "utl"),
        ));
      const linkedTeamIds = new Set(linkedAssignments.map((assignment) => assignment.teamId));
      if (linkedTeamIds.size !== allCurrentTeams.length) return { projected: false as const, reason: "different_current_team_exists" };
      await db.update(iersShiftTeams).set({ status: "superseded", closedAt: new Date(), updatedAt: new Date() }).where(inArray(iersShiftTeams.id, [...linkedTeamIds]));
    }
    const [latest] = await db
      .select({ teamVersion: iersShiftTeams.teamVersion })
      .from(iersShiftTeams)
      .where(and(
        eq(iersShiftTeams.institutionId, roster.institutionId),
        eq(iersShiftTeams.poleId, roster.poleId),
        eq(iersShiftTeams.shiftDate, roster.shiftDate),
        eq(iersShiftTeams.shiftType, roster.shiftType),
      ))
      .orderBy(desc(iersShiftTeams.teamVersion), desc(iersShiftTeams.id))
      .limit(1);
    const [inserted] = await db.insert(iersShiftTeams).values({
      institutionId: roster.institutionId,
      poleId: roster.poleId,
      shiftDate: roster.shiftDate,
      shiftType: roster.shiftType,
      shiftStartTime: roster.shiftStartTime,
      shiftEndTime: roster.shiftEndTime,
      shiftEndDayOffset: roster.shiftEndDayOffset,
      teamVersion: (latest?.teamVersion ?? 0) + 1,
      status: "published",
      createdByUserId: input.actorUserId,
      publishedAt: new Date(),
    });
    const teamId = Number((inserted as unknown as { insertId: number }).insertId);
    const [created] = await db.select().from(iersShiftTeams).where(eq(iersShiftTeams.id, teamId)).limit(1);
    if (!created) return { projected: false as const, reason: "team_insert_not_readable" };
    team = created;
    teamCreated = true;
  }

  const assignments = await db
    .select()
    .from(iersShiftRoleAssignments)
    .where(eq(iersShiftRoleAssignments.teamId, team.id));
  const assignmentByRosterId = new Map<number, Map<string, typeof assignments[number]>>();
  for (const assignment of assignments) {
    if (assignment.shiftUtlRosterId == null) continue;
    const byScope = assignmentByRosterId.get(assignment.shiftUtlRosterId) ?? new Map<string, typeof assignments[number]>();
    if (byScope.has(assignment.roleScope)) return { projected: false as const, reason: "duplicate_roster_scope_assignment", teamId: team.id };
    byScope.set(assignment.roleScope, assignment);
    assignmentByRosterId.set(assignment.shiftUtlRosterId, byScope);
  }
  const assignedProviderIds = new Set(assignments.map((assignment) => assignment.providerUserId));
  let projectedAssignmentCount = 0;

  for (const relatedRoster of validRosters) {
    const existingAssignments = assignmentByRosterId.get(relatedRoster.id);
    const existingUtlAssignment = existingAssignments?.get("utl");
    if (existingUtlAssignment) {
      if (existingUtlAssignment.providerUserId !== relatedRoster.utlUserId) {
        return { projected: false as const, reason: "roster_assignment_provider_mismatch", teamId: team.id };
      }
    }
    if (assignedProviderIds.has(relatedRoster.utlUserId)) continue;

    const assignmentStatus: ShiftRoleAssignmentStatus = relatedRoster.assignmentStatus === "active" ? "accepted" : "pending_acceptance";
    const now = new Date();
    const [inserted] = await db.insert(iersShiftRoleAssignments).values({
      teamId: team.id,
      institutionId: relatedRoster.institutionId,
      poleId: relatedRoster.poleId,
      departmentId: relatedRoster.departmentId,
      providerUserId: relatedRoster.utlUserId,
      shiftUtlRosterId: relatedRoster.id,
      roleScope: "utl",
      roleKey: "utl",
      assignmentStatus,
      acceptedAt: assignmentStatus === "accepted" ? relatedRoster.acceptedAt ?? now : null,
      declinedAt: null,
      declineReason: null,
      proposedByUserId: input.actorUserId,
    });
    const assignmentId = Number((inserted as unknown as { insertId: number }).insertId);
    await db.insert(iersShiftRoleEvents).values({
      assignmentId,
      teamId: team.id,
      institutionId: relatedRoster.institutionId,
      actorUserId: input.actorUserId,
      eventType: "legacy_utl_roster_projected",
      fromStatus: "proposed",
      toStatus: assignmentStatus,
      fromRoleKey: null,
      toRoleKey: "utl",
      reason: "Projected from an explicit institution-authored dated UTL roster.",
      metadata: JSON.stringify({ source: "shiftUtlRosters", rosterId: relatedRoster.id, teamCreated }),
    });
    assignedProviderIds.add(relatedRoster.utlUserId);
    projectedAssignmentCount += 1;
  }

  const [rotation] = await db
    .select()
    .from(ertlWeeklyRotations)
    .where(and(
      eq(ertlWeeklyRotations.institutionId, roster.institutionId),
      eq(ertlWeeklyRotations.poleId, roster.poleId),
      lte(ertlWeeklyRotations.startDate, roster.shiftDate),
      gte(ertlWeeklyRotations.endDate, roster.shiftDate),
      inArray(ertlWeeklyRotations.assignmentStatus, ["unassigned", "pending_acceptance", "active", "declined"]),
    ))
    .orderBy(desc(ertlWeeklyRotations.startDate), desc(ertlWeeklyRotations.id))
    .limit(1);

  // The ERTL is never a separately selected provider. It is always the UTL
  // from the leading department for this exact pole/date/shift. The rotation
  // row supplies the department only; the roster supplies the provider.
  const designatedUtl = validRosters.find((row) => row.isShiftErtl === true || row.departmentId === rotation?.departmentId);
  const designatedErtlAlreadyExists = designatedUtl
    ? assignments.some((assignment) => assignment.roleScope === "ertl" && assignment.shiftUtlRosterId === designatedUtl.id && assignment.providerUserId === designatedUtl.utlUserId && ["pending_acceptance", "accepted"].includes(assignment.assignmentStatus))
    : false;

  // Policy: the UTL from the pole’s designated rotation department is the
  // Scene Commander/ERTL for this exact shift. This remains institution-authored
  // staffing; it does not invent a provider or assign anyone automatically.
  if (!designatedErtlAlreadyExists && designatedUtl) {
      const assignmentStatus: ShiftRoleAssignmentStatus = "pending_acceptance";
      const [inserted] = await db.insert(iersShiftRoleAssignments).values({
        teamId: team.id,
        institutionId: designatedUtl.institutionId,
        poleId: designatedUtl.poleId,
        departmentId: designatedUtl.departmentId,
        providerUserId: designatedUtl.utlUserId,
        shiftUtlRosterId: designatedUtl.id,
        roleScope: "ertl",
        roleKey: "ertl",
        assignmentStatus,
        acceptedAt: null,
        declinedAt: null,
        declineReason: null,
        proposedByUserId: input.actorUserId,
      });
      const assignmentId = Number((inserted as unknown as { insertId: number }).insertId);
      await db.insert(iersShiftRoleEvents).values({
        assignmentId,
        teamId: team.id,
        institutionId: designatedUtl.institutionId,
        actorUserId: input.actorUserId,
        eventType: "designated_utl_ertl_projected",
        fromStatus: "proposed",
        toStatus: assignmentStatus,
        fromRoleKey: null,
        toRoleKey: "ertl",
        reason: "The explicitly assigned UTL from the pole’s designated ERTL department is the Scene Commander for this dated shift; separate ERTL acceptance is required.",
        metadata: JSON.stringify({ source: "shiftUtlRosters.isShiftErtl", rosterId: designatedUtl.id }),
      });
      if (designatedUtl.assignmentStatus === "active") {
        await requestErtlAcceptance(db, { assignmentId, team, institutionId: designatedUtl.institutionId, providerUserId: designatedUtl.utlUserId, actorUserId: input.actorUserId, reason: "The leading-department UTL accepted the dated duty; the separate ERTL / Scene Commander role now requires acceptance." });
      }
      projectedAssignmentCount += 1;
    }
  return { projected: teamCreated || projectedAssignmentCount > 0, teamId: team.id, projectedAssignmentCount };
}

/**
 * Project a legacy UTL roster decision into exactly one current published/active
 * versioned shift-team UTL assignment. A missing, ambiguous, mismatched, or
 * historical team is intentionally a no-op: the legacy duty still completes, but
 * no unrelated team is changed and no hidden team is fabricated.
 */
export async function notifyDepartmentErcoOfUtlDecline(
  db: DbExecutor,
  input: { institutionId: number; departmentId: number; rosterId: number; shiftDate: Date; shiftType: string; reason?: string | null },
) {
  const [coordinator] = await db
    .select({ coordinatorUserId: institutionDepartmentResponseCoordinators.coordinatorUserId, backupUserId: institutionDepartmentResponseCoordinators.backupUserId })
    .from(institutionDepartmentResponseCoordinators)
    .where(and(
      eq(institutionDepartmentResponseCoordinators.institutionId, input.institutionId),
      eq(institutionDepartmentResponseCoordinators.departmentId, input.departmentId),
      eq(institutionDepartmentResponseCoordinators.assignmentStatus, "active"),
    ))
    .limit(1);
  if (!coordinator) return;
  const recipients = new Set([coordinator.coordinatorUserId, coordinator.backupUserId].filter((userId): userId is number => userId !== null));
  for (const userId of recipients) {
    await db.insert(inAppNotifications).values({
      userId,
      type: "iers_shift_team",
      title: "UTL duty declined — replacement required",
      body: `The assigned UTL declined the ${input.shiftType} duty on ${input.shiftDate.toISOString().slice(0, 10)}. Confirm a replacement before the shift. Reason: ${input.reason ?? "Not provided"}`,
      actionUrl: "/institution?section=iers&iersTab=workforce&workforceTab=roster",
      relatedId: input.rosterId,
      read: false,
    });
  }
}

export async function projectLegacyUtlRosterDecision(
  db: DbExecutor,
  input: {
    roster: typeof shiftUtlRosters.$inferSelect;
    actorUserId: number;
    decision: LegacyUtlDecision;
    reason?: string | null;
  },
) {
  const roster = input.roster;
  const candidateWhere = [
    eq(iersShiftRoleAssignments.institutionId, roster.institutionId),
    eq(iersShiftRoleAssignments.poleId, roster.poleId),
    eq(iersShiftRoleAssignments.departmentId, roster.departmentId),
    eq(iersShiftRoleAssignments.providerUserId, roster.utlUserId),
    eq(iersShiftRoleAssignments.roleScope, "utl"),
    inArray(iersShiftRoleAssignments.assignmentStatus, ["approved", "pending_acceptance"]),
    eq(iersShiftTeams.institutionId, roster.institutionId),
    eq(iersShiftTeams.poleId, roster.poleId),
    eq(iersShiftTeams.shiftDate, roster.shiftDate),
    eq(iersShiftTeams.shiftType, roster.shiftType),
    eq(iersShiftTeams.shiftStartTime, roster.shiftStartTime),
    eq(iersShiftTeams.shiftEndTime, roster.shiftEndTime),
    eq(iersShiftTeams.shiftEndDayOffset, roster.shiftEndDayOffset),
    inArray(iersShiftTeams.status, ["published", "active"]),
  ];

  const linkedWhere = roster.id
    ? [...candidateWhere, eq(iersShiftRoleAssignments.shiftUtlRosterId, roster.id)]
    : candidateWhere;
  const candidates = await db
    .select({ assignment: iersShiftRoleAssignments, team: iersShiftTeams })
    .from(iersShiftRoleAssignments)
    .innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleAssignments.teamId))
    .where(and(...linkedWhere))
    .orderBy(desc(iersShiftTeams.teamVersion), desc(iersShiftRoleAssignments.id))
    .limit(2);

  if (candidates.length !== 1) {
    return { projected: false as const, reason: candidates.length === 0 ? "no_current_exact_match" : "ambiguous_current_match" };
  }

  const row = candidates[0];
  const assignment = row.assignment as ShiftRoleIdentity;
  const team = row.team as ShiftTeamIdentity;
  if (
    assignment.roleScope !== "utl"
    || assignment.institutionId !== team.institutionId
    || assignment.poleId !== team.poleId
    || assignment.departmentId !== roster.departmentId
    || assignment.providerUserId !== roster.utlUserId
    || !currentPublishedTeamStatus(team)
  ) {
    return { projected: false as const, reason: "identity_mismatch" };
  }

  const nextStatus: ShiftRoleAssignmentStatus = input.decision === "accepted" ? "accepted" : "declined";
  assertShiftRoleTransition(assignment.assignmentStatus, nextStatus);
  const now = new Date();
  await db.update(iersShiftRoleAssignments).set({
    assignmentStatus: nextStatus,
    acceptedAt: input.decision === "accepted" ? now : null,
    declinedAt: input.decision === "declined" ? now : null,
    declineReason: input.decision === "declined" ? input.reason ?? null : null,
  }).where(eq(iersShiftRoleAssignments.id, assignment.id));
  await recordProjectionEvent(db, {
    assignment,
    actorUserId: input.actorUserId,
    decision: input.decision,
    reason: input.reason,
    rosterId: roster.id,
  });
  return { projected: true as const, assignmentId: assignment.id, teamId: team.id, assignmentStatus: nextStatus };
}

/**
 * Project a legacy roster reassignment into its linked current team assignment.
 * Pending/proposed/declined/expired assignments are reset in place. An already
 * accepted assignment is preserved as superseded and replaced with a new pending
 * assignment, keeping the historical acceptance auditable.
 */
export async function projectUtlRosterReassignment(
  db: DbExecutor,
  input: {
    roster: typeof shiftUtlRosters.$inferSelect;
    nextProviderUserId: number;
    nextShiftStartTime: string;
    nextShiftEndTime: string;
    nextShiftEndDayOffset: number;
    actorUserId: number;
  },
) {
  const [row] = await db
    .select({ assignment: iersShiftRoleAssignments, team: iersShiftTeams })
    .from(iersShiftRoleAssignments)
    .innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleAssignments.teamId))
    .where(and(
      eq(iersShiftRoleAssignments.shiftUtlRosterId, input.roster.id),
      eq(iersShiftRoleAssignments.roleScope, "utl"),
      eq(iersShiftRoleAssignments.institutionId, input.roster.institutionId),
      eq(iersShiftRoleAssignments.poleId, input.roster.poleId),
      eq(iersShiftRoleAssignments.departmentId, input.roster.departmentId),
      eq(iersShiftTeams.institutionId, input.roster.institutionId),
      eq(iersShiftTeams.poleId, input.roster.poleId),
      eq(iersShiftTeams.shiftDate, input.roster.shiftDate),
      eq(iersShiftTeams.shiftType, input.roster.shiftType),
      eq(iersShiftTeams.shiftStartTime, input.roster.shiftStartTime),
      eq(iersShiftTeams.shiftEndTime, input.roster.shiftEndTime),
      eq(iersShiftTeams.shiftEndDayOffset, input.roster.shiftEndDayOffset),
      inArray(iersShiftTeams.status, ["published", "active"]),
    ))
    .orderBy(desc(iersShiftTeams.teamVersion), desc(iersShiftRoleAssignments.id))
    .limit(2);
  if (!row) return { projected: false as const, reason: "no_current_exact_match" };

  const [second] = await db
    .select({ id: iersShiftRoleAssignments.id })
    .from(iersShiftRoleAssignments)
    .innerJoin(iersShiftTeams, eq(iersShiftTeams.id, iersShiftRoleAssignments.teamId))
    .where(and(
      eq(iersShiftRoleAssignments.shiftUtlRosterId, input.roster.id),
      eq(iersShiftRoleAssignments.roleScope, "utl"),
      inArray(iersShiftTeams.status, ["published", "active"]),
      eq(iersShiftTeams.shiftDate, input.roster.shiftDate),
      eq(iersShiftTeams.shiftType, input.roster.shiftType),
    ))
    .orderBy(desc(iersShiftTeams.teamVersion), desc(iersShiftRoleAssignments.id))
    .limit(2);
  if (second && second.id !== row.assignment.id) return { projected: false as const, reason: "ambiguous_current_match" };

  const changed = row.assignment.providerUserId !== input.nextProviderUserId
    || row.team.shiftStartTime !== input.nextShiftStartTime
    || row.team.shiftEndTime !== input.nextShiftEndTime
    || row.team.shiftEndDayOffset !== input.nextShiftEndDayOffset;
  if (!changed) return { projected: false as const, reason: "no_assignment_change" };

  const now = new Date();
  if (row.assignment.assignmentStatus === "accepted") {
    await db.update(iersShiftRoleAssignments).set({
      assignmentStatus: "superseded",
      supersededAt: now,
      updatedAt: now,
    }).where(eq(iersShiftRoleAssignments.id, row.assignment.id));
    await db.insert(iersShiftRoleEvents).values({
      assignmentId: row.assignment.id,
      teamId: row.team.id,
      institutionId: row.assignment.institutionId,
      actorUserId: input.actorUserId,
      eventType: "utl_reassignment_superseded",
      fromStatus: row.assignment.assignmentStatus,
      toStatus: "superseded",
      fromRoleKey: row.assignment.roleKey,
      toRoleKey: row.assignment.roleKey,
      reason: "Legacy UTL roster provider or exact interval changed.",
      metadata: JSON.stringify({ rosterId: input.roster.id, replacementProviderUserId: input.nextProviderUserId }),
    });
    const [inserted] = await db.insert(iersShiftRoleAssignments).values({
      teamId: row.team.id,
      institutionId: row.assignment.institutionId,
      poleId: row.assignment.poleId,
      departmentId: row.assignment.departmentId,
      providerUserId: input.nextProviderUserId,
      shiftUtlRosterId: input.roster.id,
      roleScope: "utl",
      roleKey: row.assignment.roleKey,
      assignmentStatus: "pending_acceptance",
      assignmentVersion: row.assignment.assignmentVersion + 1,
      proposedByUserId: input.actorUserId,
    });
    const assignmentId = Number((inserted as unknown as { insertId: number }).insertId);
    await db.insert(iersShiftRoleEvents).values({
      assignmentId,
      teamId: row.team.id,
      institutionId: row.assignment.institutionId,
      actorUserId: input.actorUserId,
      eventType: "utl_reassignment_published",
      fromStatus: "proposed",
      toStatus: "pending_acceptance",
      fromRoleKey: row.assignment.roleKey,
      toRoleKey: row.assignment.roleKey,
      metadata: JSON.stringify({ rosterId: input.roster.id, previousAssignmentId: row.assignment.id }),
    });
    return { projected: true as const, assignmentId, teamId: row.team.id, assignmentStatus: "pending_acceptance" as const };
  }

  assertShiftRoleTransition(row.assignment.assignmentStatus, "pending_acceptance");
  await db.update(iersShiftRoleAssignments).set({
    providerUserId: input.nextProviderUserId,
    assignmentStatus: "pending_acceptance",
    assignmentVersion: row.assignment.assignmentVersion + 1,
    acceptedAt: null,
    declinedAt: null,
    declineReason: null,
    approvedByUserId: null,
    supersededAt: null,
    endedAt: null,
    updatedAt: now,
  }).where(eq(iersShiftRoleAssignments.id, row.assignment.id));
  await db.insert(iersShiftRoleEvents).values({
    assignmentId: row.assignment.id,
    teamId: row.team.id,
    institutionId: row.assignment.institutionId,
    actorUserId: input.actorUserId,
    eventType: "utl_reassignment_published",
    fromStatus: row.assignment.assignmentStatus,
    toStatus: "pending_acceptance",
    fromRoleKey: row.assignment.roleKey,
    toRoleKey: row.assignment.roleKey,
    metadata: JSON.stringify({ rosterId: input.roster.id, replacementProviderUserId: input.nextProviderUserId }),
  });
  return { projected: true as const, assignmentId: row.assignment.id, teamId: row.team.id, assignmentStatus: "pending_acceptance" as const };
}

/**
 * Project a provider-owned versioned UTL decision into its linked legacy roster.
 * The roster is updated only when the explicit roster link and all shift identity
 * fields agree; a missing or mismatched link is a safe no-op.
 */
export async function projectShiftRoleDecisionToLegacyUtlRoster(
  db: DbExecutor,
  input: {
    assignment: ShiftRoleIdentity;
    team: ShiftTeamIdentity;
    actorUserId: number;
    decision: LegacyUtlDecision;
    reason?: string | null;
  },
) {
  const assignment = input.assignment;
  const team = input.team;
  if (assignment.roleScope !== "utl" || assignment.departmentId == null || assignment.shiftUtlRosterId == null || !currentPublishedTeamStatus(team)) {
    return { projected: false as const, reason: "not_a_current_linked_utl" };
  }

  const [roster] = await db
    .select()
    .from(shiftUtlRosters)
    .where(and(
      eq(shiftUtlRosters.id, assignment.shiftUtlRosterId),
      eq(shiftUtlRosters.institutionId, assignment.institutionId),
      eq(shiftUtlRosters.poleId, assignment.poleId),
      eq(shiftUtlRosters.departmentId, assignment.departmentId),
      eq(shiftUtlRosters.utlUserId, assignment.providerUserId),
      eq(shiftUtlRosters.shiftDate, team.shiftDate),
      eq(shiftUtlRosters.shiftType, team.shiftType),
      eq(shiftUtlRosters.shiftStartTime, team.shiftStartTime),
      eq(shiftUtlRosters.shiftEndTime, team.shiftEndTime),
      eq(shiftUtlRosters.shiftEndDayOffset, team.shiftEndDayOffset),
    ))
    .limit(1);
  if (!roster) return { projected: false as const, reason: "linked_roster_identity_mismatch" };

  const now = new Date();
  await db.update(shiftUtlRosters).set(
    input.decision === "accepted"
      ? { assignmentStatus: "active", acceptedAt: now, declinedAt: null, declineReason: null }
      : { assignmentStatus: "declined", acceptedAt: null, declinedAt: now, declineReason: input.reason ?? null, readinessSignOffAt: null, readinessSignedOffByUserId: null, readinessNote: null },
  ).where(eq(shiftUtlRosters.id, roster.id));
  return { projected: true as const, rosterId: roster.id, assignmentStatus: input.decision === "accepted" ? "active" as const : "declined" as const };
}
