/**
 * Fellowship Pillar A course-requirement check — CORRECTED per CEO
 * clarification (2026-07-29): Fellowship requires completion of Phase 2 of
 * each AHA course, not the full physical Phase 3 certification.
 *
 * CORRECTED AGAIN 2026-08-03 per docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.3
 * (spec dated 2026-07-31): the team-member requirement is NOT "any 6
 * sessions as team_member" — it's 1 session in EACH of the 6 named
 * team-member roles (Airway/Ventilation, Compressor 1, Compressor 2,
 * Monitor/Defib/CPR Coach, IV/IO Access and Meds, Scribe). Six sessions in
 * the same role would satisfy a naive count>=6 check but does NOT satisfy
 * the actual requirement — role coverage, not just volume. This replaces
 * the "3 team_member + 3 team_leader" rule entirely; team_leader stays at
 * 3, team_member is now 6-with-full-coverage. PR #381 already widened
 * FellowshipSimulationAttendanceInput's simulationRole type to include the
 * six named roles but left this file's counting logic unmatched against
 * them (see that PR's comment, now removed) — meaning any Phase 2 session
 * booked under the new role-based system couldn't count toward Fellowship
 * at all until this fix.
 *
 * The three phases of an AHA course on this platform (documented in
 * client/src/legal/terms-of-use.ts's Cohort Programme clause):
 *   Phase 1 — cognitive/online modules at paedsresus.com (enrollments.cognitiveModulesComplete)
 *   Gate    — AHA's own video prework + precourse assessment at elearning.heart.org
 *             (enrollments.ahaPrecourseCompleted)
 *   Phase 2 — online team simulation: everything that happens on the physical
 *             day except CPR. Minimum 3 sessions as team leader, plus 1
 *             session in each of the 6 named team-member roles (6 total,
 *             not just any 6) — each independently instructor-signed-off
 *             (trainingAttendance.simulationRole / simulationCompetencyPassed).
 *   Phase 3 — hands-on Megacode + final exam + full certification (physical).
 *             Required only for someone pursuing full AHA certification —
 *             NOT required for Fellowship.
 *
 * BLS is the one exception: it has no team-leader/team-member simulation
 * component (Phase 2 is "everything except CPR", and BLS is CPR) — so for
 * BLS, Phase 1 cognitive completion alone satisfies Fellowship.
 *
 * server/lib/fellowship-certification-floor.ts (checking the `certificates`
 * table for a full bls/acls/pals/nrp cert) checks Phase 3 completion, which
 * is the correct check for someone pursuing full AHA certification, but is
 * NOT the right check for Fellowship eligibility — it was never wired into
 * calculateCoursesPillar, so nothing live is currently wrong, but it should
 * not be used for Fellowship going forward. This module is the replacement
 * for Fellowship purposes specifically.
 */

export const FELLOWSHIP_REQUIRED_COURSES = ["bls", "acls", "pals", "nrp"] as const;
export type FellowshipRequiredCourse = (typeof FELLOWSHIP_REQUIRED_COURSES)[number];

/** The 6 named team-member roles a Fellow must cover at least once each (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.2/4.3). */
export const FELLOWSHIP_TEAM_MEMBER_ROLES = [
  "team_member_airway_ventilation",
  "team_member_compressor_1",
  "team_member_compressor_2",
  "team_member_monitor_defib_cpr_coach",
  "team_member_iv_io_meds",
  "team_member_scribe",
] as const;
export type FellowshipTeamMemberRole = (typeof FELLOWSHIP_TEAM_MEMBER_ROLES)[number];

/** Minimum instructor-signed-off sessions required as Team Leader, per course, for non-BLS courses. */
export const FELLOWSHIP_TEAM_LEADER_MIN_SESSIONS = 3;

export interface FellowshipEnrollmentInput {
  programType: string;
  cognitiveModulesComplete: boolean;
  ahaPrecourseCompleted: boolean;
  /**
   * Set by a lead_instructor for a learner who completed physical,
   * in-person training before the online Phase 2 simulation model existed
   * (North Star v2.1 addendum §6). A full override for this course — not a
   * partial waiver of just the simulation count — since grandfathered
   * learners typically have no digital trail for cognitive/precourse
   * completion either.
   */
  fellowshipGrandfathered?: boolean;
}

export interface FellowshipSimulationAttendanceInput {
  /** courses.programType of the training this session belongs to */
  coursesProgramType: string;
  /** Matches drizzle/schema.ts's simulationRoleEnum (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.2). */
  simulationRole:
    | "team_member"
    | "team_leader"
    | "team_member_airway_ventilation"
    | "team_member_compressor_1"
    | "team_member_compressor_2"
    | "team_member_monitor_defib_cpr_coach"
    | "team_member_iv_io_meds"
    | "team_member_scribe"
    | "observer"
    | null;
  simulationCompetencyPassed: boolean | null;
}

export interface FellowshipCoursePhase2Status {
  course: FellowshipRequiredCourse;
  /** Always true for bls (no Phase 2 component); for others, cognitive + AHA precourse + 3 team-leader sessions + all 6 named team-member roles covered. Also true if grandfathered. */
  met: boolean;
  cognitiveComplete: boolean;
  ahaPrecourseComplete: boolean;
  teamLeaderSessionsPassed: number;
  /** Which of the 6 named team-member roles have at least one instructor-signed-off session. */
  teamMemberRolesCovered: FellowshipTeamMemberRole[];
  grandfathered: boolean;
}

export interface FellowshipPillarACourseStatus {
  courses: FellowshipCoursePhase2Status[];
  /** All four required courses have met their Fellowship requirement. */
  met: boolean;
}

/**
 * Pure function. Given a user's enrollment rows (one per course they've
 * enrolled in) and their training-simulation attendance history, determines
 * whether each of the four required courses (bls, acls, pals, nrp) meets
 * its Fellowship requirement — Phase 1 only for bls, Phase 1 + AHA precourse
 * + 3 team-leader sessions + full 6-role team-member coverage for the
 * other three.
 */
export function getFellowshipPillarACourseStatus(
  enrollments: FellowshipEnrollmentInput[],
  simulationAttendance: FellowshipSimulationAttendanceInput[]
): FellowshipPillarACourseStatus {
  const courses = FELLOWSHIP_REQUIRED_COURSES.map((course): FellowshipCoursePhase2Status => {
    const enrollment = enrollments.find((e) => e.programType === course);
    const cognitiveComplete = enrollment?.cognitiveModulesComplete ?? false;
    const ahaPrecourseComplete = enrollment?.ahaPrecourseCompleted ?? false;
    const grandfathered = enrollment?.fellowshipGrandfathered ?? false;

    if (grandfathered) {
      return {
        course,
        met: true,
        cognitiveComplete,
        ahaPrecourseComplete,
        teamLeaderSessionsPassed: 0,
        teamMemberRolesCovered: [],
        grandfathered: true,
      };
    }

    if (course === "bls") {
      // BLS Phase 2 is CPR, which isn't part of the online-simulation model —
      // cognitive completion alone satisfies Fellowship for BLS.
      return {
        course,
        met: cognitiveComplete,
        cognitiveComplete,
        ahaPrecourseComplete,
        teamLeaderSessionsPassed: 0,
        teamMemberRolesCovered: [],
        grandfathered: false,
      };
    }

    const passedSessionsForCourse = simulationAttendance.filter(
      (a) => a.coursesProgramType === course && a.simulationCompetencyPassed === true
    );
    const teamLeaderSessionsPassed = passedSessionsForCourse.filter(
      (a) => a.simulationRole === "team_leader"
    ).length;
    const teamMemberRolesCovered = FELLOWSHIP_TEAM_MEMBER_ROLES.filter((role) =>
      passedSessionsForCourse.some((a) => a.simulationRole === role)
    );

    const phase2Complete =
      teamLeaderSessionsPassed >= FELLOWSHIP_TEAM_LEADER_MIN_SESSIONS &&
      teamMemberRolesCovered.length === FELLOWSHIP_TEAM_MEMBER_ROLES.length;

    return {
      course,
      met: cognitiveComplete && ahaPrecourseComplete && phase2Complete,
      cognitiveComplete,
      ahaPrecourseComplete,
      teamLeaderSessionsPassed,
      teamMemberRolesCovered,
      grandfathered: false,
    };
  });

  return { courses, met: courses.every((c) => c.met) };
}
