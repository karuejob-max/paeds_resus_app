import { describe, expect, it } from "vitest";
import { filterDirectoryRows, paginateDirectoryRows } from "./Directory";
import type { StaffRow } from "../InstitutionPeopleRolesPanel";

const rows: StaffRow[] = Array.from({ length: 600 }, (_, index) => ({
  id: index + 1,
  staffName: `Person ${index + 1}`,
  staffEmail: `person${index + 1}@example.test`,
  staffRole: "nurse",
  department: index % 4 === 0 ? null : index % 2 ? "Paediatrics" : "Emergency",
  facilityDepartmentId: index % 4 === 0 ? null : index % 5 === 0 ? 2 : 1,
  userId: index % 6 === 0 ? null : index + 1000,
  facilityLinkStatus: index % 5 === 0 ? "pending" : "linked",
  membershipStatus: index % 17 === 0 ? "ended" : "active",
  removedAt: index % 17 === 0 ? new Date() : null,
}));

describe("directory hardening", () => {
  it("renders at most 50 rows per client-side page from 600 rows", () => {
    expect(paginateDirectoryRows(rows, 1)).toHaveLength(50);
    expect(paginateDirectoryRows(rows, 12)).toHaveLength(50);
    expect(paginateDirectoryRows(rows, 13)).toHaveLength(0);
  });

  it("combines name/email/department search with a status filter", () => {
    const result = filterDirectoryRows(rows, "paediatrics", "unresolved");
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        row =>
          row.department === "Paediatrics" &&
          (row.facilityDepartmentId == null ||
            row.facilityLinkStatus === "pending")
      )
    ).toBe(true);
  });

  it("keeps retired and unresolved messaging cohorts distinct", () => {
    const retired = filterDirectoryRows(rows, "", "retired");
    const unresolved = filterDirectoryRows(rows, "", "unresolved");
    expect(retired.length).toBeGreaterThan(0);
    expect(unresolved.length).toBeGreaterThan(0);
    expect(
      retired.every(
        row => row.removedAt != null || row.membershipStatus === "ended"
      )
    ).toBe(true);
  });
});
