import { and, eq } from "drizzle-orm";
import {
  ierpInternProfiles,
  ierpProgramEnrollments,
  institutionalStaffMembers,
  retrospectiveRoleClaims,
  trainingAttendance,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { isMissingTableError } from "./is-missing-db-table";

export const IERP_DESIGNATIONS = ["noi", "coi_bsc", "coi_diploma", "moi"] as const;
export type IerpDesignation = (typeof IERP_DESIGNATIONS)[number];

/** AHA cognitive programmes currently supported by the IERP evidence path. */
export const IERP_COGNITIVE_PROGRAMS = ["bls", "acls"] as const;

export function isIerpCognitiveProgram(value: string | null | undefined): value is (typeof IERP_COGNITIVE_PROGRAMS)[number] {
  return value != null && (IERP_COGNITIVE_PROGRAMS as readonly string[]).includes(value);
}

export function isIerpDesignation(value: string | null | undefined): value is IerpDesignation {
  return value != null && (IERP_DESIGNATIONS as readonly string[]).includes(value);
}

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

export async function getIerpInternProfile(db: IerpDb, userId: number) {
  try {
    const rows = await db
      .select()
      .from(ierpInternProfiles)
      .where(eq(ierpInternProfiles.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    if (isMissingTableError(error, "ierpInternProfiles")) return null;
    throw error;
  }
}

/** A submitted profile is enough to register; rejected/revoked profiles are fail-closed. */
export function isIerpInternProfileReady<T extends { status?: string | null }>(
  profile: T | null | undefined
): profile is T & { status: "pending" | "verified" } {
  return profile?.status === "pending" || profile?.status === "verified";
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

export const IERP_TOTAL_FEE_KES = 15_000;

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const IERP_DEFERRED_START_MONTH = 8;
const IERP_DEFERRED_END_MONTH = 11;

type IerpPaymentEnrollment = {
  enrolledAt: Date | null;
  effectiveCommencementDate?: Date | null;
  totalPaidAmount: string | number | null;
  effectiveFeeKes?: number | null;
  paymentStatus?: string | null;
};

function eastAfricaCalendar(date: Date) {
  const eatDate = new Date(date.getTime() + EAT_OFFSET_MS);
  return {
    year: eatDate.getUTCFullYear(),
    month: eatDate.getUTCMonth() + 1,
  };
}

function eastAfricaMidnight(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - EAT_OFFSET_MS);
}

/**
 * IERP payment/access contract:
 * - Learners who start in August, September, October, or November may access
 *   Phase 1 and Phase 2 before paying.
 * - From 1 December EAT, those learners need the full KES 15,000 paid before
 *   cognitive access or further Phase 2 progress.
 * - Learners who start in December through July need the full fee before any
 *   cognitive access.
 * - Full payment always unlocks the programme, regardless of start month.
 *
 * `now` is injectable so the month boundary is deterministic in tests.
 */
export function getIerpPaymentAccess(
  enrollment: IerpPaymentEnrollment,
  now: Date = new Date()
) {
  const requiredFeeKes = Math.max(0, Number(enrollment.effectiveFeeKes ?? IERP_TOTAL_FEE_KES));
  const paid = Math.max(0, Number(enrollment.totalPaidAmount ?? 0));
  const balance = Math.max(0, requiredFeeKes - paid);
  const isPaidInFull = enrollment.paymentStatus === "not_required" || paid >= requiredFeeKes;
  const paymentStartAt = enrollment.effectiveCommencementDate ?? enrollment.enrolledAt;
  const enrolledAt = paymentStartAt ? new Date(paymentStartAt) : null;
  const startCalendar = enrolledAt ? eastAfricaCalendar(enrolledAt) : null;
  const deferredStartWindow = !!startCalendar &&
    startCalendar.month >= IERP_DEFERRED_START_MONTH &&
    startCalendar.month <= IERP_DEFERRED_END_MONTH;
  const paymentDeadline = deferredStartWindow && startCalendar
    ? eastAfricaMidnight(startCalendar.year, 12, 1)
    : null;
  const paymentLockoutActive = !isPaidInFull && (
    !deferredStartWindow || !paymentDeadline || now.getTime() >= paymentDeadline.getTime()
  );

  return {
    paid,
    balance,
    requiredFeeKes,
    isPaidInFull,
    enrolledAt,
    deferredStartWindow,
    paymentDeadline,
    paymentLockoutActive,
    cognitiveAccessLocked: paymentLockoutActive,
    phase2BookingLocked: paymentLockoutActive,
  };
}

/** Resolve the standalone IERP record, falling back to the legacy linked intern record. */
export async function getIerpPaymentAccessForUser(db: IerpDb, userId: number) {
  const enrollment = await getIerpEnrollment(db, userId);
  const internProfile = await getIerpInternProfile(db, userId);
  if (enrollment) {
    return getIerpPaymentAccess({
      ...enrollment,
      effectiveCommencementDate: internProfile?.effectiveCommencementDate ?? null,
    });
  }

  const [staff] = await db
    .select({ designation: institutionalStaffMembers.designation, totalPaidAmount: institutionalStaffMembers.totalPaidAmount, enrollmentDate: institutionalStaffMembers.enrollmentDate, createdAt: institutionalStaffMembers.createdAt })
    .from(institutionalStaffMembers)
    .where(and(eq(institutionalStaffMembers.userId, userId), eq(institutionalStaffMembers.facilityLinkStatus, "linked")))
    .limit(1);
  if (!staff || !isIerpDesignation(staff.designation)) return null;
  return getIerpPaymentAccess({
    enrolledAt: staff.enrollmentDate ?? staff.createdAt,
    effectiveCommencementDate: internProfile?.effectiveCommencementDate ?? null,
    totalPaidAmount: String(staff.totalPaidAmount),
  });
}

/** @deprecated Use getIerpPaymentAccess; retained for callers on the old name. */
export function getIerpPaymentLockout(enrollment: IerpPaymentEnrollment) {
  return getIerpPaymentAccess(enrollment);
}
