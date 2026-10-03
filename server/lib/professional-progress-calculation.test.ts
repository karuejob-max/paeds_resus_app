import { describe, expect, it } from "vitest";
import { phaseForEnrollment, progressForEnrollment, selectBestCurrentEnrollments } from "./professional-progress-calculation";

describe("professional progress calculation", () => {
  it("maps the real enrollment evidence fields to percentages", () => {
    expect(progressForEnrollment({ programType: "bls" })).toBe(0);
    expect(progressForEnrollment({ programType: "bls", ahaPrecourseCompleted: true })).toBe(25);
    expect(progressForEnrollment({ programType: "bls", cognitiveModulesComplete: true })).toBe(50);
    expect(progressForEnrollment({ programType: "bls", practicalSkillsSignedOff: true })).toBe(100);
    expect(phaseForEnrollment({ programType: "bls", cognitiveModulesComplete: true })).toBe("Cognitive / Phase 2");
  });

  it("keeps the best non-cancelled current record per course", () => {
    const records = selectBestCurrentEnrollments([
      { id: 1, programType: "bls", enrollmentStatus: "active", cognitiveModulesComplete: false, updatedAt: "2026-08-01" },
      { id: 2, programType: "bls", enrollmentStatus: "active", cognitiveModulesComplete: true, updatedAt: "2026-08-02" },
      { id: 3, programType: "bls", enrollmentStatus: "cancelled", practicalSkillsSignedOff: true, updatedAt: "2026-08-03" },
      { id: 4, programType: "acls", enrollmentStatus: "active", cognitiveModulesComplete: true, practicalSkillsSignedOff: true, updatedAt: "2026-08-02" },
    ]);
    expect(records.map(record => [record.programType, record.id])).toEqual([["acls", 4], ["bls", 2]]);
  });
});
