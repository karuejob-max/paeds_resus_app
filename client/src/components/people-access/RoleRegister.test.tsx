import { describe, expect, it } from "vitest";
import { roleActionLabel } from "./RoleRegister";
import type { RoleSlot } from "@shared/institution-role-register";

const slot = (kind: RoleSlot["kind"], status: RoleSlot["status"]): RoleSlot => ({
  kind,
  status,
  departmentId: null,
  assignmentId: null,
  holders: [],
  others: [],
});

describe("People access role actions", () => {
  it("treats an occupied administrator slot as add, not change", () => {
    expect(roleActionLabel(slot("institution_admin", "active"))).toBe("Add administrator");
  });

  it("requires explicit end-then-reassign for occupied operational slots", () => {
    expect(roleActionLabel(slot("dept_head", "active"))).toBe("Replace");
    expect(roleActionLabel(slot("erco", "active"))).toBe("Replace");
  });

  it("keeps vacant and non-active slots on assignment flow", () => {
    expect(roleActionLabel(slot("dept_head", "vacant"))).toBe("Assign");
    expect(roleActionLabel(slot("erco", "declined"))).toBe("Assign");
  });
});
