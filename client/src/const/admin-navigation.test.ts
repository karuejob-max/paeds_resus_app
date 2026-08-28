import { describe, expect, it } from "vitest";
import {
  adminNavigationGroups,
  adminPrimaryRoutes,
  isAdminRouteActive,
} from "./admin-navigation";

describe("Global Admin navigation registry", () => {
  it("classifies every destination exactly once", () => {
    const hrefs = adminPrimaryRoutes.map(item => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toContain("/admin/access-grants");
    expect(adminNavigationGroups.length).toBeGreaterThan(1);
  });

  it("keeps the overview route exact while matching admin subpages", () => {
    expect(isAdminRouteActive("/admin", "/admin")).toBe(true);
    expect(isAdminRouteActive("/admin/access-grants", "/admin")).toBe(false);
    expect(isAdminRouteActive("/admin/access-grants", "/admin/access-grants")).toBe(true);
    expect(isAdminRouteActive("/admin/care-signal-review/details", "/admin/care-signal-review")).toBe(true);
  });
});
