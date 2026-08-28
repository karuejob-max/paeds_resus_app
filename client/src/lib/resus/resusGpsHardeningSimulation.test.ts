import { describe, expect, it } from "vitest";
import {
  answerPrimarySurvey,
  createSession,
  getBlockingPrimarySurveyInterventions,
  markInterventionUnavailable,
  resolveBlsAssessment,
  returnToPrimarySurvey,
  updateResusSetting,
  primarySurveyQuestions,
  type Threat,
} from "./abcdeEngine";
import { resolveLifeSupportPack } from "./cpr-pack-resolver";
import { sanitizeEventData } from "../../../../server/routers/resus-event";

describe("ResusGPS synthetic/manikin hardening matrix", () => {
  it("routes age and care context without silently selecting NRP", () => {
    expect(resolveLifeSupportPack(0, false, "hospital").pack).toBe("PALS");
    expect(resolveLifeSupportPack(0, false, "delivery_room").pack).toBe("NRP");
    expect(() => resolveLifeSupportPack(24, false, "delivery_room")).toThrow(/newborn under 1 month/i);
    expect(resolveLifeSupportPack(216, false, "hospital").pack).toBe("ACLS");
  });

  it("reroutes a confirmed absent pulse into the cardiac-arrest branch", () => {
    const session = createSession(20, "5 years");
    const circulationQuestion = primarySurveyQuestions.C.find((question) => question.id === "pulse_quality");
    if (!circulationQuestion) throw new Error("pulse_quality question missing from canonical C survey");
    const next = answerPrimarySurvey(session, "pulse_quality", "absent", circulationQuestion);
    expect(next.phase).toBe("CARDIAC_ARREST");
    expect(next.events.some((event) => event.type === "cardiac_arrest_start")).toBe(true);
  });

  it("keeps the arrest branch distinct from non-arrest routing at the BLS gate", () => {
    expect(resolveBlsAssessment("unresponsive", "absent", "absent")).toBe("cardiac_arrest");
    expect(resolveBlsAssessment("responsive", "normal", "present")).toBe("no_cardiac_arrest");
  });

  it("requires an explicit disposition before a critical threat can return to XABCDE", () => {
    const session = createSession(20, "5 years");
    const threat: Threat = {
      id: "synthetic-airway-threat",
      letter: "A",
      name: "Synthetic airway threat",
      severity: "critical",
      resolved: false,
      findings: ["synthetic obstruction"],
      interventions: [{
        id: "synthetic-airway-action",
        action: "Position and open airway",
        critical: true,
        status: "pending",
      }],
    };
    const interventionState = updateResusSetting({ ...session, phase: "INTERVENTION", currentLetter: "A", threats: [threat] }, "hospital");
    expect(getBlockingPrimarySurveyInterventions(interventionState)).toHaveLength(1);
    expect(returnToPrimarySurvey(interventionState).phase).toBe("INTERVENTION");
  });

  it("preserves explicit unavailable-resource provenance without treating it as clinical success", () => {
    const session = createSession(20, "5 years");
    const threat: Threat = {
      id: "synthetic-circulation-threat",
      letter: "C",
      name: "Synthetic circulation threat",
      severity: "urgent",
      resolved: false,
      findings: ["synthetic poor perfusion"],
      interventions: [{
        id: "synthetic-fluid-action",
        action: "Crystalloid bolus",
        critical: true,
        status: "pending",
      }],
    };
    const interventionState = updateResusSetting({ ...session, phase: "INTERVENTION", currentLetter: "C", threats: [threat] }, "hospital");
    const unavailable = markInterventionUnavailable(interventionState, "synthetic-fluid-action", "No IV crystalloid available; IO escalation requested");
    expect(unavailable.threats[0].interventions[0].status).toBe("skipped");
    expect(unavailable.threats[0].interventions[0].unavailableAt).toEqual(expect.any(Number));
    expect(unavailable.threats[0].interventions[0].alternativeUsed).toContain("IO escalation");
    expect(getBlockingPrimarySurveyInterventions(unavailable)).toHaveLength(0);
  });

  it("redacts patient identifiers before the QI timeline boundary", () => {
    const payload = sanitizeEventData({
      patientName: "Synthetic Patient",
      medicalRecordNumber: "SIM-001",
      finding: "synthetic wheeze",
      observations: { name: "not stored", spo2: 92 },
    });
    expect(payload).toBe(JSON.stringify({ finding: "synthetic wheeze", observations: { spo2: 92 } }));
  });
});
