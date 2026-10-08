import { describe, expect, it } from "vitest";
import { advanceSimulationWorld, calculateSimulationWorldAssessment, createSimulationWorld, getSimulationWorldScenario, isSimulationWorldCommandAllowed, isSimulationWorldScenarioCompatible, parseSimulationWorldCommand, reduceSimulationWorld, replaySimulationWorldAttempt, SIMULATION_ASSESSMENT_VERSION, SIMULATION_ENGINE_VERSION, SIMULATION_SCENARIO_VERSION } from "./simulation-world";

describe("simulation world V2", () => {
  it("keeps physiology hidden until the learner obtains an observation", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    expect(start.observations.spo2).toBeUndefined();
    const assessed = reduceSimulationWorld(start, { type: "assess", target: "spo2" });
    expect(assessed.observations.spo2).toBeLessThan(86);
    expect(assessed.events.at(-1)?.description).toContain("SpO₂");
  });

  it("advances deterioration while the learner hesitates", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const waiting = advanceSimulationWorld(start, 20);
    expect(waiting.elapsedSeconds).toBe(20);
    expect(waiting.patient.spo2).toBeLessThan(start.patient.spo2);
    expect(waiting.patient.trajectory).toBe("deteriorating");
  });

  it("keeps causal physiology hidden while deriving worsening observations", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const waiting = advanceSimulationWorld(start, 20);
    expect(waiting.observations.spo2).toBeUndefined();
    expect(waiting.patient.physiology.ventilation).toBeLessThan(start.patient.physiology.ventilation);
    expect(waiting.patient.physiology.metabolicDebt).toBeGreaterThan(start.patient.physiology.metabolicDebt);
    expect(waiting.patient.etco2).toBeGreaterThan(start.patient.etco2 ?? 0);
  });

  it("makes oxygen and fluid act through physiology rather than direct vital edits", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const oxygen = reduceSimulationWorld(start, { type: "give_oxygen" });
    const fluid = reduceSimulationWorld(start, { type: "give_fluid" });
    expect(oxygen.patient.physiology.oxygenation).toBeGreaterThan(start.patient.physiology.oxygenation);
    expect(oxygen.patient.physiology.ventilation).toBeLessThan(start.patient.physiology.ventilation);
    expect(oxygen.environment.ventilationAssisted).toBe(false);
    const ventilated = reduceSimulationWorld(start, { type: "assist_ventilation" });
    expect(ventilated.patient.physiology.ventilation).toBeGreaterThan(start.patient.physiology.ventilation);
    expect(ventilated.environment.ventilationAssisted).toBe(true);
    expect(fluid.patient.physiology.circulatingVolume).toBeGreaterThan(start.patient.physiology.circulatingVolume);
    expect(fluid.patient.systolicBp).toBeGreaterThan(start.patient.systolicBp);
  });

  it("uses scenario-specific profiles and preserves their transition boundaries", () => {
    const septic = getSimulationWorldScenario("septic-shock-arrest").physiology;
    const respiratory = getSimulationWorldScenario("respiratory-bradycardia").physiology;
    const postoperative = getSimulationWorldScenario("postop-equipment").physiology;
    expect(respiratory.respiratoryFailureAfterSeconds).toBeLessThan(septic.respiratoryFailureAfterSeconds);
    expect(postoperative.arrestAfterSeconds).toBeLessThan(septic.arrestAfterSeconds);
    expect(respiratory.ventilationDeclinePerSecond).toBeGreaterThan(septic.ventilationDeclinePerSecond);

    expect(advanceSimulationWorld(createSimulationWorld("septic-shock-arrest", "team_leader"), 41).patient.circulation).toBe("poor_perfusion");
    expect(advanceSimulationWorld(createSimulationWorld("septic-shock-arrest", "team_leader"), 43).patient.circulation).toBe("pulseless");
    expect(advanceSimulationWorld(createSimulationWorld("respiratory-bradycardia", "team_leader"), 35).patient.circulation).toBe("poor_perfusion");
    expect(advanceSimulationWorld(createSimulationWorld("respiratory-bradycardia", "team_leader"), 37).patient.circulation).toBe("pulseless");
    expect(advanceSimulationWorld(createSimulationWorld("postop-equipment", "team_leader"), 29).patient.circulation).toBe("poor_perfusion");
    expect(advanceSimulationWorld(createSimulationWorld("postop-equipment", "team_leader"), 31).patient.circulation).toBe("pulseless");
    expect(getSimulationWorldScenario("postop-equipment").initialRhythm).toBe("sinus_tachycardia");
  });

  it("does not allow paediatric scenarios to be used as adult ACLS or neonatal NRP simulations", () => {
    expect(isSimulationWorldScenarioCompatible("septic-shock-arrest", "pals")).toBe(true);
    expect(isSimulationWorldScenarioCompatible("septic-shock-arrest", "acls")).toBe(false);
    expect(isSimulationWorldScenarioCompatible("septic-shock-arrest", "nrp")).toBe(false);
  });

  it("requires both oxygenation and ventilation support before respiratory recovery is possible", () => {
    const untreated = advanceSimulationWorld(createSimulationWorld("respiratory-bradycardia", "team_leader"), 8);
    const oxygenOnly = reduceSimulationWorld(untreated, { type: "give_oxygen" });
    const supported = reduceSimulationWorld(oxygenOnly, { type: "assist_ventilation" });
    expect(oxygenOnly.patient.breathing).not.toBe("adequate");
    expect(supported.environment.ventilationAssisted).toBe(true);
    expect(supported.patient.physiology.oxygenation).toBeGreaterThan(untreated.patient.physiology.oxygenation);
    expect(supported.patient.physiology.ventilation).toBeGreaterThan(oxygenOnly.patient.physiology.ventilation);
  });

  it("keeps a mechanism-mismatched fluid intervention from fixing respiratory failure", () => {
    let state = advanceSimulationWorld(createSimulationWorld("respiratory-bradycardia", "team_leader"), 8);
    state = reduceSimulationWorld(state, { type: "give_fluid" });
    state = advanceSimulationWorld(state, 28);
    expect(state.patient.physiology.circulatingVolume).toBeGreaterThan(0.62);
    expect(state.patient.physiology.ventilation).toBeLessThan(0.25);
    expect(state.patient.circulation).toBe("pulseless");
  });

  it("separates delegation, NPC acknowledgement, execution, and closed loop", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const delegated = reduceSimulationWorld(start, { type: "delegate", target: "airway_ventilation", task: "Assess and support breathing" });
    expect(delegated.npcs[0].status).toBe("waiting");
    const acknowledged = advanceSimulationWorld(delegated, 2);
    expect(acknowledged.npcs[0].status).toBe("acknowledged");
    const completed = advanceSimulationWorld(acknowledged, 3);
    expect(completed.npcs[0].status).toBe("completed");
    const closed = reduceSimulationWorld(completed, { type: "acknowledge", target: "airway_ventilation" });
    expect(closed.competencies.delegation).toBeGreaterThan(0);
    expect(closed.competencies.closedLoop).toBeGreaterThan(0);
  });

  it("constrains actions by role and penalises unsafe actions", () => {
    const scribe = createSimulationWorld("septic-shock-arrest", "scribe");
    expect(isSimulationWorldCommandAllowed("scribe", { type: "give_oxygen" })).toBe(false);
    const next = reduceSimulationWorld(scribe, { type: "give_oxygen" });
    expect(next.criticalFailures).toHaveLength(1);
    expect(next.competencies.safety).toBeLessThan(60);
  });

  it("creates a critical safety failure for shocking a non-shockable rhythm", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const next = reduceSimulationWorld(start, { type: "shock" });
    expect(next.criticalFailures).toHaveLength(1);
    expect(next.competencies.safety).toBeLessThan(60);
    expect(calculateSimulationWorldAssessment(next).evidenceEligible).toBe(false);
  });

  it("does not award repeated credit for the same assessment", () => {
    const start = createSimulationWorld("septic-shock-arrest", "team_leader");
    const once = reduceSimulationWorld(start, { type: "assess", target: "airway" });
    const twice = reduceSimulationWorld(once, { type: "assess", target: "airway" });
    expect(twice.competencies.recognition).toBe(12);
    expect(twice.competencies.prioritisation).toBe(8);
  });

  it("provides a deterministic resuscitation pathway to ROSC", () => {
    let state = createSimulationWorld("septic-shock-arrest", "team_leader");
    state = advanceSimulationWorld(state, 43);
    state = reduceSimulationWorld(state, { type: "assess", target: "circulation" });
    state = reduceSimulationWorld(state, { type: "start_cpr" });
    state = reduceSimulationWorld(state, { type: "give_fluid" });
    state = reduceSimulationWorld(state, { type: "give_epinephrine" });
    state = advanceSimulationWorld(state, 3);
    state = reduceSimulationWorld(state, { type: "reassess" });
    expect(state.patient.trajectory).toBe("rosc");
    expect(calculateSimulationWorldAssessment(state).evidenceEligible).toBe(false); // behavioural domains still require demonstration
  });

  it("parses natural language into structured commands without changing physiology", () => {
    expect(parseSimulationWorldCommand("Mary, airway")).toEqual({ type: "delegate", target: "airway_ventilation", task: "Mary, airway" });
    expect(parseSimulationWorldCommand("start compressions")).toEqual({ type: "start_cpr" });
    expect(parseSimulationWorldCommand("check sats")).toEqual({ type: "assess", target: "spo2" });
  });

  it("replays a versioned event stream and rejects tampering", () => {
    let state = createSimulationWorld("septic-shock-arrest", "team_leader");
    state = reduceSimulationWorld(state, { type: "assess", target: "airway" });
    state = reduceSimulationWorld(state, { type: "call_for_help" });
    const meta = { timestamp: state.elapsedSeconds, type: "simulation_world_meta", description: JSON.stringify({ role: "team_leader", scenarioId: "septic-shock-arrest", engineVersion: SIMULATION_ENGINE_VERSION, scenarioVersion: SIMULATION_SCENARIO_VERSION, assessmentVersion: SIMULATION_ASSESSMENT_VERSION }) };
    const eventLog = [...state.events, meta] as typeof state.events;
    const replay = replaySimulationWorldAttempt({ scenarioId: "septic-shock-arrest", role: "team_leader", eventLog });
    expect(replay.valid).toBe(true);
    const tampered = [...eventLog];
    tampered[1] = { ...tampered[1], description: "altered" };
    expect(replaySimulationWorldAttempt({ scenarioId: "septic-shock-arrest", role: "team_leader", eventLog: tampered }).valid).toBe(false);
  });
});
