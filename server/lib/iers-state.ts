export const IERS_ACTIVATION_STATES = [
  "draft",
  "triggered",
  "notifying",
  "acknowledged",
  "responding",
  "at_scene",
  "stabilized",
  "recovered",
  "debrief_pending",
  "closed",
  "cancelled",
  "false_alarm",
  "downtime_pending_sync",
  "failed_escalation",
] as const;

export type IersActivationState = (typeof IERS_ACTIVATION_STATES)[number];

const TRANSITIONS: Record<IersActivationState, readonly IersActivationState[]> = {
  draft: ["triggered", "cancelled"],
  triggered: ["notifying", "cancelled", "false_alarm", "downtime_pending_sync"],
  notifying: ["acknowledged", "failed_escalation", "cancelled", "false_alarm", "downtime_pending_sync"],
  acknowledged: ["responding", "at_scene", "cancelled", "false_alarm"],
  responding: ["at_scene", "cancelled", "false_alarm"],
  at_scene: ["stabilized", "cancelled", "false_alarm"],
  stabilized: ["recovered", "debrief_pending"],
  recovered: ["debrief_pending"],
  debrief_pending: ["closed"],
  closed: [],
  cancelled: [],
  false_alarm: [],
  downtime_pending_sync: ["notifying", "cancelled"],
  failed_escalation: ["notifying", "acknowledged", "cancelled", "false_alarm"],
};

export function canAdvanceIersActivation(from: string, to: IersActivationState): boolean {
  return (TRANSITIONS[from as IersActivationState] ?? []).includes(to);
}

export function isActiveIersActivationState(state: string): boolean {
  return ["notifying", "acknowledged", "responding", "at_scene", "stabilized", "recovered", "debrief_pending"].includes(state);
}

export function activationStateLabel(state: string): string {
  return state.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
