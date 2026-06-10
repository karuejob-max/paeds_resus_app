import { describe, expect, it } from 'vitest';
import { resolveDefinitiveCare } from './definitive-care-engine';
import { getAllFellowshipConditionIds } from '@shared/fellowship-clinical-rigor';
import { FELLOWSHIP_DEFINITIVE_CARE_CATALOG } from '@shared/fellowship-definitive-care-catalog';
import { requiredDefinitiveCareStepIds } from '@shared/definitive-care-completion';

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

  it('provides full protocol (not fallback) for severe malaria', () => {
    const care = resolveDefinitiveCare('severe_malaria', 15, '4 years');
    expect(care!.hasFullProtocol).toBe(true);
    expect(care!.protocol!.id).toBe('severe_malaria');
    expect(care!.fallbackSteps.length).toBe(0);
    expect(care!.allSteps.length).toBeGreaterThan(6);
  });

  it('all 15 fellowship conditions have full protocols meeting catalog minimums', () => {
    for (const id of getAllFellowshipConditionIds()) {
      const care = resolveDefinitiveCare(id, 12, '6 years');
      expect(care!.hasFullProtocol, id).toBe(true);
      const required = requiredDefinitiveCareStepIds(care!.allSteps);
      expect(required.length, id).toBeGreaterThanOrEqual(FELLOWSHIP_DEFINITIVE_CARE_CATALOG[id].minSteps);
    }
  });

  it('appends co-diagnosis steps for trauma + hypovolemic shock', () => {
    const care = resolveDefinitiveCare('trauma', 25, '10 years', ['hypovolemic_shock']);
    expect(care!.allSteps.some((s) => s.id.startsWith('co_hvs'))).toBe(true);
  });

  it('covers seriously ill child with ABCDE-focused steps', () => {
    const care = resolveDefinitiveCare('seriously_ill_child', 10, '2 years');
    expect(care!.protocol!.steps.some((s) => s.action.includes('ABCDE'))).toBe(true);
    expect(care!.allSteps.some((s) => s.id.startsWith('dc_sic'))).toBe(true);
  });

  it('meningitis protocol includes antibiotics and LP guidance', () => {
    const care = resolveDefinitiveCare('meningitis', 18, '7 years');
    const actions = care!.protocol!.steps.map((s) => s.action).join(' ');
    expect(actions).toMatch(/Ceftriaxone/i);
    expect(actions).toMatch(/Dexamethasone/i);
    expect(actions).toMatch(/Lumbar puncture/i);
  });
});
