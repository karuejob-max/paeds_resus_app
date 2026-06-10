import {
  isDefinitiveCareProgressComplete,
  type DefinitiveCareProgress,
} from "./definitive-care-completion";
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
  definitiveCareProgress?: DefinitiveCareProgress | null;
  /** Resolved definitive-care step list for completion check (client supplies from engine). */
  definitiveCareSteps?: Array<{ id: string; isReassessment?: boolean }>;
};

const CLINICAL_ACTIVITY_EVENT_TYPES = new Set([
  "intervention_started",
  "intervention_completed",
  "reassessment",
  "threat_identified",
]);

/** Phases where definitive care may run (credit only after completion). */
const DEFINITIVE_CARE_PHASES = new Set(["DEFINITIVE_CARE", "ONGOING"]);

/**
 * True when definitive care is complete for a fellowship-mappable primary diagnosis.
 * Fellowship Pillar B credit fires only after definitive therapy — not on primary diagnosis alone.
 */
export function isEligibleForFellowshipAutoCredit(session: FellowshipAutoCreditSession): boolean {
  if (!session.definitiveDiagnosis?.trim()) return false;
  const diagnosis = normalizeToFellowshipResusConditionId(session.definitiveDiagnosis);
  if (!isFellowshipMicrocourseResusCondition(diagnosis)) return false;

  if (!DEFINITIVE_CARE_PHASES.has(session.phase)) return false;

  const progress = session.definitiveCareProgress;
  if (!progress || progress.fellowshipId !== diagnosis) return false;

  if (progress.completedAt) return true;

  if (session.definitiveCareSteps?.length) {
    return isDefinitiveCareProgressComplete(session.definitiveCareSteps, progress);
  }

  // Fallback: require explicit completion timestamp when step list not supplied
  return false;
}

/** Legacy helper — clinical activity alone is insufficient for fellowship credit. */
export function hasClinicalActivityForCredit(session: FellowshipAutoCreditSession): boolean {
  return session.events.some((e) => CLINICAL_ACTIVITY_EVENT_TYPES.has(e.type));
}
