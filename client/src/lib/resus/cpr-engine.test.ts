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
