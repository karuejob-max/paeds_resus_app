import { describe, expect, it } from "vitest";
import { buildRoleRegister } from "./institution-role-register";

const departments = [
  { id: 1, departmentName: "Surgery", parentDepartmentId: null },
  { id: 2, departmentName: "Theatre", parentDepartmentId: 1 },
];
const empty = { admins: [], productRoles: [], heads: [], ercos: [], cpdCoordinators: [] } as const;

describe("buildRoleRegister", () => {
  it("builds all nine kinds with canonical institution and department scopes", () => {
    const result = buildRoleRegister({ departments, ...empty });
    expect(result.institutionWide.map(slot => slot.kind)).toEqual(["institution_admin", "iers_coordinator", "cpd_coordinator"]);
    expect(result.departments[1]?.label).toBe("Surgery → Theatre");
    expect(result.departments[0]?.slots.map(slot => slot.kind)).toEqual([
      "dept_head", "dept_head_deputy", "erco", "erco_deputy", "cpd_dept_coordinator", "cpd_dept_coordinator_deputy",
    ]);
    expect(result.departments[0]?.slots.every(slot => slot.status === "vacant")).toBe(true);
  });
  it("supports every status, ignores ended rows, and lets active win while retaining others", () => {
    const result = buildRoleRegister({ departments: [{ id: 1, departmentName: "Surgery" }], admins: [
      { userId: 1, name: "Pending", roleStatus: "pending_acceptance" },
      { userId: 2, name: "Active", roleStatus: "active" },
      { userId: 3, name: "Ended", roleStatus: "ended" },
    ], productRoles: [{ productKey: "iers", roleKey: "iers_coordinator", userId: 4, name: "Declined", roleStatus: "declined" }], heads: [], ercos: [], cpdCoordinators: [] });
    expect(result.institutionWide[0]).toMatchObject({ status: "active", holders: [{ userId: 2 }], others: [{ userId: 1 }] });
    expect(result.institutionWide[1]).toMatchObject({ status: "declined", holders: [{ userId: 4 }] });
  });
  it("propagates source failures as unavailable rather than vacant", () => {
    const result = buildRoleRegister({ departments, admins: { unavailable: true }, productRoles: [], heads: { unavailable: true }, ercos: [], cpdCoordinators: [] });
    expect(result.institutionWide[0]?.status).toBe("unavailable");
    expect(result.departments[0]?.slots[0]?.status).toBe("unavailable");
    expect(result.departments[0]?.slots[2]?.status).toBe("vacant");
  });
  it("keeps department-scoped rows isolated", () => {
    const result = buildRoleRegister({ departments, ...empty, heads: [{ departmentId: 1, userId: 8, name: "Head" }] });
    expect(result.departments[0]?.slots[0]?.holders[0]?.userId).toBe(8);
    expect(result.departments[1]?.slots[0]?.status).toBe("vacant");
  });
});
