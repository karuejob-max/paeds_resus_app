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
      expect(identity.rules.some((r) => r.includes("4 months"))).toBe(true);
    }
  });

  it("returns no program identity for permanent_doctor", () => {
    const identity = getProgramIdentity("permanent_doctor");
    expect(identity.programName).toBeNull();
  });

  it("returns no program identity for 'other' or unset designation", () => {
    expect(getProgramIdentity("other").programName).toBeNull();
    expect(getProgramIdentity(null).programName).toBeNull();
    expect(getProgramIdentity(undefined).programName).toBeNull();
  });

  it("never returns overlapping rules between the nurse and intern programs", () => {
    const nurse = getProgramIdentity("permanent_nurse");
    const intern = getProgramIdentity("noi");
    expect(nurse.programName).not.toBe(intern.programName);
  });
});
