import { describe, expect, it } from "vitest";
import { summarizeInstitutionalResponsibilities } from "./institution-role-summary";

describe("summarizeInstitutionalResponsibilities", () => {
  it("summarizes direct, deputy, product, and IERS responsibilities", () => {
    const result = summarizeInstitutionalResponsibilities({
      person: { userId: 7, email: "person@example.com" },
      administrators: [{ userId: 7 }],
      departmentHeads: [{ id: 1, userId: 7, department: "Paediatrics", assignmentStatus: "active" }],
      educationCoordinators: [{ id: 2, userId: 9, deputyUserId: 7, departmentName: "Paediatrics", deputyAssignmentStatus: "active" }],
      productRoles: [{ id: 3, userId: 7, productName: "IERS", roleKey: "reviewer", roleStatus: "active" }],
      ercoDuties: [{ id: 4, providerUserId: 7, departmentName: "Paediatrics", assignmentStatus: "active" }],
    });

    expect(result.map(item => item.label)).toEqual([
      "Institutional administrator",
      "Departmental Head",
      "Deputy CPD Coordinator",
      "reviewer",
      "ERCo",
    ]);
  });

  it("does not match another person with the same department", () => {
    const result = summarizeInstitutionalResponsibilities({
      person: { userId: 7, email: "person@example.com" },
      departmentHeads: [{ id: 1, userId: 8, department: "Paediatrics" }],
    });
    expect(result).toEqual([]);
  });
});
