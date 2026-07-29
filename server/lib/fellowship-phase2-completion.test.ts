import { describe, expect, it } from "vitest";
import { getFellowshipPillarACourseStatus } from "./fellowship-phase2-completion";

function enrollment(programType: string, cognitive: boolean, ahaPrecourse: boolean) {
  return { programType, cognitiveModulesComplete: cognitive, ahaPrecourseCompleted: ahaPrecourse };
}

function attendance(
  coursesProgramType: string,
  simulationRole: "team_member" | "team_leader",
  passed: boolean
) {
  return { coursesProgramType, simulationRole, simulationCompetencyPassed: passed };
}

function fullSimSet(course: string) {
  // 3 team_member + 3 team_leader, all passed
  return [
    ...Array.from({ length: 3 }, () => attendance(course, "team_member", true)),
    ...Array.from({ length: 3 }, () => attendance(course, "team_leader", true)),
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

  it("ACLS is met with cognitive + AHA precourse + exactly 3 team_member + 3 team_leader passed sessions", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("acls", true, true)],
      fullSimSet("acls")
    );
    const acls = status.courses.find((c) => c.course === "acls")!;
    expect(acls.met).toBe(true);
    expect(acls.teamMemberSessionsPassed).toBe(3);
    expect(acls.teamLeaderSessionsPassed).toBe(3);
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
        ...Array.from({ length: 3 }, () => attendance("pals", "team_member", true)),
        ...Array.from({ length: 2 }, () => attendance("pals", "team_leader", true)),
      ]
    );
    const pals = status.courses.find((c) => c.course === "pals")!;
    expect(pals.met).toBe(false);
    expect(pals.teamLeaderSessionsPassed).toBe(2);
  });

  it("does not count a session where the instructor did not sign off competency", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("nrp", true, true)],
      [
        ...Array.from({ length: 3 }, () => attendance("nrp", "team_member", true)),
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
    expect(acls.teamMemberSessionsPassed).toBe(0);
    expect(acls.teamLeaderSessionsPassed).toBe(0);
    expect(acls.met).toBe(false);
  });

  it("more than the minimum still counts -- extra sessions don't break anything", () => {
    const status = getFellowshipPillarACourseStatus(
      [enrollment("acls", true, true)],
      [
        ...Array.from({ length: 5 }, () => attendance("acls", "team_member", true)),
        ...Array.from({ length: 4 }, () => attendance("acls", "team_leader", true)),
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
});
