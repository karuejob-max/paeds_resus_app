import type { PracticeLabEvent } from "./practice-lab-types";

export const SIMULATION_WORLD_ROLES = [
  "team_leader",
  "airway_ventilation",
  "compressor_1",
  "compressor_2",
  "monitor_defib_coach",
  "iv_io_meds",
  "scribe",
] as const;
export type SimulationWorldRole = (typeof SIMULATION_WORLD_ROLES)[number];

export const SIMULATION_WORLD_SCENARIOS = [
  { id: "septic-shock-arrest", title: "03:17 — Emergency Department", subtitle: "A 4-year-old arrives pale, tachypnoeic, and tiring.", initialRhythm: "sinus_tachycardia", weightKg: 16, difficulty: "predictable" as const },
  { id: "respiratory-bradycardia", title: "11:42 — Paediatric Ward", subtitle: "A child with worsening respiratory failure is becoming bradycardic.", initialRhythm: "sinus_bradycardia", weightKg: 12, difficulty: "ambiguous" as const },
  { id: "postop-equipment", title: "22:08 — Recovery Room", subtitle: "A postoperative child deteriorates while oxygen and IV access are under pressure.", initialRhythm: "ventricular_fibrillation", weightKg: 20, difficulty: "chaotic" as const },
] as const;
export type SimulationWorldScenarioId = (typeof SIMULATION_WORLD_SCENARIOS)[number]["id"];

export type PatientState = {
  airway: "patent" | "threatened" | "obstructed";
  breathing: "adequate" | "distressed" | "failing" | "apnoeic";
  circulation: "stable" | "poor_perfusion" | "shock" | "pulseless";
  rhythm: "sinus_tachycardia" | "sinus_bradycardia" | "ventricular_fibrillation" | "pulseless_electrical_activity" | "sinus_rhythm";
  heartRate: number;
  respiratoryRate: number;
  systolicBp: number;
  spo2: number;
  etco2: number | null;
  trajectory: "improving" | "stable" | "deteriorating" | "rosc" | "death";
};

export type NpcState = { role: Exclude<SimulationWorldRole, "team_leader">; name: string; competence: number; latencySeconds: number; currentTask: string; status: "waiting" | "acknowledged" | "working" | "needs_clarification" | "completed" };
export type SimulationWorldState = {
  scenarioId: SimulationWorldScenarioId;
  role: SimulationWorldRole;
  elapsedSeconds: number;
  patient: PatientState;
  npcs: NpcState[];
  environment: { oxygenAvailable: boolean; defibrillatorReady: boolean; ivAccess: boolean; monitorAttached: boolean };
  events: PracticeLabEvent[];
  phase: "assessment" | "resuscitation" | "post_resuscitation" | "ended";
  criticalFailures: string[];
  competencies: { recognition: number; prioritisation: number; leadership: number; delegation: number; closedLoop: number; technicalAction: number; reassessment: number; teamDynamics: number; timeCriticalAction: number; safety: number };
};

export type SimulationWorldCommand =
  | { type: "assess"; target: "airway" | "breathing" | "circulation" | "rhythm" | "spo2" | "blood_pressure" }
  | { type: "call_for_help" }
  | { type: "delegate"; target: Exclude<SimulationWorldRole, "team_leader">; task: string }
  | { type: "acknowledge"; target: Exclude<SimulationWorldRole, "team_leader"> }
  | { type: "start_cpr" }
  | { type: "attach_monitor" }
  | { type: "charge_defibrillator" }
  | { type: "shock" }
  | { type: "give_epinephrine" }
  | { type: "give_oxygen" }
  | { type: "reassess" }
  | { type: "report"; text: string };

const ROLE_LABELS: Record<SimulationWorldRole, string> = {
  team_leader: "Team leader", airway_ventilation: "Airway & ventilation", compressor_1: "Compressor 1", compressor_2: "Compressor 2", monitor_defib_coach: "Monitor / defib / CPR coach", iv_io_meds: "IV/IO & medications", scribe: "Scribe",
};
export function getSimulationWorldRoleLabel(role: SimulationWorldRole): string { return ROLE_LABELS[role]; }

function event(state: SimulationWorldState, type: string, description: string, correct?: boolean): SimulationWorldState {
  return { ...state, events: [...state.events, { timestamp: state.elapsedSeconds, type, description, correct }] };
}
function tick(state: SimulationWorldState, seconds = 1): SimulationWorldState {
  const next = { ...state, elapsedSeconds: state.elapsedSeconds + seconds };
  if (next.patient.trajectory !== "rosc" && next.patient.trajectory !== "death") {
    const untreated = next.elapsedSeconds > 18 && next.patient.breathing !== "adequate";
    const arrest = next.elapsedSeconds > 42 && !next.events.some((e) => e.type === "cpr_started");
    next.patient = { ...next.patient, trajectory: arrest ? "deteriorating" : untreated ? "deteriorating" : next.patient.trajectory };
    if (arrest && next.patient.circulation !== "pulseless") next.patient = { ...next.patient, circulation: "pulseless", rhythm: next.scenarioId === "postop-equipment" ? "ventricular_fibrillation" : "pulseless_electrical_activity", heartRate: 0, spo2: Math.max(45, next.patient.spo2 - 4) };
  }
  return next;
}

export function createSimulationWorld(scenarioId: SimulationWorldScenarioId, role: SimulationWorldRole): SimulationWorldState {
  const scenario = SIMULATION_WORLD_SCENARIOS.find((item) => item.id === scenarioId) ?? SIMULATION_WORLD_SCENARIOS[0];
  return {
    scenarioId, role, elapsedSeconds: 0,
    patient: { airway: "threatened", breathing: "distressed", circulation: "poor_perfusion", rhythm: scenario.initialRhythm, heartRate: scenario.initialRhythm === "sinus_bradycardia" ? 58 : 178, respiratoryRate: 52, systolicBp: 72, spo2: 86, etco2: null, trajectory: "deteriorating" },
    npcs: [
      ["airway_ventilation", "Mary", .82], ["compressor_1", "John", .86], ["compressor_2", "Amina", .7], ["monitor_defib_coach", "David", .8], ["iv_io_meds", "Ruth", .78], ["scribe", "Peter", .92],
    ].map(([npcRole, name, competence]) => ({ role: npcRole as Exclude<SimulationWorldRole, "team_leader">, name: String(name), competence: Number(competence), latencySeconds: 2, currentTask: "waiting", status: "waiting" })),
    environment: { oxygenAvailable: true, defibrillatorReady: false, ivAccess: false, monitorAttached: false }, events: [], phase: "assessment", criticalFailures: [], competencies: { recognition: 0, prioritisation: 0, leadership: 0, delegation: 0, closedLoop: 0, technicalAction: 0, reassessment: 0, teamDynamics: 0, timeCriticalAction: 0, safety: 100 },
  };
}

function withCompetency(state: SimulationWorldState, patch: Partial<SimulationWorldState["competencies"]>): SimulationWorldState { return { ...state, competencies: { ...state.competencies, ...patch } }; }
function npcFor(state: SimulationWorldState, role: Exclude<SimulationWorldRole, "team_leader">) { return state.npcs.find((npc) => npc.role === role); }

export function reduceSimulationWorld(state: SimulationWorldState, command: SimulationWorldCommand): SimulationWorldState {
  let next = tick(state);
  switch (command.type) {
    case "assess": {
      const result = command.target === "airway" ? `Airway ${next.patient.airway}` : command.target === "breathing" ? `Breathing ${next.patient.breathing}; RR ${next.patient.respiratoryRate}` : command.target === "circulation" ? `Circulation ${next.patient.circulation}; pulse ${next.patient.heartRate}` : command.target === "rhythm" ? `Rhythm ${next.patient.rhythm}` : command.target === "spo2" ? `SpO₂ ${next.patient.spo2}%` : `Systolic BP ${next.patient.systolicBp} mmHg`;
      next = event(next, "assessment", result, true);
      if (command.target === "airway" || command.target === "breathing" || command.target === "circulation") next = withCompetency(next, { recognition: Math.min(100, next.competencies.recognition + 12), prioritisation: Math.min(100, next.competencies.prioritisation + 8) });
      return next;
    }
    case "call_for_help": return withCompetency(event(next, "call_for_help", "Help called; team assembled.", true), { recognition: Math.min(100, next.competencies.recognition + 10), timeCriticalAction: Math.min(100, next.competencies.timeCriticalAction + 8) });
    case "delegate": {
      const npc = npcFor(next, command.target); if (!npc) return next;
      const updated = next.npcs.map((item) => item.role === command.target ? { ...item, currentTask: command.task, status: "acknowledged" as const } : item);
      return withCompetency(event({ ...next, npcs: updated }, "delegation", `${npc.name} acknowledged: ${command.task}.`, true), { leadership: Math.min(100, next.competencies.leadership + 8), delegation: Math.min(100, next.competencies.delegation + 14), teamDynamics: Math.min(100, next.competencies.teamDynamics + 8) });
    }
    case "acknowledge": return withCompetency(event(next, "closed_loop", `${npcFor(next, command.target)?.name ?? "Team member"} confirmed task completion.`, true), { closedLoop: Math.min(100, next.competencies.closedLoop + 12) });
    case "attach_monitor": return event({ ...next, environment: { ...next.environment, monitorAttached: true }, phase: "resuscitation" }, "monitor_attached", "Monitor attached; rhythm available.", true);
    case "start_cpr": {
      if (next.patient.circulation !== "pulseless") return withCompetency(event({ ...next, criticalFailures: [...next.criticalFailures, "CPR started without confirmed pulselessness"] }, "critical_failure", "CPR started before pulselessness was established.", false), { safety: Math.max(0, next.competencies.safety - 35) });
      return withCompetency(event({ ...next, phase: "resuscitation", patient: { ...next.patient, breathing: "apnoeic" } }, "cpr_started", "CPR started; compressor reports a two-minute cycle.", true), { technicalAction: Math.min(100, next.competencies.technicalAction + 15), timeCriticalAction: Math.min(100, next.competencies.timeCriticalAction + 14) });
    }
    case "charge_defibrillator": {
      if (next.patient.rhythm !== "ventricular_fibrillation") return withCompetency(event({ ...next, criticalFailures: [...next.criticalFailures, "Defibrillator charged for non-shockable rhythm"] }, "critical_failure", "Defibrillator charged despite a non-shockable rhythm.", false), { safety: Math.max(0, next.competencies.safety - 50) });
      return event({ ...next, environment: { ...next.environment, defibrillatorReady: true }, }, "defibrillator_charging", "Defibrillator charging; team must confirm clear.", true);
    }
    case "shock": {
      if (next.patient.rhythm !== "ventricular_fibrillation" || !next.environment.defibrillatorReady) return withCompetency(event({ ...next, criticalFailures: [...next.criticalFailures, "Unsafe shock sequence"] }, "critical_failure", "Shock attempted without a shockable rhythm and safe charge sequence.", false), { safety: Math.max(0, next.competencies.safety - 50) });
      return withCompetency(event({ ...next, patient: { ...next.patient, rhythm: "pulseless_electrical_activity", trajectory: "deteriorating" }, environment: { ...next.environment, defibrillatorReady: false } }, "shock_delivered", "Shock delivered; resume CPR and reassess rhythm.", true), { technicalAction: Math.min(100, next.competencies.technicalAction + 18), closedLoop: Math.min(100, next.competencies.closedLoop + 6) });
    }
    case "give_epinephrine": {
      if (next.patient.circulation !== "pulseless") return withCompetency(event({ ...next, criticalFailures: [...next.criticalFailures, "Unsafe medication timing"] }, "critical_failure", "Epinephrine given outside the arrest sequence.", false), { safety: Math.max(0, next.competencies.safety - 30) });
      return withCompetency(event(next, "medication", `Epinephrine prepared for ${next.patient.rhythm}; scribe requested to record time.`, true), { technicalAction: Math.min(100, next.competencies.technicalAction + 12) });
    }
    case "give_oxygen": return withCompetency(event({ ...next, patient: { ...next.patient, airway: "patent", breathing: "adequate", spo2: Math.min(98, next.patient.spo2 + 8), trajectory: "improving" } }, "oxygen_applied", "Oxygen applied and ventilation supported; reassess response.", true), { technicalAction: Math.min(100, next.competencies.technicalAction + 12), prioritisation: Math.min(100, next.competencies.prioritisation + 10) });
    case "reassess": return withCompetency(event(next, "reassessment", `Reassessment: SpO₂ ${next.patient.spo2}%, HR ${next.patient.heartRate}, rhythm ${next.patient.rhythm}.`, true), { reassessment: Math.min(100, next.competencies.reassessment + 18), recognition: Math.min(100, next.competencies.recognition + 5) });
    case "report": return event(next, "communication", `Leader report: ${command.text}`, true);
  }
}

export function parseSimulationWorldCommand(text: string): SimulationWorldCommand | null {
  const value = text.trim().toLowerCase();
  if (!value) return null;
  const target = value.includes("airway") ? "airway_ventilation" : value.includes("compressor 1") ? "compressor_1" : value.includes("compressor 2") ? "compressor_2" : value.includes("monitor") ? "monitor_defib_coach" : value.includes("med") || value.includes("iv") ? "iv_io_meds" : value.includes("scribe") ? "scribe" : null;
  if (target && /,|delegate|assign|you take|you do/.test(value)) return { type: "delegate", target, task: text.trim() };
  if (/call|help|activate/.test(value)) return { type: "call_for_help" };
  if (/reassess|repeat observations|repeat obs/.test(value)) return { type: "reassess" };
  if (/start cpr|start compressions|begin compressions/.test(value)) return { type: "start_cpr" };
  if (/attach.*monitor|monitor on/.test(value)) return { type: "attach_monitor" };
  if (/charge|defibrillator charge/.test(value)) return { type: "charge_defibrillator" };
  if (/shock|defibrillate/.test(value)) return { type: "shock" };
  if (/adrenaline|epinephrine/.test(value)) return { type: "give_epinephrine" };
  if (/oxygen|bvm|ventilat/.test(value)) return { type: "give_oxygen" };
  if (/airway/.test(value)) return { type: "assess", target: "airway" };
  if (/breath|respir/.test(value)) return { type: "assess", target: "breathing" };
  if (/circulation|pulse|perfusion/.test(value)) return { type: "assess", target: "circulation" };
  if (/rhythm|ecg/.test(value)) return { type: "assess", target: "rhythm" };
  if (/sats|spo2|oxygen saturation/.test(value)) return { type: "assess", target: "spo2" };
  if (/bp|blood pressure/.test(value)) return { type: "assess", target: "blood_pressure" };
  if (target) return { type: "delegate", target, task: text.trim() };
  return { type: "report", text: text.trim() };
}

export function calculateSimulationWorldAssessment(state: SimulationWorldState) {
  const vector = state.competencies;
  const values = Object.values(vector);
  const overall = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const required = state.role === "team_leader" ? ["recognition", "prioritisation", "leadership", "delegation", "closedLoop", "reassessment", "safety"] : ["technicalAction", "recognition", "reassessment", "safety"];
  const thresholdMet = required.every((key) => vector[key as keyof typeof vector] >= 70);
  const safe = state.criticalFailures.length === 0 && vector.safety >= 80;
  return { overall, vector, criticalFailures: state.criticalFailures, evidenceEligible: thresholdMet && safe, requiredDomains: required };
}

export function getRoleEvidenceFromAttempt(eventLog: unknown): { role?: SimulationWorldRole; evidenceEligible?: boolean; scenarioId?: string } {
  if (!Array.isArray(eventLog)) return {};
  const meta = eventLog.find((item) => item && typeof item === "object" && (item as { type?: string }).type === "simulation_world_meta") as { description?: string } | undefined;
  if (!meta?.description) return {};
  try { return JSON.parse(meta.description) as { role?: SimulationWorldRole; evidenceEligible?: boolean; scenarioId?: string }; } catch { return {}; }
}
