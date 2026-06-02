import {
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
} from "./fellowship-microcourse-resus-conditions";

/** Minimal session shape for fellowship auto-credit eligibility (client + tests). */
export type FellowshipAutoCreditSession = {
  definitiveDiagnosis: string | null;
  concurrentDiagnoses?: string[];
  phase: string;
  activeThreat?: { id?: string } | null;
  events: Array<{ type: string }>;
};

const CLINICAL_ACTIVITY_EVENT_TYPES = new Set([
  "intervention_started",
  "intervention_completed",
  "reassessment",
]);

/**
 * True when a post-primary ResusGPS session has a mappable fellowship primary diagnosis
 * and enough documented activity to credit Pillar B without an extra "Save" click.
 */
export function isEligibleForFellowshipAutoCredit(session: FellowshipAutoCreditSession): boolean {
  if (!session.definitiveDiagnosis?.trim()) return false;
  const diagnosis = normalizeToFellowshipResusConditionId(session.definitiveDiagnosis);
  if (!isFellowshipMicrocourseResusCondition(diagnosis)) return false;
  return session.events.some((e) => CLINICAL_ACTIVITY_EVENT_TYPES.has(e.type));
}
