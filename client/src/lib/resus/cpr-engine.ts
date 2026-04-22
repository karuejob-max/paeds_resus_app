/**
 * Pure clinical engine for CPR logic (AHA PALS aligned).
 * Extracted from UI components to ensure consistency across Solo/Team modes.
 */

export type ArrestPhase = 'initial_assessment' | 'compressions' | 'reassessment' | 'rhythm_check' | 'charging' | 'shock_ready' | 'post_shock';
export type RhythmType = 'vf_pvt' | 'pea' | 'asystole' | 'rosc' | 'unknown';

export interface CprEngineState {
  shockCount: number;
  epiDoses: number;
  lastEpiTime: number | null;
  antiarrhythmicDoses: number;
  rhythmType: RhythmType;
  phase: ArrestPhase;
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
export function evaluateMedicationEligibility(
  arrestDuration: number,
  state: CprEngineState,
  isShockable: boolean
): { epiEligible: boolean; antiarrhythmicEligible: boolean; recommendation: string | null } {
  let epiEligible = false;
  let antiarrhythmicEligible = false;
  let recommendation: string | null = null;

  // Epinephrine (every 3-5 min)
  if (state.lastEpiTime === null) {
    // First dose: immediate if non-shockable, after 2nd shock if shockable
    if (!isShockable || state.shockCount >= 2) {
      epiEligible = true;
      recommendation = 'Prepare epinephrine.';
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
