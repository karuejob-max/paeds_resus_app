/**
 * PALS Capstone Friction Audit & Test Script
 * 
 * This script simulates a learner's journey through the PALS Capstone
 * to identify usability friction, clinical logic errors, and integration gaps.
 */

import {
  initializePalsCapstoneSimulation,
  evaluateAbcdeAssessment,
  evaluateAirwayBreathingIntervention,
  evaluateShockAssessment,
  evaluateFluidResuscitation,
  simulateDeterioration,
  evaluateCprExecution,
  simulateRosc,
  evaluatePostResuscitationCare,
  calculateSimulationScore,
  type SimulationState,
} from './pals-capstone-engine';

/**
 * Run a full simulation audit
 */
export function runSimulationAudit() {
  console.log('--- STARTING PALS CAPSTONE FRICTION AUDIT ---');

  // 1. Initialize
  let state = initializePalsCapstoneSimulation({
    patientAge: 2,
    patientWeight: 12,
    difficulty: 'standard',
  });
  console.log('1. Initialized simulation for 2yo (12kg).');

  // 2. ABCDE Assessment
  const abcdeResult = evaluateAbcdeAssessment(state, {
    respiratoryRate: 45,
    oxygenSaturation: 88,
    capillaryRefillTime: 4,
    pulseQuality: 'weak',
    consciousness: 'alert',
  });
  state = abcdeResult.newState;
  console.log(`2. ABCDE Assessment: ${abcdeResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);
  if (!abcdeResult.isCorrect) console.error(abcdeResult.feedback);

  // 3. Airway Intervention
  const airwayResult = evaluateAirwayBreathingIntervention(state, 'high_flow_oxygen');
  state = airwayResult.newState;
  console.log(`3. Airway Intervention: ${airwayResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);

  // 4. Shock Assessment
  const shockResult = evaluateShockAssessment(state, 'hypovolemic');
  state = shockResult.newState;
  console.log(`4. Shock Assessment: ${shockResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);

  // 5. Fluid Resuscitation
  const fluidResult = evaluateFluidResuscitation(state, 240, 'normal_saline'); // 12kg * 20ml/kg = 240ml
  state = fluidResult.newState;
  console.log(`5. Fluid Resuscitation: ${fluidResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);

  // 6. Deterioration
  state = simulateDeterioration(state);
  console.log('6. Patient deteriorated into Cardiac Arrest (VF).');

  // 7. CPR Execution
  const cprResult = evaluateCprExecution(state, {
    compressionRate: 110,
    compressionDepth: 1.4,
    shockDelivered: true,
    medicationGiven: 'epinephrine',
    cyclesDuration: 120,
  });
  state = cprResult.newState;
  console.log(`7. CPR Execution: ${cprResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);

  // 8. ROSC
  state = simulateRosc(state);
  console.log('8. ROSC Achieved.');

  // 9. Post-Resuscitation Care
  const postResusResult = evaluatePostResuscitationCare(state, {
    targetTemperature: 33,
    sedationInitiated: true,
    continuousMonitoring: true,
    referralInitiated: true,
  });
  state = postResusResult.newState;
  console.log(`9. Post-Resuscitation Care: ${postResusResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);

  // 10. Final Score
  const finalScore = calculateSimulationScore(state);
  console.log(`--- AUDIT COMPLETE ---`);
  console.log(`Final Score: ${finalScore.percentage}%`);
  console.log(`Sim-Ready: ${finalScore.simReady ? 'YES' : 'NO'}`);
  console.log(`Badge: ${finalScore.badge}`);

  return {
    success: finalScore.simReady && finalScore.percentage >= 80,
    state,
    finalScore,
  };
}

/**
 * Audit Findings & Friction Points
 * 
 * 1. ABCDE Input: Requiring exact numbers for RR and SpO2 might be too rigid. 
 *    Suggestion: Use ranges or pre-populated probable answers.
 * 2. Shock Assessment: Differentiating hypovolemic vs distributive shock 
 *    without more clues (e.g., rash, history) is difficult.
 *    Suggestion: Add a "Clinical History" module or more visual clues.
 * 3. Fluid Calculation: Learners might struggle with the 20ml/kg math.
 *    Suggestion: Integrate the ResusGPS Drug Calculator directly into the UI.
 * 4. CPR Timing: The 2-minute cycle is critical.
 *    Suggestion: Ensure the CPR Clock has high-visibility alerts at 15s before cycle end.
 */
