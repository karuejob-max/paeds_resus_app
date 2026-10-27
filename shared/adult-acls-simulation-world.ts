import { getAdultAclsCaseDefinition, type AdultAclsEventRequirement } from "./adult-acls-case-definitions";
import type { SimulationWorldRole } from "./simulation-world";
import { getSimulationClinicalPackage } from "./simulation-clinical-packages";

export const ADULT_ACLS_WORLD_VERSION = "1.4.0";
export const ADULT_ACLS_SCENARIO_VERSION = "1.4.0";
export const ADULT_ACLS_CLINICAL_STATUS = "clinical_review" as const;
export const ADULT_ACLS_END_STATE_MIN_SPO2 = 90;
/** Untreated ACS escalates to VF arrest after this many simulated seconds without reperfusion activation. Must stay below the physiological PEA-arrest time (~110 s). Clinical owner to confirm. */
export const ADULT_ACLS_ACS_ESCALATION_SECONDS = 90;
/** Cue assessments that are informative for each reversible cause. A cue unrelated to the chosen cause does not license treating it. */
export const ADULT_ACLS_CAUSE_CUE_TARGETS: Record<"hypovolaemia" | "prolonged_hypoxia" | "tension_pneumothorax", readonly string[]> = {
  hypovolaemia: ["bleeding", "airway_history", "neck_veins"],
  prolonged_hypoxia: ["airway_history", "breath_sounds"],
  tension_pneumothorax: ["breath_sounds", "trachea", "neck_veins"],
};
export const ADULT_ACLS_END_STATE_MIN_SYSTOLIC_BP = 90;
/** Browser/network delay is bounded so manual interaction is not itself a clinical error. */
export const ADULT_ACLS_MAX_ACTION_ADVANCE_SECONDS = 5;

export type AdultAclsScenarioId =
  | "unstable-bradycardia"
  | "high-grade-av-block"
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
  | "complete_heart_block"
  | "supraventricular_tachycardia"
  | "atrial_fibrillation"
  | "atrial_flutter"
  | "ventricular_tachycardia"
  | "ventricular_fibrillation"
  | "pulseless_electrical_activity"
  | "asystole";

export type AdultAclsPhase = "stable" | "unstable" | "peri_arrest" | "cardiac_arrest" | "rosc" | "post_rosc" | "ended" | "failed";
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
  | { type: "assess"; target: "rhythm" | "pulse" | "blood_pressure" | "breathing" | "mental_status" | "spo2" | "heart_rate" | "breath_sounds" | "trachea" | "neck_veins" | "bleeding" | "airway_history" }
  | { type: "reassess" }
  | { type: "start_cpr" }
  | { type: "give_oxygen" }
  | { type: "assist_ventilation" }
  | { type: "support_perfusion" }
  | { type: "defibrillate" }
  | { type: "synchronized_cardioversion" }
  | { type: "pace" }
  | { type: "give_epinephrine" }
  | { type: "give_antiarrhythmic" }
  | { type: "give_adenosine" }
  | { type: "give_atropine" }
  | { type: "obtain_ecg" }
  | { type: "give_aspirin" }
  | { type: "activate_reperfusion" }
  | { type: "treat_reversible_cause"; cause: "hypovolaemia" | "prolonged_hypoxia" | "tension_pneumothorax" }
  | { type: "prepare_synchronized_cardioversion" }
  | { type: "end_rehearsal" };
export type AdultAclsAssessmentTarget = Extract<AdultAclsCommand, { type: "assess" }>["target"];

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

export type AdultAclsScoreBreakdown = {
  score: number;
  terminalOutcome: boolean;
  assessment: boolean;
  indicatedAction: boolean;
  reassessment: boolean;
  safeEndState: boolean;
  criticalFailures: boolean;
  poorChoices: string[];
  reasons: string[];
};

export type AdultAclsNextAction = {
  label: string;
  command: AdultAclsCommand;
  reason: string;
};

export const ADULT_ACLS_SCENARIOS: readonly { id: AdultAclsScenarioId; title: string; subtitle: string; initial: AdultAclsPatient; cause: string }[] = [
  { id: "unstable-bradycardia", title: "Unstable sinus bradycardia", subtitle: "A slow sinus rhythm with hypotension and altered mental status; atropine is first-line before pacing escalation.", cause: "conduction_failure", initial: { rhythm: "sinus_bradycardia", pulse: "severely_reduced", heartRate: 38, systolicBp: 78, diastolicBp: 46, spo2: 94, respiratoryRate: 18, breathing: "adequate", mentalStatus: "altered", phase: "unstable", trajectory: "deteriorating", hidden: { cardiacOutput: 0.35, coronaryPerfusion: 0.42, cerebralPerfusion: 0.4, oxygenation: 0.86, ventilation: 0.8, circulatingVolume: 0.9, vascularTone: 0.62, myocardialFunction: 0.52, oxygenDebt: 18, metabolicDebt: 20, probabilityOfRosc: 0, probabilityOfReArrest: 0.2, causeLoad: 0.7 } } },
  { id: "high-grade-av-block", title: "High-grade AV block", subtitle: "Mobitz II / complete heart block with instability; pacing or an infusion is the escalation. Atropine is ineffective but not a critical failure.", cause: "conduction_failure", initial: { rhythm: "complete_heart_block", pulse: "severely_reduced", heartRate: 30, systolicBp: 72, diastolicBp: 40, spo2: 94, respiratoryRate: 18, breathing: "adequate", mentalStatus: "altered", phase: "unstable", trajectory: "deteriorating", hidden: { cardiacOutput: 0.3, coronaryPerfusion: 0.38, cerebralPerfusion: 0.34, oxygenation: 0.86, ventilation: 0.8, circulatingVolume: 0.9, vascularTone: 0.58, myocardialFunction: 0.45, oxygenDebt: 20, metabolicDebt: 23, probabilityOfRosc: 0, probabilityOfReArrest: 0.25, causeLoad: 0.75 } } },
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
export function getAdultAclsAssessmentCue(scenarioId: AdultAclsScenarioId, target: AdultAclsAssessmentTarget): string | number {
  switch (target) {
    case "breath_sounds": return scenarioId === "reversible-cause-arrest" ? "Absent on the right; trachea deviated" : scenarioId === "hypoxia-to-arrest" ? "Very poor air entry with shallow breaths" : "No focal abnormality heard";
    case "trachea": return scenarioId === "reversible-cause-arrest" ? "Deviated away from the right chest" : "Midline";
    case "neck_veins": return scenarioId === "reversible-cause-arrest" ? "Distended" : "Not distended";
    case "bleeding": return scenarioId === "pea" ? "Cool extremities; no external bleeding seen" : "No external bleeding seen";
    case "airway_history": return scenarioId === "asystole" ? "Witness reports prolonged hypoxia before collapse" : scenarioId === "pea" ? "History suggests fluid loss" : "No contributory history identified";
    default: return 1;
  }
}
function hasCauseCueAssessment(state: AdultAclsState) {
  return state.events.some((event) => event.type === "cause_assessment");
}
function hasCueForCause(state: AdultAclsState, cause: keyof typeof ADULT_ACLS_CAUSE_CUE_TARGETS) {
  const targets = ADULT_ACLS_CAUSE_CUE_TARGETS[cause] ?? [];
  return state.events.some((event) => event.type === "cause_assessment" && targets.some((target) => event.description.startsWith(`Observed ${target}:`)));
}
function hasRhythmAssessment(state: AdultAclsState) {
  return state.events.some((event) => event.type === "assessment" && event.description.startsWith("Observed rhythm"));
}
function hasAssessmentTarget(state: AdultAclsState, target: AdultAclsAssessmentTarget) {
  return state.events.some((event) => event.type === (target === "breath_sounds" || target === "trachea" || target === "neck_veins" || target === "bleeding" || target === "airway_history" ? "cause_assessment" : "assessment") && event.description.startsWith(`Observed ${target}:`));
}
function hasEvent(state: AdultAclsState, type: string) {
  return state.events.some((event) => event.type === type);
}

/**
 * Select one visible next action without hiding the full command catalogue.
 * This is guidance only: the server still validates and scores every command.
 */
export function getAdultAclsNextAction(state: AdultAclsState): AdultAclsNextAction | null {
  if (state.patient.phase === "failed" || state.patient.phase === "ended") return null;
  if (state.patient.phase === "cardiac_arrest") {
    if (!hasRhythmAssessment(state)) return { label: "Assess rhythm", command: { type: "assess", target: "rhythm" }, reason: "Confirm shockable versus non-shockable rhythm before choosing the arrest pathway." };
    if (!state.environment.cprActive) return { label: "Start CPR", command: { type: "start_cpr" }, reason: "Provide high-quality CPR before the next rhythm-directed intervention." };
    if (["ventricular_fibrillation", "ventricular_tachycardia"].includes(state.patient.rhythm) && !hasEvent(state, "defibrillation")) return { label: "Defibrillate", command: { type: "defibrillate" }, reason: "The observed rhythm is shockable and CPR is active." };
    if (!["ventricular_fibrillation", "ventricular_tachycardia"].includes(state.patient.rhythm) && !hasEvent(state, "medication")) return { label: "Epinephrine", command: { type: "give_epinephrine" }, reason: "The observed rhythm is non-shockable; give arrest medication while CPR continues." };
    const cause = getAdultAclsScenario(state.scenarioId).cause;
    const causeTargets = (ADULT_ACLS_CAUSE_CUE_TARGETS[cause as keyof typeof ADULT_ACLS_CAUSE_CUE_TARGETS] ?? []);
    const target = causeTargets.find((candidate) => !hasAssessmentTarget(state, candidate as AdultAclsAssessmentTarget));
    if (target) {
      const labels: Record<string, string> = { breath_sounds: "Assess breath sounds", trachea: "Assess trachea", neck_veins: "Assess neck veins", bleeding: "Assess bleeding/volume", airway_history: "Ask airway/hypoxia history" };
      return { label: labels[target] ?? "Assess the cause", command: { type: "assess", target: target as AdultAclsAssessmentTarget }, reason: "Gather a cue that is relevant to the suspected reversible cause before treating it." };
    }
    if (!hasEvent(state, "cause_treatment")) {
      const causeLabels: Record<string, string> = { hypovolaemia: "Treat hypovolaemia", prolonged_hypoxia: "Treat prolonged hypoxia", tension_pneumothorax: "Treat tension pneumothorax" };
      return { label: causeLabels[cause] ?? "Treat the reversible cause", command: { type: "treat_reversible_cause", cause: cause as "hypovolaemia" | "prolonged_hypoxia" | "tension_pneumothorax" }, reason: "The relevant cause cue has been observed; treat the matching reversible cause." };
    }
    return { label: "Reassess", command: { type: "reassess" }, reason: "Reassess rhythm and pulse to look for ROSC or continue the arrest cycle." };
  }
  if (state.patient.phase === "post_rosc" || state.patient.phase === "rosc") {
    if (state.patient.spo2 < ADULT_ACLS_END_STATE_MIN_SPO2 || !hasEvent(state, "oxygen")) return { label: "Give oxygen", command: { type: "give_oxygen" }, reason: "Protect oxygenation after ROSC and bring SpO₂ to the safe target." };
    if (state.patient.breathing !== "adequate" || !hasEvent(state, "ventilation")) return { label: "Assist ventilation", command: { type: "assist_ventilation" }, reason: "Support ventilation and reassess chest movement and gas exchange." };
    if (state.patient.systolicBp < ADULT_ACLS_END_STATE_MIN_SYSTOLIC_BP || !hasEvent(state, "perfusion_support")) return { label: "Support perfusion", command: { type: "support_perfusion" }, reason: "Support circulation and restore a safe blood-pressure endpoint." };
    return { label: "Reassess", command: { type: "reassess" }, reason: "Confirm sustained ROSC, perfusion, oxygenation, and mental status before saving." };
  }
  if (state.scenarioId === "unstable-bradycardia") {
    if (!hasRhythmAssessment(state)) return { label: "Assess rhythm", command: { type: "assess", target: "rhythm" }, reason: "Confirm the rhythm before atropine or pacing." };
    if (!hasEvent(state, "medication") && !hasEvent(state, "pacing")) return { label: "Atropine", command: { type: "give_atropine" }, reason: "The patient is unstable with sinus bradycardia; give the indicated first-line treatment, then reassess." };
  }
  if (state.scenarioId === "high-grade-av-block") {
    if (!hasRhythmAssessment(state)) return { label: "Assess rhythm", command: { type: "assess", target: "rhythm" }, reason: "Confirm high-grade AV block before selecting pacing or infusion support." };
    if (!hasEvent(state, "pacing")) return { label: "Pace", command: { type: "pace" }, reason: "High-grade AV block is unstable; pacing is the recommended escalation." };
  }
  if (state.scenarioId === "stable-narrow-tachycardia") {
    if (!hasRhythmAssessment(state)) return { label: "Assess rhythm", command: { type: "assess", target: "rhythm" }, reason: "Confirm the rhythm before giving rhythm-specific medication." };
    if (!hasEvent(state, "medication")) return { label: "Adenosine", command: { type: "give_adenosine" }, reason: "The stable narrow-complex rhythm is ready for the indicated medication." };
  }
  if (state.scenarioId === "unstable-tachycardia") {
    if (!hasRhythmAssessment(state)) return { label: "Assess rhythm", command: { type: "assess", target: "rhythm" }, reason: "Confirm the rhythm before synchronized treatment." };
    if (!hasEvent(state, "synchronization")) return { label: "Prepare synchronized cardioversion", command: { type: "prepare_synchronized_cardioversion" }, reason: "Prepare synchronized treatment for an unstable perfusing tachyarrhythmia." };
    if (!hasEvent(state, "cardioversion")) return { label: "Synchronized cardioversion", command: { type: "synchronized_cardioversion" }, reason: "Deliver the prepared synchronized intervention, then reassess." };
  }
  if (state.scenarioId === "acs-to-vf") {
    if (!hasEvent(state, "ecg")) return { label: "Obtain 12-lead ECG", command: { type: "obtain_ecg" }, reason: "Confirm the ischemic pathway before escalation." };
    if (!hasEvent(state, "acs_medication")) return { label: "Give aspirin", command: { type: "give_aspirin" }, reason: "Give the indicated ACS medication after checking contraindications." };
    if (!hasEvent(state, "reperfusion")) return { label: "Activate reperfusion", command: { type: "activate_reperfusion" }, reason: "Escalate the confirmed ACS pathway without delay." };
  }
  if (state.scenarioId === "hypoxia-to-arrest" && !hasAssessmentTarget(state, "breathing")) return { label: "Assess breathing", command: { type: "assess", target: "breathing" }, reason: "Confirm the respiratory problem before supporting oxygenation and ventilation." };
  if (state.patient.phase === "unstable" && state.patient.breathing !== "adequate") return { label: "Assist ventilation", command: { type: "assist_ventilation" }, reason: "The patient is hypoventilating; support ventilation and reassess." };
  return { label: "Reassess", command: { type: "reassess" }, reason: "Reassess the patient response before taking another action or saving." };
}
function hasSafeEndState(state: AdultAclsState) {
  return state.patient.spo2 >= ADULT_ACLS_END_STATE_MIN_SPO2 && state.patient.systolicBp >= ADULT_ACLS_END_STATE_MIN_SYSTOLIC_BP && state.patient.mentalStatus !== "unresponsive";
}

function clamp(value: number, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
function derivePatient(patient: AdultAclsPatient): AdultAclsPatient {
  const h = patient.hidden;
  const perfusion = clamp(h.cardiacOutput * 0.65 + h.vascularTone * 0.35);
  const pulse: AdultAclsPulse = patient.phase === "cardiac_arrest" || patient.phase === "failed" ? "absent" : perfusion >= 0.7 ? "adequate" : perfusion >= 0.45 ? "reduced" : "severely_reduced";
  const mentalStatus: AdultAclsMentalStatus = patient.phase === "cardiac_arrest" || patient.phase === "failed" ? "unresponsive" : h.cerebralPerfusion < 0.3 ? "unresponsive" : h.cerebralPerfusion < 0.5 ? "altered" : h.cerebralPerfusion < 0.7 ? "confused" : "alert";
  const breathing: AdultAclsBreathing = h.ventilation < 0.2 ? "apnoeic" : h.ventilation < 0.55 ? "hypoventilating" : "adequate";
  const phase: AdultAclsPhase = patient.phase === "failed" || patient.phase === "ended" ? patient.phase : patient.phase === "cardiac_arrest" ? "cardiac_arrest" : patient.phase === "rosc" || patient.phase === "post_rosc" ? "post_rosc" : perfusion < 0.25 ? "peri_arrest" : perfusion < 0.48 || mentalStatus === "altered" ? "unstable" : "stable";
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
  if (h.causeLoad > 0.3 && !next.environment.cprActive) h.cardiacOutput = clamp(h.cardiacOutput - seconds * (next.patient.phase === "post_rosc" ? 0.001 : 0.006));
  if (next.patient.phase !== "cardiac_arrest" && h.cardiacOutput < 0.2) next.patient = { ...next.patient, phase: "cardiac_arrest", rhythm: next.patient.rhythm === "ventricular_tachycardia" ? "ventricular_tachycardia" : "pulseless_electrical_activity", pulse: "absent", mentalStatus: "unresponsive" };
  if (next.patient.phase === "post_rosc" && h.cardiacOutput < 0.25) next.patient = { ...next.patient, phase: "cardiac_arrest", rhythm: "ventricular_fibrillation", pulse: "absent", mentalStatus: "unresponsive" };
  if (next.patient.phase === "cardiac_arrest" && h.metabolicDebt >= 100) {
    next.patient = { ...next.patient, phase: "failed", pulse: "absent", mentalStatus: "unresponsive", trajectory: "deteriorating" };
  }
  const acsStalled = next.scenarioId === "acs-to-vf"
    && next.patient.phase !== "cardiac_arrest" && next.patient.phase !== "failed" && next.patient.phase !== "ended"
    && next.elapsedSeconds >= ADULT_ACLS_ACS_ESCALATION_SECONDS
    && !next.events.some((event) => event.type === "reperfusion" || event.type === "acs_escalation");
  if (acsStalled) {
    next.patient = { ...structuredClone(getAdultAclsScenario("vf-pulseless-vt").initial), phase: "cardiac_arrest" };
    next.events = [...next.events, { timestamp: next.elapsedSeconds, type: "acs_escalation", description: "Untreated acute coronary syndrome progressed to ventricular fibrillation arrest", correct: false, consequence: "Reperfusion was not activated in time" }];
  }
  next.patient = derivePatient(next.patient);
  if (next.patient.phase === "failed") return addEvent(next, "patient_death", "Patient died after untreated cardiac arrest; debrief remains available", false, "Scenario failed");
  return addEvent(next, "time_advanced", `${seconds} seconds elapsed`);
}

export function canEndAdultAclsSimulation(state: AdultAclsState): boolean {
  return state.patient.phase === "stable" || state.patient.phase === "post_rosc" || (state.patient.phase === "unstable" && hasSafeEndState(state)) || state.patient.phase === "ended" || state.patient.phase === "failed";
}

export function reduceAdultAclsSimulation(state: AdultAclsState, command: AdultAclsCommand): AdultAclsState {
  const actionAdvanceSeconds = command.type === "end_rehearsal" ? 0 : command.type === "give_oxygen" || command.type === "assist_ventilation" ? 1 : command.type === "assess" || command.type === "reassess" ? 2 : 5;
  let next = advanceAdultAclsSimulation(state, actionAdvanceSeconds);
  const p = next.patient;
  switch (command.type) {
    case "assess":
      next = { ...next, observations: { ...next.observations, [command.target]: command.target === "blood_pressure" ? p.systolicBp : command.target === "spo2" ? p.spo2 : command.target === "heart_rate" ? p.heartRate : getAdultAclsAssessmentCue(next.scenarioId, command.target) }, competencies: { ...next.competencies, recognition: Math.min(100, next.competencies.recognition + 8) } };
      return addEvent(next, ["breath_sounds", "trachea", "neck_veins", "bleeding", "airway_history"].includes(command.target) ? "cause_assessment" : "assessment", `Observed ${command.target}: ${String((next.observations as Record<string, string | number>)[command.target])}`, true);
    case "reassess":
      if (p.phase === "cardiac_arrest" && next.environment.cprActive && next.events.some((event) => event.type === "assessment" && event.description.startsWith("Observed rhythm")) && next.events.some((event) => event.type === "medication") && next.events.some((event) => event.type === "cause_treatment")) {
        const roscProbability = clamp(next.patient.hidden.probabilityOfRosc);
        const replaySeed = next.scenarioId === "pea" ? 0.12 : next.scenarioId === "asystole" ? 0.18 : 0.24;
        if (roscProbability < replaySeed) return addEvent(next, "reassessment", "Organised electrical activity remains without a pulse; continue CPR and reassess the cause", false, "No ROSC on this reassessment");
        next.patient = { ...next.patient, phase: "rosc", rhythm: "sinus_rhythm", pulse: "reduced", mentalStatus: "altered", trajectory: "rosc" };
        next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.3);
        next.patient = derivePatient(next.patient);
        return addEvent({ ...next, competencies: { ...next.competencies, reassessment: Math.min(100, next.competencies.reassessment + 10) } }, "rosc", "Reassessment confirms organised rhythm and a pulse after arrest treatment", true);
      }
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
    case "support_perfusion":
      if (p.phase !== "post_rosc" && p.phase !== "unstable") return fail(next, "Perfusion support is not indicated in the current state");
      next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.18);
      next.patient.hidden.vascularTone = clamp(next.patient.hidden.vascularTone + 0.12);
      next.patient.hidden.cerebralPerfusion = clamp(next.patient.hidden.cerebralPerfusion + 0.18);
      next.patient = derivePatient(next.patient);
      return addEvent(next, "perfusion_support", "Perfusion support delivered; reassess blood pressure, pulse, and mental status", true);
    case "start_cpr":
      if (p.phase !== "cardiac_arrest") return fail(next, "CPR started without cardiac arrest; reassess the patient state");
      if (next.environment.cprActive) return addEvent(next, "repeated_action", "CPR is already active; repeated command did not add perfusion credit", false);
      next.environment.cprActive = true;
      next.patient.hidden.coronaryPerfusion = clamp(next.patient.hidden.coronaryPerfusion + 0.22);
      next.patient.hidden.cerebralPerfusion = clamp(next.patient.hidden.cerebralPerfusion + 0.12);
      return addEvent(next, "cpr", "CPR started; perfusion is supported but not normal", true);
    case "defibrillate":
      if (p.phase !== "cardiac_arrest" || !["ventricular_fibrillation", "ventricular_tachycardia"].includes(p.rhythm)) return fail(next, "Defibrillation is not therapeutically indicated for this state");
      if (!next.events.some((event) => event.type === "assessment" && event.description.startsWith("Observed rhythm")) || !next.environment.cprActive) return fail(next, "Confirm the shockable rhythm and start CPR before defibrillation");
      next.environment.cprActive = false;
      if (next.patient.hidden.probabilityOfRosc >= 0.3 && next.patient.hidden.coronaryPerfusion >= 0.2) { next.patient = { ...next.patient, phase: "rosc", rhythm: "sinus_rhythm", pulse: "reduced", mentalStatus: "altered" }; next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.35); return addEvent(next, "defibrillation", "Shock delivered; organised rhythm and pulse require reassessment", true); }
      next.patient.hidden.probabilityOfRosc = clamp(next.patient.hidden.probabilityOfRosc + 0.08);
      return addEvent(next, "defibrillation", "Shock delivered; rhythm remains shockable pending reassessment", true);
    case "synchronized_cardioversion":
      if (p.phase === "cardiac_arrest" || p.pulse === "absent" || !next.environment.synchronized) return fail(next, "Synchronized cardioversion requires a pulse, appropriate rhythm, and synchronization");
      if (["supraventricular_tachycardia", "atrial_fibrillation", "atrial_flutter", "ventricular_tachycardia"].includes(p.rhythm)) { next.patient = { ...next.patient, rhythm: "sinus_rhythm", heartRate: 92 }; next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.22); next.patient.hidden.cerebralPerfusion = clamp(next.patient.hidden.cerebralPerfusion + 0.28); return addEvent(next, "cardioversion", "Synchronized cardioversion delivered; reassess rhythm and perfusion", true); }
      return fail(next, "Rhythm is not an appropriate synchronized-cardioversion target");
    case "pace":
      if (!hasRhythmAssessment(next)) return fail(next, "Assess the rhythm before pacing");
      if (p.phase === "cardiac_arrest" || !["sinus_bradycardia", "complete_heart_block"].includes(p.rhythm) || !next.environment.pacingAvailable) return fail(next, "Pacing is not valid for the current state");
      next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.18);
      next.patient.hidden.cerebralPerfusion = clamp(next.patient.hidden.cerebralPerfusion + 0.2);
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
      if (!hasRhythmAssessment(next)) return fail(next, "Assess the rhythm before giving atropine");
      if (p.rhythm === "complete_heart_block" && p.phase === "unstable") return addEvent(next, "medication", "Atropine given first for high-grade AV block; this is a poor choice because it is unlikely to work, but it is not a critical failure. Escalate to pacing or an infusion.", false);
      if (p.rhythm !== "sinus_bradycardia" || p.phase !== "unstable") return fail(next, "Atropine is not appropriate for the current rhythm/stability state");
      next.patient = { ...next.patient, heartRate: 64, rhythm: "sinus_rhythm" };
      next.patient.hidden.cardiacOutput = clamp(next.patient.hidden.cardiacOutput + 0.18);
      next.patient.hidden.cerebralPerfusion = clamp(next.patient.hidden.cerebralPerfusion + 0.2);
      return addEvent(next, "medication", "Bradycardia response observed; reassess pressure and mental status", true);
    case "obtain_ecg":
      if (p.phase === "cardiac_arrest") return fail(next, "Obtain the ECG when it will not delay immediate arrest care");
      return addEvent(next, "ecg", "12-lead ECG obtained; ischemic changes require escalation", true);
    case "give_aspirin":
      if (next.scenarioId !== "acs-to-vf") return fail(next, "Aspirin is not indicated for this scenario");
      return addEvent(next, "acs_medication", "Aspirin given after confirming no contraindication", true);
    case "activate_reperfusion":
      if (!next.events.some((event) => event.type === "ecg")) return fail(next, "Obtain and review the 12-lead ECG before activating reperfusion");
      if (next.scenarioId !== "acs-to-vf") return fail(next, "Reperfusion activation is not indicated for this scenario");
      return addEvent(next, "reperfusion", "Senior/cath-lab escalation activated for suspected acute coronary syndrome", true);
    case "treat_reversible_cause":
      if (p.phase !== "cardiac_arrest") return fail(next, "Treat the reversible cause only after confirming cardiac arrest and its rhythm");
      if (!hasCueForCause(next, command.cause)) return fail(next, "Assess at least one cue relevant to the selected cause before treating it");
      if (command.cause !== getAdultAclsScenario(next.scenarioId).cause) return fail(next, "The selected reversible cause does not match the scenario findings");
      next.patient.hidden.causeLoad = clamp(next.patient.hidden.causeLoad - 0.35);
      next.patient.hidden.probabilityOfRosc = clamp(next.patient.hidden.probabilityOfRosc + 0.18);
      return addEvent(next, "cause_treatment", `Cause-specific treatment delivered for ${command.cause}; observe for delayed physiological response`, true);
    case "prepare_synchronized_cardioversion":
      if (p.phase === "cardiac_arrest" || p.pulse === "absent") return fail(next, "Synchronization requires a perfusing patient and an appropriate rhythm");
      next.environment.synchronized = true;
      return addEvent(next, "synchronization", "Defibrillator synchronized; confirm rhythm, pulse, and instability before shock", true);
    case "end_rehearsal":
      if (!canEndAdultAclsSimulation(next)) return fail(next, "Rehearsal cannot end until the patient is stable or post-ROSC and reassessed");
      return addEvent({ ...next, patient: { ...next.patient, phase: next.patient.phase === "failed" ? "failed" : "ended" } }, "terminal_state", next.patient.phase === "failed" ? "Failed rehearsal closed; formative debrief is ready" : "Rehearsal ended after a stable or post-ROSC reassessment", next.patient.phase !== "failed");
  }
}

export function calculateAdultAclsTrainingEvidence(state: AdultAclsState) {
  return { scenarioId: state.scenarioId, durationSeconds: state.elapsedSeconds, phase: state.patient.phase, roscObserved: state.patient.phase === "post_rosc" || state.patient.trajectory === "rosc", criticalFailures: state.criticalFailures.length, evidenceStatus: "simulation_performance_recorded" as const, competenceClaim: false, credentialClaim: false };
}

/**
 * Score observable clinical performance rather than action counts.
 * This is deliberately conservative: a rehearsal must reach a valid terminal
 * outcome, include recognition and reassessment, and contain the indicated
 * intervention for its scenario family. Critical failures or a patient death
 * make the attempt fail regardless of the other components.
 */
export function getAdultAclsScoreBreakdown(state: AdultAclsState): AdultAclsScoreBreakdown {
  const eventTypes = new Set(state.events.map((event) => event.type));
  const hasAssessment = eventTypes.has("assessment");
  const hasReassessment = eventTypes.has("reassessment") || eventTypes.has("rosc");
  const terminalSuccess = state.patient.phase === "ended" && !eventTypes.has("patient_death");
  const has = (...types: string[]) => types.some((type) => eventTypes.has(type));
  const hasAll = (...types: string[]) => types.every((type) => eventTypes.has(type));
  const postRoscCare = hasAll("oxygen", "ventilation", "perfusion_support", "reassessment") && state.patient.spo2 >= 90 && state.patient.systolicBp >= 90;
  const definition = getAdultAclsCaseDefinition(state.scenarioId);
  const matches = (requirement: AdultAclsEventRequirement) => state.events.some((event) => event.type === requirement.type
    && (!requirement.descriptionIncludes || event.description.toLowerCase().includes(requirement.descriptionIncludes.toLowerCase())));
  const conditionalMet = (definition.conditionalRequirements ?? []).every((rule) => !eventTypes.has(rule.whenEventType) || rule.require.every(matches));
  // Instructor ordering rule: assess BEFORE the first treatment, reassess AFTER it.
  const assessmentTypes = new Set(["assessment", "reassessment", "cause_assessment"]);
  const treatmentTypes = new Set(definition.treatmentEventTypes ?? definition.requiredEvents.map((item) => item.type).filter((type) => !assessmentTypes.has(type)));
  const firstTreatment = state.events.findIndex((event) => treatmentTypes.has(event.type));
  const firstAssessment = state.events.findIndex((event) => event.type === "assessment" && (!definition.requiresRhythmAssessment || event.description.startsWith("Observed rhythm")));
  const lastReassessment = Math.max(...state.events.map((event, index) => (event.type === "reassessment" || event.type === "rosc" ? index : -1)), -1);
  const orderedCorrectly = firstTreatment < 0 || ((firstAssessment >= 0 && firstAssessment < firstTreatment) && lastReassessment > firstTreatment);
  const indicatedAction = definition.requiredEvents.every(matches)
    && orderedCorrectly
    && (!definition.requiresRhythmAssessment || hasRhythmAssessment(state))
    && (!definition.requiresPostRoscCare || postRoscCare)
    && conditionalMet;
  const poorChoices = (definition.poorChoices ?? []).filter((poor) => {
    const index = state.events.findIndex((event) => event.type === poor.type
      && (!poor.descriptionIncludes || event.description.toLowerCase().includes(poor.descriptionIncludes.toLowerCase())));
    if (index < 0) return false;
    if (!poor.beforeEventType) return true;
    const gate = state.events.findIndex((event) => event.type === poor.beforeEventType);
    return gate < 0 || index < gate;
  }).map((poor) => poor.reason);
  const safeEndState = hasSafeEndState(state);
  const terminalOutcome = state.patient.phase === "ended" && !eventTypes.has("patient_death");
  const criticalFailures = state.criticalFailures.length === 0 && !eventTypes.has("patient_death");
  const reasons: string[] = [];
  if (!terminalOutcome) reasons.push("The rehearsal did not reach a successful ended endpoint.");
  if (!indicatedAction) reasons.push("The required scenario-specific clinical actions were not all completed, or were not done in order (assess before treating, reassess after treating).");
  if (!safeEndState) reasons.push(`Unsafe endpoint: SpO₂ ${state.patient.spo2} (needs ≥ ${ADULT_ACLS_END_STATE_MIN_SPO2}), SBP ${state.patient.systolicBp} (needs ≥ ${ADULT_ACLS_END_STATE_MIN_SYSTOLIC_BP}), mental status ${state.patient.mentalStatus}.`);
  if (!criticalFailures) reasons.push("A critical failure or patient-death event occurred.");
  for (const reason of poorChoices) reasons.push(`Poor choice: ${reason}`);
  const components = [
    terminalSuccess ? 30 : 0,
    hasAssessment ? 20 : 0,
    indicatedAction ? 30 : 0,
    hasReassessment ? 20 : 0,
  ];
  const raw = components.reduce((sum, value) => sum + value, 0);
  return { score: !indicatedAction || !safeEndState || !terminalOutcome || !criticalFailures || poorChoices.length > 0 ? Math.min(60, raw) : raw, terminalOutcome, assessment: hasAssessment, indicatedAction, reassessment: hasReassessment, safeEndState, criticalFailures, poorChoices, reasons };
}
export function scoreAdultAclsTraining(state: AdultAclsState): number {
  return getAdultAclsScoreBreakdown(state).score;
}
