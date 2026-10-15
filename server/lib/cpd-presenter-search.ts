import { departmentLabelsMatch } from "../../shared/clinical-departments";

export type CpdPresenterSearchScope = "department" | "platform";

/**
 * Full-access CPD roles have a null department assignment and may browse all
 * platform accounts. Department-scoped coordinators have an array (including
 * an empty array) and must remain limited to their department directory.
 */
export function getCpdPresenterSearchScope(
  departmentIds: readonly number[] | null,
): CpdPresenterSearchScope {
  return departmentIds === null ? "platform" : "department";
}

export function matchesScopedPresenterDepartment(
  row: { facilityDepartmentId: number | null; department: string | null },
  departmentIds: readonly number[] | null,
  departmentNames: readonly string[],
) {
  if (departmentIds === null) return true;
  if (row.facilityDepartmentId != null) return departmentIds.includes(row.facilityDepartmentId);
  return departmentNames.some(name => departmentLabelsMatch(row.department ?? "", name));
}
