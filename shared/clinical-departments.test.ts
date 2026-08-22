import { describe, expect, it } from "vitest";
import {
  canonicalizeDepartmentLabel,
  departmentLabelsMatch,
  getPresetDepartmentLabels,
  isPresetDepartment,
  resolvePresetDepartment,
} from "./clinical-departments";

describe("shared clinical department catalog", () => {
  it("canonicalizes a legacy sub-department label to the preset parent/sub label", () => {
    expect(canonicalizeDepartmentLabel("PICU")).toBe("Critical Care: PICU");
    expect(resolvePresetDepartment("Critical Care: PICU")?.key).toBe("Critical Care:PICU");
  });

  it("treats equivalent CPD/profile and IERS labels as one department", () => {
    expect(departmentLabelsMatch("ICU", "Critical Care: ICU")).toBe(true);
    expect(departmentLabelsMatch("critical care: icu", "ICU")).toBe(true);
  });

  it("preserves a genuinely missing department as a custom exception", () => {
    expect(isPresetDepartment("Paediatric Ward")).toBe(true);
    expect(isPresetDepartment("Paediatric Emergency Transport Hub")).toBe(false);
    expect(canonicalizeDepartmentLabel("Paediatric Emergency Transport Hub")).toBe("Paediatric Emergency Transport Hub");
  });

  it("exposes the same preset labels used by CPD/profile selectors", () => {
    const labels = getPresetDepartmentLabels();
    expect(labels).toContain("Paediatrics and Child Health: Paediatric Ward");
    expect(labels).toContain("Critical Care: PICU");
  });
});
