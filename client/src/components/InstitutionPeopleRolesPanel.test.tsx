import { describe, expect, it } from "vitest";
import { getMoveDisabledReason } from "./InstitutionPeopleRolesPanel";

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
