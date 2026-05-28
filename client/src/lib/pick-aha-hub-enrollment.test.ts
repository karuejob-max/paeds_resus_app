import { describe, expect, it } from "vitest";
import { buildAhaHubEnrollmentMap, pickAhaHubEnrollmentForProgram } from "./pick-aha-hub-enrollment";
import type { AhaHubEnrollmentRow } from "./pick-aha-hub-enrollment";

const ahaPals: AhaHubEnrollmentRow = {
  id: 2,
  programType: "pals",
  courseId: 42,
  courseTitle: "Paediatric Advanced Life Support (PALS)",
  createdAt: "2026-04-01",
  cognitiveModulesComplete: true,
  practicalSkillsSignedOff: false,
};

const adfPals: AhaHubEnrollmentRow = {
  id: 1,
  programType: "pals",
  courseId: 99,
  courseTitle: "The systematic approach to a seriously ill child",
  createdAt: "2026-05-01",
  cognitiveModulesComplete: false,
  practicalSkillsSignedOff: false,
};

describe("pickAhaHubEnrollmentForProgram", () => {
  it("prefers canonical AHA PALS enrollment over newer ADF pals row", () => {
    const picked = pickAhaHubEnrollmentForProgram([adfPals, ahaPals], "pals", 42);
    expect(picked?.id).toBe(2);
    expect(picked?.cognitiveModulesComplete).toBe(true);
  });

  it("matches hub anchor courseId when multiple PALS rows exist", () => {
    const picked = pickAhaHubEnrollmentForProgram([adfPals, ahaPals], "pals", 42);
    expect(picked?.courseId).toBe(42);
  });

  it("builds one enrollment per AHA program for hub cards", () => {
    const bls: AhaHubEnrollmentRow = {
      id: 10,
      programType: "bls",
      createdAt: "2026-01-01",
      cognitiveModulesComplete: false,
      practicalSkillsSignedOff: false,
    };
    const map = buildAhaHubEnrollmentMap([adfPals, ahaPals, bls], new Map([["pals", 42]]));
    expect(map.get("pals")?.id).toBe(2);
    expect(map.get("bls")?.id).toBe(10);
    expect(map.has("acls")).toBe(false);
  });
});
