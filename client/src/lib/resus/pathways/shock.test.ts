import { describe, it, expect } from 'vitest';
import { shockPathway } from '@/lib/resus/pathways/shock';

describe('shock pathway fluid aliquots', () => {
  it('undifferentiated shock default uses 10 mL/kg aliquot messaging', () => {
    const bolus = shockPathway.defaultSteps.find(s => s.id === 'us_bolus');
    expect(bolus).toBeDefined();
    expect(bolus!.dose?.dosePerKg).toBe(10);
    expect(bolus!.action).toContain('10 mL/kg');
    expect(bolus!.dose?.preparation).toMatch(/not a single 20 mL/i);
    expect(bolus!.dose?.preparation).toMatch(/hyperglycaemia|DKA/i);
  });

  it('septic shock antibiotics use 80-100 mg/kg ceftriaxone with meningitis note', () => {
    const septic = shockPathway.subPathways!.find(s => s.id === 'septic_shock');
    const abx = septic!.steps.find(s => s.id === 'ss_antibiotics');
    expect(abx!.dose?.dosePerKg).toBe(100);
    expect(abx!.dose?.preparation).toMatch(/80.100 mg/);
    expect(abx!.dose?.preparation).toMatch(/meningitis/i);
  });
});
