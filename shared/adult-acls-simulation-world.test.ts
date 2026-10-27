import { describe, expect, it } from "vitest";
import {
  ADULT_ACLS_ACS_ESCALATION_SECONDS,
  ADULT_ACLS_SCENARIOS,
  canEndAdultAclsSimulation,
  calculateAdultAclsTrainingEvidence,
  createAdultAclsSimulation,
  advanceAdultAclsSimulation,
  getAdultAclsNextAction,
  reduceAdultAclsSimulation,
  scoreAdultAclsTraining,
  type AdultAclsCommand,
  type AdultAclsScenarioId,
} from "./adult-acls-simulation-world";

describe("Adult ACLS Simulation World V1 safety contract", () => {
  it("contains the ten required adult scenario families", () => {
    expect(ADULT_ACLS_SCENARIOS).toHaveLength(11);
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
    const state = reduceAdultAclsSimulation(createAdultAclsSimulation("unstable-bradycardia"), { type: "assess", target: "rhythm" });
    const paced = reduceAdultAclsSimulation(state, { type: "pace" });
    expect(paced.events.at(-1)?.description).toContain("mechanical capture");
    expect(paced.patient.rhythm).toBe("sinus_bradycardia");
  });

  it("keeps the next safe action visible and clinically ordered", () => {
    let state = createAdultAclsSimulation("unstable-bradycardia");
    expect(getAdultAclsNextAction(state)?.label).toBe("Assess rhythm");
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "rhythm" });
    expect(getAdultAclsNextAction(state)?.label).toBe("Atropine");
    const unsafePacing = reduceAdultAclsSimulation(createAdultAclsSimulation("unstable-bradycardia"), { type: "pace" });
    expect(unsafePacing.criticalFailures).toHaveLength(1);
  });

  it("treats atropine-first high-grade AV block as poor but not critical, then requires pacing", () => {
    let state = createAdultAclsSimulation("high-grade-av-block");
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "rhythm" });
    state = reduceAdultAclsSimulation(state, { type: "give_atropine" });
    expect(state.criticalFailures).toHaveLength(0);
    expect(state.events.at(-1)?.correct).toBe(false);
    state = reduceAdultAclsSimulation(state, { type: "pace" });
    expect(state.events.at(-1)?.type).toBe("pacing");
    expect(getAdultAclsNextAction(state)?.label).toBe("Reassess");
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
    for (let i = 0; i < 5; i++) state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    for (let i = 0; i < 3; i++) state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "support_perfusion" });
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "blood_pressure" });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    state = reduceAdultAclsSimulation(state, { type: "end_rehearsal" });
    expect(state.patient.phase).toBe("ended");
    expect(scoreAdultAclsTraining(state)).toBe(100);
  });

  it.each(["pea", "asystole", "reversible-cause-arrest"] as const)("provides an honest ROSC route for %s", (scenarioId) => {
    let state = createAdultAclsSimulation(scenarioId);
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "rhythm" });
    state = reduceAdultAclsSimulation(state, { type: "start_cpr" });
    const causeTarget = scenarioId === "reversible-cause-arrest" ? "breath_sounds" : "airway_history";
    state = reduceAdultAclsSimulation(state, { type: "assess", target: causeTarget });
    state = reduceAdultAclsSimulation(state, { type: "give_epinephrine" });
    const cause = scenarioId === "pea" ? "hypovolaemia" : scenarioId === "asystole" ? "prolonged_hypoxia" : "tension_pneumothorax";
    state = reduceAdultAclsSimulation(state, { type: "treat_reversible_cause", cause });
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

  it("never passes a stable tachycardia without its indicated medication", () => {
    let state = createAdultAclsSimulation("stable-narrow-tachycardia");
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "rhythm" });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    state = reduceAdultAclsSimulation(state, { type: "end_rehearsal" });
    expect(scoreAdultAclsTraining(state)).toBeLessThan(70);
  });

  it("requires post-ROSC oxygenation, ventilation, perfusion support, and reassessment", () => {
    let state = createAdultAclsSimulation("rosc-post-arrest");
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "blood_pressure" });
    state = reduceAdultAclsSimulation(state, { type: "support_perfusion" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    expect(state.patient.phase).toBe("post_rosc");
    state = reduceAdultAclsSimulation(state, { type: "end_rehearsal" });
    expect(scoreAdultAclsTraining(state)).toBe(100);
  });

  it("rejects an incorrect reversible cause", () => {
    const state = reduceAdultAclsSimulation(createAdultAclsSimulation("pea"), { type: "treat_reversible_cause", cause: "tension_pneumothorax" });
    expect(state.criticalFailures).toHaveLength(1);
  });

  it.each([
    ["unstable-bradycardia", [{ type: "assess", target: "rhythm" }, { type: "give_atropine" }, { type: "reassess" }, { type: "end_rehearsal" }]],
    ["stable-narrow-tachycardia", [{ type: "assess", target: "rhythm" }, { type: "give_adenosine" }, { type: "reassess" }, { type: "end_rehearsal" }]],
    ["unstable-tachycardia", [{ type: "assess", target: "rhythm" }, { type: "prepare_synchronized_cardioversion" }, { type: "synchronized_cardioversion" }, { type: "support_perfusion" }, { type: "give_oxygen" }, { type: "give_oxygen" }, { type: "give_oxygen" }, { type: "assist_ventilation" }, { type: "reassess" }, { type: "end_rehearsal" }]],
    ["vf-pulseless-vt", [{ type: "assess", target: "rhythm" }, { type: "start_cpr" }, { type: "defibrillate" }, { type: "reassess" }, ...Array(6).fill({ type: "give_oxygen" }), ...Array(4).fill({ type: "assist_ventilation" }), { type: "support_perfusion" }, { type: "reassess" }, { type: "end_rehearsal" }]],
    ["acs-to-vf", [{ type: "assess", target: "pulse" }, { type: "obtain_ecg" }, { type: "give_aspirin" }, { type: "activate_reperfusion" }, { type: "reassess" }, { type: "end_rehearsal" }]],
    ["hypoxia-to-arrest", [{ type: "assess", target: "breathing" }, ...Array(8).fill({ type: "give_oxygen" }), ...Array(8).fill({ type: "assist_ventilation" }), { type: "reassess" }, { type: "end_rehearsal" }]],
    ["rosc-post-arrest", [{ type: "assess", target: "blood_pressure" }, { type: "support_perfusion" }, { type: "give_oxygen" }, { type: "give_oxygen" }, { type: "give_oxygen" }, { type: "give_oxygen" }, { type: "give_oxygen" }, { type: "assist_ventilation" }, { type: "assist_ventilation" }, { type: "assist_ventilation" }, { type: "reassess" }, { type: "end_rehearsal" }]],
  ] as const)("has a complete honest winning path for %s", (scenarioId, commands) => {
    let state = createAdultAclsSimulation(scenarioId as AdultAclsScenarioId);
    for (const command of commands) state = reduceAdultAclsSimulation(state, command as AdultAclsCommand);
    expect(state.patient.phase).toBe("ended");
    expect(scoreAdultAclsTraining(state)).toBe(100);
  });

  it.each(["pea", "asystole", "reversible-cause-arrest"] as const)("has a complete post-ROSC winning path for %s", (scenarioId) => {
    let state = createAdultAclsSimulation(scenarioId);
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "rhythm" });
    state = reduceAdultAclsSimulation(state, { type: "start_cpr" });
    const causeTarget = scenarioId === "reversible-cause-arrest" ? "breath_sounds" : "airway_history";
    state = reduceAdultAclsSimulation(state, { type: "assess", target: causeTarget });
    state = reduceAdultAclsSimulation(state, { type: "give_epinephrine" });
    const cause = scenarioId === "pea" ? "hypovolaemia" : scenarioId === "asystole" ? "prolonged_hypoxia" : "tension_pneumothorax";
    state = reduceAdultAclsSimulation(state, { type: "treat_reversible_cause", cause });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    state = reduceAdultAclsSimulation(state, { type: "support_perfusion" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "give_oxygen" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assist_ventilation" });
    state = reduceAdultAclsSimulation(state, { type: "assess", target: "blood_pressure" });
    state = reduceAdultAclsSimulation(state, { type: "reassess" });
    state = reduceAdultAclsSimulation(state, { type: "end_rehearsal" });
    expect(state.patient.phase).toBe("ended");
    expect(scoreAdultAclsTraining(state)).toBe(100);
  });
});


describe("Adult ACLS gate-integrity follow-up (v1.3.0)", () => {
  const run = (id: AdultAclsScenarioId, commands: AdultAclsCommand[]) =>
    commands.reduce((state, command) => reduceAdultAclsSimulation(state, command), createAdultAclsSimulation(id));

  it("treats pacing or atropine before a rhythm assessment as a critical failure", () => {
    for (const command of [{ type: "pace" }, { type: "give_atropine" }] as AdultAclsCommand[]) {
      const state = run("unstable-bradycardia", [command]);
      expect(state.criticalFailures.length).toBeGreaterThan(0);
    }
  });

  it("does not let pace-then-assess pass bradycardia", () => {
    const state = run("unstable-bradycardia", [{ type: "pace" }, { type: "assess", target: "rhythm" }, { type: "end_rehearsal" }]);
    expect(scoreAdultAclsTraining(state)).toBeLessThan(70);
  });

  it("requires a cue relevant to the chosen cause, not just any cue", () => {
    const irrelevant = run("pea", [
      { type: "assess", target: "rhythm" }, { type: "start_cpr" }, { type: "give_epinephrine" },
      { type: "assess", target: "trachea" }, { type: "treat_reversible_cause", cause: "hypovolaemia" },
    ]);
    expect(irrelevant.criticalFailures.join(" ")).toContain("relevant to the selected cause");
    const relevant = run("pea", [
      { type: "assess", target: "rhythm" }, { type: "start_cpr" }, { type: "give_epinephrine" },
      { type: "assess", target: "airway_history" }, { type: "treat_reversible_cause", cause: "hypovolaemia" },
    ]);
    expect(relevant.criticalFailures).toHaveLength(0);
    expect(relevant.events.some((event) => event.type === "cause_treatment")).toBe(true);
  });

  it("makes a wrong cause guess a critical failure even after reading unrelated cues", () => {
    const state = run("pea", [
      { type: "assess", target: "rhythm" }, { type: "start_cpr" }, { type: "assess", target: "breath_sounds" },
      { type: "treat_reversible_cause", cause: "tension_pneumothorax" },
    ]);
    expect(state.criticalFailures.join(" ")).toContain("does not match");
  });

  it("requires the ECG before reperfusion activation", () => {
    const state = run("acs-to-vf", [{ type: "assess", target: "pulse" }, { type: "activate_reperfusion" }]);
    expect(state.criticalFailures.join(" ")).toContain("ECG");
  });

  it("escalates an unmanaged ACS to VF arrest and still passes on the honest, timely path", () => {
    const honest = run("acs-to-vf", [
      { type: "assess", target: "pulse" }, { type: "obtain_ecg" }, { type: "give_aspirin" },
      { type: "activate_reperfusion" }, { type: "reassess" }, { type: "end_rehearsal" },
    ]);
    expect(honest.events.some((event) => event.type === "acs_escalation")).toBe(false);
    expect(scoreAdultAclsTraining(honest)).toBeGreaterThanOrEqual(70);

    let stalled = createAdultAclsSimulation("acs-to-vf");
    stalled = advanceAdultAclsSimulation(stalled, ADULT_ACLS_ACS_ESCALATION_SECONDS + 1);
    expect(stalled.events.some((event) => event.type === "acs_escalation")).toBe(true);
    expect(stalled.patient.phase).toBe("cardiac_arrest");
    expect(stalled.patient.rhythm).toBe("ventricular_fibrillation");
  });

  it("does not let the ACS indicated actions alone pass after an escalation", () => {
    let state = advanceAdultAclsSimulation(createAdultAclsSimulation("acs-to-vf"), ADULT_ACLS_ACS_ESCALATION_SECONDS + 1);
    for (const command of [{ type: "assess", target: "pulse" }, { type: "give_aspirin" }, { type: "reassess" }] as AdultAclsCommand[]) {
      state = reduceAdultAclsSimulation(state, command);
    }
    expect(scoreAdultAclsTraining(state)).toBeLessThan(70);
  });
});
