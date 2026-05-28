/**
 * Test suite for cpr-engine.ts
 * Validates clinical logic for rhythm assessment, shock energy, and medication timing.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateRhythmTransition,
  evaluateMedicationEligibility,
  calculateShockEnergy,
  calculateCprMedicationDose,
  getCycleWorkflowStatus,
  applyRhythmWindowDecision,
  getEpinephrineTimingState,
  shouldTriggerIntubatedVentilationCue,
  getHyperkalemiaGuidance,
  type CprEngineState,
} from './cpr-engine';

describe('CPR Engine - Rhythm Assessment', () => {
  it('should identify VF/pVT as shockable and recommend shock_ready phase', () => {
    const state: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'unknown',
      phase: 'rhythm_check',
    };

    const result = evaluateRhythmTransition('vf_pvt', state);
    expect(result.shockRequired).toBe(true);
    expect(result.nextPhase).toBe('shock_ready');
  });

  it('should identify PEA as non-shockable and recommend compressions', () => {
    const state: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'unknown',
      phase: 'rhythm_check',
    };

    const result = evaluateRhythmTransition('pea', state);
    expect(result.shockRequired).toBe(false);
    expect(result.nextPhase).toBe('compressions');
  });

  it('should identify asystole as non-shockable and recommend compressions', () => {
    const state: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'unknown',
      phase: 'rhythm_check',
    };

    const result = evaluateRhythmTransition('asystole', state);
    expect(result.shockRequired).toBe(false);
    expect(result.nextPhase).toBe('compressions');
  });

  it('should identify ROSC and recommend post_shock phase', () => {
    const state: CprEngineState = {
      shockCount: 2,
      epiDoses: 1,
      lastEpiTime: 120,
      antiarrhythmicDoses: 0,
      rhythmType: 'unknown',
      phase: 'rhythm_check',
    };

    const result = evaluateRhythmTransition('rosc', state);
    expect(result.shockRequired).toBe(false);
    expect(result.nextPhase).toBe('post_shock');
  });
});

describe('CPR Engine - Medication Eligibility', () => {
  it('should recommend epinephrine immediately for first dose in non-shockable rhythm', () => {
    const state: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'pea',
      phase: 'compressions',
    };

    const result = evaluateMedicationEligibility(0, state, false);
    expect(result.epiEligible).toBe(true);
    expect(result.recommendation).toContain('epinephrine');
  });

  it('should NOT recommend epinephrine before 2nd shock in shockable rhythm', () => {
    const state: CprEngineState = {
      shockCount: 1,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'vf_pvt',
      phase: 'post_shock',
    };

    const result = evaluateMedicationEligibility(60, state, true);
    expect(result.epiEligible).toBe(false);
  });

  it('should recommend epinephrine after 2nd shock in shockable rhythm', () => {
    const state: CprEngineState = {
      shockCount: 2,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'vf_pvt',
      phase: 'post_shock',
    };

    const result = evaluateMedicationEligibility(120, state, true);
    expect(result.epiEligible).toBe(true);
  });

  it('should recommend early epinephrine when defibrillation is delayed in shockable rhythm', () => {
    const state: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'vf_pvt',
      phase: 'compressions',
    };

    const result = evaluateMedicationEligibility(30, state, true, { defibDelayed: true });
    expect(result.epiEligible).toBe(true);
    expect(result.recommendation).toMatch(/delayed/i);
  });

  it('should NOT recommend early epinephrine in shockable rhythm without defib delay', () => {
    const state: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'vf_pvt',
      phase: 'compressions',
    };

    const result = evaluateMedicationEligibility(30, state, true, { defibDelayed: false });
    expect(result.epiEligible).toBe(false);
  });

  it('should recommend repeat epinephrine every 3-5 minutes', () => {
    const state: CprEngineState = {
      shockCount: 2,
      epiDoses: 1,
      lastEpiTime: 120,
      antiarrhythmicDoses: 0,
      rhythmType: 'vf_pvt',
      phase: 'compressions',
    };

    // 180 seconds (3 minutes) after first dose
    const result = evaluateMedicationEligibility(300, state, true);
    expect(result.epiEligible).toBe(true);
  });

  it('should recommend antiarrhythmic after 3rd shock', () => {
    const state: CprEngineState = {
      shockCount: 3,
      epiDoses: 1,
      lastEpiTime: 120,
      antiarrhythmicDoses: 0,
      rhythmType: 'vf_pvt',
      phase: 'post_shock',
    };

    const result = evaluateMedicationEligibility(180, state, true);
    expect(result.antiarrhythmicEligible).toBe(true);
  });

  it('should recommend second antiarrhythmic after 5th shock', () => {
    const state: CprEngineState = {
      shockCount: 5,
      epiDoses: 2,
      lastEpiTime: 300,
      antiarrhythmicDoses: 1,
      rhythmType: 'vf_pvt',
      phase: 'post_shock',
    };

    const result = evaluateMedicationEligibility(300, state, true);
    expect(result.antiarrhythmicEligible).toBe(true);
  });
});

describe('CPR Engine - Shock Energy Calculation', () => {
  it('should calculate 2 J/kg for initial shock', () => {
    const energy = calculateShockEnergy(20, 0);
    expect(energy).toBe(40); // 20 kg * 2 J/kg
  });

  it('should calculate 4 J/kg for subsequent shocks', () => {
    const energy = calculateShockEnergy(20, 1);
    expect(energy).toBe(80); // 20 kg * 4 J/kg
  });

  it('should cap shock energy at 200 J for initial shocks', () => {
    const energy = calculateShockEnergy(150, 0);
    expect(energy).toBeLessThanOrEqual(200);
  });

  it('should scale correctly for small children', () => {
    const energy = calculateShockEnergy(5, 0);
    expect(energy).toBe(10); // 5 kg * 2 J/kg
  });
});

describe('CPR Engine - Medication Dose Calculation', () => {
  it('should calculate epinephrine dose as 0.01 mg/kg', () => {
    const dose = calculateCprMedicationDose('epinephrine', 20);
    expect(dose.dose).toBe(0.2); // 20 kg * 0.01 mg/kg
    expect(dose.unit).toBe('mg');
  });

  it('should calculate amiodarone dose as 5 mg/kg with max 300 mg', () => {
    const dose = calculateCprMedicationDose('amiodarone', 20);
    expect(dose.dose).toBe(100); // 20 kg * 5 mg/kg
    expect(dose.unit).toBe('mg');
  });

  it('should cap amiodarone at 300 mg', () => {
    const dose = calculateCprMedicationDose('amiodarone', 100);
    expect(dose.dose).toBe(300); // Capped at 300 mg
  });

  it('should calculate lidocaine dose as 1 mg/kg with max 100 mg', () => {
    const dose = calculateCprMedicationDose('lidocaine', 20);
    expect(dose.dose).toBe(20); // 20 kg * 1 mg/kg
    expect(dose.unit).toBe('mg');
  });

  it('should cap lidocaine at 100 mg', () => {
    const dose = calculateCprMedicationDose('lidocaine', 150);
    expect(dose.dose).toBe(100); // Capped at 100 mg
  });

  it('should provide preparation instructions for epinephrine', () => {
    const dose = calculateCprMedicationDose('epinephrine', 20);
    expect(dose.preparation).toBeDefined();
    expect(dose.preparation).toContain('1:10,000');
  });
});

describe('CPR Engine - CPR-GPS Cycle Workflow', () => {
  it('should trigger pre-charge alert at T-15 seconds', () => {
    const status = getCycleWorkflowStatus(105);
    expect(status.phase).toBe('precharge_alert');
    expect(status.countdownToRhythmCheck).toBe(15);
  });

  it('should enter 10-second rhythm/shock reassessment window', () => {
    const status = getCycleWorkflowStatus(123);
    expect(status.phase).toBe('rhythm_window');
    expect(status.rhythmWindowRemaining).toBe(7);
  });

  it('should roll into next cycle after rhythm window', () => {
    const status = getCycleWorkflowStatus(130);
    expect(status.cycleNumber).toBe(2);
    expect(status.phase).toBe('compressions');
  });
});

describe('CPR Engine - Rhythm Window Documentation and Shock Capture', () => {
  it('should increment shock number when shock delivered is documented', () => {
    const result = applyRhythmWindowDecision(2, {
      rhythmClassification: 'shockable',
      rhythmType: 'vf_pvt',
      shockAction: 'shock_delivered',
    });
    expect(result.nextShockCount).toBe(3);
    expect(result.actionSummary).toContain('Shock #3');
  });

  it('should enforce reason when no shock is delivered', () => {
    expect(() =>
      applyRhythmWindowDecision(2, {
        rhythmClassification: 'non_shockable',
        rhythmType: 'pea',
        shockAction: 'no_shock',
      })
    ).toThrow(/noShockReason/i);
  });
});

describe('CPR Engine - Epinephrine Timer Color State', () => {
  const shockableState: CprEngineState = {
    shockCount: 2,
    epiDoses: 1,
    lastEpiTime: 60,
    antiarrhythmicDoses: 0,
    rhythmType: 'vf_pvt',
    phase: 'compressions',
  };

  it('should be not_due before threshold', () => {
    expect(getEpinephrineTimingState(180, shockableState, true)).toBe('not_due');
  });

  it('should be almost_due near 3-minute mark', () => {
    expect(getEpinephrineTimingState(215, shockableState, true)).toBe('almost_due');
  });

  it('should be overdue at 3 minutes', () => {
    expect(getEpinephrineTimingState(240, shockableState, true)).toBe('overdue');
  });
});

describe('CPR Engine - Intubated Ventilation Cue Cadence', () => {
  it('should trigger cue every 6 seconds when intubated', () => {
    expect(shouldTriggerIntubatedVentilationCue(6, true)).toBe(true);
    expect(shouldTriggerIntubatedVentilationCue(12, true)).toBe(true);
    expect(shouldTriggerIntubatedVentilationCue(7, true)).toBe(false);
  });

  it('should not trigger cue without advanced airway', () => {
    expect(shouldTriggerIntubatedVentilationCue(6, false)).toBe(false);
  });
});

describe('CPR Engine - Hyperkalemia Reversible Cause Guidance', () => {
  it('should provide severe hyperkalemia recommendations with bicarbonate indication', () => {
    const guidance = getHyperkalemiaGuidance({
      weightKg: 20,
      potassiumMmolL: 7.2,
      hasEcgChanges: true,
      prolongedArrest: true,
    });
    expect(guidance.severity).toBe('severe');
    expect(guidance.calciumGluconate).toMatch(/Calcium gluconate/i);
    expect(guidance.insulinDextrose).toMatch(/insulin/i);
    expect(guidance.bicarbonate).toMatch(/Consider sodium bicarbonate/i);
  });
});
