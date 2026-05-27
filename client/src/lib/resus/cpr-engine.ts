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
export const PRECHARGE_ALERT_SECONDS = 15;
export const RHYTHM_WINDOW_SECONDS = 10;
export const CYCLE_BLOCK_SECONDS = CPR_CYCLE_SECONDS + RHYTHM_WINDOW_SECONDS;
export const VENTILATION_CUE_SECONDS = 6;

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
  if (elapsed >= 180) return 'overdue';
  if (elapsed >= 150) return 'almost_due';
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

  // Antiarrhythmic (after 3rd shock and 5th shock for refractory VF/pVT)
  if (isShockable && (state.shockCount === 3 || state.shockCount === 5)) {
    if (state.antiarrhythmicDoses < 2) {
      antiarrhythmicEligible = true;
      recommendation = `Consider antiarrhythmic after shock #${state.shockCount}.`;
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
