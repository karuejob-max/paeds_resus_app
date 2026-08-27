import { describe, expect, it } from 'vitest';
import {
  calculateAmiodaroneDose,
  calculateCprMedicationDose,
  calculateShockEnergy,
  getCompressionCycleStatus,
  evaluateMedicationEligibility,
  getCprShockEnergyLabel,
  evaluateCprGpsAlerts,
  CPR_METRONOME_BPM,
} from './cpr-engine';

describe('CPR-GPS life-support pack behavior', () => {
  it('keeps PALS shock energy weight-based', () => {
    expect(calculateShockEnergy(20, 0)).toBe(40);
    expect(getCprShockEnergyLabel(20, 0, 'PALS')).toContain('40 J');
  });

  it('uses an adult ACLS device-selected energy range rather than a paediatric joule number', () => {
    expect(getCprShockEnergyLabel(80, 0, 'ACLS')).toMatch(/120–200 J/);
  });

  it('prompts defibrillator pre-charge at T-15 and labels escalation for later PALS shocks', () => {
    expect(getCompressionCycleStatus(104).phase).toBe('compressions');
    expect(getCompressionCycleStatus(105).phase).toBe('precharge_alert');
    expect(getCompressionCycleStatus(120).phase).toBe('rhythm_check_due');
    expect(getCprShockEnergyLabel(20, 2, 'PALS')).toMatch(/At least 80 J/);
  });

  it('uses the 110/min timing-aid cadence', () => {
    expect(CPR_METRONOME_BPM).toBe(110);
    expect(Math.round(60000 / CPR_METRONOME_BPM)).toBe(545);
  });

  it('keeps the 120-second countdown monotonic until the reassessment boundary', () => {
    expect(getCompressionCycleStatus(0).countdownToRhythmCheck).toBe(120);
    expect(getCompressionCycleStatus(1).countdownToRhythmCheck).toBe(119);
    expect(getCompressionCycleStatus(105).countdownToRhythmCheck).toBe(15);
    expect(getCompressionCycleStatus(120).countdownToRhythmCheck).toBe(0);
  });

  it('emits an actionable pre-charge alert until charging is confirmed', () => {
    const input = {
      compressionElapsed: 105,
      rhythmWindowElapsed: null,
      inReassessment: false,
      arrestDuration: 105,
      state: { shockCount: 0, epiDoses: 0, lastEpiTime: null, antiarrhythmicDoses: 0, rhythmType: 'vf_pvt' as const, phase: 'compressions' as const },
      isShockable: true,
      advancedAirwayPlaced: true,
      cycleNumber: 1,
      weightKg: 20,
      lifeSupportPack: 'PALS' as const,
    };
    expect(evaluateCprGpsAlerts(input).find((alert) => alert.type === 'precharge_defibrillator')).toMatchObject({ severity: 'warning', speakText: 'Charge the defibrillator now.' });
    expect(evaluateCprGpsAlerts({ ...input, defibCharging: true }).some((alert) => alert.type === 'precharge_defibrillator')).toBe(false);
  });

  it('warns explicitly when a shockable rhythm has a delayed defibrillator', () => {
    const alerts = evaluateCprGpsAlerts({
      compressionElapsed: 80,
      rhythmWindowElapsed: null,
      inReassessment: false,
      arrestDuration: 80,
      state: { shockCount: 0, epiDoses: 0, lastEpiTime: null, antiarrhythmicDoses: 0, rhythmType: 'vf_pvt', phase: 'compressions' },
      isShockable: true,
      advancedAirwayPlaced: false,
      cycleNumber: 1,
      weightKg: 20,
      defibDelayed: true,
      lifeSupportPack: 'PALS',
    });
    expect(alerts.find((alert) => alert.type === 'defibrillator_delayed')).toMatchObject({ severity: 'critical' });
  });

  it('uses PALS weight-based and ACLS fixed epinephrine dosing', () => {
    expect(calculateCprMedicationDose('epinephrine', 20, 'PALS')).toMatchObject({ dose: 0.2, unit: 'mg' });
    expect(calculateCprMedicationDose('epinephrine', 80, 'ACLS')).toMatchObject({ dose: 1, unit: 'mg' });
  });

  it('uses fixed adult ACLS antiarrhythmic doses and weight-based PALS doses', () => {
    expect(calculateAmiodaroneDose(3, 20, 'PALS')).toMatchObject({ doseMg: 100 });
    expect(calculateAmiodaroneDose(3, 80, 'ACLS')).toMatchObject({ doseMg: 300 });
    expect(calculateAmiodaroneDose(5, 80, 'ACLS')).toMatchObject({ doseMg: 150 });
  });

  it('keeps first-dose timing and adult wording explicit for non-shockable ACLS arrest', () => {
    const result = evaluateMedicationEligibility(
      0,
      { shockCount: 0, epiDoses: 0, lastEpiTime: null, antiarrhythmicDoses: 0, rhythmType: 'asystole', phase: 'compressions' },
      false,
      { lifeSupportPack: 'ACLS' },
    );
    expect(result.epiEligible).toBe(true);
    expect(result.recommendation).toMatch(/adult ACLS epinephrine 1 mg/i);
  });
});
