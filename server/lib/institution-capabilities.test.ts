import { describe, expect, it } from "vitest";
import {
  assertRegistryHasNoDuplicateProcedures,
  getCapabilityForProcedure,
  getRegistryProcedureNames,
  INSTITUTIONAL_CAPABILITY_REGISTRY,
} from "./institution-capabilities";

const IERS_PROCEDURES = [
  "triggerActivation", "listDrills", "getPilotReadiness", "createDrill", "startDrill", "joinDrill", "submitDrillDebrief",
  "getImplementationPlan", "updateImplementationMilestone", "recordDowntimeActivation", "getMyShiftReadiness", "signOffShiftReadiness",
  "getEvidenceScorecard", "submitEvidence", "listEvidence", "reviewEvidence", "createAction", "listActions", "updateAction", "getActionLogs", "createActionLog", "updateActionLogStatus",
  "getIncidents", "createIncident", "getFacilityGapAnalysis", "getPendingCareSignalActions", "getPendingCodeSignalActions", "runResusGpsAudit", "importResusGpsAuditAction", "getLatestIermsAuditScorecard", "submitIermsAuditScorecard", "getEquipmentAuditLogs", "submitEquipmentAuditLog", "verifyIersCompetencyRecord",
  "getTrainingSchedules", "listAssignableInstructors", "createTrainingSchedule", "updateTrainingSchedule", "deleteTrainingSchedule", "getTrainingAttendanceForSchedule", "getIersCompetencyRecords", "upsertTrainingAttendance", "registerAllStaffForTrainingSession",
  "listInstitutionActivations", "getMyActivations", "acknowledge", "markResponse", "advance", "getTimeline",
] as const;

const CPD_PROCEDURES = [
  "updateCoordinator", "getSettings", "updateSignature", "searchPresenters", "openEvent", "updateEventPresenter", "closeEvent",
  "listEvents", "submitRegistration", "listAttendees", "exportCsv", "updateCpdCode", "logCpdCodeReveal", "myCertificates",
  "getInstitutionalCpdAnalytics", "getPlatformCpdAnalytics", "deleteEvent",
] as const;

describe("institutional capability registry", () => {
  it("contains no duplicate product-procedure mappings", () => {
    expect(() => assertRegistryHasNoDuplicateProcedures()).not.toThrow();
  });

  it("maps every IERS router procedure to a capability", () => {
    for (const procedureName of IERS_PROCEDURES) {
      expect(getCapabilityForProcedure("iers", procedureName), procedureName).toBeDefined();
    }
    expect(getRegistryProcedureNames("iers").length).toBeGreaterThanOrEqual(IERS_PROCEDURES.length);
  });

  it("maps every CPD router procedure to a capability", () => {
    for (const procedureName of CPD_PROCEDURES) {
      expect(getCapabilityForProcedure("cpd_portal", procedureName), procedureName).toBeDefined();
    }
    expect(getRegistryProcedureNames("cpd_portal").length).toBeGreaterThanOrEqual(CPD_PROCEDURES.length);
  });

  it("requires every capability to declare a product, route, procedure, role, and table family", () => {
    for (const definition of INSTITUTIONAL_CAPABILITY_REGISTRY) {
      expect(definition.productKey).toBeTruthy();
      expect(definition.capabilityKey).toBeTruthy();
      expect(definition.routeKeys.length).toBeGreaterThan(0);
      expect(definition.procedureNames.length).toBeGreaterThan(0);
      expect(definition.requiredRoleKeys.length).toBeGreaterThan(0);
      expect(definition.tableFamilies.length).toBeGreaterThan(0);
    }
  });

  it("keeps emergency activation capabilities available during active-event continuity", () => {
    expect(getCapabilityForProcedure("iers", "triggerActivation")?.allowedDuringActiveEvent).toBe(true);
    expect(getCapabilityForProcedure("iers", "acknowledge")?.allowedDuringActiveEvent).toBe(true);
    expect(getCapabilityForProcedure("iers", "markResponse")?.allowedDuringActiveEvent).toBe(true);
    expect(getCapabilityForProcedure("iers", "advance")?.allowedDuringActiveEvent).toBe(true);
  });
});
