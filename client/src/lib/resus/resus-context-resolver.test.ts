import { describe, expect, it } from 'vitest';
import { resolveResusContext } from './resus-context-resolver';

describe('resolveResusContext', () => {
  it('routes an explicit delivery-room newborn to NRP', () => {
    const result = resolveResusContext({ age: '1 day', measuredWeightKg: 3.1, setting: 'delivery_room' });
    expect(result.status).toBe('ready');
    expect(result.pack?.pack).toBe('NRP');
    expect(result.weight?.source).toBe('measured');
  });

  it('routes a hospital newborn to PALS rather than inferring NRP', () => {
    const result = resolveResusContext({ age: '1 day', lastKnownWeightKg: 3, setting: 'hospital' });
    expect(result.status).toBe('ready');
    expect(result.pack?.pack).toBe('PALS');
    expect(result.weight?.source).toBe('last_known');
  });

  it('fails closed when setting is missing', () => {
    const result = resolveResusContext({ age: '2 years', measuredWeightKg: 12 });
    expect(result.status).toBe('needs_confirmation');
    expect(result.pack).toBeNull();
  });

  it('blocks adult content unless explicitly enabled', () => {
    const blocked = resolveResusContext({ age: '18 years', measuredWeightKg: 70, setting: 'hospital' });
    expect(blocked.status).toBe('needs_confirmation');
    expect(blocked.pack).toBeNull();
    const enabled = resolveResusContext({ age: '18 years', measuredWeightKg: 70, setting: 'hospital', adultContentEnabled: true });
    expect(enabled.status).toBe('ready');
    expect(enabled.pack?.pack).toBe('ACLS');
  });

  it('preserves preterm gestation and labelled estimate provenance', () => {
    const result = resolveResusContext({ age: '32 weeks gestation', gestationalAgeWeeks: 32, setting: 'delivery_room' });
    expect(result.status).toBe('ready');
    expect(result.ageInterpretation).toBe('gestational');
    expect(result.gestationalAgeWeeks).toBe(32);
    expect(result.weight?.source).toBe('age_estimate');
    expect(result.weight?.requiresVerification).toBe(true);
  });
});
