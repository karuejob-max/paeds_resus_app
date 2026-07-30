import { describe, it, expect } from "vitest";
import { inferDesignationFromCadre } from "./cadre-designation-mapping";

describe("inferDesignationFromCadre", () => {
  it("maps every RN-family cadre leaf to permanent_nurse, regardless of level or sub-specialty", () => {
    const rnValues = [
      "MSN", "HND", "BSN", "BSM", "Other Undergraduate",
      "KRCHN", "KRNM", "KRN", "KRM", "Other Diploma RN",
      "KECHN", "Other Certificate RN", "Other RN",
    ];
    for (const cadre of rnValues) {
      expect(inferDesignationFromCadre(cadre)).toBe("permanent_nurse");
    }
  });

  it("maps NOI and MOI 1:1", () => {
    expect(inferDesignationFromCadre("NOI")).toBe("noi");
    expect(inferDesignationFromCadre("MOI")).toBe("moi");
  });

  it("does NOT guess for COI — ambiguous between coi_bsc and coi_diploma", () => {
    expect(inferDesignationFromCadre("COI")).toBeNull();
  });

  it("returns null for doctor/consultant/student cadres and unset values", () => {
    expect(inferDesignationFromCadre("MO")).toBeNull();
    expect(inferDesignationFromCadre("Consultant Physician")).toBeNull();
    expect(inferDesignationFromCadre("Nursing Student")).toBeNull();
    expect(inferDesignationFromCadre(null)).toBeNull();
    expect(inferDesignationFromCadre(undefined)).toBeNull();
    expect(inferDesignationFromCadre("")).toBeNull();
  });
});
