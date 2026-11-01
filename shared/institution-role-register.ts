import { buildCanonicalDepartmentOptions, type DepartmentHierarchyRow } from "./institution-department-hierarchy";

export const SLOT_KINDS = [
  "institution_admin",
  "iers_coordinator",
  "cpd_coordinator",
  "dept_head",
  "dept_head_deputy",
  "erco",
  "erco_deputy",
  "cpd_dept_coordinator",
  "cpd_dept_coordinator_deputy",
] as const;
export type SlotKind = (typeof SLOT_KINDS)[number];
export type SlotStatus = "vacant" | "pending_acceptance" | "active" | "declined" | "unavailable";
export type RoleHolder = { userId: number; name: string; email?: string | null };
export type RoleSlot = {
  kind: SlotKind;
  departmentId: number | null;
  status: SlotStatus;
  holders: RoleHolder[];
  others?: RoleHolder[];
  assignmentId?: number;
  assignedAt?: Date | string | null;
  declineReason?: string | null;
};
export type Unavailable = { unavailable: true };
export type RoleRegisterInput = {
  departments: readonly DepartmentHierarchyRow[] | Unavailable;
  admins: readonly RoleRecord[] | Unavailable;
  productRoles: readonly RoleRecord[] | Unavailable;
  heads: readonly RoleRecord[] | Unavailable;
  ercos: readonly RoleRecord[] | Unavailable;
  cpdCoordinators: readonly RoleRecord[] | Unavailable;
};
export type RoleRecord = Record<string, unknown> & {
  id?: number;
  departmentId?: number | null;
  userId?: number | null;
  providerUserId?: number | null;
  coordinatorUserId?: number | null;
  deputyUserId?: number | null;
  name?: string | null;
  fullName?: string | null;
  providerName?: string | null;
  email?: string | null;
  providerEmail?: string | null;
  assignmentStatus?: string | null;
  roleStatus?: string | null;
  assignmentRole?: string | null;
  roleKey?: string | null;
  declineReason?: string | null;
  deputyDeclineReason?: string | null;
  assignedAt?: Date | string | null;
};

const unavailable = (kind: SlotKind, departmentId: number | null): RoleSlot => ({ kind, departmentId, status: "unavailable", holders: [] });
const isUnavailable = (value: readonly RoleRecord[] | Unavailable): value is Unavailable => "unavailable" in value;
const user = (row: RoleRecord, deputy = false): RoleHolder | null => {
  const userId = deputy ? row.deputyUserId : (row.userId ?? row.providerUserId ?? row.coordinatorUserId);
  if (userId == null) return null;
  return { userId: Number(userId), name: String(deputy ? (row.deputyFullName ?? row.deputyName ?? "Unknown person") : (row.name ?? row.fullName ?? row.providerName ?? "Unknown person")), email: deputy ? (row.deputyEmail as string | null | undefined) : (row.email ?? row.providerEmail) };
};
function status(row: RoleRecord, deputy = false): SlotStatus | "ended" {
  const value = String(deputy ? row.deputyAssignmentStatus : (row.assignmentStatus ?? row.roleStatus ?? "active"));
  return value === "ended" ? "ended" : value === "pending_acceptance" || value === "declined" || value === "active" ? value : "vacant";
}
function selectSlot(kind: SlotKind, departmentId: number | null, rows: readonly RoleRecord[], deputy = false): RoleSlot {
  const usable = rows.filter(row => status(row, deputy) !== "ended");
  if (!usable.length) return { kind, departmentId, status: "vacant", holders: [] };
  const ordered = [...usable].sort((a, b) => (status(a, deputy) === "active" ? 0 : 1) - (status(b, deputy) === "active" ? 0 : 1));
  const [primary, ...rest] = ordered;
  const holder = user(primary, deputy);
  const others = rest.map(row => user(row, deputy)).filter((item): item is RoleHolder => item != null);
  return {
    kind, departmentId, status: status(primary, deputy) as SlotStatus,
    holders: holder ? [holder] : [],
    ...(others.length ? { others } : {}),
    ...(primary.id != null ? { assignmentId: primary.id } : {}),
    ...(primary.assignedAt != null ? { assignedAt: primary.assignedAt } : {}),
    ...(primary.declineReason || (deputy && primary.deputyDeclineReason) ? { declineReason: deputy ? primary.deputyDeclineReason : primary.declineReason } : {}),
  };
}
function recordsFor(rows: readonly RoleRecord[], departmentId: number | null, kind: SlotKind): RoleRecord[] {
  return rows.filter(row => (row.departmentId ?? null) === departmentId && (kind !== "erco" && kind !== "erco_deputy" || (kind === "erco" ? (row.assignmentRole ?? "erco") === "erco" : true)));
}

export function buildRoleRegister(input: RoleRegisterInput): { institutionWide: RoleSlot[]; departments: Array<{ departmentId: number; label: string; slots: RoleSlot[] }> } {
  const institutionWide: RoleSlot[] = [];
  const global = (kind: SlotKind, rows: readonly RoleRecord[] | Unavailable, predicate: (row: RoleRecord) => boolean) => {
    institutionWide.push(isUnavailable(rows) ? unavailable(kind, null) : selectSlot(kind, null, rows.filter(predicate)));
  };
  global("institution_admin", input.admins, () => true);
  global("iers_coordinator", input.productRoles, row => row.productKey === "iers" && row.roleKey === "iers_coordinator");
  global("cpd_coordinator", input.productRoles, row => row.productKey === "cpd_portal" && row.roleKey === "cpd_coordinator");
  const options = isUnavailable(input.departments) ? [] : buildCanonicalDepartmentOptions(input.departments);
  const departments = options.map(department => {
    const departmentId = department.id;
    const scoped = (kind: SlotKind, rows: readonly RoleRecord[] | Unavailable, deputy = false): RoleSlot => isUnavailable(rows) ? unavailable(kind, departmentId) : selectSlot(kind, departmentId, recordsFor(rows, departmentId, kind), deputy);
    return { departmentId, label: department.label, slots: [
      scoped("dept_head", input.heads), scoped("dept_head_deputy", input.heads, true),
      scoped("erco", input.ercos), scoped("erco_deputy", input.ercos, true),
      scoped("cpd_dept_coordinator", input.cpdCoordinators), scoped("cpd_dept_coordinator_deputy", input.cpdCoordinators, true),
    ] };
  });
  return { institutionWide, departments };
}
