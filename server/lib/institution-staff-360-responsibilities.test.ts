import { describe, expect, it } from "vitest";
import { buildStaff360Responsibilities } from "./institution-staff-360-responsibilities";

describe("Staff 360 responsibilities", () => {
  it("keeps standing appointments, product roles, and dated duties separate", () => {
    const result = buildStaff360Responsibilities({
      standingAppointments: [
        {
          kind: "department_erco",
          scope: "department",
          departmentId: 4,
          departmentLabel: "Emergency",
          status: "pending_acceptance",
          assignedAt: new Date("2026-01-01"),
          acceptedAt: null,
          effectiveFrom: "2026-01-01",
          effectiveUntil: null,
          source: "department_erco",
          sourceId: 8,
        },
      ],
      productRoles: [{ id: 9, productKey: "iers", roleKey: "iers_coordinator", roleStatus: "active" }],
      datedDuties: [{
        assignmentId: 10,
        roleScope: "utl",
        roleKey: "utl",
        departmentId: 4,
        departmentLabel: "Emergency",
        effectiveFrom: "2026-01-02",
        effectiveUntil: "2026-01-02",
        shiftType: "morning",
        assignmentStatus: "accepted",
        acceptedAt: new Date("2026-01-01"),
      }],
    });

    expect(result.standingAppointments).toHaveLength(1);
    expect(result.productRoles[0]).toMatchObject({ label: "Institutional IERS Coordinator", status: "active" });
    expect(result.datedDuties[0]).toMatchObject({ assignmentStatus: "accepted", roleScope: "utl" });
  });

  it("does not turn unavailable sources into empty conclusions", () => {
    const result = buildStaff360Responsibilities({
      standingAppointments: [],
      productRoles: [],
      datedDuties: [],
      sourceState: { datedDuties: "unavailable" },
    });
    expect(result.sourceState.datedDuties).toBe("unavailable");
  });
});
