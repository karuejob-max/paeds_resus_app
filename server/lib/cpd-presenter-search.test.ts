import { describe, expect, it } from "vitest";
import { getCpdPresenterSearchScope } from "./cpd-presenter-search";

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
});
