export type ResponsibilitySummaryItem = {
  key: string;
  label: string;
  scope: string;
  status: string;
};

type Person = { userId?: number | null; email?: string | null };

type Assignment = Record<string, unknown>;

function matches(person: Person, row: Assignment): boolean {
  const rowUserId = row.userId ?? row.providerUserId ?? row.coordinatorUserId;
  const rowEmail = row.email ?? row.providerEmail ?? row.invitedEmail;
  return (person.userId != null && Number(rowUserId) === person.userId)
    || Boolean(person.email && rowEmail && String(rowEmail).trim().toLowerCase() === person.email.trim().toLowerCase());
}

export function summarizeInstitutionalResponsibilities(input: {
  person: Person;
  administrators?: readonly Assignment[];
  departmentHeads?: readonly Assignment[];
  educationCoordinators?: readonly Assignment[];
  productRoles?: readonly Assignment[];
  ercoDuties?: readonly Assignment[];
  ertlDuties?: readonly Assignment[];
  utlDuties?: readonly Assignment[];
}): ResponsibilitySummaryItem[] {
  const result: ResponsibilitySummaryItem[] = [];
  for (const row of input.administrators ?? []) if (matches(input.person, row)) {
    result.push({ key: `admin-${String(row.userId)}`, label: "Institutional administrator", scope: "Institution-wide", status: "Active" });
  }
  for (const row of input.departmentHeads ?? []) if (matches(input.person, row)) {
    result.push({ key: `head-${String(row.id)}`, label: "Departmental Head", scope: String(row.department ?? "Department"), status: String(row.assignmentStatus ?? "Active") });
  }
  for (const row of input.educationCoordinators ?? []) {
    if (matches(input.person, row)) result.push({ key: `cpd-${String(row.id)}`, label: "Departmental CPD Coordinator", scope: String(row.departmentName ?? "Department"), status: String(row.assignmentStatus ?? "Active") });
    if (row.deputyUserId != null && input.person.userId === Number(row.deputyUserId)) result.push({ key: `cpd-deputy-${String(row.id)}`, label: "Deputy CPD Coordinator", scope: String(row.departmentName ?? "Department"), status: String(row.deputyAssignmentStatus ?? "Active") });
  }
  for (const row of input.productRoles ?? []) if (matches(input.person, row)) {
    result.push({ key: `product-${String(row.id)}`, label: String(row.roleKey ?? "Product role"), scope: String(row.productName ?? "Institutional product"), status: String(row.roleStatus ?? "Invited") });
  }
  for (const [rows, label] of [[input.ercoDuties, "ERCo"], [input.ertlDuties, "ERTL"], [input.utlDuties, "UTL"]] as const) {
    for (const row of rows ?? []) if (matches(input.person, row)) {
      result.push({ key: `${label}-${String(row.id)}`, label, scope: String(row.departmentName ?? row.poleName ?? "IERS duty"), status: String(row.assignmentStatus ?? "Active") });
    }
  }
  return result;
}
