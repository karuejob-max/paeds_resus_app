import { describe, expect, it } from "vitest";
import { getSlotEligibility } from "./institution-role-eligibility";

const nurse = { id: 1, userId: 11, staffName: "Nurse A", staffEmail: "a@example.com", departmentId: 4, facilityLinkStatus: "linked", membershipStatus: "active", staffRole: "Nurse" };

describe("getSlotEligibility", () => {
  it("requires explicit selection and a linked account", () => {
    expect(getSlotEligibility("erco", null, 4)).toContain("Select a staff member before submitting.");
    expect(getSlotEligibility("institution_admin", { ...nurse, userId: null }, null)).toContain("A linked account is required.");
  });
  it("keeps departmental roles in their fixed department", () => {
    expect(getSlotEligibility("dept_head", nurse, 9)).toContain("The staff member must belong to the selected canonical department.");
    expect(getSlotEligibility("dept_head", nurse, 4)).not.toContain("The staff member must belong to the selected canonical department.");
  });
  it("requires a primary ERCo before a deputy", () => {
    expect(getSlotEligibility("erco_deputy", nurse, 4)).toContain("Assign and accept a primary ERCo before assigning a Deputy ERCo.");
    expect(getSlotEligibility("erco_deputy", nurse, 4, { primaryErcoUserId: 12 })).toEqual([]);
  });
  it("uses the server candidate set rather than a staffRole name heuristic", () => {
    const staffMemberWithNonNursingLabel = { ...nurse, staffRole: "clinical practitioner" };
    expect(getSlotEligibility("erco", staffMemberWithNonNursingLabel, 4, { serverEligibleUserIds: [11] })).toEqual([]);
    expect(getSlotEligibility("erco", nurse, 4, { serverEligibleUserIds: [12] })).toContain("This person is not an eligible active linked nurse for the selected canonical department.");
  });
  it("shows the authoritative server error verbatim", () => {
    expect(getSlotEligibility("erco", nurse, 4, { serverEligibilityError: "This department is not available." })).toContain("This department is not available.");
  });
});
