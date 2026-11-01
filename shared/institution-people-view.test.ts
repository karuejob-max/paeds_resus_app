import { describe, expect, it } from "vitest";
import { getInstitutionAdministrationAttention } from "./institution-administration";
import { deriveSetupChecklist, resolveDefaultPeopleView } from "./institution-people-view";

describe("People and access view helpers", () => {
  it("opens the inbox for numeric attention and stays conservative for unknown counts", () => {
    expect(resolveDefaultPeopleView({ pendingAcceptances: 2 })).toEqual({ view: "inbox", couldNotLoad: false });
    expect(resolveDefaultPeopleView({ pendingAcceptances: "unknown", declinedAppointments: 0 })).toEqual({ view: "roles", couldNotLoad: true });
  });
  it("derives five checklist steps with tri-state unknown values", () => {
    expect(deriveSetupChecklist({ institutionProfile: true, staffRoster: false, peopleAccess: null, departments: undefined, accessLinks: true })).toEqual([
      { key: "institutionProfile", status: "done" },
      { key: "staffRoster", status: "not_done" },
      { key: "peopleAccess", status: "unknown" },
      { key: "departments", status: "unknown" },
      { key: "accessLinks", status: "done" },
    ]);
  });
  it("adds optional appointment attention without changing clean legacy output", () => {
    expect(getInstitutionAdministrationAttention({ pendingLinkRequests: 0, departmentMismatches: 0, missingDepartments: 0, productIssues: 0, ilsOrdersNeedingAttention: 0, declinedAppointments: 1 })).toMatchObject([
      { label: "1 appointment declined", lane: "institution", peopleView: "inbox", focus: "declined_appointments" },
    ]);
  });
});
