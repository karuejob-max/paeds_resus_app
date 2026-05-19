/**
 * Phase 4: CPR Override Engine
 * 
 * Detects when clinicians deviate from system recommendations and triggers
 * the override justification modal. Provides clinical context for audit trail.
 */

import type { CprEngineState } from './cpr-engine';

export type OverrideType =
  | 'skip_rhythm_check'
  | 'medication_timing'
  | 'shock_energy'
  | 'antiarrhythmic_selection'
  | 'skip_medication'
  | 'continue_cpr_beyond_protocol'
  | 'other';

export interface OverrideContext {
  overrideType: OverrideType;
  recommendedAction: string;
  actualAction: string;
  isHighRisk: boolean;
  arrestDurationSeconds: number;
  rhythmType?: string;
  shockCount: number;
  epiDoseCount: number;
}

/**
 * Detect if a rhythm check was skipped
 * Rhythm checks should occur every 2 minutes (120 seconds)
 */
export const detectSkippedRhythmCheck = (
  state: CprEngineState,
  timeSinceLastRhythmCheck: number,
  currentAction: string
): OverrideContext | null => {
  const RHYTHM_CHECK_INTERVAL = 120; // seconds

  // If continuing compressions beyond 2 minutes without a rhythm check
  if (
    timeSinceLastRhythmCheck > RHYTHM_CHECK_INTERVAL &&
    currentAction === 'continue_compressions' &&
    state.rhythmType !== 'unknown'
  ) {
    return {
      overrideType: 'skip_rhythm_check',
      recommendedAction: `Perform rhythm check (last check was ${timeSinceLastRhythmCheck}s ago)`,
      actualAction: 'Continued compressions without rhythm assessment',
      isHighRisk: true,
      arrestDurationSeconds: state.phase === 'compressions' ? 0 : 120,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  return null;
};

/**
 * Detect medication timing deviations
 * Epinephrine: after 2nd shock, then every 3-5 minutes
 * Antiarrhythmic: after 3rd and 5th shock
 */
export const detectMedicationTimingDeviation = (
  state: CprEngineState,
  arrestDurationSeconds: number,
  currentAction: string
): OverrideContext | null => {
  const isShockable = state.rhythmType === 'vf_pvt';
  const timeSinceLastEpi = state.lastEpiTime ? arrestDurationSeconds - state.lastEpiTime : arrestDurationSeconds;

  // Epinephrine too early (before 2nd shock)
  if (
    isShockable &&
    state.shockCount < 2 &&
    state.epiDoses === 0 &&
    currentAction === 'give_epinephrine'
  ) {
    return {
      overrideType: 'medication_timing',
      recommendedAction: 'Wait for 2nd shock before first epinephrine dose (shockable rhythm)',
      actualAction: `Gave epinephrine after ${state.shockCount} shock(s)`,
      isHighRisk: true,
      arrestDurationSeconds,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  // Epinephrine too soon (less than 3 minutes since last dose)
  if (
    state.epiDoses > 0 &&
    timeSinceLastEpi < 180 &&
    currentAction === 'give_epinephrine'
  ) {
    return {
      overrideType: 'medication_timing',
      recommendedAction: `Wait ${180 - timeSinceLastEpi}s before next epinephrine dose (3-5 min interval)`,
      actualAction: `Gave epinephrine ${timeSinceLastEpi}s after last dose`,
      isHighRisk: false,
      arrestDurationSeconds,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  return null;
};

/**
 * Detect shock energy deviations
 * Initial: 2 J/kg, Subsequent: 4 J/kg, Max: 200 J initial, 360 J subsequent
 */
export const detectShockEnergyDeviation = (
  state: CprEngineState,
  patientWeight: number,
  recommendedEnergy: number,
  actualEnergy: number
): OverrideContext | null => {
  const tolerance = 10; // Allow 10 J tolerance

  if (Math.abs(actualEnergy - recommendedEnergy) > tolerance) {
    return {
      overrideType: 'shock_energy',
      recommendedAction: `Shock energy: ${recommendedEnergy} J (${recommendedEnergy / patientWeight} J/kg)`,
      actualAction: `Delivered ${actualEnergy} J`,
      isHighRisk: false,
      arrestDurationSeconds: 0,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  return null;
};

/**
 * Detect antiarrhythmic selection deviations
 * After 3rd shock: Amiodarone or Lidocaine
 * After 5th shock: Second antiarrhythmic dose
 */
export const detectAntiarrhythmicDeviation = (
  state: CprEngineState,
  recommendedMedication: string,
  selectedMedication: string
): OverrideContext | null => {
  // Both are acceptable, but log if different
  if (
    recommendedMedication !== selectedMedication &&
    ['amiodarone', 'lidocaine'].includes(selectedMedication)
  ) {
    return {
      overrideType: 'antiarrhythmic_selection',
      recommendedAction: `Give ${recommendedMedication}`,
      actualAction: `Gave ${selectedMedication} instead`,
      isHighRisk: false,
      arrestDurationSeconds: 0,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  return null;
};

/**
 * Detect skipped medication
 * When system recommends a medication but clinician declines
 */
export const detectSkippedMedication = (
  state: CprEngineState,
  recommendedMedication: string,
  currentAction: string
): OverrideContext | null => {
  if (currentAction === 'skip_medication') {
    return {
      overrideType: 'skip_medication',
      recommendedAction: `Give ${recommendedMedication}`,
      actualAction: 'Declined medication',
      isHighRisk: false,
      arrestDurationSeconds: 0,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  return null;
};

/**
 * Detect extended CPR beyond protocol
 * Standard termination: 30 minutes without ROSC or after 2 unsuccessful shocks in asystole
 */
export const detectExtendedCpr = (
  state: CprEngineState,
  arrestDurationSeconds: number,
  currentAction: string
): OverrideContext | null => {
  const MAX_CPR_DURATION = 1800; // 30 minutes in seconds

  if (
    arrestDurationSeconds > MAX_CPR_DURATION &&
    currentAction === 'continue_cpr' &&
    state.rhythmType === 'asystole'
  ) {
    return {
      overrideType: 'continue_cpr_beyond_protocol',
      recommendedAction: 'Consider terminating resuscitation (30 minutes without ROSC)',
      actualAction: `Continued CPR for ${arrestDurationSeconds}s (${(arrestDurationSeconds / 60).toFixed(1)} minutes)`,
      isHighRisk: true,
      arrestDurationSeconds,
      rhythmType: state.rhythmType,
      shockCount: state.shockCount,
      epiDoseCount: state.epiDoses,
    };
  }

  return null;
};

/**
 * Main override detection function
 * Analyzes current action against engine state to detect deviations
 */
export const detectOverride = (
  state: CprEngineState,
  arrestDurationSeconds: number,
  patientWeight: number,
  currentAction: string,
  actionDetails?: Record<string, any>
): OverrideContext | null => {
  // Check for skipped rhythm check
  const rhythmCheckOverride = detectSkippedRhythmCheck(
    state,
    actionDetails?.timeSinceLastRhythmCheck ?? 0,
    currentAction
  );
  if (rhythmCheckOverride) return rhythmCheckOverride;

  // Check for medication timing deviations
  const medicationTimingOverride = detectMedicationTimingDeviation(
    state,
    arrestDurationSeconds,
    currentAction
  );
  if (medicationTimingOverride) return medicationTimingOverride;

  // Check for shock energy deviations
  if (actionDetails?.recommendedEnergy && actionDetails?.actualEnergy) {
    const shockEnergyOverride = detectShockEnergyDeviation(
      state,
      patientWeight,
      actionDetails.recommendedEnergy,
      actionDetails.actualEnergy
    );
    if (shockEnergyOverride) return shockEnergyOverride;
  }

  // Check for antiarrhythmic deviations
  if (actionDetails?.recommendedMedication && actionDetails?.selectedMedication) {
    const antiarrhythmicOverride = detectAntiarrhythmicDeviation(
      state,
      actionDetails.recommendedMedication,
      actionDetails.selectedMedication
    );
    if (antiarrhythmicOverride) return antiarrhythmicOverride;
  }

  // Check for skipped medication
  if (actionDetails?.recommendedMedication) {
    const skippedMedicationOverride = detectSkippedMedication(
      state,
      actionDetails.recommendedMedication,
      currentAction
    );
    if (skippedMedicationOverride) return skippedMedicationOverride;
  }

  // Check for extended CPR
  const extendedCprOverride = detectExtendedCpr(state, arrestDurationSeconds, currentAction);
  if (extendedCprOverride) return extendedCprOverride;

  return null;
};
