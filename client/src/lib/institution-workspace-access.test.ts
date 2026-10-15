import { describe, expect, it } from "vitest";
import { deriveInstitutionWorkspaceAccess } from "./institution-workspace-access";

describe("institution workspace access policy", () => {
  it("does not promote departmental leadership into institution-wide IERS access", () => {
    const access = deriveInstitutionWorkspaceAccess(false, ["department_head"]);

    expect(access.hasDepartmentLeadership).toBe(true);
    expect(access.hasIersRole).toBe(false);
    expect(access.canOperateIers).toBe(false);
  });

  it("keeps institutional ERCo inside the IERS operational lane", () => {
    const access = deriveInstitutionWorkspaceAccess(false, ["institutional_erco"]);

    expect(access.hasInstitutionIers).toBe(true);
    expect(access.hasIersRole).toBe(true);
    expect(access.canOperateIers).toBe(true);
  });

  it("does not expose IERS or CPD operations to finance staff", () => {
    const access = deriveInstitutionWorkspaceAccess(false, ["finance_officer"]);

    expect(access.hasIersRole).toBe(false);
    expect(access.hasCpdRole).toBe(false);
    expect(access.canOperateIers).toBe(false);
  });
});
