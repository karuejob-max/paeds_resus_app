import { describe, expect, it } from "vitest";
import { groupInstitutionalErtAssignments } from "./institution-ert";

describe("institutional canonical ERT grouping", () => {
  it("shows one provider when the same person is both UTL and ERTL", () => {
    const grouped = groupInstitutionalErtAssignments([
      {
        providerUserId: 7,
        providerName: "Job Karue",
        departmentId: 11,
        departmentName: "Paediatric Ward",
        roleScope: "utl",
        roleKey: "utl",
        assignmentStatus: "accepted",
        acceptedAt: "2026-08-25T07:30:00Z",
        declinedAt: null,
        declineReason: null,
        shiftUtlRosterId: 91,
      },
      {
        providerUserId: 7,
        providerName: "Job Karue",
        departmentId: 11,
        departmentName: "Paediatric Ward",
        roleScope: "ertl",
        roleKey: "ertl",
        assignmentStatus: "accepted",
        acceptedAt: "2026-08-25T07:31:00Z",
        declinedAt: null,
        declineReason: null,
        shiftUtlRosterId: 91,
      },
      {
        providerUserId: 8,
        providerName: "Amina Nurse",
        departmentId: 12,
        departmentName: "Emergency Department",
        roleScope: "ert_member",
        roleKey: "airway_lead",
        assignmentStatus: "pending_acceptance",
        acceptedAt: null,
        declinedAt: null,
        declineReason: null,
        shiftUtlRosterId: null,
      },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped.find((person) => person.providerUserId === 7)).toMatchObject({
      isErtl: true,
      assignmentStatus: "accepted",
      staff: { staffName: "Job Karue", staffRole: "UTL • ERTL / Scene Commander" },
    });
    expect(grouped.find((person) => person.providerUserId === 8)).toMatchObject({
      isErtl: false,
      staff: { staffRole: "Airway Lead" },
    });
  });
});
