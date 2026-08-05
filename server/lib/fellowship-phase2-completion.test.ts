import { describe, expect, it } from "vitest";
import { getFellowshipPillarACourseStatus, FELLOWSHIP_TEAM_MEMBER_ROLES } from "./fellowship-phase2-completion";

function enrollment(programType: string, cognitive: boolean, ahaPrecourse: boolean) {
  return { programType, cognitiveModulesComplete: cognitive, ahaPrecourseCompleted: ahaPrecourse };
}

function attendance(
  coursesProgramType: string,
  simulationRole: string,
  passed: boolean
) {
  return { coursesProgramType, simulationRole: simulationRole as any, simulationCompetencyPassed: passed };
}

/** 3 team_leader sessions + 1 session in each of the 6 named team-member roles, all passed. */
function fullSimSet(course: string) {
  return [
    ...Array.from({ length: 3 }, () => attendance(course, "team_leader", true)),
    ...FELLOWSHIP_TEAM_MEMBER_ROLES.map((role) => attendance(course, role, true)),
  ];
}

describe("getFellowshipPillarACourseStatus", () => {
  it("BLS is satisfied by cognitive completion alone -- no simulation requirement", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("bls", true, false)], // ahaPrecourseCompleted false -- shouldn't matter for BLS
      []
    );
    const bls = status.courses.find((c) => c.course === "bls")!;
    expect(bls.met).toBe(true);
  });

  it("BLS is not met if cognitive work isn't done, regardless of anything else", () => {
    const status = getFellowshipPillarACourseStatus([enrollment("bls", false, true)], []);
    const bls = status.courses.find((c) => c.course === "bls")!;
    expect(bls.met).toBe(false);
  });

  it("ACLS is met with cognitive + AHA precourse + 3 team-leader sessions + all 6 team-member roles covered", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("acls", true, true)],
      fullSimSet("acls")
    );
    const acls = status.courses.find((c) => c.course === "acls")!;
    expect(acls.met).toBe(true);
    expect(acls.teamLeaderSessionsPassed).toBe(3);
    expect(acls.teamMemberRolesCovered).toHaveLength(6);
  });

  it("ACLS is not met without the AHA precourse gate, even with full simulations", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("acls", true, false)],
      fullSimSet("acls")
    );
    const acls = status.courses.find((c) => c.course === "acls")!;
    expect(acls.met).toBe(false);
  });

  it("PALS is not met with only 2 team_leader sessions passed (needs 3)", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("pals", true, true)],
      [
        ...FELLOWSHIP_TEAM_MEMBER_ROLES.map((role) => attendance("pals", role, true)),
        ...Array.from({ length: 2 }, () => attendance("pals", "team_leader", true)),
      ]
    );
    const pals = status.courses.find((c) => c.course === "pals")!;
    expect(pals.met).toBe(false);
    expect(pals.teamLeaderSessionsPassed).toBe(2);
  });

  it("6 sessions in the SAME team-member role does NOT satisfy the requirement -- role coverage, not just volume", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("nrp", true, true)],
      [
        ...Array.from({ length: 3 }, () => attendance("nrp", "team_leader", true)),
        ...Array.from({ length: 6 }, () => attendance("nrp", "team_member_scribe", true)), // all scribe, 0 other roles
      ]
    );
    const nrp = status.courses.find((c) => c.course === "nrp")!;
    expect(nrp.teamMemberRolesCovered).toEqual(["team_member_scribe"]);
    expect(nrp.met).toBe(false);
  });

  it("missing exactly one of the 6 named roles means not met", () => {
    const rolesMinusOne = FELLOWSHIP_TEAM_MEMBER_ROLES.slice(0, 5);
    const status = getFellowshipPillarACourseStatus(
      [enrollment("nrp", true, true)],
      [
        ...Array.from({ length: 3 }, () => attendance("nrp", "team_leader", true)),
        ...rolesMinusOne.map((role) => attendance("nrp", role, true)),
      ]
    );
    const nrp = status.courses.find((c) => c.course === "nrp")!;
    expect(nrp.teamMemberRolesCovered).toHaveLength(5);
    expect(nrp.met).toBe(false);
  });

  it("does not count a session where the instructor did not sign off competency", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("nrp", true, true)],
      [
        ...FELLOWSHIP_TEAM_MEMBER_ROLES.map((role) => attendance("nrp", role, true)),
        ...Array.from({ length: 2 }, () => attendance("nrp", "team_leader", true)),
        attendance("nrp", "team_leader", false), // attended, not signed off -- doesn't count
      ]
    );
    const nrp = status.courses.find((c) => c.course === "nrp")!;
    expect(nrp.teamLeaderSessionsPassed).toBe(2);
    expect(nrp.met).toBe(false);
  });

  it("does not cross-count sessions from a different course", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("acls", true, true)],
      fullSimSet("pals") // all sessions are PALS, not ACLS
    );
    const acls = status.courses.find((c) => c.course === "acls")!;
    expect(acls.teamMemberRolesCovered).toHaveLength(0);
    expect(acls.teamLeaderSessionsPassed).toBe(0);
    expect(acls.met).toBe(false);
  });

  it("more than the minimum team-leader sessions still counts -- extra sessions don't break anything", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("acls", true, true)],
      [
        ...FELLOWSHIP_TEAM_MEMBER_ROLES.map((role) => attendance("acls", role, true)),
        ...Array.from({ length: 5 }, () => attendance("acls", "team_leader", true)),
      ]
    );
    const acls = status.courses.find((c) => c.course === "acls")!;
    expect(acls.met).toBe(true);
  });

  it("overall met is true only when all four required courses are individually met", () => {
    const status = getFellowshipPillarACourseStatus(
      [
        enrollment("bls", true, false),
        enrollment("acls", true, true),
        enrollment("pals", true, true),
        enrollment("nrp", true, true),
      ],
      [...fullSimSet("acls"), ...fullSimSet("pals")] // nrp missing its simulations
    );
    expect(status.met).toBe(false);
    const nrp = status.courses.find((c) => c.course === "nrp")!;
    expect(nrp.met).toBe(false);
  });

  it("a user with no enrollment row for a course simply hasn't met it", () => {
    const status = getFellowshipPillarACourseStatus([], []);
    expect(status.met).toBe(false);
    expect(status.courses.every((c) => !c.met)).toBe(true);
  });

  it("grandfathering overrides everything -- met true even with no cognitive, no precourse, no simulations", () => {
    const status = getFellowshipPillarACourseStatus(
      [{ programType: "acls", cognitiveModulesComplete: false, ahaPrecourseCompleted: false, fellowshipGrandfathered: true }],
      []
    );
    const acls = status.courses.find((c) => c.course === "acls")!;
    expect(acls.met).toBe(true);
    expect(acls.grandfathered).toBe(true);
  });

  it("grandfathering on one course does not grandfather the others", () => {
    const status = getFellowshipPillarACourseStatus(
      [
        { programType: "acls", cognitiveModulesComplete: false, ahaPrecourseCompleted: false, fellowshipGrandfathered: true },
        { programType: "pals", cognitiveModulesComplete: true, ahaPrecourseCompleted: true },
      ],
      []
    );
    expect(status.met).toBe(false); // pals still needs its simulations
    const pals = status.courses.find((c) => c.course === "pals")!;
    expect(pals.grandfathered).toBe(false);
    expect(pals.met).toBe(false);
  });

  it("grandfathering works for bls too, even though bls doesn't normally need it", () => {
    const status = getFellowshipPillarACourseStatus(
      [{ programType: "bls", cognitiveModulesComplete: false, ahaPrecourseCompleted: false, fellowshipGrandfathered: true }],
      []
    );
    const bls = status.courses.find((c) => c.course === "bls")!;
    expect(bls.met).toBe(true);
  });
});
