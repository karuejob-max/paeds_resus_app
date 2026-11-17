import { describe, expect, it } from "vitest";
import { buildDepartmentSnapshots } from "./institution-performance-departments";

const base = {
  departments: [{ id: 1, name: "Paediatric Ward" }, { id: 2, name: "Emergency" }],
  staff: [{ userId: 10, facilityDepartmentId: 1 }, { userId: 11, facilityDepartmentId: 1 }, { userId: null, facilityDepartmentId: 2 }],
  credentials: [{ userId: 10, credentialType: "paeds_resus_bls_provider", status: "verified", expiresAt: new Date("2027-01-01") }],
  cpdEvents: [{ id: 100, facilityDepartmentId: 1 }],
  cpdAttendees: [{ cpdEventId: 100, facilityDepartmentId: 1, attendanceStatus: "attendance_verified" }],
  qiReports: [{ id: 200, facilityDepartmentId: 1, status: "open" }],
  qiActions: [{ reportId: 200, status: "open", dueAt: new Date("2026-01-01") }],
  sourceStates: { credentials: "available" as const, cpd: "available" as const, quality: "available" as const },
  now: new Date("2026-06-01"),
};

describe("buildDepartmentSnapshots", () => {
  it("returns no rows when there are no departments", () => {
    expect(buildDepartmentSnapshots({ ...base, departments: [] })).toEqual([]);
  });

  it("keeps one department and flags groups below five active staff", () => {
    const [row] = buildDepartmentSnapshots({ ...base, departments: [base.departments[0]] });
    expect(row).toMatchObject({ id: 1, activeStaff: 2, smallGroup: true, lifeSupportCurrentOrExpiring: 1, lifeSupportMissing: 1 });
  });

  it("does not divide by zero and represents a zero-staff department honestly", () => {
    const [row] = buildDepartmentSnapshots({ ...base, staff: [], departments: [base.departments[0]] });
    expect(row).toMatchObject({ activeStaff: 0, lifeSupportCurrentOrExpiring: 0, lifeSupportMissing: 0, smallGroup: true });
  });

  it("uses null metrics when a required source is unavailable", () => {
    const [row] = buildDepartmentSnapshots({ ...base, sourceStates: { credentials: "unavailable", cpd: "unavailable", quality: "unavailable" } });
    expect(row).toMatchObject({ lifeSupportCurrentOrExpiring: null, cpdVerifiedAttendance: null, qiOverdueActions: null });
    expect(row.sourceAvailability).toMatchObject({ credentials: "unavailable", cpd: "unavailable", quality: "unavailable" });
  });

  it("excludes unassigned staff from department rows", () => {
    const rows = buildDepartmentSnapshots(base);
    expect(rows.find(row => row.id === 2)).toMatchObject({ activeStaff: 1, lifeSupportMissing: 1 });
    expect(rows.every(row => row.id !== 0)).toBe(true);
  });
});
