import { describe, expect, it } from 'vitest';
import { buildExtendedProtocol } from './conditionProtocols';
import {
  MAX_RESUS_WEIGHT_KG,
  MIN_RESUS_WEIGHT_KG,
  parseResusWeight,
  validateResusWeight,
} from './patientDemographics';

describe('ResusGPS patient weight safety boundaries', () => {
  it('accepts clinically plausible boundary values', () => {
    expect(validateResusWeight(MIN_RESUS_WEIGHT_KG).valid).toBe(true);
    expect(validateResusWeight(MAX_RESUS_WEIGHT_KG).valid).toBe(true);
    expect(parseResusWeight('18.5')).toBe(18.5);
  });

  it('rejects zero, negative, non-finite, and implausibly large values', () => {
    expect(validateResusWeight(0).valid).toBe(false);
    expect(validateResusWeight(-2).valid).toBe(false);
    expect(validateResusWeight(Number.NaN).valid).toBe(false);
    expect(validateResusWeight(Number.POSITIVE_INFINITY).valid).toBe(false);
    expect(validateResusWeight(MAX_RESUS_WEIGHT_KG + 0.1).valid).toBe(false);
  });

  it('rejects impossible weights at the central protocol-builder boundary', () => {
    expect(() => buildExtendedProtocol('septic_shock', 0, 'child')).toThrow(/at least|numeric/i);
    expect(() => buildExtendedProtocol('septic_shock', 301, 'child')).toThrow(/300 kg or less/i);
  });

  it('treats blank input as unknown and malformed input as unknown', () => {
    expect(parseResusWeight('')).toBeNull();
    expect(parseResusWeight('   ')).toBeNull();
    expect(parseResusWeight('not a weight')).toBeNull();
    expect(parseResusWeight('-1')).toBeNull();
  });
});
