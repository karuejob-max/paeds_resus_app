/**
 * mobile/lib/engine/index.ts
 *
 * Mobile Engine Adapter — Phase 8.1
 *
 * Re-exports the full ABCDE engine (abcdeEngine.ts) and condition protocols
 * (conditionProtocols.ts) for use in React Native / Expo.
 *
 * The engine is pure TypeScript with zero browser/DOM dependencies, so it
 * runs identically on React Native. The only adaptation needed is the
 * persistence layer (AsyncStorage instead of IndexedDB).
 *
 * Architecture:
 *   mobile/lib/engine/index.ts       ← this file (re-exports)
 *   mobile/lib/engine/persistence.ts ← AsyncStorage session persistence
 *   mobile/lib/engine/useResusSession.ts ← React Native hook
 *
 * All clinical logic lives in the shared web engine. This file is the
 * single import point for all mobile clinical features.
 */

// ─── Re-export full ABCDE engine ────────────────────────────────────────────
export type {
  Phase,
  ABCDELetter,
  Severity,
  Finding,
  Threat,
  DoseInfo,
  InterventionStatus,
  ReassessmentCheck,
  Intervention,
  SafetyAlert,
  SAMPLEHistory,
  ClinicalEvent,
  VitalSigns,
  FluidTracker,
  ResusSession,
  QuestionInputType,
  AssessmentQuestion,
} from '../../client/src/lib/resus/abcdeEngine';

export {
  getAgeCategory,
  derivePerfusionState,
  primarySurveyQuestions,
  createSession,
  updatePatientInfo,
  startQuickAssessment,
  answerQuickAssessment,
  getCurrentQuestions,
  getAnsweredQuestionIds,
  answerPrimarySurvey,
  completeIntervention,
  startIntervention,
  markInterventionUnavailable,
  returnToPrimarySurvey,
  updateSAMPLE,
  setDefinitiveDiagnosis,
  triggerCardiacArrest,
  achieveROSC,
  acknowledgeSafetyAlert,
  getActiveThreats,
  getPendingInterventions,
  getAllPendingCritical,
} from '../../client/src/lib/resus/abcdeEngine';

// ─── Re-export condition protocols ──────────────────────────────────────────
export type {
  ExtendedConditionId,
  ProtocolPhase,
  ProtocolStep,
  ConditionProtocol,
} from '../../client/src/lib/resus/conditionProtocols';

export {
  buildExtendedProtocol,
  ALL_EXTENDED_CONDITION_IDS,
} from '../../client/src/lib/resus/conditionProtocols';

// ─── Re-export drug calculations ─────────────────────────────────────────────
export { calcDose } from '../../client/src/lib/resus/abcdeEngine';

// ─── Re-export weight estimation ─────────────────────────────────────────────
export { estimateWeight } from '../../client/src/lib/resus/weightEstimation';
