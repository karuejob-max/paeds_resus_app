import { TRPCError } from "@trpc/server";
import type { User } from "../../drizzle/schema";
import type { AppDb } from "./institution-access";
import { assertInstitutionProductCapability, type InstitutionalProductKey } from "./institution-entitlements";
import { assertInstitutionProductRole, type InstitutionalProductRoleKey } from "./institution-product-roles";

export type InstitutionalCapabilityClass = "read" | "operate" | "review" | "govern" | "commercial";
export type InstitutionalRenewalPolicy = "full" | "read_only" | "operational_continuity" | "blocked";

export type InstitutionalCapabilityDefinition = {
  productKey: InstitutionalProductKey;
  capabilityKey: string;
  capabilityClass: InstitutionalCapabilityClass;
  renewalPolicy: InstitutionalRenewalPolicy;
  requiredRoleKeys: readonly InstitutionalProductRoleKey[];
  routeKeys: readonly string[];
  procedureNames: readonly string[];
  tableFamilies: readonly string[];
  allowedDuringActiveEvent: boolean;
};

const IERS_COORDINATOR = ["iers_coordinator", "iers_governance"] as const;
const IERS_RESPONDER = ["iers_coordinator", "iers_responder"] as const;
const IERS_REVIEWER = ["iers_reviewer", "iers_governance"] as const;
const IERS_VIEWER = ["iers_viewer", "iers_coordinator", "iers_governance", "iers_reviewer", "iers_responder"] as const;
const CPD_COORDINATOR = ["cpd_coordinator"] as const;
const CPD_REVIEWER = ["cpd_reviewer", "cpd_coordinator"] as const;
const CPD_REPORTER = ["cpd_reporter", "cpd_viewer", "cpd_coordinator", "cpd_reviewer"] as const;

/**
 * Release-owned mapping from institutional procedures to product capabilities.
 * Every protected procedure in the named institutional routers must occur here.
 */
export const INSTITUTIONAL_CAPABILITY_REGISTRY: readonly InstitutionalCapabilityDefinition[] = [
  {
    productKey: "iers",
    capabilityKey: "iers.workspace.read",
    capabilityClass: "read",
    renewalPolicy: "operational_continuity",
    requiredRoleKeys: IERS_VIEWER,
    routeKeys: ["/institution/iers", "/institution/iers/report"],
    procedureNames: ["listDrills", "getPilotReadiness", "getImplementationPlan", "getMyShiftReadiness", "getEvidenceScorecard", "listEvidence", "listInstitutionActivations", "getMyActivations", "getTimeline", "getIersMissingPoleAlerts"],
    tableFamilies: ["iersDrills", "iersImplementationMilestones", "iersEvidenceRecords", "iersActivationEvents", "iersActivationTimeline"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.activation.operate",
    capabilityClass: "operate",
    renewalPolicy: "operational_continuity",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers"],
    procedureNames: ["triggerActivation", "acknowledge", "markResponse", "advance"],
    tableFamilies: ["iersActivationEvents", "iersActivationResponders", "iersActivationTimeline"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.activation.respond",
    capabilityClass: "operate",
    renewalPolicy: "operational_continuity",
    requiredRoleKeys: IERS_RESPONDER,
    routeKeys: ["/provider/iers/activations/:id"],
    procedureNames: ["recordDowntimeActivation"],
    tableFamilies: ["institutionMemberships", "iersActivationResponders", "iersDrillParticipants"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.team_readiness.operate",
    capabilityClass: "operate",
    renewalPolicy: "operational_continuity",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers/workforce"],
    procedureNames: ["signOffShiftReadiness"],
    tableFamilies: ["shiftUtlRosters", "iersEvidenceRecords"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.competency_training.operate",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers/competency"],
    procedureNames: ["getTrainingSchedules", "listAssignableInstructors", "createTrainingSchedule", "updateTrainingSchedule", "deleteTrainingSchedule", "getTrainingAttendanceForSchedule", "getIersCompetencyRecords", "upsertTrainingAttendance", "registerAllStaffForTrainingSession"],
    tableFamilies: ["trainingSchedules", "trainingAttendance", "iersCompetencyRecords"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.drills.operate",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers/drills"],
    procedureNames: ["createDrill", "startDrill", "joinDrill", "submitDrillDebrief"],
    tableFamilies: ["iersDrills", "iersDrillParticipants", "iersEvidenceRecords"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.evidence.submit",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers/evidence"],
    procedureNames: ["submitEvidence"],
    tableFamilies: ["iersEvidenceRecords"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.evidence.review",
    capabilityClass: "review",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_REVIEWER,
    routeKeys: ["/institution/iers/evidence"],
    procedureNames: ["reviewEvidence"],
    tableFamilies: ["iersEvidenceRecords"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.actions.operate",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers/evidence"],
    procedureNames: ["createAction", "listActions", "updateAction", "getActionLogs", "createActionLog", "updateActionLogStatus"],
    tableFamilies: ["iersActionItems", "institutionalActionLogs", "iersEvidenceRecords"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.implementation.govern",
    capabilityClass: "govern",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_COORDINATOR,
    routeKeys: ["/institution/iers/plan"],
    procedureNames: ["updateImplementationMilestone", "getImplementationTracker", "updateImplementationTrackerPhase"],
    tableFamilies: ["iersImplementationMilestones", "iersImplementationTrackers"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.governance.review",
    capabilityClass: "review",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_REVIEWER,
    routeKeys: ["/institution/iers/evidence"],
    procedureNames: ["getIncidents", "createIncident", "getFacilityGapAnalysis", "getPendingCareSignalActions", "getPendingCodeSignalActions", "runResusGpsAudit", "importResusGpsAuditAction", "getLatestIermsAuditScorecard", "submitIermsAuditScorecard", "getEquipmentAuditLogs", "submitEquipmentAuditLog", "verifyIersCompetencyRecord"],
    tableFamilies: ["incidents", "careSignalEvents", "codeSignalEvents", "equipmentAuditLogs", "iermsAuditScorecards"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "iers",
    capabilityKey: "iers.reports.read",
    capabilityClass: "read",
    renewalPolicy: "read_only",
    requiredRoleKeys: IERS_VIEWER,
    routeKeys: ["/institution/iers/report"],
    procedureNames: ["getStats", "getInstitutionalAnalytics", "refreshInstitutionalAnalytics"],
    tableFamilies: ["institutionalAnalytics", "iersEvidenceRecords", "iersActionItems"],
    allowedDuringActiveEvent: true,
  },
  {
    productKey: "cpd_portal",
    capabilityKey: "cpd.workspace.read",
    capabilityClass: "read",
    renewalPolicy: "read_only",
    requiredRoleKeys: CPD_REPORTER,
    routeKeys: ["/institution/cpd"],
    procedureNames: ["getSettings", "listEvents", "getInstitutionalCpdAnalytics"],
    tableFamilies: ["cpdEvents", "cpdAttendees", "cpdCertificates"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "cpd_portal",
    capabilityKey: "cpd.sessions.operate",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: CPD_COORDINATOR,
    routeKeys: ["/institution/cpd"],
    procedureNames: ["updateCoordinator", "updateSignature", "searchPresenters", "openEvent", "updateEventPresenter", "closeEvent", "deleteEvent"],
    tableFamilies: ["cpdEvents"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "cpd_portal",
    capabilityKey: "cpd.attendance.operate",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: CPD_REVIEWER,
    routeKeys: ["/institution/cpd"],
    procedureNames: ["submitRegistration", "listAttendees", "updateCpdCode", "logCpdCodeReveal"],
    tableFamilies: ["cpdAttendees", "cpdEvents"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "cpd_portal",
    capabilityKey: "cpd.reports.read",
    capabilityClass: "read",
    renewalPolicy: "read_only",
    requiredRoleKeys: CPD_REPORTER,
    routeKeys: ["/institution/cpd"],
    procedureNames: ["exportCsv", "getPlatformCpdAnalytics"],
    tableFamilies: ["cpdEvents", "cpdAttendees", "cpdCertificates"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "cpd_portal",
    capabilityKey: "cpd.certificates.operate",
    capabilityClass: "operate",
    renewalPolicy: "read_only",
    requiredRoleKeys: ["cpd_viewer", "cpd_reviewer", "cpd_coordinator"],
    routeKeys: ["/institution/cpd"],
    procedureNames: ["myCertificates"],
    tableFamilies: ["cpdCertificates", "cpdAttendees"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "connected_services",
    capabilityKey: "connected_services.read",
    capabilityClass: "read",
    renewalPolicy: "read_only",
    requiredRoleKeys: ["connected_services_viewer", "connected_services_manager"],
    routeKeys: ["/institution/connected-services"],
    procedureNames: ["getConnectedServices", "getSafeTruthGovernancePolicy", "listConnectedServiceEvents"],
    tableFamilies: ["institutionConnectedServices", "safeTruthGovernancePolicies"],
    allowedDuringActiveEvent: false,
  },
  {
    productKey: "connected_services",
    capabilityKey: "connected_services.govern",
    capabilityClass: "govern",
    renewalPolicy: "read_only",
    requiredRoleKeys: ["connected_services_manager"],
    routeKeys: ["/institution/connected-services"],
    procedureNames: ["updateConnectedService", "updateSafeTruthGovernancePolicy"],
    tableFamilies: ["institutionConnectedServices", "institutionConnectedServiceEvents", "safeTruthGovernancePolicies"],
    allowedDuringActiveEvent: false,
  },
];

const procedureToCapability = new Map<string, InstitutionalCapabilityDefinition>();
for (const definition of INSTITUTIONAL_CAPABILITY_REGISTRY) {
  for (const procedureName of definition.procedureNames) {
    procedureToCapability.set(`${definition.productKey}:${procedureName}`, definition);
  }
}

export async function assertInstitutionProcedureAccess(
  db: AppDb,
  user: Pick<User, "id" | "role" | "email">,
  institutionId: number,
  productKey: InstitutionalProductKey,
  procedureName: string,
): Promise<{ definition: InstitutionalCapabilityDefinition; mode: string; roleKey: string }> {
  const definition = getCapabilityForProcedure(productKey, procedureName);
  if (!definition) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Institutional procedure is not mapped: ${productKey}.${procedureName}` });
  }
  const decision = await assertInstitutionProductCapability(db, institutionId, productKey, definition.capabilityKey);
  const role = await assertInstitutionProductRole(db, user, institutionId, productKey, definition.requiredRoleKeys);
  return { definition, mode: decision.mode, roleKey: role.roleKey };
}

export function getCapabilityForProcedure(productKey: InstitutionalProductKey, procedureName: string): InstitutionalCapabilityDefinition | undefined {
  return procedureToCapability.get(`${productKey}:${procedureName}`);
}

export function getRegistryProcedureNames(productKey: InstitutionalProductKey): string[] {
  return INSTITUTIONAL_CAPABILITY_REGISTRY
    .filter((definition) => definition.productKey === productKey)
    .flatMap((definition) => definition.procedureNames);
}

export function assertRegistryHasNoDuplicateProcedures(): void {
  const seen = new Map<string, string>();
  for (const definition of INSTITUTIONAL_CAPABILITY_REGISTRY) {
    for (const procedureName of definition.procedureNames) {
      const key = `${definition.productKey}:${procedureName}`;
      const previous = seen.get(key);
      if (previous) throw new Error(`Procedure ${key} is mapped more than once (${previous}, ${definition.capabilityKey}).`);
      seen.set(key, definition.capabilityKey);
    }
  }
}

assertRegistryHasNoDuplicateProcedures();
