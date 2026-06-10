/**
 * Pure clinical engine for CPR logic (AHA PALS aligned).
 * Extracted from UI components to ensure consistency across Solo/Team modes.
 */

export type ArrestPhase = 'initial_assessment' | 'compressions' | 'reassessment' | 'rhythm_check' | 'charging' | 'shock_ready' | 'post_shock';
export type RhythmType = 'vf_pvt' | 'pea' | 'asystole' | 'rosc' | 'unknown';
export type EpiTimingState = 'not_due' | 'almost_due' | 'overdue';
export type RhythmWindowPhase = 'compressions' | 'precharge_alert' | 'rhythm_window';
export type RhythmClassification = 'shockable' | 'non_shockable';
export type ShockActionType = 'shock_delivered' | 'no_shock';

export const CPR_CYCLE_SECONDS = 120;
/** T-30s before rhythm check — charge defibrillator (CEO CPR-GPS). */
export const PRECHARGE_ALERT_SECONDS = 30;
export const RHYTHM_WINDOW_SECONDS = 10;
export const CYCLE_BLOCK_SECONDS = CPR_CYCLE_SECONDS + RHYTHM_WINDOW_SECONDS;
export const VENTILATION_CUE_SECONDS = 6;
export const EPI_MIN_INTERVAL_SECONDS = 180;
/** 1-minute prep warning before next epinephrine dose (CEO CPR-GPS). */
export const EPI_PREP_WARNING_SECONDS = 60;
export const PRECHARGE_AT_COMPRESSION_ELAPSED = CPR_CYCLE_SECONDS - PRECHARGE_ALERT_SECONDS;

export interface CprEngineState {
  shockCount: number;
  epiDoses: number;
  lastEpiTime: number | null;
  antiarrhythmicDoses: number;
  rhythmType: RhythmType;
  phase: ArrestPhase;
}

export interface CycleWorkflowStatus {
  cycleNumber: number;
  elapsedInBlock: number;
  countdownToRhythmCheck: number;
  rhythmWindowRemaining: number;
  phase: RhythmWindowPhase;
  nextAction: string;
}

export interface CompressionCycleStatus {
  compressionElapsed: number;
  countdownToRhythmCheck: number;
  phase: 'compressions' | 'precharge_alert' | 'rhythm_check_due';
  nextAction: string;
}

export type CprGpsAlertType =
  | 'reassessment_due'
  | 'precharge_defibrillator'
  | 'rhythm_window'
  | 'epinephrine_due'
  | 'epinephrine_prep'
  | 'amiodarone_due'
  | 'advanced_airway'
  | 'reversible_causes';

export interface CprGpsAlert {
  type: CprGpsAlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  speakText?: string;
}

export interface CprGpsAlertInput {
  compressionElapsed: number;
  rhythmWindowElapsed: number | null;
  inReassessment: boolean;
  arrestDuration: number;
  state: CprEngineState;
  isShockable: boolean;
  advancedAirwayPlaced: boolean;
  cycleNumber: number;
  weightKg: number;
  defibDelayed?: boolean;
}

export interface RhythmWindowDocumentation {
  rhythmClassification: RhythmClassification;
  rhythmType?: RhythmType;
  shockAction: ShockActionType;
  noShockReason?: string;
}

export interface HyperkalemiaGuidanceInput {
  weightKg: number;
  potassiumMmolL: number;
  hasEcgChanges: boolean;
  prolongedArrest?: boolean;
}

export interface HyperkalemiaGuidance {
  severity: 'mild' | 'moderate' | 'severe';
  calciumGluconate: string;
  insulinDextrose: string;
  bicarbonate: string;
  prompts: string[];
}

export function getCycleWorkflowStatus(totalElapsedSeconds: number): CycleWorkflowStatus {
  const safeElapsed = Math.max(0, totalElapsedSeconds);
  const elapsedInBlock = safeElapsed % CYCLE_BLOCK_SECONDS;
  const cycleNumber = Math.floor(safeElapsed / CYCLE_BLOCK_SECONDS) + 1;
  const inCompressionPhase = elapsedInBlock < CPR_CYCLE_SECONDS;
  const countdownToRhythmCheck = inCompressionPhase ? CPR_CYCLE_SECONDS - elapsedInBlock : 0;
  const rhythmWindowRemaining = inCompressionPhase ? 0 : CYCLE_BLOCK_SECONDS - elapsedInBlock;
  const phase: RhythmWindowPhase = !inCompressionPhase
    ? 'rhythm_window'
    : countdownToRhythmCheck <= PRECHARGE_ALERT_SECONDS
      ? 'precharge_alert'
      : 'compressions';

  const nextAction =
    phase === 'rhythm_window'
      ? 'Document rhythm and shock decision'
      : phase === 'precharge_alert'
        ? 'Pre-charge defibrillator'
        : 'Continue high-quality compressions';

  return {
    cycleNumber,
    elapsedInBlock,
    countdownToRhythmCheck,
    rhythmWindowRemaining,
    phase,
    nextAction,
  };
}

/** Compression-phase cycle timer — resets after each reassessment (CEO CPR-GPS). */
export function getCompressionCycleStatus(compressionElapsed: number): CompressionCycleStatus {
  const elapsed = Math.max(0, compressionElapsed);
  const countdownToRhythmCheck = Math.max(0, CPR_CYCLE_SECONDS - elapsed);
  const phase: CompressionCycleStatus['phase'] =
    elapsed >= CPR_CYCLE_SECONDS
      ? 'rhythm_check_due'
      : elapsed >= PRECHARGE_AT_COMPRESSION_ELAPSED
        ? 'precharge_alert'
        : 'compressions';

  const nextAction =
    phase === 'rhythm_check_due'
      ? 'Stop compressions — reassess patient and rhythm'
      : phase === 'precharge_alert'
        ? 'Charge defibrillator now'
        : 'Continue high-quality compressions';

  return { compressionElapsed: elapsed, countdownToRhythmCheck, phase, nextAction };
}

export function getRhythmClassificationFeedback(
  classification: RhythmClassification,
  rhythmType?: RhythmType
): { title: string; message: string; severity: 'warning' | 'destructive' } {
  if (classification === 'shockable') {
    return {
      title: 'SHOCKABLE RHYTHM',
      message: `${rhythmType === 'vf_pvt' ? 'VF/pVT' : 'Shockable rhythm'} — prepare to defibrillate. Minimize pause; resume compressions immediately after shock.`,
      severity: 'warning',
    };
  }
  return {
    title: 'NON-SHOCKABLE RHYTHM',
    message: `${rhythmType === 'pea' ? 'PEA' : rhythmType === 'asystole' ? 'Asystole' : 'Non-shockable rhythm'} — do not shock. Resume compressions and give epinephrine if due.`,
    severity: 'destructive',
  };
}

export function calculateAmiodaroneDose(
  shockCount: number,
  weightKg: number
): { eligible: boolean; doseMg: number; label: string } {
  if (shockCount === 3) {
    const doseMg = Math.min(Math.round(weightKg * 5), 300);
    return { eligible: true, doseMg, label: `${doseMg} mg IV (5 mg/kg, max 300 mg) — after 3rd shock` };
  }
  if (shockCount === 5) {
    const doseMg = Math.min(Math.round(weightKg * 2.5), 150);
    return { eligible: true, doseMg, label: `${doseMg} mg IV (2.5 mg/kg, max 150 mg) — after 5th shock` };
  }
  return { eligible: false, doseMg: 0, label: '' };
}

export function shouldPromptAdvancedAirway(shockCount: number, advancedAirwayPlaced: boolean): boolean {
  return shockCount >= 1 && !advancedAirwayPlaced;
}

export function shouldPromptReversibleCausesReview(cycleNumber: number): boolean {
  return cycleNumber >= 1;
}

export function evaluateCprGpsAlerts(input: CprGpsAlertInput): CprGpsAlert[] {
  const alerts: CprGpsAlert[] = [];
  const {
    compressionElapsed,
    rhythmWindowElapsed,
    inReassessment,
    arrestDuration,
    state,
    isShockable,
    advancedAirwayPlaced,
    cycleNumber,
    weightKg,
    defibDelayed = false,
  } = input;

  if (inReassessment && rhythmWindowElapsed !== null) {
    const remaining = Math.max(0, RHYTHM_WINDOW_SECONDS - rhythmWindowElapsed);
    alerts.push({
      type: 'rhythm_window',
      severity: 'warning',
      message: `${remaining}s rhythm/shock window — document rhythm and shock decision`,
      speakText: remaining <= 3 ? 'Resume compressions soon' : undefined,
    });
    if (shouldPromptReversibleCausesReview(cycleNumber)) {
      alerts.push({
        type: 'reversible_causes',
        severity: 'info',
        message: 'Review reversible causes (Hs & Ts) between cycles',
      });
    }
    return alerts;
  }

  const compression = getCompressionCycleStatus(compressionElapsed);
  if (compression.phase === 'rhythm_check_due') {
    alerts.push({
      type: 'reassessment_due',
      severity: 'critical',
      message: '2-minute cycle complete — reassess patient and check rhythm',
      speakText: 'Stop compressions. Reassess patient and check rhythm.',
    });
  } else if (compression.phase === 'precharge_alert' && isShockable) {
    alerts.push({
      type: 'precharge_defibrillator',
      severity: 'warning',
      message: `Charge defibrillator — rhythm check in ${compression.countdownToRhythmCheck}s`,
      speakText: 'Charge the defibrillator now.',
    });
  }

  const med = evaluateMedicationEligibility(arrestDuration, state, isShockable, { defibDelayed });
  const epiState = getEpinephrineTimingState(arrestDuration, state, isShockable, { defibDelayed });
  if (med.epiEligible) {
    alerts.push({
      type: 'epinephrine_due',
      severity: 'critical',
      message: med.recommendation ?? 'Give epinephrine now',
      speakText: med.recommendation ?? 'Give epinephrine now.',
    });
  } else if (epiState === 'almost_due') {
    alerts.push({
      type: 'epinephrine_prep',
      severity: 'warning',
      message: 'Prepare next epinephrine dose — due within 1 minute',
      speakText: 'Prepare epinephrine. Dose due within one minute.',
    });
  }

  if (isShockable && med.antiarrhythmicEligible) {
    const doseInfo = calculateAmiodaroneDose(state.shockCount, weightKg);
    alerts.push({
      type: 'amiodarone_due',
      severity: 'warning',
      message: doseInfo.eligible
        ? `Amiodarone ${doseInfo.doseMg} mg IV after shock #${state.shockCount}`
        : `Consider antiarrhythmic after shock #${state.shockCount}`,
      speakText: doseInfo.eligible ? `Give amiodarone ${doseInfo.doseMg} milligrams.` : undefined,
    });
  }

  if (shouldPromptAdvancedAirway(state.shockCount, advancedAirwayPlaced)) {
    alerts.push({
      type: 'advanced_airway',
      severity: 'info',
      message: 'Consider advanced airway placement (after 1st shock)',
      speakText: 'Consider advanced airway placement.',
    });
  }

  return alerts;
}

export function validateRhythmWindowDocumentation(
  doc: RhythmWindowDocumentation
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!doc.rhythmClassification) {
    missing.push('rhythmClassification');
  }
  if (!doc.shockAction) {
    missing.push('shockAction');
  }
  if (doc.shockAction === 'no_shock' && !doc.noShockReason?.trim()) {
    missing.push('noShockReason');
  }
  return { valid: missing.length === 0, missing };
}

export function applyRhythmWindowDecision(
  shockCount: number,
  doc: RhythmWindowDocumentation
): { nextShockCount: number; actionSummary: string } {
  const decision = validateRhythmWindowDocumentation(doc);
  if (!decision.valid) {
    throw new Error(`Incomplete rhythm window documentation: ${decision.missing.join(', ')}`);
  }

  if (doc.shockAction === 'shock_delivered') {
    const nextShockCount = shockCount + 1;
    return {
      nextShockCount,
      actionSummary: `Shock #${nextShockCount} delivered`,
    };
  }

  return {
    nextShockCount: shockCount,
    actionSummary: `No shock delivered (${doc.noShockReason?.trim()})`,
  };
}

export function getEpinephrineTimingState(
  arrestDuration: number,
  state: CprEngineState,
  isShockable: boolean,
  options: MedicationEligibilityOptions = {}
): EpiTimingState {
  const med = evaluateMedicationEligibility(arrestDuration, state, isShockable, options);
  if (state.lastEpiTime === null) {
    return med.epiEligible ? 'overdue' : 'not_due';
  }

  const elapsed = Math.max(0, arrestDuration - state.lastEpiTime);
  if (elapsed >= EPI_MIN_INTERVAL_SECONDS) return 'overdue';
  if (elapsed >= EPI_MIN_INTERVAL_SECONDS - EPI_PREP_WARNING_SECONDS) return 'almost_due';
  return 'not_due';
}

export function shouldTriggerIntubatedVentilationCue(
  elapsedSinceIntubation: number,
  advancedAirwayPlaced: boolean
): boolean {
  if (!advancedAirwayPlaced) return false;
  if (elapsedSinceIntubation <= 0) return false;
  return elapsedSinceIntubation % VENTILATION_CUE_SECONDS === 0;
}

export function getHyperkalemiaGuidance(input: HyperkalemiaGuidanceInput): HyperkalemiaGuidance {
  const { weightKg, potassiumMmolL, hasEcgChanges, prolongedArrest = false } = input;
  const severity: HyperkalemiaGuidance['severity'] =
    potassiumMmolL >= 7 || hasEcgChanges ? 'severe' : potassiumMmolL >= 6 ? 'moderate' : 'mild';

  const calciumMinMl = Math.max(1, Math.round(weightKg * 0.6 * 10) / 10);
  const calciumMaxMl = Math.max(1, Math.round(weightKg * 1 * 10) / 10);
  const insulinUnits = Math.max(1, Math.round(weightKg * 0.1 * 10) / 10);
  const dextroseGrams = Math.max(2.5, Math.round(weightKg * 0.5 * 10) / 10);
  const bicarbonateDose = Math.max(5, Math.round(weightKg));

  const prompts = [
    'Confirm potassium with blood gas/chemistry and trend ECG.',
    'Prioritize membrane stabilization before intracellular shift therapy.',
    'Recheck potassium and rhythm within 5-10 minutes.',
  ];

  if (severity === 'severe') {
    prompts.unshift('Treat as immediate life-threatening hyperkalemia.');
  }

  return {
    severity,
    calciumGluconate: `Calcium gluconate 10% ${calciumMinMl}-${calciumMaxMl} mL IV/IO (60-100 mg/kg) over 5-10 minutes.`,
    insulinDextrose: `Regular insulin ${insulinUnits} units IV with dextrose ${dextroseGrams} g (D10 5 mL/kg equivalent).`,
    bicarbonate:
      hasEcgChanges || prolongedArrest || potassiumMmolL >= 7
        ? `Consider sodium bicarbonate ${bicarbonateDose} mEq IV (1 mEq/kg) for severe hyperkalemia/prolonged arrest with acidosis concern.`
        : 'Bicarbonate not routine; reserve for severe hyperkalemia, prolonged arrest, or suspected significant metabolic acidosis.',
    prompts,
  };
}

/**
 * Evaluates rhythm transitions and determines next clinical phase.
 */
export function evaluateRhythmTransition(
  currentRhythm: RhythmType,
  previousState: CprEngineState
): { nextPhase: ArrestPhase; shockRequired: boolean; message: string } {
  if (currentRhythm === 'vf_pvt') {
    return {
      nextPhase: 'shock_ready',
      shockRequired: true,
      message: 'Shockable rhythm detected. Prepare to shock.',
    };
  }

  if (currentRhythm === 'rosc') {
    return {
      nextPhase: 'post_shock',
      shockRequired: false,
      message: 'ROSC achieved. Transition to post-resuscitation care.',
    };
  }

  return {
    nextPhase: 'compressions',
    shockRequired: false,
    message: 'Non-shockable rhythm. Resume compressions immediately.',
  };
}

/**
 * Determines if a shock should be recommended based on rhythm and cycle.
 */
export function isShockAdvised(rhythm: RhythmType): boolean {
  return rhythm === 'vf_pvt';
}

/**
 * Calculates recommended shock energy (AHA PALS: 2J/kg, then 4J/kg, then >=4J/kg, max 10J/kg or adult dose).
 */
export function calculateShockEnergy(weightKg: number, shockCount: number): number {
  const energyPerKg = shockCount === 0 ? 2 : shockCount === 1 ? 4 : 4; // Simplified for now, can be 4-10J/kg
  const energy = weightKg * energyPerKg;
  return Math.min(Math.round(energy), 200); // Max 200J for peds initial cycles
}

/**
 * Evaluates medication eligibility based on arrest duration and previous doses.
 */
export interface MedicationEligibilityOptions {
  /** Shockable rhythm but defibrillator unavailable or not yet attached — allow earlier epi per 2025 guidance. */
  defibDelayed?: boolean;
}

export function evaluateMedicationEligibility(
  arrestDuration: number,
  state: CprEngineState,
  isShockable: boolean,
  options: MedicationEligibilityOptions = {}
): { epiEligible: boolean; antiarrhythmicEligible: boolean; recommendation: string | null } {
  let epiEligible = false;
  let antiarrhythmicEligible = false;
  let recommendation: string | null = null;

  const { defibDelayed = false } = options;

  // Epinephrine (every 3-5 min)
  if (state.lastEpiTime === null) {
    // First dose: immediate if non-shockable; shockable after 2nd shock OR if defib delayed
    const shockableFirstEpiOk =
      state.shockCount >= 2 || (defibDelayed && state.shockCount >= 0);
    if (!isShockable || shockableFirstEpiOk) {
      epiEligible = true;
      recommendation = !isShockable
        ? 'Give epinephrine now (non-shockable rhythm).'
        : defibDelayed && state.shockCount < 2
          ? 'Prepare epinephrine (defibrillation delayed).'
          : 'Prepare epinephrine.';
    }
  } else if (arrestDuration - state.lastEpiTime >= 180) { // 3 min = 180s
    epiEligible = true;
    recommendation = 'Consider epinephrine (3-5 min since last dose).';
  }

  // Amiodarone: 300 mg IV after 3rd shock; 150 mg IV after 5th shock (PALS)
  if (isShockable && (state.shockCount === 3 || state.shockCount === 5)) {
    const doseIndex = state.shockCount === 3 ? 0 : 1;
    if (state.antiarrhythmicDoses <= doseIndex) {
      antiarrhythmicEligible = true;
      recommendation =
        state.shockCount === 3
          ? 'Give amiodarone 300 mg IV (or 5 mg/kg, max 300 mg) after 3rd shock.'
          : 'Give amiodarone 150 mg IV (or 2.5 mg/kg, max 150 mg) after 5th shock.';
    }
  }

  return { epiEligible, antiarrhythmicEligible, recommendation };
}

/**
 * Calculates medication doses based on weight (AHA PALS).
 */
export function calculateCprMedicationDose(
  medication: 'epinephrine' | 'amiodarone' | 'lidocaine',
  weightKg: number
): { dose: number; unit: string; preparation?: string } {
  switch (medication) {
    case 'epinephrine':
      // 0.01 mg/kg (0.1 mL/kg of 1:10,000)
      return { 
        dose: Math.round(weightKg * 0.01 * 100) / 100, 
        unit: 'mg', 
        preparation: `${Math.round(weightKg * 0.1 * 10) / 10} mL of 1:10,000 solution` 
      };
    case 'amiodarone':
      // 5 mg/kg (max 300 mg)
      return { 
        dose: Math.min(Math.round(weightKg * 5), 300), 
        unit: 'mg' 
      };
    case 'lidocaine':
      // 1 mg/kg (max 100 mg)
      return { 
        dose: Math.min(Math.round(weightKg * 1), 100), 
        unit: 'mg' 
      };
    default:
      return { dose: 0, unit: 'unknown' };
  }
}
