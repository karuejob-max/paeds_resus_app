import { describe, it, expect } from "vitest";
import { getProgramIdentity } from "./program-identity";

describe("getProgramIdentity", () => {
  it("maps permanent_nurse to NERP with nurse-specific rules", () => {
    const identity = getProgramIdentity("permanent_nurse");
    expect(identity.programName).toBe("NERP");
    expect(identity.rules.some((r) => r.includes("2,500/month"))).toBe(true);
    expect(identity.rules.some((r) => r.includes("licence"))).toBe(true);
  });

  it("maps every intern designation to IERP with no licence requirement mentioned", () => {
    for (const designation of ["noi", "coi_bsc", "coi_diploma", "moi"]) {
      const identity = getProgramIdentity(designation);
      expect(identity.programName).toBe("IERP");
      expect(identity.rules.some((r) => r.includes("August–November"))).toBe(true);
      expect(identity.rules.some((r) => r.includes("full KES 15,000"))).toBe(true);
    }
  });

  it("maps permanent_doctor to the Paeds Resus Open Enrolment Pathway", () => {
    const identity = getProgramIdentity("permanent_doctor");
    expect(identity.programName).toBe("Open Enrolment");
    expect(identity.programFullName).toBe("Paeds Resus Open Enrolment Pathway");
    expect(identity.rules.some((r) => r.includes("Standard individual pricing"))).toBe(true);
  });

  it("maps other or unset designation to the same open pathway", () => {
    expect(getProgramIdentity("other").programName).toBe("Open Enrolment");
    expect(getProgramIdentity(null).programName).toBe("Open Enrolment");
    expect(getProgramIdentity(undefined).programFullName).toBe("Paeds Resus Open Enrolment Pathway");
  });

  it("never returns overlapping rules between the nurse and intern programs", () => {
    const nurse = getProgramIdentity("permanent_nurse");
    const intern = getProgramIdentity("noi");
    expect(nurse.programName).not.toBe(intern.programName);
  });
});
