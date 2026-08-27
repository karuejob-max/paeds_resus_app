import { describe, expect, it } from 'vitest';
import {
  estimateEmergencyWeight,
  parseAgeToMonths,
  resolvePatientWeight,
} from './patient-weight';

describe('patient weight resolution', () => {
  it('prefers measured weight over all fallbacks', () => {
    const result = resolvePatientWeight({
      age: '30 years',
      measuredWeightKg: 62.4,
      lastKnownWeightKg: 70,
    });
    expect(result).toMatchObject({
      weightKg: 62.4,
      source: 'measured',
      confidence: 'high',
      requiresVerification: false,
    });
  });

  it('uses caregiver-reported last-known weight when current weight is unavailable', () => {
    const result = resolvePatientWeight({ age: '4 years', lastKnownWeightKg: 13.7 });
    expect(result).toMatchObject({
      weightKg: 13.7,
      source: 'last_known',
      confidence: 'moderate',
      requiresVerification: true,
    });
  });

  it('uses age-only estimates only when no weight is available', () => {
    expect(resolvePatientWeight({ age: '6 months' })).toMatchObject({
      weightKg: 7.5,
      source: 'age_estimate',
      requiresVerification: true,
    });
  });

  it('uses bounded adult emergency weight instead of an unbounded age slope', () => {
    const result = estimateEmergencyWeight('30 years');
    expect(result).toMatchObject({ weightKg: 70, source: 'age_estimate' });
    expect(result?.weightKg).toBeLessThan(100);
  });

  it('uses the requested paediatric age bands', () => {
    expect(estimateEmergencyWeight('2 years')?.weightKg).toBe(12);
    expect(estimateEmergencyWeight('8 years')?.weightKg).toBe(31);
    expect(estimateEmergencyWeight('15 years')?.weightKg).toBe(55);
  });

  it('uses a low-confidence preterm band when gestational age is explicit', () => {
    const result = estimateEmergencyWeight('32 weeks gestation');
    expect(result).toMatchObject({
      weightKg: 1.9,
      source: 'age_estimate',
      confidence: 'low',
      requiresVerification: true,
    });
  });

  it('parses compound age without treating days or weeks as years', () => {
    expect(parseAgeToMonths('2 years 3 months')).toBeCloseTo(27, 5);
    expect(parseAgeToMonths('10 days')).toBeCloseTo(10 / 30.4375, 5);
    expect(parseAgeToMonths('3 weeks')).toBeCloseTo(3 / 4.345, 5);
  });
});
