import { describe, expect, it } from "vitest";
import { canEndAppointment, primaryEndWarning } from "./RoleAssignDrawer";

const deputyKinds = [
  "dept_head_deputy",
  "erco_deputy",
  "cpd_dept_coordinator_deputy",
] as const;

describe("RoleAssignDrawer destructive-action safety", () => {
  it.each(["institution_admin"] as const)(
    "does not permit ending %s from the generic drawer",
    kind => {
      expect(canEndAppointment(kind)).toBe(false);
    },
  );

  it.each(["dept_head", "erco", "cpd_dept_coordinator"] as const)(
    "warns that ending primary %s also ends its deputy",
    kind => {
      expect(primaryEndWarning(kind)).toContain("also ends its deputy");
    },
  );

  it("allows primary end only for the supported primary role kinds", () => {
    expect(canEndAppointment("dept_head")).toBe(true);
    expect(canEndAppointment("erco")).toBe(true);
    expect(canEndAppointment("cpd_dept_coordinator")).toBe(true);
    expect(canEndAppointment("iers_coordinator")).toBe(true);
    expect(canEndAppointment("cpd_coordinator")).toBe(true);
  });

  it.each(deputyKinds)("permits role-aware ending for %s", kind => {
    expect(canEndAppointment(kind)).toBe(true);
  });
});
