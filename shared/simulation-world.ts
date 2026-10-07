import type { PracticeLabEvent } from "./practice-lab-types";

export const SIMULATION_ENGINE_VERSION = "3.0.0";
export const SIMULATION_SCENARIO_VERSION = "1.0.0";
export const SIMULATION_ASSESSMENT_VERSION = "2.0.0";

export const SIMULATION_WORLD_ROLES = [
  "team_leader", "airway_ventilation", "compressor_1", "compressor_2",
  "monitor_defib_coach", "iv_io_meds", "scribe",
] as const;
export type SimulationWorldRole = (typeof SIMULATION_WORLD_ROLES)[number];

export const SIMULATION_WORLD_SCENARIOS = [
  { id: "septic-shock-arrest", title: "03:17 — Emergency Department", subtitle: "A 4-year-old arrives pale, tachypnoeic, and tiring.", initialRhythm: "sinus_tachycardia" as const, weightKg: 16, difficulty: "predictable" as const },
  { id: "respiratory-bradycardia", title: "11:42 — Paediatric Ward", subtitle: "A child with worsening respiratory failure is becoming bradycardic.", initialRhythm: "sinus_bradycardia" as const, weightKg: 12, difficulty: "ambiguous" as const },
  { id: "postop-equipment", title: "22:08 — Recovery Room", subtitle: "A postoperative child deteriorates while oxygen and IV access are under pressure.", initialRhythm: "ventricular_fibrillation" as const, weightKg: 20, difficulty: "chaotic" as const },
] as const;
export type SimulationWorldScenarioId = (typeof SIMULATION_WORLD_SCENARIOS)[number]["id"];

type ObservableKey = "airway" | "breathing" | "circulation" | "rhythm" | "spo2" | "blood_pressure" | "heart_rate" | "etco2";
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
  /** Hidden causal variables. Learners see derived observations, never these values. */
  physiology: {
    oxygenation: number;
    ventilation: number;
    circulatingVolume: number;
    myocardialFunction: number;
    respiratoryDrive: number;
    metabolicDebt: number;
    ongoingLoss: number;
  };
};

export type NpcState = {
  role: Exclude<SimulationWorldRole, "team_leader">;
  name: string;
  competence: number;
  latencySeconds: number;
  currentTask: string;
  taskAssignedAt: number | null;
  status: "waiting" | "acknowledged" | "working" | "needs_clarification" | "completed";
};

export type SimulationWorldEvent = PracticeLabEvent & {
  eventId?: string;
  sequence?: number;
  actor?: "learner" | `npc:${string}` | "system";
  role?: SimulationWorldRole;
  action?: string;
  target?: string;
  parameters?: Record<string, unknown>;
  consequence?: string;
  competencySignals?: string[];
  hash?: string;
};

export type SimulationWorldState = {
  scenarioId: SimulationWorldScenarioId;
  role: SimulationWorldRole;
  elapsedSeconds: number;
  patient: PatientState;
  observations: Partial<Record<ObservableKey, string | number | null>>;
  npcs: NpcState[];
  environment: { oxygenAvailable: boolean; defibrillatorReady: boolean; ivAccess: boolean; monitorAttached: boolean };
  events: SimulationWorldEvent[];
  phase: "assessment" | "resuscitation" | "post_resuscitation" | "ended";
  criticalFailures: string[];
  competencies: { recognition: number; prioritisation: number; leadership: number; delegation: number; closedLoop: number; technicalAction: number; reassessment: number; teamDynamics: number; timeCriticalAction: number; safety: number };
  creditedSignals: string[];
  lastInterventionAt: number;
  lastReassessmentAt: number;
};

export type SimulationWorldCommand =
  | { type: "assess"; target: ObservableKey }
  | { type: "call_for_help" }
  | { type: "delegate"; target: Exclude<SimulationWorldRole, "team_leader">; task: string }
  | { type: "acknowledge"; target: Exclude<SimulationWorldRole, "team_leader"> }
  | { type: "start_cpr" }
  | { type: "attach_monitor" }
  | { type: "charge_defibrillator" }
  | { type: "shock" }
  | { type: "give_epinephrine" }
  | { type: "give_oxygen" }
  | { type: "give_fluid" }
  | { type: "reassess" }
  | { type: "report"; text: string };

const ROLE_LABELS: Record<SimulationWorldRole, string> = {
  team_leader: "Team leader", airway_ventilation: "Airway & ventilation", compressor_1: "Compressor 1", compressor_2: "Compressor 2", monitor_defib_coach: "Monitor / defib / CPR coach", iv_io_meds: "IV/IO & medications", scribe: "Scribe",
};
export function getSimulationWorldRoleLabel(role: SimulationWorldRole): string { return ROLE_LABELS[role]; }

const ROLE_ACTIONS: Record<SimulationWorldRole, readonly SimulationWorldCommand["type"][]> = {
  team_leader: ["assess", "call_for_help", "delegate", "acknowledge", "start_cpr", "attach_monitor", "charge_defibrillator", "shock", "give_epinephrine", "give_oxygen", "give_fluid", "reassess", "report"],
  airway_ventilation: ["assess", "give_oxygen", "reassess", "report"],
  compressor_1: ["assess", "start_cpr", "reassess", "report"],
  compressor_2: ["assess", "start_cpr", "reassess", "report"],
  monitor_defib_coach: ["assess", "attach_monitor", "charge_defibrillator", "shock", "reassess", "report"],
  iv_io_meds: ["assess", "give_epinephrine", "give_fluid", "reassess", "report"],
  scribe: ["assess", "reassess", "report"],
};
export function isSimulationWorldCommandAllowed(role: SimulationWorldRole, command: SimulationWorldCommand): boolean { return ROLE_ACTIONS[role].includes(command.type); }

function stableHash(value: string): string { let hash = 2166136261; for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
export function hashSimulationWorldEvent(event: Pick<SimulationWorldEvent, "sequence" | "timestamp" | "type" | "description">, previousHash: string): string { return stableHash(`${previousHash}|${event.sequence}|${event.timestamp}|${event.type}|${event.description}`); }
function event(state: SimulationWorldState, type: string, description: string, correct?: boolean, details: Partial<SimulationWorldEvent> = {}): SimulationWorldState {
  const sequence = state.events.length;
  const previousHash = state.events.at(-1)?.hash ?? "root";
  const core = { timestamp: state.elapsedSeconds, type, description, sequence };
  const nextEvent: SimulationWorldEvent = { ...core, correct, eventId: `${state.scenarioId}-${sequence}`, actor: details.actor ?? "system", hash: hashSimulationWorldEvent(core, previousHash), ...details };
  return { ...state, events: [...state.events, nextEvent] };
}
function awardOnce(state: SimulationWorldState, signal: string, patch: Partial<SimulationWorldState["competencies"]>): SimulationWorldState {
  if (state.creditedSignals.includes(signal)) return state;
  return { ...state, creditedSignals: [...state.creditedSignals, signal], competencies: { ...state.competencies, ...patch } };
}
function npcFor(state: SimulationWorldState, role: Exclude<SimulationWorldRole, "team_leader">) { return state.npcs.find((npc) => npc.role === role); }

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function derivePatientFromPhysiology(patient: PatientState, seconds: number): PatientState {
  const p = patient.physiology;
  const perfusion = clamp((p.circulatingVolume * 0.62 + p.myocardialFunction * 0.38) * 100, 0, 100);
  const spo2 = clamp(55 + p.oxygenation * 43 - p.metabolicDebt * 0.08, 35, 99);
  const etco2 = patient.breathing === "apnoeic" ? clamp(35 + p.metabolicDebt * 0.55, 35, 95) : clamp(28 + (1 - p.ventilation) * 42 + p.metabolicDebt * 0.25, 25, 80);
  const heartRate = patient.circulation === "pulseless"
    ? 0
    : Math.round(clamp(92 + p.respiratoryDrive * 54 + p.metabolicDebt * 1.6 - (1 - p.myocardialFunction) * 35, 40, 220));
  const systolicBp = Math.round(clamp(48 + perfusion * 0.48, 35, 115));
  const trajectory = patient.circulation === "pulseless" || p.metabolicDebt >= 85
    ? "deteriorating"
    : p.oxygenation >= 0.78 && perfusion >= 0.62 && p.metabolicDebt < 35
      ? "improving"
      : "deteriorating";
  return { ...patient, spo2: Number(spo2.toFixed(1)), etco2: Number(etco2.toFixed(1)), heartRate, systolicBp, trajectory };
}

function tick(state: SimulationWorldState, seconds: number): SimulationWorldState {
  if (seconds <= 0 || state.phase === "ended") return state;
  let next = { ...state, elapsedSeconds: Number((state.elapsedSeconds + seconds).toFixed(2)) };
  if (next.patient.trajectory !== "rosc" && next.patient.trajectory !== "death") {
    const physiology = { ...next.patient.physiology };
    if (next.patient.breathing !== "adequate") {
      physiology.ventilation = clamp(physiology.ventilation - seconds * 0.018, 0, 1);
      physiology.oxygenation = clamp(physiology.oxygenation - seconds * 0.012, 0, 1);
      physiology.metabolicDebt = clamp(physiology.metabolicDebt + seconds * 1.25, 0, 100);
    } else {
      physiology.ventilation = clamp(physiology.ventilation + seconds * 0.006, 0, 1);
      physiology.metabolicDebt = clamp(physiology.metabolicDebt - seconds * 0.18, 0, 100);
    }
    if (next.patient.circulation === "pulseless") {
      physiology.oxygenation = clamp(physiology.oxygenation - seconds * 0.02, 0, 1);
      physiology.metabolicDebt = clamp(physiology.metabolicDebt + seconds * 1.8, 0, 100);
    } else {
      physiology.circulatingVolume = clamp(physiology.circulatingVolume - seconds * physiology.ongoingLoss * 0.002, 0, 1);
      physiology.oxygenation = clamp(physiology.oxygenation + seconds * 0.002 * physiology.myocardialFunction, 0, 1);
    }
    next = { ...next, patient: derivePatientFromPhysiology({ ...next.patient, physiology }, seconds) };
    const respiratoryFailure = next.patient.breathing !== "adequate" && next.elapsedSeconds >= 18;
    const arrest = next.elapsedSeconds >= 42 && next.patient.circulation !== "pulseless" && next.patient.breathing !== "adequate";
    if (respiratoryFailure) next = { ...next, patient: { ...next.patient, trajectory: "deteriorating" } };
    if (arrest) next = { ...next, patient: derivePatientFromPhysiology({ ...next.patient, circulation: "pulseless", rhythm: next.scenarioId === "postop-equipment" ? "ventricular_fibrillation" : "pulseless_electrical_activity", heartRate: 0, trajectory: "deteriorating" }, seconds) };
  }
  let npcs = next.npcs;
  for (const npc of npcs) {
    if (npc.status === "waiting" && npc.taskAssignedAt !== null && next.elapsedSeconds >= npc.taskAssignedAt + npc.latencySeconds) {
      npcs = npcs.map((item) => item.role === npc.role ? { ...item, status: "acknowledged" as const } : item);
      next = event({ ...next, npcs }, "npc_acknowledged", `${npc.name} acknowledges: ${npc.currentTask}.`, true, { actor: `npc:${npc.name}`, role: npc.role, action: "acknowledge", target: npc.role });
    } else if (npc.status === "acknowledged" && npc.taskAssignedAt !== null && next.elapsedSeconds >= npc.taskAssignedAt + npc.latencySeconds + 3) {
      const success = npc.competence >= 0.7;
      npcs = npcs.map((item) => item.role === npc.role ? { ...item, status: success ? "completed" as const : "needs_clarification" as const } : item);
      next = event({ ...next, npcs }, success ? "npc_completed" : "npc_needs_clarification", success ? `${npc.name} reports: ${npc.currentTask} complete.` : `${npc.name} reports difficulty with: ${npc.currentTask}.`, success, { actor: `npc:${npc.name}`, role: npc.role, action: success ? "complete" : "clarify", target: npc.role });
    }
  }
  return next;
}

export function advanceSimulationWorld(state: SimulationWorldState, seconds: number): SimulationWorldState { return tick(state, seconds); }

export function verifySimulationWorldEventChain(events: readonly SimulationWorldEvent[]): boolean {
  let previousHash = "root";
  for (const item of events) {
    if (item.sequence === undefined || !item.hash || hashSimulationWorldEvent(item, previousHash) !== item.hash) return false;
    previousHash = item.hash;
  }
  return true;
}

export function createSimulationWorld(scenarioId: SimulationWorldScenarioId, role: SimulationWorldRole): SimulationWorldState {
  const scenario = SIMULATION_WORLD_SCENARIOS.find((item) => item.id === scenarioId) ?? SIMULATION_WORLD_SCENARIOS[0];
  return {
    scenarioId, role, elapsedSeconds: 0,
    patient: { airway: "threatened", breathing: "distressed", circulation: "poor_perfusion", rhythm: scenario.initialRhythm, heartRate: scenario.initialRhythm === "sinus_bradycardia" ? 58 : 178, respiratoryRate: 52, systolicBp: 72, spo2: 86, etco2: 58, trajectory: "deteriorating", physiology: { oxygenation: 0.72, ventilation: 0.46, circulatingVolume: scenario.id === "septic-shock-arrest" ? 0.48 : 0.62, myocardialFunction: scenario.initialRhythm === "sinus_bradycardia" ? 0.58 : 0.76, respiratoryDrive: 0.82, metabolicDebt: 24, ongoingLoss: scenario.id === "septic-shock-arrest" ? 0.9 : 0.35 } },
    observations: {},
    npcs: [["airway_ventilation", "Mary", .82], ["compressor_1", "John", .86], ["compressor_2", "Amina", .7], ["monitor_defib_coach", "David", .8], ["iv_io_meds", "Ruth", .78], ["scribe", "Peter", .92]].map(([npcRole, name, competence]) => ({ role: npcRole as Exclude<SimulationWorldRole, "team_leader">, name: String(name), competence: Number(competence), latencySeconds: 2, currentTask: "waiting", taskAssignedAt: null, status: "waiting" })),
    environment: { oxygenAvailable: true, defibrillatorReady: false, ivAccess: false, monitorAttached: false }, events: [], phase: "assessment", criticalFailures: [], creditedSignals: [], lastInterventionAt: 0, lastReassessmentAt: 0,
    competencies: { recognition: 0, prioritisation: 0, leadership: 0, delegation: 0, closedLoop: 0, technicalAction: 0, reassessment: 0, teamDynamics: 0, timeCriticalAction: 0, safety: 100 },
  };
}

function observationValue(patient: PatientState, target: ObservableKey): string | number | null { return target === "airway" ? patient.airway : target === "breathing" ? patient.breathing : target === "circulation" ? patient.circulation : target === "rhythm" ? patient.rhythm : target === "spo2" ? patient.spo2 : target === "blood_pressure" ? patient.systolicBp : target === "heart_rate" ? patient.heartRate : patient.etco2; }
function commandEvent(state: SimulationWorldState, command: SimulationWorldCommand): SimulationWorldState { return event(state, "command", JSON.stringify(command), true, { actor: "learner", role: state.role, action: command.type, target: "target" in command ? command.target : undefined, parameters: command as unknown as Record<string, unknown>, source: "client" } as Partial<SimulationWorldEvent>); }
function criticalFailure(state: SimulationWorldState, description: string, action: string): SimulationWorldState {
  const withFailure = event({ ...state, criticalFailures: [...state.criticalFailures, description], competencies: { ...state.competencies, safety: Math.max(0, state.competencies.safety - 50) } }, "critical_failure", description, false, { actor: "learner", role: state.role, action });
  return withFailure;
}

export function reduceSimulationWorld(state: SimulationWorldState, command: SimulationWorldCommand): SimulationWorldState {
  let next = commandEvent(tick(state, 1), command);
  if (!isSimulationWorldCommandAllowed(next.role, command)) return criticalFailure(next, `Role ${next.role} attempted ${command.type}`, command.type);
  switch (command.type) {
    case "assess": {
      const value = observationValue(next.patient, command.target);
      const label = command.target === "spo2" ? `SpO₂ ${value}%` : command.target === "blood_pressure" ? `Systolic BP ${value} mmHg` : `${command.target.replace("_", " ")} ${String(value).replaceAll("_", " ")}`;
      const observed = { ...next.observations, [command.target]: value };
      next = event({ ...next, observations: observed }, "assessment", label, true, { actor: "learner", role: next.role, action: "assess", target: command.target, consequence: "Observation revealed" });
      return awardOnce(next, `assess:${command.target}`, { recognition: Math.min(100, next.competencies.recognition + 12), prioritisation: Math.min(100, next.competencies.prioritisation + 8) });
    }
    case "call_for_help": return awardOnce(event(next, "call_for_help", "Help called; team assembled.", true, { actor: "learner", role: next.role, action: "call_for_help" }), "call_for_help", { recognition: Math.min(100, next.competencies.recognition + 10), timeCriticalAction: Math.min(100, next.competencies.timeCriticalAction + 8) });
    case "delegate": {
      const npc = npcFor(next, command.target); if (!npc) return next;
      const npcs = next.npcs.map((item) => item.role === command.target ? { ...item, currentTask: command.task, taskAssignedAt: next.elapsedSeconds, status: "waiting" as const } : item);
      return awardOnce(event({ ...next, npcs }, "delegation", `${npc.name} assigned: ${command.task}. Await acknowledgement and completion.`, true, { actor: "learner", role: next.role, action: "delegate", target: command.target, parameters: { task: command.task } }), `delegate:${command.target}:${command.task}`, { leadership: Math.min(100, next.competencies.leadership + 8), delegation: Math.min(100, next.competencies.delegation + 14), teamDynamics: Math.min(100, next.competencies.teamDynamics + 8) });
    }
    case "acknowledge": {
      const npc = npcFor(next, command.target);
      if (!npc || npc.status !== "completed") return event(next, "closed_loop_failure", `${npc?.name ?? "Team member"} has not reported completion yet.`, false, { actor: "learner", role: next.role, action: "acknowledge", target: command.target });
      return awardOnce(event(next, "closed_loop", `${npc.name} task completion confirmed and closed loop.` , true, { actor: "learner", role: next.role, action: "acknowledge", target: command.target }), `closed_loop:${command.target}:${npc.currentTask}`, { closedLoop: Math.min(100, next.competencies.closedLoop + 18) });
    }
    case "attach_monitor": return event({ ...next, environment: { ...next.environment, monitorAttached: true }, phase: "resuscitation" }, "monitor_attached", "Monitor attached; rhythm can now be assessed.", true, { actor: "learner", role: next.role, action: "attach_monitor" });
    case "start_cpr": {
      if (next.patient.circulation !== "pulseless") return criticalFailure(next, "CPR started without confirmed pulselessness", "start_cpr");
      return awardOnce(event({ ...next, phase: "resuscitation", patient: { ...next.patient, breathing: "apnoeic" }, lastInterventionAt: next.elapsedSeconds }, "cpr_started", "CPR started; compressor reports a two-minute cycle.", true, { actor: "learner", role: next.role, action: "start_cpr" }), "cpr_started", { technicalAction: Math.min(100, next.competencies.technicalAction + 20), timeCriticalAction: Math.min(100, next.competencies.timeCriticalAction + 14) });
    }
    case "charge_defibrillator": {
      if (next.patient.rhythm !== "ventricular_fibrillation") return criticalFailure(next, "Defibrillator charged for non-shockable rhythm", "charge_defibrillator");
      return event({ ...next, environment: { ...next.environment, defibrillatorReady: true } }, "defibrillator_charging", "Defibrillator charging; team must confirm clear.", true, { actor: "learner", role: next.role, action: "charge_defibrillator" });
    }
    case "shock": {
      if (next.patient.rhythm !== "ventricular_fibrillation" || !next.environment.defibrillatorReady) return criticalFailure(next, "Unsafe shock sequence", "shock");
      return event({ ...next, patient: { ...next.patient, rhythm: "pulseless_electrical_activity", trajectory: "deteriorating", physiology: { ...next.patient.physiology, myocardialFunction: Math.min(1, next.patient.physiology.myocardialFunction + 0.12), metabolicDebt: Math.max(0, next.patient.physiology.metabolicDebt - 5) } }, environment: { ...next.environment, defibrillatorReady: false }, lastInterventionAt: next.elapsedSeconds }, "shock_delivered", "Shock delivered; resume CPR and reassess rhythm.", true, { actor: "learner", role: next.role, action: "shock" });
    }
    case "give_epinephrine": {
      if (next.patient.circulation !== "pulseless" || !next.environment.ivAccess) return criticalFailure(next, "Unsafe medication timing or access", "give_epinephrine");
      return event({ ...next, lastInterventionAt: next.elapsedSeconds }, "medication", `Epinephrine prepared for ${next.patient.rhythm}; scribe requested to record time.`, true, { actor: "learner", role: next.role, action: "give_epinephrine" });
    }
    case "give_fluid": return event({ ...next, environment: { ...next.environment, ivAccess: true }, patient: { ...next.patient, circulation: next.patient.circulation === "shock" ? "poor_perfusion" : next.patient.circulation, physiology: { ...next.patient.physiology, circulatingVolume: clamp(next.patient.physiology.circulatingVolume + 0.16, 0, 1), metabolicDebt: Math.max(0, next.patient.physiology.metabolicDebt - 4) } }, lastInterventionAt: next.elapsedSeconds }, "fluid_bolus", "Fluid bolus administered through IV/IO access; reassess perfusion.", true, { actor: "learner", role: next.role, action: "give_fluid" });
    case "give_oxygen": return event({ ...next, patient: { ...next.patient, airway: "patent", breathing: "adequate", physiology: { ...next.patient.physiology, oxygenation: clamp(next.patient.physiology.oxygenation + 0.2, 0, 1), ventilation: clamp(next.patient.physiology.ventilation + 0.28, 0, 1), metabolicDebt: Math.max(0, next.patient.physiology.metabolicDebt - 8) } }, environment: { ...next.environment, oxygenAvailable: true }, lastInterventionAt: next.elapsedSeconds }, "oxygen_applied", "Oxygen applied and ventilation supported; reassess response.", true, { actor: "learner", role: next.role, action: "give_oxygen" });
    case "reassess": {
      let result = event({ ...next, observations: { ...next.observations, rhythm: next.patient.rhythm, spo2: next.patient.spo2, heart_rate: next.patient.heartRate, blood_pressure: next.patient.systolicBp, airway: next.patient.airway, breathing: next.patient.breathing, circulation: next.patient.circulation }, lastReassessmentAt: next.elapsedSeconds }, "reassessment", `Reassessment: SpO₂ ${next.patient.spo2}%, HR ${next.patient.heartRate}, rhythm ${next.patient.rhythm}.`, true, { actor: "learner", role: next.role, action: "reassess" });
      const hasCpr = result.events.some((item) => item.type === "cpr_started");
      const hasEpi = result.events.some((item) => item.type === "medication");
      if (hasCpr && hasEpi && result.patient.circulation === "pulseless" && result.elapsedSeconds - result.lastInterventionAt >= 3) result = event({ ...result, patient: { ...result.patient, circulation: "stable", rhythm: "sinus_rhythm", heartRate: 118, systolicBp: 82, trajectory: "rosc", physiology: { ...result.patient.physiology, myocardialFunction: clamp(result.patient.physiology.myocardialFunction + 0.2, 0, 1), circulatingVolume: clamp(result.patient.physiology.circulatingVolume + 0.08, 0, 1), metabolicDebt: Math.max(0, result.patient.physiology.metabolicDebt - 18) } }, phase: "post_resuscitation" }, "rosc", "ROSC achieved after CPR, rhythm management, medication, and reassessment.", true, { actor: "system", consequence: "ROSC" });
      return awardOnce(result, `reassessment:${Math.floor(result.lastInterventionAt)}:${result.events.length}`, { reassessment: Math.min(100, result.competencies.reassessment + 18), recognition: Math.min(100, result.competencies.recognition + 5) });
    }
    case "report": return event(next, "communication", `Team report: ${command.text}`, true, { actor: "learner", role: next.role, action: "report", parameters: { text: command.text } });
  }
}

export function parseSimulationWorldCommand(text: string): SimulationWorldCommand | null {
  const value = text.trim().toLowerCase(); if (!value) return null;
  const target = value.includes("airway") ? "airway_ventilation" : value.includes("compressor 1") ? "compressor_1" : value.includes("compressor 2") ? "compressor_2" : value.includes("monitor") ? "monitor_defib_coach" : value.includes("med") || value.includes("iv") ? "iv_io_meds" : value.includes("scribe") ? "scribe" : null;
  if (target && /,|delegate|assign|you take|you do/.test(value)) return { type: "delegate", target, task: text.trim() };
  if (/call|help|activate/.test(value)) return { type: "call_for_help" };
  if (/reassess|repeat observations|repeat obs/.test(value)) return { type: "reassess" };
  if (/start cpr|start compressions|begin compressions/.test(value)) return { type: "start_cpr" };
  if (/attach.*monitor|monitor on/.test(value)) return { type: "attach_monitor" };
  if (/charge|defibrillator charge/.test(value)) return { type: "charge_defibrillator" };
  if (/shock|defibrillate/.test(value)) return { type: "shock" };
  if (/adrenaline|epinephrine/.test(value)) return { type: "give_epinephrine" };
  if (/fluid|bolus|saline/.test(value)) return { type: "give_fluid" };
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
  const vector = state.competencies; const values = Object.values(vector); const overall = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const required = state.role === "team_leader" ? ["recognition", "prioritisation", "leadership", "delegation", "closedLoop", "reassessment", "safety"] : state.role === "scribe" ? ["recognition", "reassessment", "teamDynamics", "safety"] : ["technicalAction", "recognition", "reassessment", "safety"];
  const thresholdMet = required.every((key) => vector[key as keyof typeof vector] >= 70); const safe = state.criticalFailures.length === 0 && vector.safety >= 80;
  return { overall, vector, criticalFailures: state.criticalFailures, evidenceEligible: thresholdMet && safe && state.patient.trajectory === "rosc", requiredDomains: required };
}

export function getRoleEvidenceFromAttempt(eventLog: unknown): { role?: SimulationWorldRole; evidenceEligible?: boolean; scenarioId?: string } {
  if (!Array.isArray(eventLog)) return {};
  const meta = eventLog.find((item) => item && typeof item === "object" && (item as { type?: string }).type === "simulation_world_meta") as { description?: string } | undefined;
  if (!meta?.description) return {};
  try { return JSON.parse(meta.description) as { role?: SimulationWorldRole; evidenceEligible?: boolean; scenarioId?: string }; } catch { return {}; }
}

export function replaySimulationWorldAttempt(input: { scenarioId: SimulationWorldScenarioId; role: SimulationWorldRole; eventLog: readonly SimulationWorldEvent[] }) {
  const metaEvent = input.eventLog.find((item) => item.type === "simulation_world_meta");
  let meta: { role?: SimulationWorldRole; scenarioId?: SimulationWorldScenarioId; engineVersion?: string; scenarioVersion?: string; assessmentVersion?: string } = {};
  try { meta = metaEvent?.description ? JSON.parse(metaEvent.description) as typeof meta : {}; } catch { return { valid: false, reason: "Malformed version metadata" }; }
  if (meta.role !== input.role || meta.scenarioId !== input.scenarioId) return { valid: false, reason: "Role or scenario metadata mismatch" };
  if (meta.engineVersion !== SIMULATION_ENGINE_VERSION || meta.scenarioVersion !== SIMULATION_SCENARIO_VERSION || meta.assessmentVersion !== SIMULATION_ASSESSMENT_VERSION) return { valid: false, reason: "Unsupported simulation version" };
  if (!verifySimulationWorldEventChain(input.eventLog.filter((item) => item.type !== "simulation_world_meta"))) return { valid: false, reason: "Event hash chain failed" };
  let state = createSimulationWorld(input.scenarioId, input.role);
  for (const item of input.eventLog.filter((eventItem) => eventItem.type === "command")) {
    let command: SimulationWorldCommand;
    try { command = JSON.parse(item.description) as SimulationWorldCommand; } catch { return { valid: false, reason: "Malformed command event" }; }
    const idle = item.timestamp - state.elapsedSeconds - 1;
    if (idle > 0) state = advanceSimulationWorld(state, idle);
    state = reduceSimulationWorld(state, command);
  }
  return { valid: true, state, assessment: calculateSimulationWorldAssessment(state) };
}
