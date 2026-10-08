import { describe, expect, it } from "vitest";
import {
  ADULT_ACLS_SCENARIOS,
  calculateAdultAclsTrainingEvidence,
  createAdultAclsSimulation,
  advanceAdultAclsSimulation,
  reduceAdultAclsSimulation,
} from "./adult-acls-simulation-world";

describe("Adult ACLS Simulation World V1 safety contract", () => {
  it("contains the ten required adult scenario families", () => {
    expect(ADULT_ACLS_SCENARIOS).toHaveLength(10);
    expect(ADULT_ACLS_SCENARIOS.every((scenario) => scenario.initial.hidden)).toBe(true);
  });

  it("starts VF arrest pulseless and unresponsive", () => {
    const state = createAdultAclsSimulation("vf-pulseless-vt");
    expect(state.patient.phase).toBe("cardiac_arrest");
    expect(state.patient.pulse).toBe("absent");
    expect(state.patient.mentalStatus).toBe("unresponsive");
    expect(state.patient.rhythm).toBe("ventricular_fibrillation");
  });

  it("keeps oxygen separate from ventilation", () => {
    const start = createAdultAclsSimulation("hypoxia-to-arrest");
    const oxygen = reduceAdultAclsSimulation(start, { type: "give_oxygen" });
    expect(oxygen.patient.hidden.oxygenation).toBeGreaterThan(start.patient.hidden.oxygenation);
    expect(oxygen.patient.hidden.ventilation).toBe(start.patient.hidden.ventilation);
    expect(oxygen.patient.breathing).not.toBe("adequate");
    const ventilated = reduceAdultAclsSimulation(oxygen, { type: "assist_ventilation" });
    expect(ventilated.patient.hidden.ventilation).toBeGreaterThan(oxygen.patient.hidden.ventilation);
  });

  it("rejects defibrillation for PEA and asystole", () => {
    for (const scenarioId of ["pea", "asystole"] as const) {
      const state = reduceAdultAclsSimulation(createAdultAclsSimulation(scenarioId), { type: "defibrillate" });
      expect(state.criticalFailures).toHaveLength(1);
      expect(state.patient.phase).toBe("cardiac_arrest");
    }
  });

  it("does not make defibrillation automatic ROSC", () => {
    let state = createAdultAclsSimulation("vf-pulseless-vt");
    state.patient.hidden.probabilityOfRosc = 0.05;
    state = reduceAdultAclsSimulation(state, { type: "defibrillate" });
    expect(state.patient.phase).toBe("cardiac_arrest");
    expect(state.patient.pulse).toBe("absent");
  });

  it("requires synchronisation and a pulse for cardioversion", () => {
    const state = createAdultAclsSimulation("unstable-tachycardia");
    const unsafe = reduceAdultAclsSimulation(state, { type: "synchronized_cardioversion" });
    expect(unsafe.criticalFailures).toHaveLength(1);
    const synchronised = { ...state, environment: { ...state.environment, synchronized: true } };
    const converted = reduceAdultAclsSimulation(synchronised, { type: "synchronized_cardioversion" });
    expect(converted.patient.rhythm).toBe("sinus_rhythm");
  });

  it("keeps electrical pacing distinct from mechanical capture", () => {
    const state = createAdultAclsSimulation("unstable-bradycardia");
    const paced = reduceAdultAclsSimulation(state, { type: "pace" });
    expect(paced.events.at(-1)?.description).toContain("mechanical capture");
    expect(paced.patient.rhythm).toBe("sinus_bradycardia");
  });

  it("supports delayed deterioration and post-ROSC continuation", () => {
    const start = createAdultAclsSimulation("rosc-post-arrest");
    const waiting = advanceAdultAclsSimulation(start, 20);
    expect(waiting.patient.phase).not.toBe("ended");
    expect(waiting.patient.hidden.metabolicDebt).toBeGreaterThan(start.patient.hidden.metabolicDebt);
    expect(calculateAdultAclsTrainingEvidence(waiting).competenceClaim).toBe(false);
    expect(calculateAdultAclsTrainingEvidence(waiting).credentialClaim).toBe(false);
  });

  it("keeps programme and population isolation explicit", () => {
    const state = createAdultAclsSimulation("acs-to-vf");
    expect(state.patient.hidden).toBeDefined();
    expect(state.patient.rhythm).toBe("sinus_tachycardia");
  });
});
