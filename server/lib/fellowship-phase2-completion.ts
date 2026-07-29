/**
 * Fellowship Pillar A course-requirement check — CORRECTED per CEO
 * clarification (2026-07-29): Fellowship requires completion of Phase 2 of
 * each AHA course, not the full physical Phase 3 certification.
 *
 * The three phases of an AHA course on this platform (documented in
 * client/src/legal/terms-of-use.ts's Cohort Programme clause):
 *   Phase 1 — cognitive/online modules at paedsresus.com (enrollments.cognitiveModulesComplete)
 *   Gate    — AHA's own video prework + precourse assessment at elearning.heart.org
 *             (enrollments.ahaPrecourseCompleted)
 *   Phase 2 — online team simulation: everything that happens on the physical
 *             day except CPR. Minimum 3 sessions as team_member + 3 as
 *             team_leader, each independently instructor-signed-off
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

/** Minimum instructor-signed-off simulation sessions required per role, per course, for non-BLS courses. */
export const FELLOWSHIP_PHASE2_MIN_SESSIONS_PER_ROLE = 3;

export interface FellowshipEnrollmentInput {
  programType: string;
  cognitiveModulesComplete: boolean;
  ahaPrecourseCompleted: boolean;
}

export interface FellowshipSimulationAttendanceInput {
  /** courses.programType of the training this session belongs to */
  coursesProgramType: string;
  simulationRole: "team_member" | "team_leader" | null;
  simulationCompetencyPassed: boolean | null;
}

export interface FellowshipCoursePhase2Status {
  course: FellowshipRequiredCourse;
  /** Always true for bls (no Phase 2 component); for others, cognitive + AHA precourse + 3 team_member + 3 team_leader, each instructor-signed-off. */
  met: boolean;
  cognitiveComplete: boolean;
  ahaPrecourseComplete: boolean;
  /** N/A (always true) for bls */
  teamMemberSessionsPassed: number;
  teamLeaderSessionsPassed: number;
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
 * + 3 team_member + 3 team_leader instructor-signed-off sessions for the
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

    if (course === "bls") {
      // BLS Phase 2 is CPR, which isn't part of the online-simulation model —
      // cognitive completion alone satisfies Fellowship for BLS.
      return {
        course,
        met: cognitiveComplete,
        cognitiveComplete,
        ahaPrecourseComplete,
        teamMemberSessionsPassed: 0,
        teamLeaderSessionsPassed: 0,
      };
    }

    const passedSessionsForCourse = simulationAttendance.filter(
      (a) => a.coursesProgramType === course && a.simulationCompetencyPassed === true
    );
    const teamMemberSessionsPassed = passedSessionsForCourse.filter(
      (a) => a.simulationRole === "team_member"
    ).length;
    const teamLeaderSessionsPassed = passedSessionsForCourse.filter(
      (a) => a.simulationRole === "team_leader"
    ).length;

    const phase2Complete =
      teamMemberSessionsPassed >= FELLOWSHIP_PHASE2_MIN_SESSIONS_PER_ROLE &&
      teamLeaderSessionsPassed >= FELLOWSHIP_PHASE2_MIN_SESSIONS_PER_ROLE;

    return {
      course,
      met: cognitiveComplete && ahaPrecourseComplete && phase2Complete,
      cognitiveComplete,
      ahaPrecourseComplete,
      teamMemberSessionsPassed,
      teamLeaderSessionsPassed,
    };
  });

  return { courses, met: courses.every((c) => c.met) };
}
