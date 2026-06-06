/**
 * PALS Capstone Simulation Engine
 * 
 * This engine powers the "PALS Mega-Case" — a high-fidelity simulation that forces learners
 * to use ResusGPS tools (Shock Assessment, CPR Clock, Drug Calculator) to manage a deteriorating
 * pediatric patient through to cardiac arrest and successful resuscitation.
 * 
 * Clinical Scenario:
 * - 2-year-old child (12 kg) presenting with respiratory distress and poor perfusion
 * - Progression: Respiratory distress → Shock → Cardiac Arrest → CPR → ROSC
 * 
 * Learning Outcomes:
 * - Systematic ABCDE assessment
 * - Shock differentiation and fluid resuscitation
 * - Cardiac arrest recognition and CPR execution
 * - Medication timing and dosing
 * - Reassessment after interventions
 */

export type SimulationPhase = 
  | 'initial_assessment'
  | 'airway_breathing'
  | 'circulation_assessment'
  | 'shock_recognition'
  | 'fluid_resuscitation'
  | 'deterioration'
  | 'cardiac_arrest'
  | 'cpr_execution'
  | 'rosc_achieved'
  | 'post_resuscitation';

export type ClinicalFinding = 
  | 'respiratory_distress'
  | 'poor_perfusion'
  | 'weak_pulse'
  | 'tachycardia'
  | 'low_oxygen'
  | 'altered_consciousness'
  | 'no_pulse'
  | 'no_breathing';

export interface PatientState {
  age: number; // years
  weight: number; // kg
  oxygenSaturation: number; // %
  heartRate: number; // bpm
  bloodPressure: { systolic: number; diastolic: number };
  respiratoryRate: number; // breaths/min
  consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive';
  capillaryRefillTime: number; // seconds
  pulseQuality: 'strong' | 'weak' | 'absent';
  breathingPresent: boolean;
  rhythmType: 'sinus' | 'svt' | 'vf' | 'pea' | 'asystole' | null;
}

export interface SimulationState {
  phase: SimulationPhase;
  patientState: PatientState;
  elapsedTime: number; // seconds since start
  interventionsPerformed: string[];
  shockCount: number;
  epiDoses: number;
  fluidGiven: number; // mL
  cpuCycles: number; // 2-minute cycles completed
  learnerActions: LearnerAction[];
  clinicalFindings: ClinicalFinding[];
  score: number;
  isComplete: boolean;
  outcome: 'success' | 'failure' | 'in_progress';
}

export interface LearnerAction {
  timestamp: number;
  action: string;
  details?: Record<string, any>;
  correct: boolean;
  feedback: string;
}

export interface SimulationConfig {
  patientAge: number;
  patientWeight: number;
  difficulty: 'standard' | 'challenging';
}

/**
 * Initialize the PALS Mega-Case simulation
 */
export function initializePalsCapstoneSimulation(
  config: SimulationConfig
): SimulationState {
  return {
    phase: 'initial_assessment',
    patientState: {
      age: config.patientAge,
      weight: config.patientWeight,
      oxygenSaturation: 88, // Low — respiratory distress
      heartRate: 160, // Tachycardic
      bloodPressure: { systolic: 85, diastolic: 55 }, // Low — poor perfusion
      respiratoryRate: 45, // Tachypneic
      consciousness: 'alert',
      capillaryRefillTime: 4, // Delayed — shock
      pulseQuality: 'weak',
      breathingPresent: true,
      rhythmType: 'sinus',
    },
    elapsedTime: 0,
    interventionsPerformed: [],
    shockCount: 0,
    epiDoses: 0,
    fluidGiven: 0,
    cpuCycles: 0,
    learnerActions: [],
    clinicalFindings: [
      'respiratory_distress',
      'poor_perfusion',
      'weak_pulse',
      'tachycardia',
      'low_oxygen',
    ],
    score: 0,
    isComplete: false,
    outcome: 'in_progress',
  };
}

/**
 * Evaluate learner's ABCDE assessment
 * Returns feedback and advances simulation if assessment is correct
 */
export function evaluateAbcdeAssessment(
  state: SimulationState,
  learnerFindings: Partial<PatientState>
): { isCorrect: boolean; feedback: string; newState: SimulationState } {
  const errors: string[] = [];

  // Airway: Should be patent
  if (learnerFindings.consciousness !== 'alert') {
    errors.push('Airway: Patient is alert, airway should be patent.');
  }

  // Breathing: Should recognize respiratory distress (RR 45, O2 sat 88%)
  if (!learnerFindings.respiratoryRate || learnerFindings.respiratoryRate < 40) {
    errors.push('Breathing: Respiratory rate is elevated (45 breaths/min). Recognize respiratory distress.');
  }

  if (!learnerFindings.oxygenSaturation || learnerFindings.oxygenSaturation > 90) {
    errors.push('Breathing: Oxygen saturation is low (88%). Initiate supplemental oxygen.');
  }

  // Circulation: Should recognize poor perfusion (CRT 4s, weak pulse, low BP)
  if (!learnerFindings.capillaryRefillTime || learnerFindings.capillaryRefillTime < 3) {
    errors.push('Circulation: Capillary refill is delayed (4 seconds). This indicates poor perfusion.');
  }

  if (learnerFindings.pulseQuality !== 'weak') {
    errors.push('Circulation: Pulse quality is weak. This is a sign of shock.');
  }

  // Disability: Should recognize alert but tachycardic
  if (learnerFindings.consciousness !== 'alert') {
    errors.push('Disability: Patient is alert. No neurological deficit noted.');
  }

  // Exposure: Should assess for rash, temperature
  // (Simplified for this capstone)

  const isCorrect = errors.length === 0;
  const feedback = isCorrect
    ? '✓ Correct ABCDE assessment. You recognized respiratory distress and poor perfusion. Next: Initiate oxygen, establish IV/IO access, and perform shock assessment.'
    : `✗ ABCDE Assessment incomplete:\n${errors.join('\n')}\n\nTry again.`;

  const newState = { ...state };
  if (isCorrect) {
    newState.phase = 'airway_breathing';
    newState.score += 10;
  }

  newState.learnerActions.push({
    timestamp: state.elapsedTime,
    action: 'abcde_assessment',
    details: learnerFindings,
    correct: isCorrect,
    feedback,
  });

  return { isCorrect, feedback, newState };
}

/**
 * Evaluate learner's oxygen/airway management
 */
export function evaluateAirwayBreathingIntervention(
  state: SimulationState,
  intervention: 'high_flow_oxygen' | 'hfnc' | 'cpap' | 'intubation'
): { isCorrect: boolean; feedback: string; newState: SimulationState } {
  const isCorrect = intervention === 'high_flow_oxygen' || intervention === 'hfnc';
  const feedback = isCorrect
    ? '✓ Correct. High-flow oxygen initiated. Oxygen saturation improving to 94%. Next: Assess circulation and initiate IV/IO access.'
    : '✗ Intubation is not indicated at this stage. Start with high-flow oxygen or HFNC. Reassess after oxygen therapy.';

  const newState = { ...state };
  if (isCorrect) {
    newState.patientState.oxygenSaturation = 94;
    newState.phase = 'circulation_assessment';
    newState.interventionsPerformed.push('oxygen_therapy');
    newState.score += 10;
  }

  newState.learnerActions.push({
    timestamp: state.elapsedTime,
    action: 'airway_breathing_intervention',
    details: { intervention },
    correct: isCorrect,
    feedback,
  });

  return { isCorrect, feedback, newState };
}

/**
 * Evaluate learner's shock assessment and differentiation
 */
export function evaluateShockAssessment(
  state: SimulationState,
  shockType: 'hypovolemic' | 'distributive' | 'cardiogenic' | 'obstructive'
): { isCorrect: boolean; feedback: string; newState: SimulationState } {
  // Clinical clues: delayed CRT, weak pulse, low BP, tachycardia, alert
  // This suggests hypovolemic or distributive shock (not cardiogenic with pulmonary edema)
  const isCorrect = shockType === 'hypovolemic' || shockType === 'distributive';
  const feedback = isCorrect
    ? '✓ Correct shock type. Hypovolemic/distributive shock recognized. Next: Establish IV/IO access and initiate fluid resuscitation (20 mL/kg bolus).'
    : '✗ Incorrect. The clinical picture (delayed CRT, weak pulse, tachycardia) suggests hypovolemic or distributive shock, not cardiogenic. Reassess.';

  const newState = { ...state };
  if (isCorrect) {
    newState.phase = 'shock_recognition';
    newState.score += 15;
  }

  newState.learnerActions.push({
    timestamp: state.elapsedTime,
    action: 'shock_assessment',
    details: { shockType },
    correct: isCorrect,
    feedback,
  });

  return { isCorrect, feedback, newState };
}

/**
 * Evaluate learner's fluid resuscitation
 */
export function evaluateFluidResuscitation(
  state: SimulationState,
  fluidVolume: number,
  fluidType: 'normal_saline' | 'lactated_ringer'
): { isCorrect: boolean; feedback: string; newState: SimulationState } {
  const expectedVolume = state.patientState.weight * 20; // 20 mL/kg
  const tolerance = expectedVolume * 0.1; // ±10%
  const volumeCorrect = Math.abs(fluidVolume - expectedVolume) <= tolerance;
  const fluidCorrect = fluidType === 'normal_saline' || fluidType === 'lactated_ringer';

  const isCorrect = volumeCorrect && fluidCorrect;
  const feedback = isCorrect
    ? `✓ Correct fluid bolus: ${fluidVolume} mL of ${fluidType}. Reassessing patient...`
    : `✗ Fluid bolus incorrect. Expected: ${expectedVolume} mL (±10%) of crystalloid. You gave: ${fluidVolume} mL. Try again.`;

  const newState = { ...state };
  if (isCorrect) {
    newState.fluidGiven += fluidVolume;
    newState.interventionsPerformed.push('fluid_bolus_1');
    newState.score += 15;
    // Simulate patient response after 2-3 minutes
    newState.elapsedTime += 180;
    // Patient improves slightly but remains in shock
    newState.patientState.heartRate = 150;
    newState.patientState.capillaryRefillTime = 3;
    newState.patientState.pulseQuality = 'weak';
    newState.phase = 'fluid_resuscitation';
  }

  newState.learnerActions.push({
    timestamp: state.elapsedTime,
    action: 'fluid_resuscitation',
    details: { fluidVolume, fluidType },
    correct: isCorrect,
    feedback,
  });

  return { isCorrect, feedback, newState };
}

/**
 * Simulate patient deterioration → Cardiac Arrest
 * Triggered after learner completes fluid resuscitation or after 5+ minutes
 */
export function simulateDeterioration(
  state: SimulationState
): SimulationState {
  const newState = { ...state };
  newState.elapsedTime += 120; // 2 minutes pass

  // Patient deteriorates: fluid-refractory shock → cardiac arrest
  newState.patientState.heartRate = 40; // Bradycardia — ominous sign
  newState.patientState.pulseQuality = 'absent'; // No pulse
  newState.patientState.breathingPresent = false; // No breathing
  newState.patientState.consciousness = 'unresponsive';
  newState.patientState.rhythmType = 'vf'; // Ventricular fibrillation

  newState.phase = 'cardiac_arrest';
  newState.clinicalFindings.push('no_pulse', 'no_breathing');
  newState.learnerActions.push({
    timestamp: newState.elapsedTime,
    action: 'patient_deterioration',
    details: { reason: 'Fluid-refractory shock → Cardiac arrest' },
    correct: true,
    feedback: '⚠ CARDIAC ARREST DETECTED. Patient is unresponsive, pulseless, and apneic. Rhythm: VF. Initiate CPR immediately. Call for defibrillator.',
  });

  return newState;
}

/**
 * Evaluate learner's CPR execution
 * This hooks into the CPR Clock component
 */
export function evaluateCprExecution(
  state: SimulationState,
  cprMetrics: {
    compressionRate: number; // 100-120 bpm
    compressionDepth: number; // 1/3 chest depth
    shockDelivered: boolean;
    medicationGiven: 'epinephrine' | 'amiodarone' | null;
    cyclesDuration: number; // seconds
  }
): { isCorrect: boolean; feedback: string; newState: SimulationState } {
  const errors: string[] = [];

  if (cprMetrics.compressionRate < 100 || cprMetrics.compressionRate > 120) {
    errors.push(`Compression rate out of range: ${cprMetrics.compressionRate} bpm. Target: 100-120 bpm.`);
  }

  if (cprMetrics.compressionDepth < 1.2 || cprMetrics.compressionDepth > 1.6) {
    errors.push(`Compression depth incorrect: ${cprMetrics.compressionDepth} cm. Target: 1/3 chest depth (~1.3-1.5 cm for 2yo).`);
  }

  if (!cprMetrics.shockDelivered) {
    errors.push('Shock not delivered. VF is shockable. Defibrillate immediately.');
  }

  if (!cprMetrics.medicationGiven) {
    errors.push('Epinephrine not given. After first shock, give epinephrine 0.01 mg/kg IV/IO.');
  }

  const isCorrect = errors.length === 0;
  const feedback = isCorrect
    ? '✓ Excellent CPR execution. Compressions at 110 bpm, adequate depth, shock delivered, epinephrine given. Continuing cycles...'
    : `✗ CPR execution issues:\n${errors.join('\n')}\n\nCorrect and continue.`;

  const newState = { ...state };
  if (isCorrect) {
    newState.shockCount += 1;
    newState.epiDoses += 1;
    newState.cpuCycles += 1;
    newState.score += 20;
    newState.phase = 'cpr_execution';
    newState.interventionsPerformed.push('cpr_cycle_1');
  }

  newState.learnerActions.push({
    timestamp: state.elapsedTime,
    action: 'cpr_execution',
    details: cprMetrics,
    correct: isCorrect,
    feedback,
  });

  return { isCorrect, feedback, newState };
}

/**
 * Simulate ROSC (Return of Spontaneous Circulation)
 * Triggered after 2-3 successful CPR cycles
 */
export function simulateRosc(
  state: SimulationState
): SimulationState {
  const newState = { ...state };
  newState.elapsedTime += 240; // 4 minutes of CPR

  newState.patientState.heartRate = 120;
  newState.patientState.pulseQuality = 'strong';
  newState.patientState.breathingPresent = true;
  newState.patientState.consciousness = 'pain'; // Improving
  newState.patientState.oxygenSaturation = 96;
  newState.patientState.rhythmType = 'sinus';

  newState.phase = 'rosc_achieved';
  newState.score += 30;
  newState.learnerActions.push({
    timestamp: newState.elapsedTime,
    action: 'rosc_achieved',
    details: { reason: 'Successful CPR and defibrillation' },
    correct: true,
    feedback: '✓ ROSC ACHIEVED! Pulse restored, breathing spontaneous, oxygen saturation 96%. Transition to post-resuscitation care.',
  });

  return newState;
}

/**
 * Evaluate post-resuscitation care
 */
export function evaluatePostResuscitationCare(
  state: SimulationState,
  actions: {
    targetTemperature: number; // 32-34°C for therapeutic hypothermia
    sedationInitiated: boolean;
    continuousMonitoring: boolean;
    referralInitiated: boolean;
  }
): { isCorrect: boolean; feedback: string; newState: SimulationState } {
  const errors: string[] = [];

  if (actions.targetTemperature < 32 || actions.targetTemperature > 34) {
    errors.push(`Target temperature out of range: ${actions.targetTemperature}°C. Target: 32-34°C for therapeutic hypothermia.`);
  }

  if (!actions.sedationInitiated) {
    errors.push('Sedation not initiated. Sedate and paralyze for therapeutic hypothermia.');
  }

  if (!actions.continuousMonitoring) {
    errors.push('Continuous monitoring not established. Monitor ECG, SpO2, BP, temperature.');
  }

  if (!actions.referralInitiated) {
    errors.push('Referral to PICU not initiated. Arrange transfer for advanced care.');
  }

  const isCorrect = errors.length === 0;
  const feedback = isCorrect
    ? '✓ Excellent post-resuscitation care. Therapeutic hypothermia initiated, sedation given, continuous monitoring established, PICU referral arranged. Simulation complete.'
    : `✗ Post-resuscitation care incomplete:\n${errors.join('\n')}\n\nCorrect and continue.`;

  const newState = { ...state };
  if (isCorrect) {
    newState.phase = 'post_resuscitation';
    newState.score += 25;
    newState.isComplete = true;
    newState.outcome = 'success';
  }

  newState.learnerActions.push({
    timestamp: state.elapsedTime,
    action: 'post_resuscitation_care',
    details: actions,
    correct: isCorrect,
    feedback,
  });

  return { isCorrect, feedback, newState };
}

/**
 * Calculate final score and generate "Sim-Ready" badge
 */
export function calculateSimulationScore(state: SimulationState): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  simReady: boolean;
  badge: string;
} {
  const maxScore = 100; // ABCDE (10) + O2 (10) + Shock (15) + Fluid (15) + CPR (20) + ROSC (30) + Post-resus (25) = 145, normalized to 100
  const percentage = (state.score / maxScore) * 100;
  const simReady = percentage >= 80; // 80% pass threshold

  const badge = simReady
    ? '🟢 SIM-READY: You are operationally ready for the bedside.'
    : '🟡 NEEDS REVIEW: Review weak areas and retake the simulation.';

  return {
    totalScore: state.score,
    maxScore,
    percentage: Math.round(percentage),
    simReady,
    badge,
  };
}
