import { describe, it, expect } from 'vitest';
import { resolveDefinitiveCare } from './definitive-care-engine';

describe('definitive-care-engine', () => {
  it('resolves septic shock to full protocol with 10 mL/kg steps', () => {
    const care = resolveDefinitiveCare('septic_shock', 20, '5 years');
    expect(care).not.toBeNull();
    expect(care!.hasFullProtocol).toBe(true);
    expect(care!.protocol!.steps.some(s => s.action.includes('10 mL/kg'))).toBe(true);
  });

  it('resolves DKA fellowship id', () => {
    const care = resolveDefinitiveCare('hyperglycaemia', 18, '8 years');
    expect(care!.fellowshipId).toBe('dka');
    expect(care!.protocol!.id).toBe('dka');
  });

  it('provides fallback steps for malaria', () => {
    const care = resolveDefinitiveCare('severe_malaria', 15, '4 years');
    expect(care!.hasFullProtocol).toBe(false);
    expect(care!.fallbackSteps.some(s => s.includes('artesunate'))).toBe(true);
  });
});
