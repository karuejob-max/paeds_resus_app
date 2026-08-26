import { describe, expect, it } from 'vitest';
import { createSession, updatePatientInfo } from './abcdeEngine';

describe('canonical ResusGPS engine safety boundaries', () => {
  it('does not create a session with an impossible weight', () => {
    expect(() => createSession(0, '5 years')).toThrow(/at least|numeric/i);
    expect(() => createSession(-4, '5 years')).toThrow(/at least|numeric/i);
    expect(() => createSession(301, '5 years')).toThrow(/300 kg or less/i);
    expect(createSession(null, '5 years').patientWeight).toBeNull();
  });

  it('does not update a session with an impossible weight', () => {
    const session = createSession(20, '5 years');
    expect(() => updatePatientInfo(session, -1, '5 years')).toThrow(/at least|numeric/i);
    expect(session.patientWeight).toBe(20);
  });

  it('preserves a verified weight and recalculates fluid tracking', () => {
    const session = createSession(20, '5 years');
    const updated = updatePatientInfo(session, 25, '5 years');
    expect(updated.patientWeight).toBe(25);
    expect(updated.fluidTracker.totalVolumePerKg).toBe(0);
  });
});
