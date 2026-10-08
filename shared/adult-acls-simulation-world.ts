import type { SimulationWorldRole } from "./simulation-world";
import { getSimulationClinicalPackage } from "./simulation-clinical-packages";

export const ADULT_ACLS_WORLD_VERSION = "1.0.0";
export const ADULT_ACLS_SCENARIO_VERSION = "1.0.0";
export const ADULT_ACLS_CLINICAL_STATUS = "clinical_review" as const;

export type AdultAclsScenarioId =
  | "unstable-bradycardia"
  | "stable-narrow-tachycardia"
  | "unstable-tachycardia"
  | "vf-pulseless-vt"
  | "pea"
  | "asystole"
  | "rosc-post-arrest"
  | "acs-to-vf"
  | "hypoxia-to-arrest"
  | "reversible-cause-arrest";

export type AdultAclsRhythm =
  | "sinus_rhythm"
  | "sinus_tachycardia"
  | "sinus_bradycardia"
  | "supraventricular_tachycardia"
  | "atrial_fibrillation"
  | "atrial_flutter"
  | "ventricular_tachycardia"
  | "ventricular_fibrillation"
  | "pulseless_electrical_activity"
  | "asystole";

export type AdultAclsPhase = "stable" | "unstable" | "peri_arrest" | "cardiac_arrest" | "rosc" | "post_rosc" | "ended";
export type AdultAclsPulse = "adequate" | "reduced" | "severely_reduced" | "absent";
export type AdultAclsMentalStatus = "alert" | "confused" | "altered" | "unresponsive";
export type AdultAclsBreathing = "adequate" | "hypoventilating" | "apnoeic";

export type AdultAclsHiddenPhysiology = {
  cardiacOutput: number;
  coronaryPerfusion: number;
  cerebralPerfusion: number;
  oxygenation: number;
  ventilation: number;
  circulatingVolume: number;
  vascularTone: number;
  myocardialFunction: number;
  oxygenDebt: number;
  metabolicDebt: number;
  probabilityOfRosc: number;
  probabilityOfReArrest: number;
  causeLoad: number;
};

export type AdultAclsPatient = {
  rhythm: AdultAclsRhythm;
  pulse: AdultAclsPulse;
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  spo2: number;
  respiratoryRate: number;
  breathing: AdultAclsBreathing;
  mentalStatus: AdultAclsMentalStatus;
  phase: AdultAclsPhase;
  trajectory: "improving" | "stable" | "deteriorating" | "rosc" | "re_arrest";
  hidden: AdultAclsHiddenPhysiology;
};

export type AdultAclsCommand =
  | { type: "assess"; target: "rhythm" | "pulse" | "blood_pressure" | "breathing" | "mental_status" | "spo2" | "heart_rate" }
  | { type: "reassess" }
  | { type: "start_cpr" }
  | { type: "give_oxygen" }
  | { type: "assist_ventilation" }
  | { type: "defibrillate" }
  | { type: "synchronized_cardioversion" }
  | { type: "pace" }
  | { type: "give_epinephrine" }
  | { type: "give_antiarrhythmic" }
  | { type: "give_adenosine" }
  | { type: "give_atropine" }
  | { type: "treat_reversible_cause" };

export type AdultAclsEvent = {
  timestamp: number;
  type: string;
  description: string;
  correct?: boolean;
  consequence?: string;
};

export type AdultAclsState = {
  scenarioId: AdultAclsScenarioId;
  role: SimulationWorldRole;
  elapsedSeconds: number;
  patient: AdultAclsPatient;
  observations: Partial<Record<AdultAclsCommand["type"], string | number>>;
  events: AdultAclsEvent[];
  environment: { oxygenAvailable: boolean; ventilationAvailable: boolean; defibrillatorReady: boolean; pacingAvailable: boolean; synchronized: boolean; cprActive: boolean };
  criticalFailures: string[];
  competencies: { recognition: number; interventionSelection: number; sequencing: number; execution: number; reassessment: number; teamPerformance: number };
};

export const ADULT_ACLS_SCENARIOS: readonly { id: AdultAclsScenarioId; title: string; subtitle: string; initial: AdultAclsPatient; cause: string }[] = [
  { id: "unstable-bradycardia", title: "Unstable bradycardia", subtitle: "A slow rhythm with hypotension and altered mental status.", cause: "conduction_failure", initial: { rhythm: "sinus_bradycardia", pulse: "severely_reduced", heartRate: 38, systolicBp: 78, diastolicBp: 46, spo2: 94, respiratoryRate: 18, breathing: "adequate", mentalStatus: "altered", phase: "unstable", trajectory: "deteriorating", hidden: { cardiacOutput: 0.35, coronaryPerfusion: 0.42, cerebralPerfusion: 0.4, oxygenation: 0.86, ventilation: 0.8, circulatingVolume: 0.9, vascularTone: 0.62, myocardialFunction: 0.52, oxygenDebt: 18, metabolicDebt: 20, probabilityOfRosc: 0, probabilityOfReArrest: 0.2, causeLoad: 0.7 } } },
  { id: "stable-narrow-tachycardia", title: "Stable narrow-complex tachycardia", subtitle: "A regular narrow-complex tachycardia with currently adequate perfusion.", cause: "reentry_tachycardia", initial: { rhythm: "supraventricular_tachycardia", pulse: "adequate", heartRate: 176, systolicBp: 118, diastolicBp: 72, spo2: 97, respiratoryRate: 20, breathing: "adequate", mentalStatus: "alert", phase: "stable", trajectory: "stable", hidden: { cardiacOutput: 0.78, coronaryPerfusion: 0.8, cerebralPerfusion: 0.82, oxygenation: 0.94, ventilation: 0.9, circulatingVolume: 0.95, vascularTone: 0.8, myocardialFunction: 0.86, oxygenDebt: 4, metabolicDebt: 5, probabilityOfRosc: 0, probabilityOfReArrest: 0.05, causeLoad: 0.5 } } },
  { id: "unstable-tachycardia", title: "Unstable tachycardia", subtitle: "A rapid rhythm with falling pressure and altered consciousness.", cause: "rapid_tachyarrhythmia", initial: { rhythm: "ventricular_tachycardia", pulse: "severely_reduced", heartRate: 188, systolicBp: 68, diastolicBp: 38, spo2: 91, respiratoryRate: 24, breathing: "hypoventilating", mentalStatus: "altered", phase: "unstable", trajectory: "deteriorating", hidden: { cardiacOutput: 0.3, coronaryPerfusion: 0.28, cerebralPerfusion: 0.3, oxygenation: 0.7, ventilation: 0.55, circulatingVolume: 0.88, vascularTone: 0.54, myocardialFunction: 0.42, oxygenDebt: 28, metabolicDebt: 30, probabilityOfRosc: 0, probabilityOfReArrest: 0.3, causeLoad: 0.65 } } },
  { id: "vf-pulseless-vt", title: "VF / pulseless VT", subtitle: "A pulseless, unresponsive shockable arrest.", cause: "ventricular_instability", initial: { rhythm: "ventricular_fibrillation", pulse: "absent", heartRate: 0, systolicBp: 0, diastolicBp: 0, spo2: 72, respiratoryRate: 0, breathing: "apnoeic", mentalStatus: "unresponsive", phase: "cardiac_arrest", trajectory: "deteriorating", hidden: { cardiacOutput: 0, coronaryPerfusion: 0.08, cerebralPerfusion: 0.04, oxygenation: 0.35, ventilation: 0, circulatingVolume: 0.92, vascularTone: 0.45, myocardialFunction: 0.3, oxygenDebt: 55, metabolicDebt: 58, probabilityOfRosc: 0.35, probabilityOfReArrest: 0.45, causeLoad: 0.6 } } },
  { id: "pea", title: "PEA", subtitle: "Organised electrical activity without effective circulation.", cause: "hypovolaemia", initial: { rhythm: "pulseless_electrical_activity", pulse: "absent", heartRate: 82, systolicBp: 0, diastolicBp: 0, spo2: 70, respiratoryRate: 0, breathing: "apnoeic", mentalStatus: "unresponsive", phase: "cardiac_arrest", trajectory: "deteriorating", hidden: { cardiacOutput: 0.04, coronaryPerfusion: 0.06, cerebralPerfusion: 0.03, oxygenation: 0.3, ventilation: 0, circulatingVolume: 0.25, vascularTone: 0.35, myocardialFunction: 0.7, oxygenDebt: 62, metabolicDebt: 66, probabilityOfRosc: 0.18, probabilityOfReArrest: 0.7, causeLoad: 0.9 } } },
  { id: "asystole", title: "Asystole", subtitle: "True non-shockable arrest requiring continued resuscitation and cause management.", cause: "prolonged_hypoxia", initial: { rhythm: "asystole", pulse: "absent", heartRate: 0, systolicBp: 0, diastolicBp: 0, spo2: 58, respiratoryRate: 0, breathing: "apnoeic", mentalStatus: "unresponsive", phase: "cardiac_arrest", trajectory: "deteriorating", hidden: { cardiacOutput: 0, coronaryPerfusion: 0.02, cerebralPerfusion: 0.01, oxygenation: 0.18, ventilation: 0, circulatingVolume: 0.8, vascularTone: 0.25, myocardialFunction: 0.18, oxygenDebt: 78, metabolicDebt: 82, probabilityOfRosc: 0.08, probabilityOfReArrest: 0.9, causeLoad: 0.85 } } },
  { id: "rosc-post-arrest", title: "ROSC and post-arrest deterioration", subtitle: "Pulse returns, but ventilation and perfusion remain unstable.", cause: "post_arrest_shock", initial: { rhythm: "sinus_rhythm", pulse: "reduced", heartRate: 108, systolicBp: 76, diastolicBp: 44, spo2: 84, respiratoryRate: 8, breathing: "hypoventilating", mentalStatus: "altered", phase: "post_rosc", trajectory: "rosc", hidden: { cardiacOutput: 0.42, coronaryPerfusion: 0.5, cerebralPerfusion: 0.42, oxygenation: 0.48, ventilation: 0.32, circulatingVolume: 0.76, vascularTone: 0.5, myocardialFunction: 0.55, oxygenDebt: 38, metabolicDebt: 48, probabilityOfRosc: 0, probabilityOfReArrest: 0.5, causeLoad: 0.7 } } },
  { id: "acs-to-vf", title: "ACS to VF arrest", subtitle: "Chest discomfort progresses through ischaemia to ventricular arrest.", cause: "coronary_thrombosis", initial: { rhythm: "sinus_tachycardia", pulse: "adequate", heartRate: 104, systolicBp: 138, diastolicBp: 84, spo2: 96, respiratoryRate: 20, breathing: "adequate", mentalStatus: "alert", phase: "stable", trajectory: "deteriorating", hidden: { cardiacOutput: 0.85, coronaryPerfusion: 0.5, cerebralPerfusion: 0.84, oxygenation: 0.93, ventilation: 0.9, circulatingVolume: 0.95, vascularTone: 0.82, myocardialFunction: 0.74, oxygenDebt: 8, metabolicDebt: 10, probabilityOfRosc: 0.2, probabilityOfReArrest: 0.35, causeLoad: 0.78 } } },
  { id: "hypoxia-to-arrest", title: "Hypoxia to arrest", subtitle: "Respiratory failure progresses to bradycardia and arrest when untreated.", cause: "hypoxia", initial: { rhythm: "sinus_tachycardia", pulse: "reduced", heartRate: 126, systolicBp: 102, diastolicBp: 60, spo2: 78, respiratoryRate: 32, breathing: "hypoventilating", mentalStatus: "confused", phase: "unstable", trajectory: "deteriorating", hidden: { cardiacOutput: 0.58, coronaryPerfusion: 0.62, cerebralPerfusion: 0.52, oxygenation: 0.35, ventilation: 0.38, circulatingVolume: 0.88, vascularTone: 0.68, myocardialFunction: 0.62, oxygenDebt: 48, metabolicDebt: 42, probabilityOfRosc: 0.25, probabilityOfReArrest: 0.55, causeLoad: 0.8 } } },
  { id: "reversible-cause-arrest", title: "Reversible-cause arrest", subtitle: "Arrest with evidence that must guide cause-specific treatment.", cause: "tension_pneumothorax", initial: { rhythm: "pulseless_electrical_activity", pulse: "absent", heartRate: 96, systolicBp: 0, diastolicBp: 0, spo2: 64, respiratoryRate: 0, breathing: "apnoeic", mentalStatus: "unresponsive", phase: "cardiac_arrest", trajectory: "deteriorating", hidden: { cardiacOutput: 0.03, coronaryPerfusion: 0.04, cerebralPerfusion: 0.02, oxygenation: 0.24, ventilation: 0, circulatingVolume: 0.88, vascularTone: 0.4, myocardialFunction: 0.64, oxygenDebt: 64, metabolicDebt: 68, probabilityOfRosc: 0.12, probabilityOfReArrest: 0.8, causeLoad: 0.92 } } },
];

export function getAdultAclsScenario(id: AdultAclsScenarioId) { return ADULT_ACLS_SCENARIOS.find((scenario) => scenario.id === id)!; }
export function isAdultAclsProgrammeCompatible(program: string, scenarioId: AdultAclsScenarioId): boolean { return program === "acls" && getSimulationClinicalPackage("acls").ageGroup === "adult" && Boolean(getAdultAclsScenario(scenarioId)); }

function clamp(value: number, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
function derivePatient(patient: AdultAclsPatient): AdultAclsPatient {
  const h = patient.hidden;
  const perfusion = clamp(h.cardiacOutput * 0.65 + h.vascularTone * 0.35);
  const pulse: AdultAclsPulse = patient.phase === "cardiac_arrest" ? "absent" : perfusion >= 0.7 ? "adequate" : perfusion >= 0.45 ? "reduced" : "severely_reduced";
  const mentalStatus: AdultAclsMentalStatus = patient.phase === "cardiac_arrest" ? "unresponsive" : h.cerebralPerfusion < 0.3 ? "unresponsive" : h.cerebralPerfusion < 0.5 ? "altered" : h.cerebralPerfusion < 0.7 ? "confused" : "alert";
  const breathing: AdultAclsBreathing = h.ventilation < 0.2 ? "apnoeic" : h.ventilation < 0.55 ? "hypoventilating" : "adequate";
  const phase: AdultAclsPhase = patient.phase === "cardiac_arrest" ? "cardiac_arrest" : patient.phase === "rosc" ? "post_rosc" : perfusion < 0.25 ? "peri_arrest" : perfusion < 0.48 || mentalStatus === "altered" ? "unstable" : "stable";
  const trajectory = phase === "post_rosc" ? "rosc" : h.metabolicDebt > 75 ? "re_arrest" : h.causeLoad > 0.75 ? "deteriorating" : h.metabolicDebt < 25 ? "improving" : "stable";
  return { ...patient, pulse, mentalStatus, breathing, phase, trajectory, spo2: Math.round(clamp(45 + h.oxygenation * 54 - h.oxygenDebt * 0.06, 35, 99)), systolicBp: phase === "cardiac_arrest" ? 0 : Math.round(45 + perfusion * 105), diastolicBp: phase === "cardiac_arrest" ? 0 : Math.round(25 + perfusion * 58), respiratoryRate: breathing === "apnoeic" ? 0 : Math.round(8 + h.ventilation * 22), heartRate: phase === "cardiac_arrest" ? (patient.rhythm === "pulseless_electrical_activity" ? 82 : 0) : patient.heartRate };
}

export function createAdultAclsSimulation(scenarioId: AdultAclsScenarioId, role: SimulationWorldRole = "team_leader"): AdultAclsState {
  const scenario = getAdultAclsScenario(scenarioId);
  return { scenarioId, role, elapsedSeconds: 0, patient: structuredClone(scenario.initial), observations: {}, events: [], environment: { oxygenAvailable: true, ventilationAvailable: true, defibrillatorReady: true, pacingAvailable: true, synchronized: false, cprActive: false }, criticalFailures: [], competencies: { recognition: 0, interventionSelection: 0, sequencing: 0, execution: 0, reassessment: 0, teamPerformance: 0 } };
}

function addEvent(state: AdultAclsState, type: string, description: string, correct?: boolean, consequence?: string): AdultAclsState { return { ...state, events: [...state.events, { timestamp: state.elapsedSeconds, type, description, correct, consequence }] }; }
function fail(state: AdultAclsState, message: string) { return addEvent({ ...state, criticalFailures: [...state.criticalFailures, message], competencies: { ...state.competencies, execution: Math.max(0, state.competencies.execution - 20) } }, "critical_failure", message, false, message); }

export function advanceAdultAclsSimulation(state: AdultAclsState, seconds: number): AdultAclsState {
  if (seconds <= 0 || state.patient.phase === "ended") return state;
  const next = structuredClone(state);
  next.elapsedSeconds = Number((state.elapsedSeconds + seconds).toFixed(2));
  const h = next.patient.hidden;
  const arrested = next.patient.phase === "cardiac_arrest";
  h.oxygenDebt = clamp(h.oxygenDebt + seconds * (next.environment.ventilationAvailable && next.patient.breathing !== "apnoeic" ? 0.08 : 0.42), 0, 100);
  h.metabolicDebt = clamp(h.metabolicDebt + seconds * (arrested && next.environment.cprActive ? 0.12 : 0.35), 0, 100);
  if (!next.environment.cprActive && arrested) h.coronaryPerfusion = clamp(h.coronaryPerfusion - seconds * 0.01);
  if (h.causeLoad > 0.3 && !next.environment.cprActive) h.cardiacOutput = clamp(h.cardiacOutput - seconds * 0.006);
  if (next.patient.phase !== "cardiac_arrest" && h.cardiacOutput < 0.2) next.patient = { ...next.patient, phase: "cardiac_arrest", rhythm: next.patient.rhythm === "ventricular_tachycardia" ? "ventricular_tachycardia" : "pulseless_electrical_activity", pulse: "absent", mentalStatus: "unresponsive" };
  if (next.patient.phase === "post_rosc" && h.cardiacOutput < 0.25) next.patient = { ...next.patient, phase: "cardiac_arrest", rhythm: "ventricular_fibrillation", pulse: "absent", mentalStatus: "unresponsive" };
  next.patient = derivePatient(next.patient);
  return addEvent(next, "time_advanced", `${seconds} seconds elapsed`);
}

export function reduceAdultAclsSimulation(state: AdultAclsState, command: AdultAclsCommand): AdultAclsState {
  let next = advanceAdultAclsSimulation(state, command.type === "assess" || command.type === "reassess" ? 2 : 5);
  const p = next.patient;
  switch (command.type) {
    case "assess":
      next = { ...next, observations: { ...next.observations, [command.target]: command.target === "blood_pressure" ? p.systolicBp : command.target === "spo2" ? p.spo2 : command.target === "heart_rate" ? p.heartRate : 1 }, competencies: { ...next.competencies, recognition: Math.min(100, next.competencies.recognition + 8) } };
      return addEvent(next, "assessment", `Observed ${command.target}`, true);
    case "reassess":
      return addEvent({ ...next, competencies: { ...next.competencies, reassessment: Math.min(100, next.competencies.reassessment + 10) } }, "reassessment", "Reassessed rhythm, pulse, pressure, breathing, and mental status", true);
    case "give_oxygen":
      next.patient.hidden.oxygenation = clamp(next.patient.hidden.oxygenation + 0.12);
      return addEvent({ ...next, competencies: { ...next.competencies, interventionSelection: next.competencies.interventionSelection + 4 } }, "oxygen", "Supplemental oxygen applied; ventilation remains independently assessed", true);
    case "assist_ventilation":
      next.patient.hidden.ventilation = clamp(next.patient.hidden.ventilation + 0.22);
      next.environment.ventilationAvailable = true;
      next.patient.hidden.oxygenation = clamp(next.patient.hidden.oxygenation + 0.08);
      next.patient = derivePatient(next.patient);
      return addEvent(next, "ventilation", "Assisted ventilation delivered; reassess chest movement and CO₂ clearance", true);
    case "start_cpr":
      if (p.phase !== "cardiac_arrest") return fail(next, "CPR started without cardiac arrest; reassess the patient state");
      next.environment.cprActive = true;
      next.patient.hidden.coronaryPerfusion = clamp(next.patient.hidden.coronaryPerfusion + 0.18);
      next.patient.hidden.cerebralPerfusion = clamp(next.patient.hidden.cerebralPerfusion + 0.12);
      return addEvent(next, "cpr", "CPR started; perfusion is supported but not normal", true);
    case "defibrillate":
      if (p.phase !== "cardiac_arrest" || !["ventricular_fibrillation", "ventricular_tachycardia"].includes(p.rhythm)) return fail(next, "Defibrillation is not therapeutically indicated for this state");
      next.environment.cprActive = false;
      if (next.patient.hidden.probabilityOfRosc >= 0.3 && next.patient.hidden.coronaryPerfusion >= 0.2) { next.patient = { ...next.patient, phase: "rosc", rhythm: "sinus_rhythm", pulse: "reduced", mentalStatus: "altered" }; next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.35); return addEvent(next, "defibrillation", "Shock delivered; organised rhythm and pulse require reassessment", true); }
      next.patient.hidden.probabilityOfRosc = clamp(next.patient.hidden.probabilityOfRosc + 0.08);
      return addEvent(next, "defibrillation", "Shock delivered; rhythm remains shockable pending reassessment", true);
    case "synchronized_cardioversion":
      if (p.phase === "cardiac_arrest" || p.pulse === "absent" || !next.environment.synchronized) return fail(next, "Synchronized cardioversion requires a pulse, appropriate rhythm, and synchronization");
      if (["supraventricular_tachycardia", "atrial_fibrillation", "atrial_flutter", "ventricular_tachycardia"].includes(p.rhythm)) { next.patient = { ...next.patient, rhythm: "sinus_rhythm", heartRate: 92 }; next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.22); return addEvent(next, "cardioversion", "Synchronized cardioversion delivered; reassess rhythm and perfusion", true); }
      return fail(next, "Rhythm is not an appropriate synchronized-cardioversion target");
    case "pace":
      if (p.phase === "cardiac_arrest" || p.rhythm !== "sinus_bradycardia" || !next.environment.pacingAvailable) return fail(next, "Pacing is not valid for the current state");
      next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.18);
      return addEvent(next, "pacing", "Electrical pacing attempted; mechanical capture and pulse still require confirmation", true);
    case "give_epinephrine":
      if (p.phase !== "cardiac_arrest") return fail(next, "Arrest medication used outside a validated arrest state");
      next.patient.hidden.vascularTone = clamp(next.patient.hidden.vascularTone + 0.12);
      next.patient.hidden.coronaryPerfusion = clamp(next.patient.hidden.coronaryPerfusion + 0.1);
      return addEvent(next, "medication", "Protocol-governed epinephrine effect applied; ROSC is not automatic", true);
    case "give_antiarrhythmic":
      if (!["ventricular_fibrillation", "ventricular_tachycardia"].includes(p.rhythm)) return fail(next, "Antiarrhythmic is not validated for this rhythm state");
      next.patient.hidden.probabilityOfRosc = clamp(next.patient.hidden.probabilityOfRosc + 0.1);
      return addEvent(next, "medication", "Ventricular antiarrhythmic effect applied; rhythm reassessment required", true);
    case "give_adenosine":
      if (p.rhythm !== "supraventricular_tachycardia" || p.phase !== "stable") return fail(next, "Adenosine is not appropriate for this rhythm/stability state");
      next.patient = { ...next.patient, rhythm: "sinus_rhythm", heartRate: 88 };
      return addEvent(next, "medication", "Rhythm-dependent adenosine response observed; reassess stability", true);
    case "give_atropine":
      if (p.rhythm !== "sinus_bradycardia" || p.phase !== "unstable") return fail(next, "Atropine is not appropriate for this rhythm/stability state");
      next.patient = { ...next.patient, heartRate: 64, rhythm: "sinus_rhythm" };
      next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.18);
      return addEvent(next, "medication", "Bradycardia response observed; reassess pressure and mental status", true);
    case "treat_reversible_cause":
      next.patient.hidden.causeLoad = clamp(next.patient.hidden.causeLoad - 0.35);
      next.patient.hidden.probabilityOfRosc = clamp(next.patient.hidden.probabilityOfRosc + 0.18);
      return addEvent(next, "cause_treatment", "Cause-specific treatment attempted; observe for delayed physiological response", true);
  }
}

export function calculateAdultAclsTrainingEvidence(state: AdultAclsState) {
  return { scenarioId: state.scenarioId, durationSeconds: state.elapsedSeconds, phase: state.patient.phase, roscObserved: state.patient.phase === "post_rosc" || state.patient.trajectory === "rosc", criticalFailures: state.criticalFailures.length, evidenceStatus: "simulation_performance_recorded" as const, competenceClaim: false, credentialClaim: false };
}
