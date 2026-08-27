import { and, eq } from "drizzle-orm";
import {
  ierpProgramEnrollments,
  retrospectiveRoleClaims,
  trainingAttendance,
} from "../../drizzle/schema";
import { getDb } from "../db";

export const IERP_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"] as const;
export type IerpDesignation = (typeof IERP_DESIGNATIONS)[number];

export const IERP_NAMED_TEAM_MEMBER_ROLES = [
  "team_member_airway_ventilation",
  "team_member_compressor_1",
  "team_member_compressor_2",
  "team_member_monitor_defib_cpr_coach",
  "team_member_iv_io_meds",
  "team_member_scribe",
] as const;

export const IERP_TEAM_LEADER_REQUIRED = 3;
export const IERP_TEAM_MEMBER_REQUIRED = 6;

export type IerpDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export async function getIerpEnrollment(db: IerpDb, userId: number) {
  const rows = await db
    .select()
    .from(ierpProgramEnrollments)
    .where(and(eq(ierpProgramEnrollments.userId, userId), eq(ierpProgramEnrollments.programKey, "ierp")))
    .limit(1);
  return rows[0] ?? null;
}

/** The deterministic named-role calculation used by every IERP Phase 2 gate. */
export function calculateAuthoritativePhase2Completion(confirmedRoles: Array<string | null | undefined>) {
  const teamLeaderCount = confirmedRoles.filter((role) => role === "team_leader").length;
  const teamMemberRoleCounts = Object.fromEntries(
    IERP_NAMED_TEAM_MEMBER_ROLES.map((role) => [role, confirmedRoles.filter((candidate) => candidate === role).length])
  ) as Record<(typeof IERP_NAMED_TEAM_MEMBER_ROLES)[number], number>;
  const teamMemberRolesCovered = IERP_NAMED_TEAM_MEMBER_ROLES.filter(
    (role) => teamMemberRoleCounts[role] > 0
  ).length;
  const teamMemberSessionsTotal = IERP_NAMED_TEAM_MEMBER_ROLES.reduce(
    (sum, role) => sum + teamMemberRoleCounts[role],
    0
  );
  const teamLeaderMet = teamLeaderCount >= IERP_TEAM_LEADER_REQUIRED;
  const teamMemberMet =
    teamMemberSessionsTotal >= IERP_TEAM_MEMBER_REQUIRED &&
    teamMemberRolesCovered >= IERP_NAMED_TEAM_MEMBER_ROLES.length;
  return {
    teamLeaderCount,
    teamLeaderRequired: IERP_TEAM_LEADER_REQUIRED,
    teamLeaderMet,
    teamMemberRoleCounts,
    teamMemberRolesCovered,
    teamMemberRolesRequired: IERP_NAMED_TEAM_MEMBER_ROLES.length,
    teamMemberSessionsTotal,
    teamMemberSessionsRequired: IERP_TEAM_MEMBER_REQUIRED,
    teamMemberMet,
    phase2Complete: teamLeaderMet && teamMemberMet,
  };
}

/**
 * The only Phase 2 completion calculation used by IERP. A confirmed booking
 * or an approved retrospective claim counts; generic legacy role labels do
 * not count toward the named-role requirement.
 */
export async function getAuthoritativePhase2CompletionStatus(db: IerpDb, userId: number) {
  const confirmedBookings = await db
    .select({ simulationRole: trainingAttendance.simulationRole })
    .from(trainingAttendance)
    .where(and(eq(trainingAttendance.staffMemberId, userId), eq(trainingAttendance.simulationCompetencyPassed, true)));

  const approvedClaims = await db
    .select({ role: retrospectiveRoleClaims.role })
    .from(retrospectiveRoleClaims)
    .where(and(eq(retrospectiveRoleClaims.claimantUserId, userId), eq(retrospectiveRoleClaims.status, "approved")));

  return calculateAuthoritativePhase2Completion([
    ...confirmedBookings.map((booking) => booking.simulationRole),
    ...approvedClaims.map((claim) => claim.role),
  ]);
}

export async function refreshIerpPhase2Status(db: IerpDb, userId: number) {
  const enrollment = await getIerpEnrollment(db, userId);
  if (!enrollment || enrollment.lifecycleStatus !== "active") return null;
  const phase2 = await getAuthoritativePhase2CompletionStatus(db, userId);
  if (!phase2.phase2Complete || enrollment.phaseStatus === "phase_3" || enrollment.phaseStatus === "completed") return phase2;
  await db.update(ierpProgramEnrollments).set({ phaseStatus: "phase_3", phase2CompletedAt: new Date(), updatedAt: new Date() }).where(eq(ierpProgramEnrollments.id, enrollment.id));
  return phase2;
}

export function getIerpPaymentLockout(enrollment: {
  enrolledAt: Date | null;
  totalPaidAmount: string | null;
}) {
  const paid = Number(enrollment.totalPaidAmount ?? 0);
  const joinedAt = enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : null;
  const FOUR_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 4;
  const paymentDeadline = joinedAt ? new Date(joinedAt.getTime() + FOUR_MONTHS_MS) : null;
  const paymentLockoutActive = !!paymentDeadline && paid <= 0 && Date.now() > paymentDeadline.getTime();
  return {
    paid,
    paymentDeadline,
    paymentLockoutActive,
  };
}
