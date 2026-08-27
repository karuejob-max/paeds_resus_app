/**
 * CPR-GPS engine tests (PALS-aligned timer, alerts, shock-count triggers).
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateRhythmTransition,
  evaluateMedicationEligibility,
  calculateShockEnergy,
  calculateCprMedicationDose,
  calculateAmiodaroneDose,
  getCycleWorkflowStatus,
  getCompressionCycleStatus,
  evaluateCprGpsAlerts,
  getRhythmClassificationFeedback,
  shouldPromptAdvancedAirway,
  applyRhythmWindowDecision,
  getEpinephrineTimingState,
  shouldTriggerIntubatedVentilationCue,
  getHyperkalemiaGuidance,
  getHypoxiaGuidance,
  getFluidBolusGuidance,
  CPR_CYCLE_SECONDS,
  PRECHARGE_AT_COMPRESSION_ELAPSED,
  DEFIB_PREPARATION_ALERT_SECONDS,
  type CprEngineState,
} from '@/lib/resus/cpr-engine';

describe('CPR Engine - Structured reversible-cause guidance', () => {
  it('gives a fail-safe hypoxia recommendation when SpO₂ is critically low', () => {
    const guidance = getHypoxiaGuidance(88);
    expect(guidance.severity).toBe('critical');
    expect(guidance.recommendation).toContain('check airway position');
  });

  it('does not treat a normal SpO₂ as permission to stop CPR', () => {
    const guidance = getHypoxiaGuidance(97);
    expect(guidance.severity).toBe('not_demonstrated');
    expect(guidance.recommendation).toContain('do not use SpO₂ alone to stop CPR');
  });

  it('stops fluid guidance when overload findings are present', () => {
    const guidance = getFluidBolusGuidance(20, false, { hepatomegaly: false, crepitations: true, jvd: false });
    expect(guidance.overloadPresent).toBe(true);
    expect(guidance.recommendation).toContain('Stop fluid boluses');
  });

  it('routes an age-context fluid range when no overload sign is recorded', () => {
    const guidance = getFluidBolusGuidance(20, false, { hepatomegaly: false, crepitations: false, jvd: false });
    expect(guidance.doseRange).toContain('100–200 mL');
    expect(guidance.recommendation).toContain('reassess');
  });
});

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
});

describe('CPR Engine - Medication Eligibility', () => {
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

  it('should not announce first epinephrine before rhythm is documented', () => {
    const baseState: CprEngineState = {
      shockCount: 0,
      epiDoses: 0,
      lastEpiTime: null,
      antiarrhythmicDoses: 0,
      rhythmType: 'unknown',
      phase: 'compressions',
    };
    const result = evaluateMedicationEligibility(0, baseState, false);
    expect(result.epiEligible).toBe(false);
    expect(result.recommendation).toBeNull();
  });

  it('should recommend amiodarone messaging after 3rd shock', () => {
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
    expect(result.recommendation).toMatch(/300 mg|5 mg\/kg/i);
  });
});

describe('CPR Engine - CPR-GPS Cycle Workflow', () => {
  it('should trigger pre-charge alert at T-15 seconds (compression cycle)', () => {
    const status = getCompressionCycleStatus(PRECHARGE_AT_COMPRESSION_ELAPSED);
    expect(status.phase).toBe('precharge_alert');
    expect(status.countdownToRhythmCheck).toBe(15);
  });

  it('should enter 10-second rhythm/shock reassessment window', () => {
    const status = getCycleWorkflowStatus(123);
    expect(status.phase).toBe('rhythm_window');
    expect(status.rhythmWindowRemaining).toBe(7);
  });
});

describe('CPR Engine - Amiodarone shock-count dosing', () => {
  it('should recommend weight-based dose after 3rd shock (max 300 mg)', () => {
    const dose = calculateAmiodaroneDose(3, 20);
    expect(dose.eligible).toBe(true);
    expect(dose.doseMg).toBe(100);
  });

  it('should cap at 150 mg after 5th shock', () => {
    const dose = calculateAmiodaroneDose(5, 80);
    expect(dose.eligible).toBe(true);
    expect(dose.doseMg).toBe(150);
  });
});

describe('CPR Engine - CPR-GPS clinical alerts', () => {
  const baseState: CprEngineState = {
    shockCount: 2,
    epiDoses: 1,
    lastEpiTime: 60,
    antiarrhythmicDoses: 0,
    rhythmType: 'vf_pvt',
    phase: 'compressions',
  };

  it('should surface an early preparation cue at T-30 without opening the final charge cue', () => {
    const alerts = evaluateCprGpsAlerts({
      compressionElapsed: 120 - DEFIB_PREPARATION_ALERT_SECONDS,
      rhythmWindowElapsed: null,
      inReassessment: false,
      arrestDuration: 90,
      state: baseState,
      isShockable: true,
      advancedAirwayPlaced: false,
      cycleNumber: 1,
      weightKg: 20,
    });
    expect(alerts.some((a) => a.type === 'defibrillator_preparation')).toBe(true);
    expect(alerts.some((a) => a.type === 'precharge_defibrillator')).toBe(false);
  });

  it('should surface the final charge-now cue at T-15 during compression phase', () => {
    const alerts = evaluateCprGpsAlerts({
      compressionElapsed: PRECHARGE_AT_COMPRESSION_ELAPSED,
      rhythmWindowElapsed: null,
      inReassessment: false,
      arrestDuration: 120,
      state: baseState,
      isShockable: true,
      advancedAirwayPlaced: false,
      cycleNumber: 1,
      weightKg: 20,
    });
    expect(alerts.some((a) => a.type === 'precharge_defibrillator')).toBe(true);
  });

  it('should not repeat a defibrillator cue after charging is confirmed', () => {
    const alerts = evaluateCprGpsAlerts({
      compressionElapsed: PRECHARGE_AT_COMPRESSION_ELAPSED,
      rhythmWindowElapsed: null,
      inReassessment: false,
      arrestDuration: PRECHARGE_AT_COMPRESSION_ELAPSED,
      state: { ...baseState, rhythmType: 'vf_pvt' },
      isShockable: true,
      advancedAirwayPlaced: false,
      cycleNumber: 1,
      weightKg: 20,
      defibCharging: true,
    });
    expect(alerts.some((a) => a.type === 'precharge_defibrillator' || a.type === 'defibrillator_preparation')).toBe(false);
  });

  it('should announce the start of the ten-second pulse and rhythm pause', () => {
    const alerts = evaluateCprGpsAlerts({
      compressionElapsed: CPR_CYCLE_SECONDS,
      rhythmWindowElapsed: 0,
      inReassessment: true,
      arrestDuration: CPR_CYCLE_SECONDS,
      state: baseState,
      isShockable: false,
      advancedAirwayPlaced: false,
      cycleNumber: 1,
      weightKg: 20,
    });
    const due = alerts.find((a) => a.type === 'reassessment_due');
    expect(due?.severity).toBe('critical');
    expect(due?.speakText).toMatch(/two minutes complete/i);
    expect(alerts.find((a) => a.type === 'rhythm_window')?.message).toContain('10s');
  });

  it('should prompt advanced airway after first shock', () => {
    expect(shouldPromptAdvancedAirway(1, false)).toBe(true);
    expect(shouldPromptAdvancedAirway(0, false)).toBe(false);
  });

  it('should classify shockable rhythm feedback', () => {
    const feedback = getRhythmClassificationFeedback('shockable', 'vf_pvt');
    expect(feedback.title).toMatch(/SHOCKABLE/i);
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

  it('should be almost_due 1 minute before 3-minute mark', () => {
    expect(getEpinephrineTimingState(180, shockableState, true)).toBe('almost_due');
  });

  it('should be overdue at 3 minutes', () => {
    expect(getEpinephrineTimingState(240, shockableState, true)).toBe('overdue');
  });
});

describe('CPR Engine - Rhythm Window Documentation', () => {
  it('should increment shock number when shock delivered is documented', () => {
    const result = applyRhythmWindowDecision(2, {
      rhythmClassification: 'shockable',
      rhythmType: 'vf_pvt',
      shockAction: 'shock_delivered',
    });
    expect(result.nextShockCount).toBe(3);
  });
});

describe('CPR Engine - Shock Energy Calculation', () => {
  it('should calculate 2 J/kg for initial shock', () => {
    expect(calculateShockEnergy(20, 0)).toBe(40);
  });
});

describe('CPR Engine - Medication Dose Calculation', () => {
  it('should calculate epinephrine dose as 0.01 mg/kg', () => {
    const dose = calculateCprMedicationDose('epinephrine', 20);
    expect(dose.dose).toBe(0.2);
  });
});

describe('CPR Engine - Intubated Ventilation Cue Cadence', () => {
  it('should trigger cue every 6 seconds when intubated', () => {
    expect(shouldTriggerIntubatedVentilationCue(6, true)).toBe(true);
    expect(shouldTriggerIntubatedVentilationCue(7, true)).toBe(false);
  });
});

describe('CPR Engine - Hyperkalemia Reversible Cause Guidance', () => {
  it('should provide severe hyperkalemia recommendations', () => {
    const guidance = getHyperkalemiaGuidance({
      weightKg: 20,
      potassiumMmolL: 7.2,
      hasEcgChanges: true,
      prolongedArrest: true,
    });
    expect(guidance.severity).toBe('severe');
  });
});
