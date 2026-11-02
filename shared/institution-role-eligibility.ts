import type { RoleSlot, SlotKind } from "./institution-role-register";

export type EligibilityPerson = {
  id: number;
  userId?: number | null;
  staffName: string;
  staffEmail?: string | null;
  departmentId?: number | null;
  facilityLinkStatus?: string | null;
  membershipStatus?: string | null;
  staffRole?: string | null;
};

export type EligibilityContext = {
  primaryErcoUserId?: number | null;
  existingHolderUserId?: number | null;
  serverEligibleUserIds?: number[] | null;
  serverEligibilityError?: string | null;
};

export function getSlotEligibility(kind: SlotKind, person: EligibilityPerson | null, departmentId: number | null, context: EligibilityContext = {}): string[] {
  if (!person) return ["Select a staff member before submitting."];
  const errors: string[] = [];
  if (!person.userId) errors.push("A linked account is required.");
  if (person.facilityLinkStatus && person.facilityLinkStatus !== "linked") errors.push("The staff member must have an active linked institution account.");
  if (person.membershipStatus && !["active", "invited"].includes(person.membershipStatus)) errors.push("The staff member must have active institution membership.");
  if (context.existingHolderUserId === person.userId) errors.push("This person already holds this role.");
  if (kind !== "institution_admin" && kind !== "iers_coordinator" && kind !== "cpd_coordinator" && person.departmentId !== departmentId) errors.push("The staff member must belong to the selected canonical department.");
  if (kind === "erco" || kind === "erco_deputy") {
    if (context.serverEligibilityError) errors.push(context.serverEligibilityError);
    else if (context.serverEligibleUserIds && !context.serverEligibleUserIds.includes(person.userId ?? -1)) {
      errors.push("This person is not an eligible active linked nurse for the selected canonical department.");
    }
    if (kind === "erco_deputy" && !context.primaryErcoUserId) errors.push("Assign and accept a primary ERCo before assigning a Deputy ERCo.");
    if (kind === "erco_deputy" && context.primaryErcoUserId === person.userId) errors.push("The Deputy ERCo must be different from the primary ERCo.");
  }
  return errors;
}
