/**
 * ABCDE Engine v2 Tests
 * 
 * Tests cover:
 * 1. Session creation and initialization
 * 2. Quick Assessment flow
 * 3. Objective vital sign inputs and interpretation
 * 4. Consistent dosing (10 mL/kg for all initial boluses)
 * 5. Drug name on every dose (calcDose always shows drug name)
 * 6. Threat detection from objective values
 * 7. Mid-case patient info update
 * 8. Intervention tracking (start, complete, bolus counting)
 * 9. Safety alerts (insulin without potassium, excessive boluses)
 * 10. Reassessment checks structure
 * 11. Diagnosis suggestions
 * 12. Event logging and export
 * 13. Cardiac arrest flow
 * 14. Full DKA scenario end-to-end
 * 15. Full Sepsis scenario end-to-end
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  startQuickAssessment,
  answerQuickAssessment,
  getCurrentQuestions,
  getAnsweredQuestionIds,
  answerPrimarySurvey,
  completeIntervention,
  startIntervention,
  returnToPrimarySurvey,
  getActiveThreats,
  getPendingInterventions,
  getAllPendingCritical,
  getSuggestedDiagnoses,
  triggerCardiacArrest,
  achieveROSC,
  exportEventLog,
  updatePatientInfo,
  acknowledgeSafetyAlert,
  calcDose,
  setDefinitiveDiagnosis,
  updateSAMPLE,
  primarySurveyQuestions,
  type ResusSession,
  type DoseInfo,
} from '../lib/resus/abcdeEngine';

// ─── Helper to answer a question by ID ──────────────────────

function answerById(session: ResusSession, questionId: string, answer: string, numVal?: number, numVal2?: number): ResusSession {
  for (const letter of ['X', 'A', 'B', 'C', 'D', 'E'] as const) {
    const q = primarySurveyQuestions[letter]?.find(q => q.id === questionId);
    if (q) {
      return answerPrimarySurvey(session, questionId, answer, q, numVal, numVal2);
    }
  }
  throw new Error(`Question ${questionId} not found`);
}

// ─── 1. Session Creation ────────────────────────────────────

describe('Session Creation', () => {
  it('creates a session with default values', () => {
    const s = createSession();
    expect(s.phase).toBe('IDLE');
    expect(s.patientWeight).toBeNull();
    expect(s.patientAge).toBeNull();
    expect(s.isTrauma).toBe(false);
    expect(s.currentLetter).toBe('A');
    expect(s.threats).toEqual([]);
    expect(s.vitalSigns).toEqual({});
    expect(s.bolusCount).toBe(0);
    expect(s.totalBolusVolume).toBe(0);
  });

  it('creates a session with weight and age', () => {
    const s = createSession(18, '5 years');
    expect(s.patientWeight).toBe(18);
    expect(s.patientAge).toBe('5 years');
  });

  it('creates a trauma session starting at X', () => {
    const s = createSession(18, '5 years', true);
    expect(s.isTrauma).toBe(true);
    expect(s.currentLetter).toBe('X');
  });
});

// ─── 2. Quick Assessment ────────────────────────────────────

describe('Quick Assessment', () => {
  it('transitions from IDLE to QUICK_ASSESSMENT', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    expect(s.phase).toBe('QUICK_ASSESSMENT');
  });

  it('SICK answer transitions to PRIMARY_SURVEY at A', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    expect(s.phase).toBe('PRIMARY_SURVEY');
    expect(s.quickAssessment).toBe('sick');
    expect(s.currentLetter).toBe('A');
  });

  it('SICK answer in trauma starts at X', () => {
    let s = createSession(18, '5 years', true);
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    expect(s.currentLetter).toBe('X');
  });

  it('NOT SICK answer transitions to PRIMARY_SURVEY at A', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'not_sick');
    expect(s.phase).toBe('PRIMARY_SURVEY');
    expect(s.quickAssessment).toBe('not_sick');
    expect(s.currentLetter).toBe('A');
  });
});

// ─── 3. Objective Vital Signs ───────────────────────────────

describe('Objective Vital Signs', () => {
  let session: ResusSession;

  beforeEach(() => {
    session = createSession(18, '5 years');
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
  });

  it('stores HR as a number in vitalSigns', () => {
    session = answerById(session, 'airway_status', 'patent');
    session = answerById(session, 'breathing_effort', 'normal');
    session = answerById(session, 'breathing_sounds', 'clear');
    session = answerById(session, 'spo2', 'SpO2 94%', 94);
    session = answerById(session, 'respiratory_rate', 'RR 25/min', 25);
    session = answerById(session, 'pulse_quality', 'strong');
    session = answerById(session, 'heart_rate', 'HR 130 bpm', 130);

    expect(session.vitalSigns.hr).toBe(130);
    expect(session.vitalSigns.rr).toBe(25);
    expect(session.vitalSigns.spo2).toBe(94);
  });

  it('stores BP as systolic and diastolic in vitalSigns', () => {
    session = answerById(session, 'airway_status', 'patent');
    session = answerById(session, 'breathing_effort', 'normal');
    session = answerById(session, 'breathing_sounds', 'clear');
    session = answerById(session, 'spo2', 'SpO2 98%', 98);
    session = answerById(session, 'respiratory_rate', 'RR 20/min', 20);
    session = answerById(session, 'pulse_quality', 'strong');
    session = answerById(session, 'heart_rate', 'HR 100 bpm', 100);
    session = answerById(session, 'perfusion', 'normal');
    session = answerById(session, 'heart_sounds', 'normal');
    session = answerById(session, 'bleeding', 'none');
    session = answerById(session, 'blood_pressure', 'BP 100/60', 100, 60);

    expect(session.vitalSigns.sbp).toBe(100);
    expect(session.vitalSigns.dbp).toBe(60);
  });

  it('stores glucose and auto-calculates mg/dL', () => {
    session = answerById(session, 'airway_status', 'patent');
    session = answerById(session, 'breathing_effort', 'normal');
    session = answerById(session, 'breathing_sounds', 'clear');
    session = answerById(session, 'spo2', 'SpO2 98%', 98);
    session = answerById(session, 'respiratory_rate', 'RR 20/min', 20);
    session = answerById(session, 'pulse_quality', 'strong');
    session = answerById(session, 'heart_rate', 'HR 100 bpm', 100);
    session = answerById(session, 'perfusion', 'normal');
    session = answerById(session, 'heart_sounds', 'normal');
    session = answerById(session, 'bleeding', 'none');
    session = answerById(session, 'blood_pressure', 'BP 100/60', 100, 60);
    session = answerById(session, 'consciousness', 'alert');
    session = answerById(session, 'glucose', 'Glucose 5.5', 5.5);

    expect(session.vitalSigns.glucose).toBe(5.5);
    expect(session.vitalSigns.glucoseMgDl).toBe(99);
  });

  it('stores temperature in vitalSigns', () => {
    session = answerById(session, 'airway_status', 'patent');
    session = answerById(session, 'breathing_effort', 'normal');
    session = answerById(session, 'breathing_sounds', 'clear');
    session = answerById(session, 'spo2', 'SpO2 98%', 98);
    session = answerById(session, 'respiratory_rate', 'RR 20/min', 20);
    session = answerById(session, 'pulse_quality', 'strong');
    session = answerById(session, 'heart_rate', 'HR 100 bpm', 100);
    session = answerById(session, 'perfusion', 'normal');
    session = answerById(session, 'heart_sounds', 'normal');
    session = answerById(session, 'bleeding', 'none');
    session = answerById(session, 'blood_pressure', 'BP 100/60', 100, 60);
    session = answerById(session, 'consciousness', 'alert');
    session = answerById(session, 'glucose', 'Glucose 5.5', 5.5);
    session = answerById(session, 'pupils', 'normal');
    session = answerById(session, 'seizure_activity', 'no');
    session = answerById(session, 'temperature', 'Temp 38.5', 38.5);

    expect(session.vitalSigns.temp).toBe(38.5);
  });
});

// ─── 4. Consistent Dosing ───────────────────────────────────

describe('Consistent Dosing', () => {
  it('all shock boluses use 10 mL/kg', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 98%', 98);
    s = answerById(s, 'respiratory_rate', 'RR 20/min', 20);
    s = answerById(s, 'pulse_quality', 'weak');
    s = answerById(s, 'heart_rate', 'HR 180 bpm', 180);
    s = answerById(s, 'perfusion', 'very_poor');

    expect(s.phase).toBe('INTERVENTION');
    const shockThreat = s.threats.find(t => t.id === 'shock');
    expect(shockThreat).toBeDefined();

    const bolusIntervention = shockThreat!.interventions.find(i => i.action.includes('FLUID BOLUS'));
    expect(bolusIntervention).toBeDefined();
    expect(bolusIntervention!.dose!.dosePerKg).toBe(10);
    expect(bolusIntervention!.dose!.drug).toBe('Normal Saline 0.9%');
  });
});

// ─── 5. Drug Name on Every Dose ─────────────────────────────

describe('calcDose always shows drug name', () => {
  it('shows drug name with weight', () => {
    const dose: DoseInfo = { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mg', route: 'IV/IO' };
    const result = calcDose(dose, 18);
    expect(result).toMatch(/^Epinephrine:/);
    expect(result).toContain('0.18');
    expect(result).toContain('mg');
    expect(result).toContain('IV/IO');
  });

  it('shows drug name without weight', () => {
    const dose: DoseInfo = { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mg', route: 'IV/IO' };
    const result = calcDose(dose, null);
    expect(result).toMatch(/^Epinephrine:/);
    expect(result).toContain('/kg');
  });

  it('respects maxDose', () => {
    const dose: DoseInfo = { drug: 'Ceftriaxone', dosePerKg: 80, unit: 'mg', route: 'IV', maxDose: 4000 };
    const result = calcDose(dose, 100);
    expect(result).toContain('4000');
    expect(result).toContain('MAX DOSE');
  });

  it('rounds appropriately', () => {
    const dose: DoseInfo = { drug: 'Midazolam', dosePerKg: 0.15, unit: 'mg', route: 'IV' };
    const result = calcDose(dose, 18);
    expect(result).toContain('2.7');
  });
});

// ─── 6. Threat Detection from Objective Values ─────────────

describe('Threat Detection from Objective Values', () => {
  it('detects hypoxia from SpO2 < 90', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'labored');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 84%', 84);

    expect(s.phase).toBe('INTERVENTION');
    const hypoxia = s.threats.find(t => t.id === 'hypoxia');
    expect(hypoxia).toBeDefined();
    expect(hypoxia!.severity).toBe('critical');
  });

  it('detects hypoglycemia from glucose < 3.5', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 98%', 98);
    s = answerById(s, 'respiratory_rate', 'RR 20/min', 20);
    s = answerById(s, 'pulse_quality', 'strong');
    s = answerById(s, 'heart_rate', 'HR 100 bpm', 100);
    s = answerById(s, 'perfusion', 'normal');
    s = answerById(s, 'heart_sounds', 'normal');
    s = answerById(s, 'bleeding', 'none');
    s = answerById(s, 'blood_pressure', 'BP 100/60', 100, 60);
    s = answerById(s, 'consciousness', 'alert');
    s = answerById(s, 'glucose', 'Glucose 2.0', 2.0);

    expect(s.phase).toBe('INTERVENTION');
    const hypo = s.threats.find(t => t.id === 'hypoglycemia');
    expect(hypo).toBeDefined();
    expect(s.vitalSigns.glucose).toBe(2.0);
  });

  it('detects severe bradycardia from objective HR', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 98%', 98);
    s = answerById(s, 'respiratory_rate', 'RR 20/min', 20);
    s = answerById(s, 'pulse_quality', 'weak');
    s = answerById(s, 'heart_rate', 'HR 40 bpm', 40);

    const brady = s.threats.find(t => t.id === 'severe_bradycardia');
    expect(brady).toBeDefined();
    expect(brady!.severity).toBe('critical');
  });
});

// ─── 7. Mid-Case Patient Info Update ────────────────────────

describe('Mid-Case Patient Info Update', () => {
  it('updates weight mid-case', () => {
    let s = createSession(null, null);
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    expect(s.patientWeight).toBeNull();

    s = updatePatientInfo(s, 18, '5 years');
    expect(s.patientWeight).toBe(18);
    expect(s.patientAge).toBe('5 years');
    expect(s.events.some(e => e.detail.includes('Weight: 18kg'))).toBe(true);
  });

  it('updates only weight without changing age', () => {
    let s = createSession(null, '3 years');
    s = updatePatientInfo(s, 15, null);
    expect(s.patientWeight).toBe(15);
    expect(s.patientAge).toBe('3 years');
  });
});

// ─── 8. Intervention Tracking ───────────────────────────────

describe('Intervention Tracking', () => {
  it('starts and completes interventions', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'obstructed');

    expect(s.phase).toBe('INTERVENTION');
    const threat = s.threats[0];
    const intervention = threat.interventions[0];
    expect(intervention.status).toBe('pending');

    s = startIntervention(s, intervention.id);
    expect(s.threats[0].interventions[0].status).toBe('in_progress');

    s = completeIntervention(s, intervention.id);
    expect(s.threats[0].interventions[0].status).toBe('completed');
    expect(s.threats[0].interventions[0].completedAt).toBeDefined();
  });

  it('tracks bolus count and total volume', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 98%', 98);
    s = answerById(s, 'respiratory_rate', 'RR 20/min', 20);
    s = answerById(s, 'pulse_quality', 'weak');
    s = answerById(s, 'heart_rate', 'HR 180 bpm', 180);
    s = answerById(s, 'perfusion', 'very_poor');

    const shockThreat = s.threats.find(t => t.id === 'shock');
    const bolusIntervention = shockThreat!.interventions.find(i => i.action.includes('FLUID BOLUS'));

    s = completeIntervention(s, bolusIntervention!.id);
    expect(s.bolusCount).toBe(1);
    expect(s.totalBolusVolume).toBe(180);
  });
});

// ─── 9. Safety Alerts ───────────────────────────────────────

describe('Safety Alerts', () => {
  it('alerts on excessive boluses', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 98%', 98);
    s = answerById(s, 'respiratory_rate', 'RR 20/min', 20);
    s = answerById(s, 'pulse_quality', 'weak');
    s = answerById(s, 'heart_rate', 'HR 180 bpm', 180);
    s = answerById(s, 'perfusion', 'very_poor');

    s.bolusCount = 2;
    const shockThreat = s.threats.find(t => t.id === 'shock');
    const bolusIntervention = shockThreat!.interventions.find(i => i.action.includes('FLUID BOLUS'));
    s = completeIntervention(s, bolusIntervention!.id);

    expect(s.bolusCount).toBe(3);
    const alert = s.safetyAlerts.find(a => a.id === 'excessive_boluses');
    expect(alert).toBeDefined();
    expect(alert!.message).toContain('3+ FLUID BOLUSES');
  });

  it('acknowledges safety alerts', () => {
    let s = createSession(18, '5 years');
    s.safetyAlerts.push({
      id: 'test_alert',
      message: 'Test alert',
      severity: 'warning',
      timestamp: Date.now(),
      acknowledged: false,
    });

    s = acknowledgeSafetyAlert(s, 'test_alert');
    expect(s.safetyAlerts[0].acknowledged).toBe(true);
  });
});

// ─── 10. Reassessment Checks ────────────────────────────────

describe('Reassessment Checks', () => {
  it('bolus interventions have reassessment checks', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 98%', 98);
    s = answerById(s, 'respiratory_rate', 'RR 20/min', 20);
    s = answerById(s, 'pulse_quality', 'weak');
    s = answerById(s, 'heart_rate', 'HR 180 bpm', 180);
    s = answerById(s, 'perfusion', 'very_poor');

    const shockThreat = s.threats.find(t => t.id === 'shock');
    const bolusIntervention = shockThreat!.interventions.find(i => i.action.includes('FLUID BOLUS'));

    expect(bolusIntervention!.reassessmentChecks).toBeDefined();
    expect(bolusIntervention!.reassessmentChecks!.length).toBeGreaterThanOrEqual(2);

    const complicationCheck = bolusIntervention!.reassessmentChecks!.find(c => c.type === 'complication');
    expect(complicationCheck).toBeDefined();

    const endpointCheck = bolusIntervention!.reassessmentChecks!.find(c => c.type === 'therapeutic_endpoint');
    expect(endpointCheck).toBeDefined();
  });
});

// ─── 11. Diagnosis Suggestions ──────────────────────────────

describe('Diagnosis Suggestions', () => {
  it('suggests DKA with high glucose and kussmaul breathing', () => {
    let s = createSession(18, '5 years');
    s.vitalSigns.glucose = 28;
    s.findings.push({ id: 'breathing_sounds', letter: 'B', description: 'kussmaul', severity: 'urgent', timestamp: Date.now() });

    const diagnoses = getSuggestedDiagnoses(s);
    const dka = diagnoses.find(d => d.diagnosis.includes('DKA'));
    expect(dka).toBeDefined();
    expect(dka!.confidence).toBe('high');
  });

  it('suggests sepsis with fever and shock', () => {
    let s = createSession(18, '5 years');
    s.vitalSigns.temp = 39.5;
    s.findings.push({ id: 'perfusion', letter: 'C', description: 'very_poor', severity: 'critical', timestamp: Date.now() });

    const diagnoses = getSuggestedDiagnoses(s);
    const sepsis = diagnoses.find(d => d.diagnosis.includes('Sepsis'));
    expect(sepsis).toBeDefined();
    expect(sepsis!.confidence).toBe('high');
  });
});

// ─── 12. Event Logging and Export ───────────────────────────

describe('Event Logging', () => {
  it('logs events throughout the assessment', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');

    expect(s.events.length).toBeGreaterThan(0);
    expect(s.events.some(e => e.type === 'phase_change')).toBe(true);
    expect(s.events.some(e => e.type === 'finding')).toBe(true);
  });

  it('exports a readable event log with vital signs', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'patent');
    s = answerById(s, 'breathing_effort', 'normal');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 96%', 96);
    s = answerById(s, 'respiratory_rate', 'RR 22/min', 22);

    const log = exportEventLog(s);
    expect(log).toContain('RESUSCITATION RECORD');
    expect(log).toContain('Patient Weight: 18 kg');
    expect(log).toContain('Patient Age: 5 years');
    expect(log).toContain('SpO2: 96%');
    expect(log).toContain('RR: 22 /min');
  });
});

// ─── 13. Cardiac Arrest ─────────────────────────────────────

describe('Cardiac Arrest', () => {
  it('triggers cardiac arrest from any phase', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = triggerCardiacArrest(s);

    expect(s.phase).toBe('CARDIAC_ARREST');
    const arrest = s.threats.find(t => t.id === 'cardiac_arrest');
    expect(arrest).toBeDefined();
    expect(arrest!.interventions.some(i => i.action.includes('CPR'))).toBe(true);
    expect(arrest!.interventions.some(i => i.dose?.drug === 'Epinephrine (1:10,000)')).toBe(true);
  });

  it('achieves ROSC and transitions to ONGOING', () => {
    let s = createSession(18, '5 years');
    s = triggerCardiacArrest(s);
    s = achieveROSC(s);

    expect(s.phase).toBe('ONGOING');
    expect(s.events.some(e => e.type === 'rosc')).toBe(true);
  });
});

// ─── 14. Full DKA Scenario ──────────────────────────────────

describe('Full DKA Scenario', () => {
  it('walks through a complete DKA case', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');

    // A: Patent
    s = answerById(s, 'airway_status', 'patent');
    expect(s.currentLetter).toBe('B');

    // B: Kussmaul breathing
    s = answerById(s, 'breathing_effort', 'labored');
    s = answerById(s, 'breathing_sounds', 'kussmaul');
    s = answerById(s, 'spo2', 'SpO2 96%', 96);
    s = answerById(s, 'respiratory_rate', 'RR 40/min', 40);

    // After completing B with urgent threat, should go to INTERVENTION
    expect(s.phase).toBe('INTERVENTION');
    const kussmaul = s.threats.find(t => t.id === 'kussmaul_breathing');
    expect(kussmaul).toBeDefined();

    for (const intervention of kussmaul!.interventions) {
      s = completeIntervention(s, intervention.id);
    }
    s = returnToPrimarySurvey(s);
    expect(s.phase).toBe('PRIMARY_SURVEY');
    expect(s.currentLetter).toBe('C');

    // C: Shock with tachycardia
    s = answerById(s, 'pulse_quality', 'weak');
    s = answerById(s, 'heart_rate', 'HR 160 bpm', 160);
    s = answerById(s, 'perfusion', 'poor');

    expect(s.phase).toBe('INTERVENTION');
    const shock = s.threats.find(t => t.id === 'shock');
    expect(shock).toBeDefined();

    // Verify 10 mL/kg bolus (not 20)
    const bolus = shock!.interventions.find(i => i.action.includes('FLUID BOLUS'));
    expect(bolus!.dose!.dosePerKg).toBe(10);

    for (const intervention of shock!.interventions) {
      s = completeIntervention(s, intervention.id);
    }
    s = returnToPrimarySurvey(s);

    // Continue C
    s = answerById(s, 'heart_sounds', 'normal');
    s = answerById(s, 'bleeding', 'none');
    s = answerById(s, 'blood_pressure', 'BP 85/50', 85, 50);
    expect(s.currentLetter).toBe('D');

    // D: Altered consciousness + high glucose
    s = answerById(s, 'consciousness', 'voice');
    s = answerById(s, 'glucose', 'Glucose 28', 28);
    s = answerById(s, 'pupils', 'normal');
    s = answerById(s, 'seizure_activity', 'no');

    // After completing D with hyperglycemia, should go to INTERVENTION
    expect(s.phase).toBe('INTERVENTION');
    const hyperglycemia = s.threats.find(t => t.id === 'hyperglycemia');
    expect(hyperglycemia).toBeDefined();

    for (const intervention of hyperglycemia!.interventions) {
      s = completeIntervention(s, intervention.id);
    }
    s = returnToPrimarySurvey(s);

    // E: Normal temp
    s = answerById(s, 'temperature', 'Temp 37.5', 37.5);
    s = answerById(s, 'rash', 'none');
    s = answerById(s, 'other_exposure', 'none');

    expect(s.phase).toBe('SECONDARY_SURVEY');

    // Check diagnosis suggestions
    const diagnoses = getSuggestedDiagnoses(s);
    const dka = diagnoses.find(d => d.diagnosis.includes('DKA'));
    expect(dka).toBeDefined();
    expect(dka!.confidence).toBe('high');
    expect(dka!.supportingFindings).toContain('Glucose 28 mmol/L');
    expect(dka!.supportingFindings).toContain('Kussmaul breathing');

    // Set definitive diagnosis
    s = setDefinitiveDiagnosis(s, 'Diabetic Ketoacidosis (DKA)');
    expect(s.phase).toBe('DEFINITIVE_CARE');
    expect(s.definitiveDiagnosis).toBe('Diabetic Ketoacidosis (DKA)');

    // Verify event log
    const log = exportEventLog(s);
    expect(log).toContain('Glucose: 28 mmol/L');
    expect(log).toContain('DKA');
  });
});

// ─── 15. Full Sepsis Scenario ───────────────────────────────

describe('Full Sepsis Scenario', () => {
  it('walks through a complete sepsis case', () => {
    let s = createSession(10, '1 year');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');

    // A: Patent
    s = answerById(s, 'airway_status', 'patent');

    // B: Tachypnea
    s = answerById(s, 'breathing_effort', 'labored');
    s = answerById(s, 'breathing_sounds', 'clear');
    s = answerById(s, 'spo2', 'SpO2 92%', 92);
    s = answerById(s, 'respiratory_rate', 'RR 55/min', 55);

    // Handle any interventions from B
    if (s.phase === 'INTERVENTION') {
      const threats = getActiveThreats(s);
      for (const threat of threats) {
        for (const intervention of threat.interventions) {
          s = completeIntervention(s, intervention.id);
        }
      }
      s = returnToPrimarySurvey(s);
    }

    // C: Warm shock - answer all C questions, warm_shock is urgent so waits until letter complete
    s = answerById(s, 'heart_rate', 'HR 190 bpm', 190);
    s = answerById(s, 'pulse_quality', 'bounding');
    s = answerById(s, 'blood_pressure', 'BP 65/35', 65, 35);
    s = answerById(s, 'perfusion', 'warm_shock');
    s = answerById(s, 'bleeding', 'none');
    s = answerById(s, 'heart_sounds', 'normal');

    // After all C questions answered with urgent warm_shock threat → INTERVENTION
    expect(s.phase).toBe('INTERVENTION');
    const warmShock = s.threats.find(t => t.id === 'warm_shock');
    expect(warmShock).toBeDefined();

    const bolus = warmShock!.interventions.find(i => i.action.includes('FLUID BOLUS'));
    expect(bolus!.dose!.dosePerKg).toBe(10);

    for (const intervention of warmShock!.interventions) {
      s = completeIntervention(s, intervention.id);
    }
    s = returnToPrimarySurvey(s);

    if (s.phase === 'INTERVENTION') {
      const threats = getActiveThreats(s);
      for (const threat of threats) {
        for (const intervention of threat.interventions) {
          s = completeIntervention(s, intervention.id);
        }
      }
      s = returnToPrimarySurvey(s);
    }

    // D
    s = answerById(s, 'consciousness', 'voice');
    s = answerById(s, 'glucose', 'Glucose 5.0', 5.0);
    s = answerById(s, 'pupils', 'normal');
    s = answerById(s, 'seizure_activity', 'no');

    if (s.phase === 'INTERVENTION') {
      const threats = getActiveThreats(s);
      for (const threat of threats) {
        for (const intervention of threat.interventions) {
          s = completeIntervention(s, intervention.id);
        }
      }
      s = returnToPrimarySurvey(s);
    }

    // E: High fever + petechiae
    s = answerById(s, 'temperature', 'Temp 39.5', 39.5);

    if (s.phase === 'INTERVENTION') {
      const threats = getActiveThreats(s);
      for (const threat of threats) {
        for (const intervention of threat.interventions) {
          s = completeIntervention(s, intervention.id);
        }
      }
      s = returnToPrimarySurvey(s);
    }

    s = answerById(s, 'rash', 'petechiae');

    if (s.phase === 'INTERVENTION') {
      const threats = getActiveThreats(s);
      for (const threat of threats) {
        for (const intervention of threat.interventions) {
          s = completeIntervention(s, intervention.id);
        }
      }
      s = returnToPrimarySurvey(s);
    }

    s = answerById(s, 'other_exposure', 'none');

    if (s.phase === 'INTERVENTION') {
      const threats = getActiveThreats(s);
      for (const threat of threats) {
        for (const intervention of threat.interventions) {
          s = completeIntervention(s, intervention.id);
        }
      }
      s = returnToPrimarySurvey(s);
    }

    // Check diagnosis suggestions
    const diagnoses = getSuggestedDiagnoses(s);
    const sepsis = diagnoses.find(d => d.diagnosis.includes('Sepsis'));
    expect(sepsis).toBeDefined();

    expect(s.vitalSigns.hr).toBe(190);
    expect(s.vitalSigns.temp).toBe(39.5);
    expect(s.vitalSigns.spo2).toBe(92);
  });
});

// ─── 16. SAMPLE History ─────────────────────────────────────

describe('SAMPLE History', () => {
  it('updates SAMPLE history fields', () => {
    let s = createSession(18, '5 years');
    s = updateSAMPLE(s, 'signs', 'Fever, vomiting for 2 days');
    s = updateSAMPLE(s, 'allergies', 'Penicillin');
    s = updateSAMPLE(s, 'medications', 'None');

    expect(s.sampleHistory.signs).toBe('Fever, vomiting for 2 days');
    expect(s.sampleHistory.allergies).toBe('Penicillin');
    expect(s.sampleHistory.medications).toBe('None');
  });
});

// ─── 17. Question Structure Validation ──────────────────────

describe('Question Structure', () => {
  it('all letters have questions', () => {
    expect(primarySurveyQuestions.A.length).toBeGreaterThan(0);
    expect(primarySurveyQuestions.B.length).toBeGreaterThan(0);
    expect(primarySurveyQuestions.C.length).toBeGreaterThan(0);
    expect(primarySurveyQuestions.D.length).toBeGreaterThan(0);
    expect(primarySurveyQuestions.E.length).toBeGreaterThan(0);
  });

  it('number questions have interpret functions', () => {
    for (const letter of ['A', 'B', 'C', 'D', 'E'] as const) {
      for (const q of primarySurveyQuestions[letter]) {
        if (q.inputType === 'number') {
          expect(q.numberConfig).toBeDefined();
          expect(typeof q.numberConfig!.interpret).toBe('function');
        }
        if (q.inputType === 'number_pair') {
          expect(q.numberPairConfig).toBeDefined();
          expect(typeof q.numberPairConfig!.interpret).toBe('function');
        }
      }
    }
  });

  it('X letter has trauma questions', () => {
    expect(primarySurveyQuestions.X).toBeDefined();
    expect(primarySurveyQuestions.X.length).toBeGreaterThan(0);
  });
});

// ─── 18. Return to Primary Survey ───────────────────────────

describe('Return to Primary Survey', () => {
  it('advances to next letter when current is complete', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerById(s, 'airway_status', 'obstructed');

    expect(s.phase).toBe('INTERVENTION');

    for (const intervention of s.threats[0].interventions) {
      s = completeIntervention(s, intervention.id);
    }

    s = returnToPrimarySurvey(s);
    expect(s.phase).toBe('PRIMARY_SURVEY');
    expect(s.currentLetter).toBe('B');
  });
});
