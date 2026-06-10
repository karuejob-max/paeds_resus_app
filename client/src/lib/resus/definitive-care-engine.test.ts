import { describe, expect, it } from 'vitest';
import { resolveDefinitiveCare } from './definitive-care-engine';

describe('definitive-care-engine', () => {
  it('resolves septic shock with full protocol steps', () => {
    const care = resolveDefinitiveCare('septic_shock', 20, '5 years');
    expect(care).not.toBeNull();
    expect(care!.fellowshipId).toBe('septic_shock');
    expect(care!.hasFullProtocol).toBe(true);
    expect(care!.allSteps.length).toBeGreaterThan(5);
  });

  it('maps hyperglycaemia alias to DKA protocol', () => {
    const care = resolveDefinitiveCare('hyperglycaemia', 18, '8 years');
    expect(care!.fellowshipId).toBe('dka');
    expect(care!.protocol!.id).toBe('dka');
  });

  it('appends co-diagnosis sepsis steps for DKA + septic shock', () => {
    const care = resolveDefinitiveCare('dka', 15, '10 years', ['septic_shock']);
    const coStepIds = care!.allSteps.map((s) => s.id).filter((id) => id.startsWith('co_sepsis'));
    expect(coStepIds.length).toBeGreaterThan(0);
  });

  it('includes discharge education steps for DKA', () => {
    const care = resolveDefinitiveCare('dka', 20, '12 years');
    const dcSteps = care!.allSteps.map((s) => s.id).filter((id) => id.startsWith('dc_dka'));
    expect(dcSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('provides fallback protocol for severe malaria', () => {
    const care = resolveDefinitiveCare('severe_malaria', 15, '4 years');
    expect(care!.hasFullProtocol).toBe(false);
    expect(care!.fallbackSteps.length).toBeGreaterThan(3);
    expect(care!.allSteps.length).toBeGreaterThan(3);
  });

  it('provides fallback protocol for all fellowship conditions without full engine', () => {
    for (const id of ['burns', 'trauma', 'severe_anaemia', 'acute_kidney_injury', 'cardiogenic_shock']) {
      const care = resolveDefinitiveCare(id, 12, '6 years');
      expect(care!.allSteps.length, id).toBeGreaterThan(2);
    }
  });

  it('covers seriously ill child with ABCDE-focused steps', () => {
    const care = resolveDefinitiveCare('seriously_ill_child', 10, '2 years');
    expect(care!.fallbackSteps.some((s) => s.action.includes('ABCDE'))).toBe(true);
  });
});
