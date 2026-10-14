import type { SimulationWorldRole } from "./simulation-world";

export const NRP_WORLD_VERSION = "1.0.0";
export const NRP_SCENARIO_VERSION = "1.0.0";
export const NRP_MAX_ACTION_ADVANCE_SECONDS = 5;
export const NRP_CLINICAL_STATUS = "clinical_review" as const;

export type NrpScenarioId = "newborn-not-breathing" | "newborn-apnoea-after-meconium" | "preterm-thermal-risk" | "newborn-persistent-bradycardia";
export type NrpPhase = "initial_assessment" | "initial_steps" | "ppv" | "corrective_steps" | "compressions" | "post_resuscitation" | "ended";
export type NrpBreathing = "breathing" | "apnoeic" | "gasping";
export type NrpTone = "good" | "poor";
export type NrpColour = "pink" | "blue" | "improving";

export type NrpPatient = {
  gestationWeeks: number;
  breathing: NrpBreathing;
  heartRate: number;
  tone: NrpTone;
  colour: NrpColour;
  phase: NrpPhase;
  ventilationEffective: boolean;
};

export type NrpCommand =
  | { type: "assess_newborn" }
  | { type: "warm_dry_stimulate" }
  | { type: "position_airway" }
  | { type: "start_ppv" }
  | { type: "corrective_ventilation_step" }
  | { type: "advanced_airway" }
  | { type: "start_compressions" }
  | { type: "reassess_heart_rate" }
  | { type: "continue_support" }
  | { type: "end_rehearsal" };

export type NrpEvent = {
  timestamp: number;
  type: string;
  description: string;
  correct?: boolean;
  consequence?: string;
};

export type NrpState = {
  scenarioId: NrpScenarioId;
  role: SimulationWorldRole;
  elapsedSeconds: number;
  patient: NrpPatient;
  observations: { assessed: boolean; airwayPositioned: boolean; initialStepsCompleted: boolean; ppvStarted: boolean; correctiveStepsCompleted: boolean; advancedAirwayPlaced: boolean; compressionsStarted: boolean; heartRateReassessed: boolean };
  events: NrpEvent[];
  criticalFailures: string[];
  competencies: { recognition: number; initialSteps: number; ventilation: number; escalation: number; reassessment: number };
};

export const NRP_SCENARIOS: readonly { id: NrpScenarioId; title: string; subtitle: string; initial: NrpPatient }[] = [
  {
    id: "newborn-not-breathing",
    title: "Newborn not breathing after birth",
    subtitle: "A term newborn is apnoeic with poor tone and a heart rate below 100/min.",
    initial: { gestationWeeks: 39, breathing: "apnoeic", heartRate: 70, tone: "poor", colour: "blue", phase: "initial_assessment", ventilationEffective: false },
  },
  {
    id: "newborn-apnoea-after-meconium",
    title: "Newborn apnoea after meconium-stained birth",
    subtitle: "A term newborn is apnoeic with poor tone after a meconium-stained birth; effective ventilation is the priority.",
    initial: { gestationWeeks: 40, breathing: "apnoeic", heartRate: 58, tone: "poor", colour: "blue", phase: "initial_assessment", ventilationEffective: false },
  },
  {
    id: "preterm-thermal-risk",
    title: "Preterm newborn with thermal risk",
    subtitle: "A 29-week newborn has poor tone and inadequate breathing; protect temperature while starting the initial steps.",
    initial: { gestationWeeks: 29, breathing: "gasping", heartRate: 76, tone: "poor", colour: "blue", phase: "initial_assessment", ventilationEffective: false },
  },
  {
    id: "newborn-persistent-bradycardia",
    title: "Persistent newborn bradycardia",
    subtitle: "Heart rate remains below 60/min after ineffective ventilation, requiring corrective ventilation and escalation.",
    initial: { gestationWeeks: 38, breathing: "gasping", heartRate: 52, tone: "poor", colour: "blue", phase: "initial_assessment", ventilationEffective: false },
  },
];

export function getNrpScenario(id: NrpScenarioId) { return NRP_SCENARIOS.find((scenario) => scenario.id === id)!; }
export function isNrpProgrammeCompatible(program: string, scenarioId: NrpScenarioId) { return program === "nrp" && Boolean(getNrpScenario(scenarioId)); }

export function createNrpSimulation(scenarioId: NrpScenarioId, role: SimulationWorldRole = "team_leader"): NrpState {
  return {
    scenarioId,
    role,
    elapsedSeconds: 0,
    patient: structuredClone(getNrpScenario(scenarioId).initial),
    observations: { assessed: false, airwayPositioned: false, initialStepsCompleted: false, ppvStarted: false, correctiveStepsCompleted: false, advancedAirwayPlaced: false, compressionsStarted: false, heartRateReassessed: false },
    events: [],
    criticalFailures: [],
    competencies: { recognition: 0, initialSteps: 0, ventilation: 0, escalation: 0, reassessment: 0 },
  };
}

function event(state: NrpState, type: string, description: string, correct?: boolean, consequence?: string): NrpState {
  return { ...state, events: [...state.events, { timestamp: state.elapsedSeconds, type, description, correct, consequence }] };
}
function failure(state: NrpState, message: string) {
  return event({ ...state, criticalFailures: [...state.criticalFailures, message], competencies: { ...state.competencies, escalation: Math.max(0, state.competencies.escalation - 15) } }, "critical_failure", message, false, message);
}

export function advanceNrpSimulation(state: NrpState, seconds: number): NrpState {
  if (seconds <= 0 || state.patient.phase === "ended") return state;
  const next = structuredClone(state);
  next.elapsedSeconds = Number((state.elapsedSeconds + seconds).toFixed(2));
  if (next.patient.phase === "initial_assessment" || next.patient.phase === "initial_steps") {
    next.patient.heartRate = Math.max(40, next.patient.heartRate - Math.round(seconds * 2));
  }
  if ((next.patient.phase === "ppv" || next.patient.phase === "corrective_steps") && !next.patient.ventilationEffective) {
    next.patient.heartRate = Math.max(40, next.patient.heartRate - Math.round(seconds));
  }
  if (next.patient.heartRate < 60 && next.observations.ppvStarted && next.observations.correctiveStepsCompleted) next.patient.phase = "compressions";
  next.patient.colour = next.patient.heartRate >= 100 ? "pink" : next.patient.heartRate >= 60 ? "improving" : "blue";
  return event(next, "time_advanced", `${seconds} seconds elapsed`);
}

export function reduceNrpSimulation(state: NrpState, command: NrpCommand): NrpState {
  if (state.patient.phase === "ended") return state;
  switch (command.type) {
    case "assess_newborn":
      return event({ ...state, observations: { ...state.observations, assessed: true }, competencies: { ...state.competencies, recognition: 25 }, patient: { ...state.patient, phase: "initial_steps" } }, "assessment", "Newborn assessed: apnoeic, poor tone, and heart rate below 100/min. Positive-pressure ventilation is indicated after initial steps.", true);
    case "warm_dry_stimulate":
      if (!state.observations.assessed) return failure(state, "Initial steps were attempted before the newborn was assessed.");
      return event({ ...state, observations: { ...state.observations, initialStepsCompleted: true }, competencies: { ...state.competencies, initialSteps: 25 }, patient: { ...state.patient, phase: "initial_steps" } }, "initial_steps", "Newborn warmed, dried, and stimulated. Breathing remains inadequate; prepare effective ventilation.", true);
    case "position_airway":
      if (!state.observations.initialStepsCompleted) return failure(state, "Airway positioning was attempted before completing the initial steps.");
      return event({ ...state, observations: { ...state.observations, airwayPositioned: true }, competencies: { ...state.competencies, ventilation: 15 } }, "airway_position", "Airway positioned in a neutral/slightly extended position for ventilation.", true);
    case "start_ppv":
      if (!state.observations.airwayPositioned) return failure(state, "Ventilation was started without positioning the newborn's airway.");
      return event({ ...state, observations: { ...state.observations, ppvStarted: true }, competencies: { ...state.competencies, ventilation: 45 }, patient: { ...state.patient, phase: "ppv", ventilationEffective: true, heartRate: 92 } }, "ventilation", "Positive-pressure ventilation started. Check chest movement and reassess heart rate after an effective ventilation interval.", true);
    case "corrective_ventilation_step":
      if (!state.observations.ppvStarted) return failure(state, "Ventilation corrective steps were attempted before ventilation was started.");
      return event({ ...state, observations: { ...state.observations, correctiveStepsCompleted: true }, competencies: { ...state.competencies, ventilation: 70 }, patient: { ...state.patient, phase: "corrective_steps", ventilationEffective: true, heartRate: Math.max(70, state.patient.heartRate) } }, "ventilation_correction", "Ventilation corrective steps completed. Confirm chest movement and reassess heart rate.", true);
    case "advanced_airway":
      if (!state.observations.ppvStarted) return failure(state, "An advanced airway was considered before providing initial ventilation.");
      return event({ ...state, observations: { ...state.observations, advancedAirwayPlaced: true }, competencies: { ...state.competencies, escalation: 35 }, patient: { ...state.patient, ventilationEffective: true } }, "advanced_airway", "Advanced airway support documented as an escalation when mask ventilation is ineffective or prolonged support is required.", true);
    case "start_compressions":
      if (!state.observations.ppvStarted || !state.observations.correctiveStepsCompleted || state.patient.heartRate >= 60) return failure(state, "Chest compressions were started without an indicated heart-rate threshold after effective ventilation.");
      return event({ ...state, observations: { ...state.observations, compressionsStarted: true }, competencies: { ...state.competencies, escalation: 60 }, patient: { ...state.patient, phase: "compressions" } }, "compressions", "Coordinated chest compressions started for persistent heart rate below 60/min after effective ventilation.", true);
    case "reassess_heart_rate":
      if (!state.observations.ppvStarted) return failure(state, "Heart rate was reassessed without first providing ventilation.");
      const recovered = state.observations.compressionsStarted ? 86 : state.patient.heartRate >= 60 ? 118 : state.patient.heartRate;
      return event({ ...state, observations: { ...state.observations, heartRateReassessed: true }, competencies: { ...state.competencies, reassessment: 35 }, patient: { ...state.patient, heartRate: recovered, phase: recovered >= 100 ? "post_resuscitation" : recovered >= 60 ? "ppv" : "compressions", colour: recovered >= 100 ? "pink" : "improving" } }, "reassessment", `Heart rate reassessed at ${recovered}/min. ${recovered >= 100 ? "Newborn improving; move to post-resuscitation care." : "Continue coordinated support and reassess again."}`, true);
    case "continue_support":
      return event({ ...state, competencies: { ...state.competencies, reassessment: Math.min(100, state.competencies.reassessment + 10) } }, "support", "Support continued while monitoring breathing, heart rate, colour, and temperature.", true);
    case "end_rehearsal":
      if (state.patient.phase !== "post_resuscitation") return failure(state, "End the rehearsal only after the newborn reaches a post-resuscitation endpoint.");
      return event({ ...state, patient: { ...state.patient, phase: "ended" } }, "terminal", "Valid post-resuscitation endpoint reached. Simulation evidence remains formative and requires review.", true);
  }
}

export function canEndNrpSimulation(state: NrpState) { return state.patient.phase === "post_resuscitation"; }
export function calculateNrpTrainingEvidence(state: NrpState) {
  // Score the completed clinical pathway, not the raw partial competency points.
  // The previous average treated the non-indicated escalation bucket as a zero,
  // so a correct ventilation-and-recovery run could never reach the 70% target.
  const checkpoints = [
    state.observations.assessed,
    state.observations.initialStepsCompleted,
    state.observations.airwayPositioned && state.observations.ppvStarted,
    state.observations.heartRateReassessed,
    state.patient.phase === "ended",
  ];
  const checkpointScore = Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  const score = Math.max(0, checkpointScore - state.criticalFailures.length * 15);
  return { scenarioId: state.scenarioId, phase: state.patient.phase, durationSeconds: state.elapsedSeconds, heartRateAtEndpoint: state.patient.heartRate, criticalFailures: state.criticalFailures.length, score, formative: true, evidenceEligible: state.patient.phase === "ended", clinicalStatus: NRP_CLINICAL_STATUS, doesNotIssueCredential: true };
}
