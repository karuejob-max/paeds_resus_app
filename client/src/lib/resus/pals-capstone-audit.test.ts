import { describe, it, expect } from 'vitest';
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
} from './pals-capstone-engine';

describe('PALS Capstone Simulation Audit', () => {
  it('should successfully complete a full PALS resuscitation scenario', () => {
    // 1. Initialize
    let state = initializePalsCapstoneSimulation({
      patientAge: 2,
      patientWeight: 12,
      difficulty: 'standard',
    });
    expect(state.phase).toBe('initial_assessment');

    // 2. ABCDE Assessment
    const abcdeResult = evaluateAbcdeAssessment(state, {
      respiratoryRate: 45,
      oxygenSaturation: 88,
      capillaryRefillTime: 4,
      pulseQuality: 'weak',
      consciousness: 'alert',
    });
    expect(abcdeResult.isCorrect).toBe(true);
    state = abcdeResult.newState;

    // 3. Airway Intervention
    const airwayResult = evaluateAirwayBreathingIntervention(state, 'high_flow_oxygen');
    expect(airwayResult.isCorrect).toBe(true);
    state = airwayResult.newState;

    // 4. Shock Assessment
    const shockResult = evaluateShockAssessment(state, 'hypovolemic');
    expect(shockResult.isCorrect).toBe(true);
    state = shockResult.newState;

    // 5. Fluid Resuscitation
    const fluidResult = evaluateFluidResuscitation(state, 240, 'normal_saline'); // 12kg * 20ml/kg = 240ml
    expect(fluidResult.isCorrect).toBe(true);
    state = fluidResult.newState;

    // 6. Deterioration
    state = simulateDeterioration(state);
    expect(state.phase).toBe('cardiac_arrest');

    // 7. CPR Execution
    const cprResult = evaluateCprExecution(state, {
      compressionRate: 110,
      compressionDepth: 1.4,
      shockDelivered: true,
      medicationGiven: 'epinephrine',
      cyclesDuration: 120,
    });
    expect(cprResult.isCorrect).toBe(true);
    state = cprResult.newState;

    // 8. ROSC
    state = simulateRosc(state);
    expect(state.phase).toBe('rosc_achieved');

    // 9. Post-Resuscitation Care
    const postResusResult = evaluatePostResuscitationCare(state, {
      targetTemperature: 33,
      sedationInitiated: true,
      continuousMonitoring: true,
      referralInitiated: true,
    });
    expect(postResusResult.isCorrect).toBe(true);
    state = postResusResult.newState;

    // 10. Final Score
    const finalScore = calculateSimulationScore(state);
    expect(finalScore.percentage).toBeGreaterThanOrEqual(80);
    expect(finalScore.simReady).toBe(true);
  });

  it('should fail if critical interventions are missed', () => {
    let state = initializePalsCapstoneSimulation({
      patientAge: 2,
      patientWeight: 12,
      difficulty: 'standard',
    });

    // Missed ABCDE details
    const abcdeResult = evaluateAbcdeAssessment(state, {
      respiratoryRate: 20, // Incorrect for distress
      oxygenSaturation: 98, // Incorrect for distress
      capillaryRefillTime: 2, // Incorrect for shock
      pulseQuality: 'strong', // Incorrect for shock
      consciousness: 'alert',
    });
    expect(abcdeResult.isCorrect).toBe(false);
  });
});
