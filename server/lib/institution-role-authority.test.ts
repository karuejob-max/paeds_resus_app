import { describe, expect, it } from "vitest";
import {
  isDepartmentHeadAuthority,
  isInstitutionWideAuthority,
} from "./institution-role-authority";

describe("institutional role authority", () => {
  it("distinguishes department-scoped authority from institution-wide authority", () => {
    expect(isDepartmentHeadAuthority("department_head")).toBe(true);
    expect(isInstitutionWideAuthority("department_head")).toBe(false);
    expect(isDepartmentHeadAuthority("cpd_coordinator")).toBe(false);
    expect(isInstitutionWideAuthority("cpd_coordinator")).toBe(true);
    expect(isInstitutionWideAuthority("iers_chair")).toBe(true);
  });
});
