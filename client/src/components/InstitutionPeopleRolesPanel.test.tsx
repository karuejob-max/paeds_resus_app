import { describe, expect, it } from "vitest";
import { getMoveDisabledReason, AUTHORITY_MAP } from "./InstitutionPeopleRolesPanel";
import type { InstitutionalRoleAuthority } from "../../../server/lib/institution-role-authority";

describe("InstitutionPeopleRolesPanel assignment safety", () => {
  it("blocks moving a person to their current department", () => {
    expect(
      getMoveDisabledReason({
        currentDepartmentId: 4,
        targetDepartmentId: 4,
        reason: "A sufficiently long reason",
        isPending: false,
      })
    ).toBe("The target is already this person’s current department.");
  });

  it("requires a target and an actionable reason before moving", () => {
    expect(
      getMoveDisabledReason({
        currentDepartmentId: null,
        targetDepartmentId: null,
        reason: "A sufficiently long reason",
        isPending: false,
      })
    ).toBe("Choose a target department.");
    expect(
      getMoveDisabledReason({
        currentDepartmentId: 1,
        targetDepartmentId: 2,
        reason: "Too short",
        isPending: false,
      })
    ).toBe("Provide a reason of at least 10 characters.");
  });
});


describe("People & access Phase 6c copy and authority map", () => {
  it("represents every server institutional authority", () => {
    const authorities: InstitutionalRoleAuthority[] = [
      "institution_admin", "iers_chair", "iers_governance",
      "iers_coordinator", "cpd_coordinator", "department_head",
    ];
    expect(Object.keys(AUTHORITY_MAP).sort()).toEqual([...authorities].sort());
  });

  it("does not expose retired People lane labels through rendered copy constants", () => {
    const renderedCopy = ["People & access", "Needs attention", "Roles", "Directory", "Departments", "Admins & access", "Advanced access", "Assign", "End", "appointment", "Pending acceptance"].join(" ");
    const retiredLabels = ["People & roles", "Role guide", "Advanced product roles", "Advanced scopes", "Access & links", "Workforce setup checklist"];
    for (const retired of retiredLabels) expect(renderedCopy).not.toContain(retired);
  });
});
