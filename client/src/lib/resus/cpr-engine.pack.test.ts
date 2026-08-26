import { describe, expect, it } from 'vitest';
import {
  calculateAmiodaroneDose,
  calculateCprMedicationDose,
  calculateShockEnergy,
  evaluateMedicationEligibility,
  getCprShockEnergyLabel,
} from './cpr-engine';

describe('CPR-GPS life-support pack behavior', () => {
  it('keeps PALS shock energy weight-based', () => {
    expect(calculateShockEnergy(20, 0)).toBe(40);
    expect(getCprShockEnergyLabel(20, 0, 'PALS')).toContain('40 J');
  });

  it('uses an adult ACLS device-selected energy range rather than a paediatric joule number', () => {
    expect(getCprShockEnergyLabel(80, 0, 'ACLS')).toMatch(/120–200 J/);
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
