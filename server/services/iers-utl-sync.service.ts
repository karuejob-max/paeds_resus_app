import { and, desc, eq, inArray } from "drizzle-orm";
import {
  iersShiftRoleAssignments,
  iersShiftRoleEvents,
  iersShiftTeams,
  inAppNotifications,
  institutionDepartmentResponseCoordinators,
  shiftUtlRosters,
} from "../../drizzle/schema";
import type { DbClient } from "../db";
import { assertShiftRoleTransition, type ShiftRoleAssignmentStatus } from "../lib/iers-shift-role-state";

type DbExecutor = Pick<DbClient, "select" | "update" | "insert">;

type ShiftTeamIdentity = {
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
