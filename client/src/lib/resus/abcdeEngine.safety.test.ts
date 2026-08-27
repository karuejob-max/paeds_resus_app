import { describe, expect, it } from 'vitest';
import {
  createSession,
  updatePatientInfo,
  updateResusSetting,
  POST_CARDIAC_ARREST_CARE_ITEMS,
  updatePostCardiacArrestCare,
  resolveBlsAssessment,
  returnToPrimarySurvey,
  getBlockingPrimarySurveyInterventions,
  getInterventionsAwaitingReassessment,
  type Threat,
} from './abcdeEngine';

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

  it('takes the BLS arrest branch safely when pulse is absent or uncertain', () => {
    expect(resolveBlsAssessment(null, null, null)).toBeNull();
    expect(resolveBlsAssessment('responsive', 'normal', 'present')).toBe('no_cardiac_arrest');
    expect(resolveBlsAssessment('responsive', 'normal', 'absent')).toBe('cardiac_arrest');
    expect(resolveBlsAssessment('unresponsive', 'abnormal', 'unknown')).toBe('cardiac_arrest');
  });

  it('requires explicit delivery-room context for neonatal NRP selection', () => {
    const hospitalCase = createSession(3, '1 day');
    expect(hospitalCase.resusSetting).toBe('hospital');
    const deliveryRoomCase = updateResusSetting(hospitalCase, 'delivery_room');
    expect(deliveryRoomCase.resusSetting).toBe('delivery_room');
    expect(hospitalCase.resusSetting).toBe('hospital');
  });

  it('records post-ROSC checklist completion and reopens safely', () => {
    let session = createSession(20, '5 years');
    for (const item of POST_CARDIAC_ARREST_CARE_ITEMS) {
      session = updatePostCardiacArrestCare(session, item.id, true);
    }
    expect(session.postCardiacArrestCare?.completedItemIds).toHaveLength(POST_CARDIAC_ARREST_CARE_ITEMS.length);
    expect(session.postCardiacArrestCare?.completedAt).toEqual(expect.any(Number));

    const reopened = updatePostCardiacArrestCare(session, POST_CARDIAC_ARREST_CARE_ITEMS[0].id, false);
    expect(reopened.postCardiacArrestCare?.completedItemIds).not.toContain(POST_CARDIAC_ARREST_CARE_ITEMS[0].id);
    expect(reopened.postCardiacArrestCare?.completedAt).toBeUndefined();
  });

  it('blocks Primary Survey continuation while an urgent action is unresolved', () => {
    const session = createSession(20, '5 years');
    const threat: Threat = {
      id: 'test-airway-threat',
      letter: 'A',
      name: 'Test airway threat',
      severity: 'urgent',
      resolved: false,
      findings: [],
      interventions: [{ id: 'test-intervention', action: 'Position airway', critical: true, status: 'pending' }],
    };
    session.phase = 'INTERVENTION';
    session.currentLetter = 'A';
    session.threats = [threat];

    expect(getBlockingPrimarySurveyInterventions(session)).toHaveLength(1);
    expect(returnToPrimarySurvey(session).phase).toBe('INTERVENTION');
  });

  it('assigns stable IDs to newly generated clinical events', () => {
    const initial = createSession(20, '5 years');
    const first = updatePatientInfo(initial, 21, '5 years');
    const second = updatePatientInfo(first, 22, '5 years');
    expect(second.events[0]?.id).toEqual(expect.any(String));
    expect(second.events[1]?.id).toEqual(expect.any(String));
    expect(second.events[0]?.id).not.toBe(second.events[1]?.id);
  });

  it('requires an explicit reassessment outcome after a completed intervention', () => {
    const session = createSession(20, '5 years');
    const threat: Threat = {
      id: 'test-shock-threat',
      letter: 'C',
      name: 'Test shock threat',
      severity: 'critical',
      resolved: false,
      findings: [],
      interventions: [{
        id: 'test-fluid',
        action: 'FLUID BOLUS — test crystalloid',
        status: 'completed',
        completedAt: Date.now(),
        reassessmentChecks: [{
          id: 'test-check',
          question: 'Still in shock?',
          type: 'therapeutic_endpoint',
          options: [{ label: 'Improving', value: 'improving', action: 'resolved' }],
        }],
      }],
    };
    session.phase = 'INTERVENTION';
    session.currentLetter = 'C';
    session.threats = [threat];

    expect(getInterventionsAwaitingReassessment(session)).toHaveLength(1);
    expect(returnToPrimarySurvey(session).phase).toBe('INTERVENTION');

    session.events.push({
      timestamp: Date.now(),
      type: 'reassessment',
      detail: 'Still in shock? → Improving',
      data: { interventionId: 'test-fluid' },
    });
    expect(getInterventionsAwaitingReassessment(session)).toHaveLength(0);
    expect(returnToPrimarySurvey(session).phase).toBe('PRIMARY_SURVEY');
  });
});
