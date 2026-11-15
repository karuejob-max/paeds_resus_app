export type Staff360ResponsibilityStatus =
  | "invited"
  | "pending_acceptance"
  | "accepted"
  | "active"
  | "declined"
  | "suspended"
  | "ended"
  | "expired"
  | "superseded"
  | "unavailable";

export type Staff360StandingAppointment = {
  kind:
    | "institutional_erco"
    | "institutional_cpd_coordinator"
    | "department_head"
    | "deputy_department_head"
    | "department_erco"
    | "deputy_department_erco"
    | "department_cpd_coordinator"
    | "deputy_department_cpd_coordinator";
  scope: "institution" | "department";
  departmentId: number | null;
  departmentLabel: string | null;
  status: Staff360ResponsibilityStatus;
  assignedAt: Date | null;
  acceptedAt: Date | null;
  effectiveFrom: string | Date | null;
  effectiveUntil: string | Date | null;
  source: "department_head" | "department_erco" | "education_coordinator" | "product_role";
  sourceId: number | null;
};

export type Staff360ProductRole = {
  productKey: string;
  roleKey: string;
  label: string;
  status: Staff360ResponsibilityStatus;
  sourceId: number | null;
};

export type Staff360DatedDuty = {
  assignmentId: number;
  roleScope: "utl" | "ertl";
  roleKey: string;
  departmentId: number | null;
  departmentLabel: string | null;
  effectiveFrom: string | Date | null;
  effectiveUntil: string | Date | null;
  shiftType: "morning" | "evening" | "night" | null;
  assignmentStatus: Staff360ResponsibilityStatus;
  acceptedAt: Date | null;
};

export type Staff360Responsibilities = {
  standingAppointments: Staff360StandingAppointment[];
  productRoles: Staff360ProductRole[];
  datedDuties: Staff360DatedDuty[];
  sourceState: {
    standingAppointments: "available" | "unavailable";
    productRoles: "available" | "unavailable";
    datedDuties: "available" | "unavailable";
  };
};

const ROLE_LABELS: Record<string, string> = {
  iers_coordinator: "Institutional IERS Coordinator",
  iers_chair: "Institutional IERS Chair",
  iers_governance: "Institutional IERS Governance",
  iers_reviewer: "Institutional IERS Reviewer",
  iers_viewer: "Institutional IERS Viewer",
  iers_responder: "Institutional IERS Responder",
  cpd_coordinator: "Institutional CPD Coordinator",
  cpd_education_coordinator: "Institutional CPD Education Coordinator",
  cpd_reviewer: "CPD Reviewer",
  cpd_reporter: "CPD Reporter",
  cpd_viewer: "CPD Viewer",
};

export function productRoleLabel(roleKey: string) {
  return ROLE_LABELS[roleKey] ?? roleKey.replaceAll("_", " ");
}

export function buildStaff360Responsibilities(input: {
  standingAppointments: Staff360StandingAppointment[];
  productRoles: Array<{
    id: number;
    productKey: string;
    roleKey: string;
    roleStatus: string | null;
  }>;
  datedDuties: Staff360DatedDuty[];
  sourceState?: Partial<Staff360Responsibilities["sourceState"]>;
}): Staff360Responsibilities {
  const productRoles = input.productRoles.map((role) => ({
    productKey: role.productKey,
    roleKey: role.roleKey,
    label: productRoleLabel(role.roleKey),
    status: (role.roleStatus ?? "unavailable") as Staff360ResponsibilityStatus,
    sourceId: role.id,
  }));

  const standingAppointments = [...input.standingAppointments].sort((a, b) => {
    const statusRank = (value: Staff360ResponsibilityStatus) =>
      value === "active" ? 0 : value === "pending_acceptance" ? 1 : value === "declined" ? 2 : 3;
    return statusRank(a.status) - statusRank(b.status) || a.kind.localeCompare(b.kind);
  });

  return {
    standingAppointments,
    productRoles,
    datedDuties: input.datedDuties,
    sourceState: {
      standingAppointments: input.sourceState?.standingAppointments ?? "available",
      productRoles: input.sourceState?.productRoles ?? "available",
      datedDuties: input.sourceState?.datedDuties ?? "available",
    },
  };
}
