/**
 * Test suite for cpr-override-engine.ts
 * Validates override detection logic for clinician deviations from protocol
 */

import { describe, it, expect } from 'vitest';
import {
  detectSkippedRhythmCheck,
  detectMedicationTimingDeviation,
  detectShockEnergyDeviation,
  detectAntiarrhythmicDeviation,
  detectSkippedMedication,
  detectExtendedCpr,
  detectOverride,
  type CprEngineState,
} from './cpr-override-engine';

const mockEngineState = (overrides?: Partial<CprEngineState>): CprEngineState => ({
  shockCount: 0,
  epiDoses: 0,
  lastEpiTime: null,
  antiarrhythmicDoses: 0,
  rhythmType: 'unknown',
  phase: 'compressions',
  ...overrides,
});

describe('Override Detection - Skipped Rhythm Check', () => {
  it('should detect skipped rhythm check after 2 minutes', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      phase: 'compressions',
    });

    const override = detectSkippedRhythmCheck(state, 150, 'continue_compressions');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('skip_rhythm_check');
    expect(override?.isHighRisk).toBe(true);
  });

  it('should not detect override if rhythm check is timely', () => {
    const state = mockEngineState({ rhythmType: 'vf_pvt' });
    const override = detectSkippedRhythmCheck(state, 60, 'continue_compressions');
    expect(override).toBeNull();
  });

  it('should not flag rhythm check if action is not continue_compressions', () => {
    const state = mockEngineState({ rhythmType: 'vf_pvt' });
    const override = detectSkippedRhythmCheck(state, 150, 'perform_rhythm_check');
    expect(override).toBeNull();
  });
});

describe('Override Detection - Medication Timing', () => {
  it('should detect epinephrine given before 2nd shock in VF/pVT', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      shockCount: 1,
      epiDoses: 0,
    });

    const override = detectMedicationTimingDeviation(state, 60, 'give_epinephrine');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('medication_timing');
    expect(override?.isHighRisk).toBe(true);
  });

  it('should allow epinephrine after 2nd shock in VF/pVT', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      shockCount: 2,
      epiDoses: 0,
    });

    const override = detectMedicationTimingDeviation(state, 120, 'give_epinephrine');
    expect(override).toBeNull();
  });

  it('should detect epinephrine given too soon after previous dose', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      shockCount: 2,
      epiDoses: 1,
      lastEpiTime: 60,
    });

    const override = detectMedicationTimingDeviation(state, 200, 'give_epinephrine');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('medication_timing');
    expect(override?.isHighRisk).toBe(false);
  });

  it('should allow epinephrine after 3-5 minute interval', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      shockCount: 2,
      epiDoses: 1,
      lastEpiTime: 60,
    });

    const override = detectMedicationTimingDeviation(state, 300, 'give_epinephrine');
    expect(override).toBeNull();
  });
});

describe('Override Detection - Shock Energy', () => {
  it('should detect shock energy deviation beyond tolerance', () => {
    const state = mockEngineState({ shockCount: 1 });
    const override = detectShockEnergyDeviation(state, 20, 80, 120);
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('shock_energy');
  });

  it('should allow shock energy within tolerance', () => {
    const state = mockEngineState({ shockCount: 1 });
    const override = detectShockEnergyDeviation(state, 20, 80, 85);
    expect(override).toBeNull();
  });

  it('should detect shock energy too low', () => {
    const state = mockEngineState({ shockCount: 0 });
    const override = detectShockEnergyDeviation(state, 20, 40, 20);
    expect(override).not.toBeNull();
  });
});

describe('Override Detection - Antiarrhythmic Selection', () => {
  it('should detect antiarrhythmic selection deviation', () => {
    const state = mockEngineState({
      shockCount: 3,
      antiarrhythmicDoses: 0,
    });

    const override = detectAntiarrhythmicDeviation(state, 'amiodarone', 'lidocaine');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('antiarrhythmic_selection');
  });

  it('should not flag if same antiarrhythmic selected', () => {
    const state = mockEngineState({ shockCount: 3 });
    const override = detectAntiarrhythmicDeviation(state, 'amiodarone', 'amiodarone');
    expect(override).toBeNull();
  });
});

describe('Override Detection - Skipped Medication', () => {
  it('should detect when medication is skipped', () => {
    const state = mockEngineState({
      shockCount: 2,
      epiDoses: 0,
    });

    const override = detectSkippedMedication(state, 'epinephrine', 'skip_medication');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('skip_medication');
  });

  it('should not flag if medication is given', () => {
    const state = mockEngineState({ shockCount: 2 });
    const override = detectSkippedMedication(state, 'epinephrine', 'give_epinephrine');
    expect(override).toBeNull();
  });
});

describe('Override Detection - Extended CPR', () => {
  it('should detect CPR continued beyond 30 minutes in asystole', () => {
    const state = mockEngineState({
      rhythmType: 'asystole',
      phase: 'compressions',
    });

    const override = detectExtendedCpr(state, 1900, 'continue_cpr');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('continue_cpr_beyond_protocol');
    expect(override?.isHighRisk).toBe(true);
  });

  it('should not flag CPR within 30 minutes', () => {
    const state = mockEngineState({ rhythmType: 'asystole' });
    const override = detectExtendedCpr(state, 1200, 'continue_cpr');
    expect(override).toBeNull();
  });

  it('should not flag if action is not continue_cpr', () => {
    const state = mockEngineState({ rhythmType: 'asystole' });
    const override = detectExtendedCpr(state, 1900, 'terminate_resuscitation');
    expect(override).toBeNull();
  });
});

describe('Override Detection - Main Function', () => {
  it('should detect skipped rhythm check via main function', () => {
    const state = mockEngineState({ rhythmType: 'vf_pvt' });
    const override = detectOverride(
      state,
      120,
      20,
      'continue_compressions',
      { timeSinceLastRhythmCheck: 150 }
    );

    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('skip_rhythm_check');
  });

  it('should detect medication timing via main function', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      shockCount: 1,
      epiDoses: 0,
    });

    const override = detectOverride(state, 60, 20, 'give_epinephrine');
    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('medication_timing');
  });

  it('should detect shock energy via main function', () => {
    const state = mockEngineState({ shockCount: 1 });
    const override = detectOverride(
      state,
      120,
      20,
      'deliver_shock',
      { recommendedEnergy: 80, actualEnergy: 120 }
    );

    expect(override).not.toBeNull();
    expect(override?.overrideType).toBe('shock_energy');
  });

  it('should return null if no override detected', () => {
    const state = mockEngineState({ rhythmType: 'vf_pvt' });
    const override = detectOverride(state, 60, 20, 'perform_rhythm_check');
    expect(override).toBeNull();
  });
});

describe('Override Context - High-Risk Identification', () => {
  it('should mark skipped rhythm check as high-risk', () => {
    const state = mockEngineState({ rhythmType: 'vf_pvt' });
    const override = detectSkippedRhythmCheck(state, 150, 'continue_compressions');
    expect(override?.isHighRisk).toBe(true);
  });

  it('should mark extended CPR as high-risk', () => {
    const state = mockEngineState({ rhythmType: 'asystole' });
    const override = detectExtendedCpr(state, 1900, 'continue_cpr');
    expect(override?.isHighRisk).toBe(true);
  });

  it('should not mark medication timing as high-risk (non-critical)', () => {
    const state = mockEngineState({
      rhythmType: 'vf_pvt',
      shockCount: 2,
      epiDoses: 1,
      lastEpiTime: 60,
    });

    const override = detectMedicationTimingDeviation(state, 200, 'give_epinephrine');
    expect(override?.isHighRisk).toBe(false);
  });
});
