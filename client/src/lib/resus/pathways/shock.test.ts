import { describe, it, expect } from 'vitest';
import { shockPathway } from '@/lib/resus/pathways/shock';

describe('shock pathway fluid aliquots', () => {
  it('undifferentiated shock default uses a controlled aliquot and reassessment messaging', () => {
    const bolus = shockPathway.defaultSteps.find(s => s.id === 'us_bolus');
    expect(bolus).toBeDefined();
    expect(bolus!.dose?.dosePerKg).toBe(10);
    expect(bolus!.action).toContain('10 mL/kg');
    expect(bolus!.dose?.preparation).toMatch(/age-.*aetiology-.*perfusion-.*setting-appropriate aliquot/i);
    expect(bolus!.dose?.preparation).toMatch(/reassess/i);
  });

  it('septic shock antibiotics require a selected local antimicrobial protocol', () => {
    const septic = shockPathway.subPathways!.find(s => s.id === 'septic_shock');
    const abx = septic!.steps.find(s => s.id === 'ss_antibiotics');
    expect(abx!.dose?.dosePerKg).toBe(0);
    expect(abx!.dose?.doseModel).toBe('protocol_only');
    expect(abx!.dose?.preparation).toMatch(/age-.*local-resistance-.*formulary-specific antimicrobial regimen/i);
    expect(abx!.dose?.preparation).toMatch(/meningitis protocol/i);
  });
});
