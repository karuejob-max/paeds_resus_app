import { describe, expect, it } from "vitest";
import { getCpdPresenterSearchScope, matchesScopedPresenterDepartment } from "./cpd-presenter-search";

describe("CPD presenter search scope", () => {
  it("allows facility-wide roles to reach platform-wide search when the query is empty", () => {
    expect(getCpdPresenterSearchScope(null)).toBe("platform");
  });

  it("keeps an assigned department coordinator inside the department directory", () => {
    expect(getCpdPresenterSearchScope([12, 24])).toBe("department");
  });

  it("keeps an unassigned department coordinator restricted rather than broadening access", () => {
    expect(getCpdPresenterSearchScope([])).toBe("department");
  });

  it("accepts a canonical department link for a scoped coordinator", () => {
    expect(matchesScopedPresenterDepartment(
      { facilityDepartmentId: 12, department: "Other" },
      [12],
      ["Emergency Department"],
    )).toBe(true);
  });

  it("accepts a legacy label only when the canonical link is missing", () => {
    expect(matchesScopedPresenterDepartment(
      { facilityDepartmentId: null, department: "Emergency Department" },
      [12],
      ["Emergency Department"],
    )).toBe(true);
  });

  it("does not let a stale label override a different canonical department", () => {
    expect(matchesScopedPresenterDepartment(
      { facilityDepartmentId: 24, department: "Emergency Department" },
      [12],
      ["Emergency Department"],
    )).toBe(false);
  });
});
