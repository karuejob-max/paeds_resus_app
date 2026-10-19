import { describe, expect, it } from "vitest";
import {
  ADULT_ACLS_SCENARIOS,
  canEndAdultAclsSimulation,
  calculateAdultAclsTrainingEvidence,
  createAdultAclsSimulation,
  advanceAdultAclsSimulation,
  reduceAdultAclsSimulation,
  scoreAdultAclsTraining,
} from "./adult-acls-simulation-world";

describe("Adult ACLS Simulation World V1 safety contract", () => {
  it("contains the ten required adult scenario families", () => {
    expect(ADULT_ACLS_SCENARIOS).toHaveLength(10);
    expect(ADULT_ACLS_SCENARIOS.every((scenario) => scenario.initial.hidden)).toBe(true);
  });

  it("preserves one-to-one scenario identity and initial findings for every selector option", () => {
    for (const scenario of ADULT_ACLS_SCENARIOS) {
      const state = createAdultAclsSimulation(scenario.id);
      expect(state.scenarioId).toBe(scenario.id);
      expect(state.patient.rhythm).toBe(scenario.initial.rhythm);
      expect(state.patient.pulse).toBe(scenario.initial.pulse);
      expect(state.patient.systolicBp).toBe(scenario.initial.systolicBp);
      expect(state.patient.diastolicBp).toBe(scenario.initial.diastolicBp);
      expect(state.patient.mentalStatus).toBe(scenario.initial.mentalStatus);
    }
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

  it("supports an explicit synchronized-cardioversion preparation step", () => {
    const state = createAdultAclsSimulation("unstable-tachycardia");
    const prepared = reduceAdultAclsSimulation(state, { type: "prepare_synchronized_cardioversion" });
    expect(prepared.environment.synchronized).toBe(true);
    const converted = reduceAdultAclsSimulation(prepared, { type: "synchronized_cardioversion" });
    expect(converted.patient.rhythm).toBe("sinus_rhythm");
  });

  it("only ends a rehearsal from a stable or post-ROSC state", () => {
    const unstable = createAdultAclsSimulation("unstable-bradycardia");
    const blocked = reduceAdultAclsSimulation(unstable, { type: "end_rehearsal" });
    expect(blocked.patient.phase).not.toBe("ended");
    expect(blocked.criticalFailures).toHaveLength(1);

    let stable = createAdultAclsSimulation("stable-narrow-tachycardia");
    stable = reduceAdultAclsSimulation(stable, { type: "give_adenosine" });
    stable = reduceAdultAclsSimulation(stable, { type: "reassess" });
    expect(canEndAdultAclsSimulation(stable)).toBe(true);
    const ended = reduceAdultAclsSimulation(stable, { type: "end_rehearsal" });
    expect(ended.patient.phase).toBe("ended");
    expect(ended.events.at(-1)?.type).toBe("terminal_state");
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

  it("rewards the textbook VF sequence and does not stack repeated CPR commands", () => {
    let state = createAdultAclsSimulation("vf-pulseless-vt");
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "rhythm" });
    state = reduceAdultAclsSimulation(state, { type: "start_cpr" });
    const perfusionAfterFirstCpr = state.patient.hidden.coronaryPerfusion;
    state = reduceAdultAclsSimulation(state, { type: "start_cpr" });
    expect(state.patient.hidden.coronaryPerfusion).toBeLessThanOrEqual(perfusionAfterFirstCpr);
    expect(state.events.at(-1)?.type).toBe("repeated_action");
    state = reduceAdultAclsSimulation(state, { type: "defibrillate" });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    state = reduceAdultAclsSimulation(state, { type: "end_rehearsal" });
    expect(state.patient.phase).toBe("ended");
    expect(scoreAdultAclsTraining(state)).toBe(100);
  });

  it.each(["pea", "asystole", "reversible-cause-arrest"] as const)("provides an honest ROSC route for %s", (scenarioId) => {
    let state = createAdultAclsSimulation(scenarioId);
    state = reduceAdultAclsSimulation(state, { type: "start_cpr" });
    state = reduceAdultAclsSimulation(state, { type: "give_epinephrine" });
    state = reduceAdultAclsSimulation(state, { type: "treat_reversible_cause" });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    expect(state.patient.phase).toBe("post_rosc");
  });

  it("scores an honest stable SVT run and rejects oxygen/assessment grinding", () => {
    let honest = createAdultAclsSimulation("stable-narrow-tachycardia");
    for (const command of [
      { type: "assess", target: "rhythm" },
      { type: "give_adenosine" },
      { type: "reassess" },
      { type: "end_rehearsal" },
    ] as const) honest = reduceAdultAclsSimulation(honest, command);
    expect(scoreAdultAclsTraining(honest)).toBe(100);

    let grind = createAdultAclsSimulation("stable-narrow-tachycardia");
    for (const command of [
      ...Array(20).fill({ type: "assess", target: "pulse" }),
      ...Array(20).fill({ type: "give_oxygen" }),
      { type: "reassess" },
      { type: "end_rehearsal" },
    ] as const) grind = reduceAdultAclsSimulation(grind, command);
    expect(scoreAdultAclsTraining(grind)).toBeLessThan(70);
  });

  it("ends untreated arrest as a failed debriefable rehearsal", () => {
    const failed = advanceAdultAclsSimulation(createAdultAclsSimulation("asystole"), 120);
    expect(failed.patient.phase).toBe("failed");
    expect(failed.events.at(-1)?.type).toBe("patient_death");
    expect(canEndAdultAclsSimulation(failed)).toBe(true);
    expect(scoreAdultAclsTraining(failed)).toBe(0);
  });
});
