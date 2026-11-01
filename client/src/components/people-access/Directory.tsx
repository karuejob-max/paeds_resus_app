import type { StaffRow } from "../InstitutionPeopleRolesPanel";

export const DIRECTORY_PAGE_SIZE = 50;
export type DirectoryFilter =
  | "all"
  | "no_department"
  | "no_account"
  | "retired"
  | "unresolved";

export function isRetiredDirectoryRow(row: StaffRow): boolean {
  return row.removedAt != null || row.membershipStatus === "ended";
}

export function isUnresolvedDirectoryRow(row: StaffRow): boolean {
  return (
    !row.facilityDepartmentId ||
    row.facilityLinkStatus === "pending" ||
    row.facilityLinkStatus === "unresolved"
  );
}

export function filterDirectoryRows(
  rows: readonly StaffRow[],
  query: string,
  filter: DirectoryFilter
): StaffRow[] {
  const normalized = query.trim().toLowerCase();
  return rows.filter(row => {
    const matchesQuery =
      !normalized ||
      [row.staffName, row.staffEmail, row.department ?? ""].some(value =>
        value.toLowerCase().includes(normalized)
      );
    if (!matchesQuery) return false;
    if (filter === "no_department") return !row.department?.trim();
    if (filter === "no_account") return !row.userId;
    if (filter === "retired") return isRetiredDirectoryRow(row);
    if (filter === "unresolved") return isUnresolvedDirectoryRow(row);
    return !isRetiredDirectoryRow(row);
  });
}

export function paginateDirectoryRows(
  rows: readonly StaffRow[],
  page: number,
  pageSize = DIRECTORY_PAGE_SIZE
): StaffRow[] {
  return rows.slice(
    Math.max(0, page - 1) * pageSize,
    Math.max(0, page) * pageSize
  );
}
