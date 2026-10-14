import { describe, expect, it } from "vitest";
import { advanceNrpSimulation, calculateNrpTrainingEvidence, canEndNrpSimulation, createNrpSimulation, reduceNrpSimulation } from "./nrp-simulation-world";

describe("NRP newborn simulation world", () => {
  it("starts with a newborn who needs initial assessment and ventilation", () => {
    const state = createNrpSimulation("newborn-not-breathing");
    expect(state.patient.breathing).toBe("apnoeic");
    expect(state.patient.heartRate).toBe(70);
    expect(state.patient.phase).toBe("initial_assessment");
    expect(canEndNrpSimulation(state)).toBe(false);
  });

  it("supports the safe initial steps to effective PPV and recovery", () => {
    let state = createNrpSimulation("newborn-not-breathing");
    state = reduceNrpSimulation(state, { type: "assess_newborn" });
    state = reduceNrpSimulation(state, { type: "warm_dry_stimulate" });
    state = reduceNrpSimulation(state, { type: "position_airway" });
    state = reduceNrpSimulation(state, { type: "start_ppv" });
    state = reduceNrpSimulation(state, { type: "reassess_heart_rate" });
    expect(state.patient.phase).toBe("post_resuscitation");
    expect(state.patient.heartRate).toBeGreaterThanOrEqual(100);
    expect(canEndNrpSimulation(state)).toBe(true);
    state = reduceNrpSimulation(state, { type: "end_rehearsal" });
    expect(state.patient.phase).toBe("ended");
    expect(calculateNrpTrainingEvidence(state)).toMatchObject({ formative: true, evidenceEligible: true, doesNotIssueCredential: true, score: 100 });
  });

  it("scores a completed safe pathway as qualifying evidence", () => {
    let state = createNrpSimulation("newborn-not-breathing");
    for (const command of [
      { type: "assess_newborn" },
      { type: "warm_dry_stimulate" },
      { type: "position_airway" },
      { type: "start_ppv" },
      { type: "reassess_heart_rate" },
      { type: "end_rehearsal" },
    ] as const) state = reduceNrpSimulation(state, command);
    expect(calculateNrpTrainingEvidence(state)).toMatchObject({ score: 100, criticalFailures: 0 });
  });

  it("penalises unsafe actions without letting raw partial points decide the score", () => {
    let state = createNrpSimulation("newborn-not-breathing");
    state = reduceNrpSimulation(state, { type: "start_ppv" });
    expect(calculateNrpTrainingEvidence({ ...state, patient: { ...state.patient, phase: "ended" } })).toMatchObject({ score: 5, criticalFailures: 1 });
  });

  it("blocks unsafe shortcuts and explains the correction", () => {
    let state = createNrpSimulation("newborn-not-breathing");
    state = reduceNrpSimulation(state, { type: "start_ppv" });
    expect(state.criticalFailures).toHaveLength(1);
    expect(state.events.at(-1)?.correct).toBe(false);
    expect(state.patient.phase).toBe("initial_assessment");
  });

  it("caps deterioration to a bounded action interval", () => {
    const state = createNrpSimulation("newborn-not-breathing");
    const advanced = advanceNrpSimulation(state, 5);
    expect(advanced.elapsedSeconds).toBe(5);
    expect(advanced.patient.heartRate).toBe(60);
  });
});
