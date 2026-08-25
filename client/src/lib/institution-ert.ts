export type InstitutionalCanonicalErtAssignment = {
  providerUserId: number;
  providerName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  roleScope: "utl" | "ertl" | "ert_member";
  roleKey: string;
  assignmentStatus: string;
  acceptedAt: Date | string | null;
  declinedAt: Date | string | null;
  declineReason: string | null;
  shiftUtlRosterId: number | null;
};

export type InstitutionalErtResponder = {
  providerUserId: number;
  department: string | null;
  staff: { staffName: string; staffRole: string; department: string };
  roles: string[];
  isErtl: boolean;
  status: string;
  assignmentStatus: string;
  acceptedAt: Date | string | null;
  signedOff: boolean;
};

export function institutionalErtRoleLabel(
  roleScope: InstitutionalCanonicalErtAssignment["roleScope"],
  roleKey: string,
): string {
  if (roleScope === "ertl") return "ERTL / Scene Commander";
  if (roleScope === "utl") return "UTL";
  return roleKey.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function groupInstitutionalErtAssignments(
  assignments: InstitutionalCanonicalErtAssignment[],
  shiftRosters: Array<{ id: number; status?: string | null; readinessSignOffAt?: Date | string | null }> = [],
): InstitutionalErtResponder[] {
  const groups = new Map<number, InstitutionalErtResponder>();
  for (const assignment of assignments) {
    const existing = groups.get(assignment.providerUserId) ?? {
      providerUserId: assignment.providerUserId,
      department: assignment.departmentName,
      staff: {
        staffName: assignment.providerName ?? "Unassigned",
        staffRole: "",
        department: assignment.departmentName ?? "Not assigned",
      },
      roles: [],
      isErtl: false,
      status: "active",
      assignmentStatus: "pending_acceptance",
      acceptedAt: null,
      signedOff: false,
    };

    const roleLabel = institutionalErtRoleLabel(assignment.roleScope, assignment.roleKey);
    if (!existing.roles.includes(roleLabel)) existing.roles.push(roleLabel);
    existing.isErtl = existing.isErtl || assignment.roleScope === "ertl";
    if (assignment.roleScope === "ertl") {
      existing.department = assignment.departmentName ?? existing.department;
      existing.staff.department = assignment.departmentName ?? existing.staff.department;
    }
    if (assignment.assignmentStatus === "accepted") {
      existing.assignmentStatus = "accepted";
      existing.acceptedAt = assignment.acceptedAt;
    } else if (existing.assignmentStatus !== "accepted") {
      existing.assignmentStatus = assignment.assignmentStatus;
    }

    const roster = assignment.shiftUtlRosterId == null
      ? undefined
      : shiftRosters.find((row) => row.id === assignment.shiftUtlRosterId);
    if (roster) {
      existing.status = roster.status ?? existing.status;
      existing.signedOff = existing.signedOff || !!roster.readinessSignOffAt;
    }
    existing.staff.staffRole = existing.roles.join(" • ");
    groups.set(assignment.providerUserId, existing);
  }
  return Array.from(groups.values());
}
