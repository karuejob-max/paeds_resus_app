export type DepartmentSourceState = "available" | "unavailable" | "empty";

export type DepartmentAggregationInput = {
  departments: Array<{ id: number; name: string }>;
  staff: Array<{ userId: number | null; facilityDepartmentId: number | null }>;
  credentials: Array<{ userId: number; credentialType: string; status: string; expiresAt: Date | null }>;
  cpdEvents: Array<{ id: number; facilityDepartmentId: number | null }>;
  cpdAttendees: Array<{ cpdEventId: number; facilityDepartmentId: number | null; attendanceStatus: string }>;
  qiReports: Array<{ id: number; facilityDepartmentId: number | null; status: string }>;
  qiActions: Array<{ reportId: number; status: string; dueAt: Date | null }>;
  sourceStates: {
    credentials: DepartmentSourceState;
    cpd: DepartmentSourceState;
    quality: DepartmentSourceState;
  };
  now?: Date;
};

export type DepartmentSnapshot = {
  id: number;
  name: string;
  activeStaff: number;
  lifeSupportCurrentOrExpiring: number | null;
  lifeSupportExpired: number | null;
  lifeSupportMissing: number | null;
  credentialsExpiringWithin90Days: number | null;
  credentialsExpired: number | null;
  cpdVerifiedAttendance: number | null;
  cpdAttendanceDenominator: number | null;
  cpdEvents: number | null;
  qiOpenReports: number | null;
  qiOverdueActions: number | null;
  sourceAvailability: {
    credentials: DepartmentSourceState;
    cpd: DepartmentSourceState;
    quality: DepartmentSourceState;
  };
  smallGroup: boolean;
};

const LIFE_SUPPORT_TYPES = new Set([
  "paeds_resus_bls_cognitive",
  "paeds_resus_bls_simulation",
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
  "external_aha_bls",
  "external_aha_acls",
  "external_aha_pals",
  "external_aha_nrp",
  "external_aha_other",
]);

export function buildDepartmentSnapshots(input: DepartmentAggregationInput): DepartmentSnapshot[] {
  const now = input.now ?? new Date();
  const horizon = now.getTime() + 90 * 24 * 60 * 60 * 1000;
  const staffByDepartment = new Map<number, Array<{ userId: number | null }>>();
  for (const member of input.staff) {
    if (member.facilityDepartmentId == null) continue;
    const rows = staffByDepartment.get(member.facilityDepartmentId) ?? [];
    rows.push({ userId: member.userId });
    staffByDepartment.set(member.facilityDepartmentId, rows);
  }
  const credentialsByUser = new Map<number, typeof input.credentials>();
  for (const credential of input.credentials) {
    const rows = credentialsByUser.get(credential.userId) ?? [];
    rows.push(credential);
    credentialsByUser.set(credential.userId, rows);
  }
  const eventDepartments = new Map<number, number>();
  for (const event of input.cpdEvents) if (event.facilityDepartmentId != null) eventDepartments.set(event.id, event.facilityDepartmentId);
  const attendanceByDepartment = new Map<number, number>();
  for (const attendee of input.cpdAttendees) {
    if (attendee.attendanceStatus !== "attendance_verified") continue;
    const departmentId = attendee.facilityDepartmentId ?? eventDepartments.get(attendee.cpdEventId);
    if (departmentId == null) continue;
    attendanceByDepartment.set(departmentId, (attendanceByDepartment.get(departmentId) ?? 0) + 1);
  }
  const eventsByDepartment = new Map<number, number>();
  for (const event of input.cpdEvents) if (event.facilityDepartmentId != null) eventsByDepartment.set(event.facilityDepartmentId, (eventsByDepartment.get(event.facilityDepartmentId) ?? 0) + 1);
  const reportDepartments = new Map<number, number>();
  const openReportsByDepartment = new Map<number, number>();
  for (const report of input.qiReports) {
    if (report.facilityDepartmentId == null) continue;
    reportDepartments.set(report.id, report.facilityDepartmentId);
    if (report.status !== "closed") openReportsByDepartment.set(report.facilityDepartmentId, (openReportsByDepartment.get(report.facilityDepartmentId) ?? 0) + 1);
  }
  const overdueByDepartment = new Map<number, number>();
  for (const action of input.qiActions) {
    const departmentId = reportDepartments.get(action.reportId);
    if (departmentId == null || !["open", "in_progress"].includes(action.status) || action.dueAt == null || action.dueAt.getTime() >= now.getTime()) continue;
    overdueByDepartment.set(departmentId, (overdueByDepartment.get(departmentId) ?? 0) + 1);
  }

  return input.departments.map(department => {
    const staff = staffByDepartment.get(department.id) ?? [];
    const staffUserIds = new Set(staff.map(row => row.userId).filter((id): id is number => id != null));
    const departmentCredentials = [...staffUserIds].flatMap(userId => credentialsByUser.get(userId) ?? []);
    const verified = departmentCredentials.filter(row => row.status === "verified");
    const currentLifeSupport = new Set(verified.filter(row => LIFE_SUPPORT_TYPES.has(row.credentialType) && (row.expiresAt == null || row.expiresAt.getTime() > now.getTime())).map(row => row.userId));
    const expiredLifeSupport = new Set(verified.filter(row => LIFE_SUPPORT_TYPES.has(row.credentialType) && row.expiresAt != null && row.expiresAt.getTime() <= now.getTime()).map(row => row.userId));
    const credentialsAvailable = input.sourceStates.credentials !== "unavailable";
    const cpdAvailable = input.sourceStates.cpd !== "unavailable";
    const qualityAvailable = input.sourceStates.quality !== "unavailable";
    return {
      id: department.id,
      name: department.name,
      activeStaff: staff.length,
      lifeSupportCurrentOrExpiring: credentialsAvailable ? currentLifeSupport.size : null,
      lifeSupportExpired: credentialsAvailable ? expiredLifeSupport.size : null,
      lifeSupportMissing: credentialsAvailable ? Math.max(0, staff.length - currentLifeSupport.size - expiredLifeSupport.size) : null,
      credentialsExpiringWithin90Days: credentialsAvailable ? verified.filter(row => row.expiresAt != null && row.expiresAt.getTime() > now.getTime() && row.expiresAt.getTime() <= horizon).length : null,
      credentialsExpired: credentialsAvailable ? verified.filter(row => row.expiresAt != null && row.expiresAt.getTime() <= now.getTime()).length : null,
      cpdVerifiedAttendance: cpdAvailable ? attendanceByDepartment.get(department.id) ?? 0 : null,
      cpdAttendanceDenominator: cpdAvailable ? eventsByDepartment.get(department.id) ?? 0 : null,
      cpdEvents: cpdAvailable ? eventsByDepartment.get(department.id) ?? 0 : null,
      qiOpenReports: qualityAvailable ? openReportsByDepartment.get(department.id) ?? 0 : null,
      qiOverdueActions: qualityAvailable ? overdueByDepartment.get(department.id) ?? 0 : null,
      sourceAvailability: input.sourceStates,
      smallGroup: staff.length < 5,
    };
  });
}
