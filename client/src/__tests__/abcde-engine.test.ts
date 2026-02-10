/**
 * ABCDE Engine Tests
 * 
 * Tests the clinical brain of ResusGPS:
 * - Session creation and initialization
 * - Quick Assessment flow
 * - Primary Survey ABCDE progression
 * - Threat detection from findings
 * - Multi-threat management
 * - Dose calculations
 * - Safety checks
 * - Cardiac arrest handling
 * - Diagnosis suggestions
 * - Event logging
 * - The DKA scenario (Job's real-world example)
 */

import { describe, it, expect } from 'vitest';
import {
  createSession,
  startQuickAssessment,
  answerQuickAssessment,
  getCurrentQuestions,
  getAnsweredQuestionIds,
  answerPrimarySurvey,
  completeIntervention,
  returnToPrimarySurvey,
  getActiveThreats,
  getPendingInterventions,
  getAllPendingCritical,
  getSuggestedDiagnoses,
  setDefinitiveDiagnosis,
  triggerCardiacArrest,
  achieveROSC,
  acknowledgeSafetyAlert,
  exportEventLog,
  calcDose,
  primarySurveyQuestions,
  type ResusSession,
  type AssessmentQuestion,
} from '../lib/resus/abcdeEngine';

// Helper to answer a question by ID
function answerQuestion(session: ResusSession, questionId: string, answer: string): ResusSession {
  // Find the question across all letters
  for (const letter of ['X', 'A', 'B', 'C', 'D', 'E'] as const) {
    const q = primarySurveyQuestions[letter].find(q => q.id === questionId);
    if (q) {
      return answerPrimarySurvey(session, questionId, answer, q);
    }
  }
  throw new Error(`Question ${questionId} not found`);
}

// ─── Session Creation ───────────────────────────────────────

describe('Session Creation', () => {
  it('creates a session with default values', () => {
    const session = createSession();
    expect(session.phase).toBe('IDLE');
    expect(session.currentLetter).toBe('A');
    expect(session.quickAssessment).toBeNull();
    expect(session.findings).toHaveLength(0);
    expect(session.threats).toHaveLength(0);
    expect(session.events).toHaveLength(0);
    expect(session.isTrauma).toBe(false);
  });

  it('creates a trauma session starting at X', () => {
    const session = createSession(null, null, true);
    expect(session.isTrauma).toBe(true);
    expect(session.currentLetter).toBe('X');
  });

  it('stores patient weight and age', () => {
    const session = createSession(15, '5 years');
    expect(session.patientWeight).toBe(15);
    expect(session.patientAge).toBe('5 years');
  });
});

// ─── Quick Assessment ───────────────────────────────────────

describe('Quick Assessment', () => {
  it('transitions from IDLE to QUICK_ASSESSMENT', () => {
    const session = createSession();
    const next = startQuickAssessment(session);
    expect(next.phase).toBe('QUICK_ASSESSMENT');
    expect(next.events.length).toBeGreaterThan(0);
  });

  it('SICK → goes to PRIMARY_SURVEY at A', () => {
    const session = startQuickAssessment(createSession());
    const next = answerQuickAssessment(session, 'sick');
    expect(next.phase).toBe('PRIMARY_SURVEY');
    expect(next.quickAssessment).toBe('sick');
    expect(next.currentLetter).toBe('A');
  });

  it('SICK trauma → goes to PRIMARY_SURVEY at X', () => {
    const session = startQuickAssessment(createSession(null, null, true));
    const next = answerQuickAssessment(session, 'sick');
    expect(next.phase).toBe('PRIMARY_SURVEY');
    expect(next.currentLetter).toBe('X');
  });

  it('NOT_SICK → goes to PRIMARY_SURVEY at A', () => {
    const session = startQuickAssessment(createSession());
    const next = answerQuickAssessment(session, 'not_sick');
    expect(next.phase).toBe('PRIMARY_SURVEY');
    expect(next.quickAssessment).toBe('not_sick');
    expect(next.currentLetter).toBe('A');
  });
});

// ─── Primary Survey Progression ─────────────────────────────

describe('Primary Survey Progression', () => {
  it('returns questions for current letter', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    const questions = getCurrentQuestions(session);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].letter).toBe('A');
  });

  it('records findings when answering questions', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    expect(session.findings).toHaveLength(1);
    expect(session.findings[0].id).toBe('airway_status');
    expect(session.findings[0].description).toBe('patent');
    expect(session.findings[0].letter).toBe('A');
  });

  it('advances to next letter when all questions answered (normal findings)', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    // A has 1 question
    session = answerQuestion(session, 'airway_status', 'patent');
    // Should advance to B
    expect(session.currentLetter).toBe('B');
    expect(session.phase).toBe('PRIMARY_SURVEY');
  });

  it('tracks answered question IDs', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    const answered = getAnsweredQuestionIds(session);
    expect(answered).toContain('airway_status');
  });
});

// ─── Threat Detection ───────────────────────────────────────

describe('Threat Detection', () => {
  it('detects airway obstruction as critical threat', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'obstructed');
    
    expect(session.threats).toHaveLength(1);
    expect(session.threats[0].name).toBe('Airway Obstruction');
    expect(session.threats[0].severity).toBe('critical');
    expect(session.phase).toBe('INTERVENTION');
  });

  it('detects airway at risk as urgent threat', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'at_risk');
    
    // Urgent threats don't immediately switch to INTERVENTION
    // They wait until all questions for the letter are answered
    // A only has 1 question, so it should go to intervention
    expect(session.threats).toHaveLength(1);
    expect(session.threats[0].name).toBe('Airway At Risk');
    expect(session.phase).toBe('INTERVENTION');
  });

  it('detects wheezing as bronchospasm', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    // Now at B
    session = answerQuestion(session, 'breathing_effort', 'labored');
    session = answerQuestion(session, 'breathing_sounds', 'wheezing');
    
    const bronchospasm = session.threats.find(t => t.id === 'bronchospasm');
    expect(bronchospasm).toBeDefined();
    expect(bronchospasm!.name).toBe('Bronchospasm / Wheezing');
  });

  it('detects absent pulse as cardiac arrest', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    session = answerQuestion(session, 'breathing_effort', 'normal');
    session = answerQuestion(session, 'breathing_sounds', 'clear');
    session = answerQuestion(session, 'spo2', 'normal');
    // Now at C
    session = answerQuestion(session, 'pulse_status', 'absent');
    
    const ca = session.threats.find(t => t.id === 'cardiac_arrest');
    expect(ca).toBeDefined();
    expect(ca!.severity).toBe('critical');
    expect(session.phase).toBe('INTERVENTION');
  });

  it('detects hypoglycemia', () => {
    let session = startQuickAssessment(createSession(15));
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    session = answerQuestion(session, 'breathing_effort', 'normal');
    session = answerQuestion(session, 'breathing_sounds', 'clear');
    session = answerQuestion(session, 'spo2', 'normal');
    session = answerQuestion(session, 'pulse_status', 'strong');
    session = answerQuestion(session, 'perfusion', 'normal');
    session = answerQuestion(session, 'bleeding', 'no');
    // Now at D
    session = answerQuestion(session, 'consciousness', 'alert');
    session = answerQuestion(session, 'glucose', 'low');
    
    const hypo = session.threats.find(t => t.id === 'hypoglycemia');
    expect(hypo).toBeDefined();
    expect(hypo!.severity).toBe('critical');
    expect(session.phase).toBe('INTERVENTION');
  });

  it('detects hyperglycemia / suspect DKA', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    session = answerQuestion(session, 'breathing_effort', 'labored');
    session = answerQuestion(session, 'breathing_sounds', 'kussmaul');
    // Kussmaul is urgent, not critical — continue
    session = answerQuestion(session, 'spo2', 'normal');
    // B complete with urgent threats → INTERVENTION
    expect(session.phase).toBe('INTERVENTION');
    
    // Continue to C, D
    session = returnToPrimarySurvey(session);
    session = answerQuestion(session, 'pulse_status', 'rapid');
    session = answerQuestion(session, 'perfusion', 'poor');
    session = answerQuestion(session, 'bleeding', 'no');
    // C has urgent threats → INTERVENTION
    session = returnToPrimarySurvey(session);
    // Now at D
    session = answerQuestion(session, 'consciousness', 'voice');
    session = answerQuestion(session, 'glucose', 'very_high');
    
    const hyperglycemia = session.threats.find(t => t.id === 'hyperglycemia');
    expect(hyperglycemia).toBeDefined();
  });
});

// ─── Multi-Threat Management ────────────────────────────────

describe('Multi-Threat Management', () => {
  it('accumulates multiple threats across letters', () => {
    let session = startQuickAssessment(createSession(null, null, true));
    session = answerQuickAssessment(session, 'sick');
    
    // X: catastrophic hemorrhage
    session = answerQuestion(session, 'catastrophic_hemorrhage', 'yes');
    expect(session.threats).toHaveLength(1);
    expect(session.phase).toBe('INTERVENTION');
    
    // Continue to A
    session = returnToPrimarySurvey(session);
    session = answerQuestion(session, 'airway_status', 'obstructed');
    expect(session.threats).toHaveLength(2);
    expect(session.phase).toBe('INTERVENTION');
    
    // Both threats should be active
    const active = getActiveThreats(session);
    expect(active).toHaveLength(2);
  });

  it('sorts threats by severity then letter order', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    
    // A: at risk (urgent)
    session = answerQuestion(session, 'airway_status', 'at_risk');
    session = returnToPrimarySurvey(session);
    
    // B: critical hypoxia
    session = answerQuestion(session, 'breathing_effort', 'labored');
    session = answerQuestion(session, 'breathing_sounds', 'clear');
    session = answerQuestion(session, 'spo2', 'critical');
    
    const active = getActiveThreats(session);
    // Critical should come first
    expect(active[0].severity).toBe('critical');
  });
});

// ─── Intervention Completion ────────────────────────────────

describe('Intervention Completion', () => {
  it('marks interventions as completed', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'obstructed');
    
    const threat = session.threats[0];
    const intervention = threat.interventions[0];
    expect(intervention.completed).toBe(false);
    
    session = completeIntervention(session, intervention.id);
    const updated = session.threats[0].interventions[0];
    expect(updated.completed).toBe(true);
    expect(updated.completedAt).toBeDefined();
  });

  it('tracks bolus count for safety checks', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    session = answerQuestion(session, 'breathing_effort', 'normal');
    session = answerQuestion(session, 'breathing_sounds', 'clear');
    session = answerQuestion(session, 'spo2', 'normal');
    session = answerQuestion(session, 'pulse_status', 'weak');
    session = answerQuestion(session, 'perfusion', 'very_poor');
    
    // Should have cold shock threat
    const shock = session.threats.find(t => t.id === 'cold_shock');
    expect(shock).toBeDefined();
    
    // Complete fluid bolus intervention
    const bolusIntervention = shock!.interventions.find(i => i.action.includes('FLUID BOLUS'));
    if (bolusIntervention) {
      session = completeIntervention(session, bolusIntervention.id);
      expect(session.bolusCount).toBe(1);
    }
  });
});

// ─── Return to Primary Survey ───────────────────────────────

describe('Return to Primary Survey', () => {
  it('advances to next letter after intervention', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'obstructed');
    expect(session.phase).toBe('INTERVENTION');
    
    session = returnToPrimarySurvey(session);
    expect(session.phase).toBe('PRIMARY_SURVEY');
    expect(session.currentLetter).toBe('B');
  });

  it('goes to SECONDARY_SURVEY after E is complete', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'not_sick');
    
    // Answer all normal through ABCDE
    session = answerQuestion(session, 'airway_status', 'patent');
    session = answerQuestion(session, 'breathing_effort', 'normal');
    session = answerQuestion(session, 'breathing_sounds', 'clear');
    session = answerQuestion(session, 'spo2', 'normal');
    session = answerQuestion(session, 'pulse_status', 'strong');
    session = answerQuestion(session, 'perfusion', 'normal');
    session = answerQuestion(session, 'bleeding', 'no');
    session = answerQuestion(session, 'consciousness', 'alert');
    session = answerQuestion(session, 'glucose', 'normal');
    session = answerQuestion(session, 'pupils', 'normal');
    session = answerQuestion(session, 'seizure_activity', 'no');
    session = answerQuestion(session, 'temperature', 'normal');
    session = answerQuestion(session, 'rash', 'none');
    session = answerQuestion(session, 'other_exposure', 'none');
    
    expect(session.phase).toBe('SECONDARY_SURVEY');
  });
});

// ─── Dose Calculations ──────────────────────────────────────

describe('Dose Calculations', () => {
  it('calculates weight-based dose', () => {
    const dose = { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mg', route: 'IV' };
    const result = calcDose(dose, 15);
    expect(result).toContain('0.15');
    expect(result).toContain('mg');
    expect(result).toContain('IV');
  });

  it('caps at max dose', () => {
    const dose = { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mg', route: 'IV', maxDose: 1 };
    const result = calcDose(dose, 200);
    expect(result).toContain('1');
    expect(result).toContain('MAX DOSE');
  });

  it('shows per-kg dose when no weight', () => {
    const dose = { drug: 'Epinephrine', dosePerKg: 0.01, unit: 'mg', route: 'IV' };
    const result = calcDose(dose, null);
    expect(result).toContain('/kg');
  });

  it('rounds appropriately', () => {
    const dose = { drug: 'Dextrose 10%', dosePerKg: 5, unit: 'mL', route: 'IV' };
    const result = calcDose(dose, 15);
    expect(result).toContain('75');
  });
});

// ─── Cardiac Arrest ─────────────────────────────────────────

describe('Cardiac Arrest', () => {
  it('triggers cardiac arrest from any phase', () => {
    let session = startQuickAssessment(createSession(15));
    session = answerQuickAssessment(session, 'sick');
    session = triggerCardiacArrest(session);
    
    expect(session.phase).toBe('CARDIAC_ARREST');
    const ca = session.threats.find(t => t.id === 'cardiac_arrest');
    expect(ca).toBeDefined();
    expect(ca!.interventions.length).toBeGreaterThan(0);
  });

  it('achieves ROSC and transitions to ONGOING', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = triggerCardiacArrest(session);
    session = achieveROSC(session);
    
    expect(session.phase).toBe('ONGOING');
    expect(session.events.some(e => e.type === 'rosc')).toBe(true);
  });

  it('includes epinephrine dose in cardiac arrest interventions', () => {
    let session = createSession(10);
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
    session = triggerCardiacArrest(session);
    
    const ca = session.threats.find(t => t.id === 'cardiac_arrest');
    const epi = ca!.interventions.find(i => i.action.includes('EPINEPHRINE'));
    expect(epi).toBeDefined();
    expect(epi!.dose).toBeDefined();
    expect(epi!.dose!.dosePerKg).toBe(0.01);
  });
});

// ─── Safety Checks ──────────────────────────────────────────

describe('Safety Checks', () => {
  it('flags insulin without potassium', () => {
    let session = createSession(15);
    session.insulinRunning = true;
    session.potassiumAdded = false;
    session.phase = 'ONGOING';
    
    // Trigger safety check by completing an intervention
    // We'll manually set the state and check
    // Safety checks run during completeIntervention
    // Let's simulate by creating a threat with an intervention
    session.threats.push({
      id: 'test_threat',
      letter: 'D',
      name: 'Test',
      severity: 'urgent',
      interventions: [{ id: 'test_int', action: 'Test', completed: false }],
      resolved: false,
      findings: [],
    });
    
    session = completeIntervention(session, 'test_int');
    
    const alert = session.safetyAlerts.find(a => a.id === 'insulin_without_potassium');
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe('danger');
  });

  it('acknowledges safety alerts', () => {
    let session = createSession();
    session.safetyAlerts.push({
      id: 'test_alert',
      message: 'Test alert',
      severity: 'warning',
      timestamp: Date.now(),
      acknowledged: false,
    });
    
    session = acknowledgeSafetyAlert(session, 'test_alert');
    expect(session.safetyAlerts[0].acknowledged).toBe(true);
  });
});

// ─── Diagnosis Suggestions ──────────────────────────────────

describe('Diagnosis Suggestions', () => {
  it('suggests DKA when hyperglycemia + Kussmaul', () => {
    let session = createSession();
    session.findings.push(
      { id: 'glucose', letter: 'D', description: 'very_high', severity: 'critical', timestamp: Date.now() },
      { id: 'breathing_sounds', letter: 'B', description: 'kussmaul', severity: 'urgent', timestamp: Date.now() },
    );
    
    const suggestions = getSuggestedDiagnoses(session);
    const dka = suggestions.find(s => s.diagnosis.includes('DKA'));
    expect(dka).toBeDefined();
    expect(dka!.confidence).toBe('high');
  });

  it('suggests sepsis when fever + shock', () => {
    let session = createSession();
    session.findings.push(
      { id: 'temperature', letter: 'E', description: 'high_fever', severity: 'urgent', timestamp: Date.now() },
      { id: 'perfusion', letter: 'C', description: 'very_poor', severity: 'critical', timestamp: Date.now() },
    );
    
    const suggestions = getSuggestedDiagnoses(session);
    const sepsis = suggestions.find(s => s.diagnosis.includes('Sepsis'));
    expect(sepsis).toBeDefined();
    expect(sepsis!.confidence).toBe('high');
  });

  it('suggests anaphylaxis when urticaria + respiratory distress', () => {
    let session = createSession();
    session.findings.push(
      { id: 'rash', letter: 'E', description: 'urticaria', severity: 'urgent', timestamp: Date.now() },
      { id: 'breathing_effort', letter: 'B', description: 'labored', severity: 'urgent', timestamp: Date.now() },
    );
    
    const suggestions = getSuggestedDiagnoses(session);
    const anaph = suggestions.find(s => s.diagnosis.includes('Anaphylaxis'));
    expect(anaph).toBeDefined();
  });

  it('suggests status epilepticus when active seizure', () => {
    let session = createSession();
    session.findings.push(
      { id: 'seizure_activity', letter: 'D', description: 'active', severity: 'critical', timestamp: Date.now() },
    );
    
    const suggestions = getSuggestedDiagnoses(session);
    const se = suggestions.find(s => s.diagnosis.includes('Status Epilepticus'));
    expect(se).toBeDefined();
  });
});

// ─── Definitive Diagnosis ───────────────────────────────────

describe('Definitive Diagnosis', () => {
  it('sets diagnosis and transitions to DEFINITIVE_CARE', () => {
    let session = createSession();
    session.phase = 'SECONDARY_SURVEY';
    session = setDefinitiveDiagnosis(session, 'Diabetic Ketoacidosis');
    
    expect(session.definitiveDiagnosis).toBe('Diabetic Ketoacidosis');
    expect(session.phase).toBe('DEFINITIVE_CARE');
  });
});

// ─── Event Logging ──────────────────────────────────────────

describe('Event Logging', () => {
  it('logs all state transitions', () => {
    let session = startQuickAssessment(createSession());
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'obstructed');
    
    expect(session.events.length).toBeGreaterThanOrEqual(3);
    expect(session.events.some(e => e.type === 'phase_change')).toBe(true);
    expect(session.events.some(e => e.type === 'finding')).toBe(true);
    expect(session.events.some(e => e.type === 'threat_identified')).toBe(true);
  });

  it('exports event log as text', () => {
    let session = startQuickAssessment(createSession(15, '5 years'));
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'airway_status', 'patent');
    
    const log = exportEventLog(session);
    expect(log).toContain('RESUSCITATION RECORD');
    expect(log).toContain('15 kg');
    expect(log).toContain('5 years');
  });
});

// ─── The DKA Scenario (Job's Real-World Example) ────────────

describe('DKA Scenario — Real Clinical Case', () => {
  it('walks through the complete DKA scenario', () => {
    // Create session for a 5-year-old, 18kg child
    let session = createSession(18, '5 years');
    session = startQuickAssessment(session);
    
    // Quick Assessment: SICK
    session = answerQuickAssessment(session, 'sick');
    expect(session.phase).toBe('PRIMARY_SURVEY');
    
    // A: Vomiting → Airway at risk
    session = answerQuestion(session, 'airway_status', 'at_risk');
    expect(session.threats.some(t => t.name === 'Airway At Risk')).toBe(true);
    // A complete with urgent threat → INTERVENTION
    expect(session.phase).toBe('INTERVENTION');
    session = returnToPrimarySurvey(session);
    
    // B: Deep labored breathing (Kussmaul)
    session = answerQuestion(session, 'breathing_effort', 'labored');
    session = answerQuestion(session, 'breathing_sounds', 'kussmaul');
    // Kussmaul detected
    expect(session.threats.some(t => t.id === 'kussmaul_breathing')).toBe(true);
    session = answerQuestion(session, 'spo2', 'low');
    // B complete with urgent threats → INTERVENTION
    expect(session.phase).toBe('INTERVENTION');
    session = returnToPrimarySurvey(session);
    
    // C: Cold shock
    session = answerQuestion(session, 'pulse_status', 'rapid');
    session = answerQuestion(session, 'perfusion', 'very_poor');
    // Cold shock detected (critical)
    expect(session.threats.some(t => t.id === 'cold_shock')).toBe(true);
    expect(session.phase).toBe('INTERVENTION');
    
    // Complete fluid bolus
    const shock = session.threats.find(t => t.id === 'cold_shock')!;
    const bolus = shock.interventions.find(i => i.action.includes('FLUID BOLUS'))!;
    session = completeIntervention(session, bolus.id);
    expect(session.bolusCount).toBe(1);
    
    session = returnToPrimarySurvey(session);
    session = answerQuestion(session, 'bleeding', 'no');
    // C complete → continue to D
    session = returnToPrimarySurvey(session);
    
    // D: Glucose very high, unequal pupils, seizure
    session = answerQuestion(session, 'consciousness', 'voice');
    session = answerQuestion(session, 'glucose', 'very_high');
    // Hyperglycemia detected (urgent, not critical — stays in PRIMARY_SURVEY)
    expect(session.threats.some(t => t.id === 'hyperglycemia')).toBe(true);
    expect(session.phase).toBe('PRIMARY_SURVEY');
    
    session = answerQuestion(session, 'pupils', 'unequal');
    // Raised ICP detected (critical) → INTERVENTION
    expect(session.threats.some(t => t.id === 'raised_icp')).toBe(true);
    expect(session.phase).toBe('INTERVENTION');
    session = returnToPrimarySurvey(session);
    
    session = answerQuestion(session, 'seizure_activity', 'active');
    // Active seizure detected (critical) → INTERVENTION
    expect(session.threats.some(t => t.id === 'active_seizure')).toBe(true);
    expect(session.phase).toBe('INTERVENTION');
    session = returnToPrimarySurvey(session);
    
    // E: Fever
    session = answerQuestion(session, 'temperature', 'high_fever');
    session = answerQuestion(session, 'rash', 'none');
    session = answerQuestion(session, 'other_exposure', 'none');
    
    // E complete with urgent threats → INTERVENTION
    expect(session.phase).toBe('INTERVENTION');
    session = returnToPrimarySurvey(session);
    
    // Should be at SECONDARY_SURVEY now
    expect(session.phase).toBe('SECONDARY_SURVEY');
    
    // Check all threats accumulated
    const activeThreats = getActiveThreats(session);
    expect(activeThreats.length).toBeGreaterThanOrEqual(5);
    
    // System should suggest DKA
    const suggestions = getSuggestedDiagnoses(session);
    const dka = suggestions.find(s => s.diagnosis.includes('DKA'));
    expect(dka).toBeDefined();
    expect(dka!.confidence).toBe('high');
    
    // Set definitive diagnosis
    session = setDefinitiveDiagnosis(session, 'Diabetic Ketoacidosis (DKA)');
    expect(session.phase).toBe('DEFINITIVE_CARE');
    
    // Verify dose calculations are correct for 18kg child
    const seizureThreat = session.threats.find(t => t.id === 'active_seizure')!;
    const midazolam = seizureThreat.interventions.find(i => i.dose?.drug === 'Midazolam');
    expect(midazolam).toBeDefined();
    const midazolamDose = calcDose(midazolam!.dose!, 18);
    expect(midazolamDose).toContain('2.7'); // 0.15 * 18 = 2.7mg
    
    // Verify raised ICP treatment
    const icpThreat = session.threats.find(t => t.id === 'raised_icp')!;
    const hypertonic = icpThreat.interventions.find(i => i.dose?.drug.includes('Hypertonic'));
    expect(hypertonic).toBeDefined();
    const hypertonicDose = calcDose(hypertonic!.dose!, 18);
    expect(hypertonicDose).toContain('90'); // 5 * 18 = 90mL
    
    // Verify event log
    const log = exportEventLog(session);
    expect(log).toContain('18 kg');
    expect(log).toContain('DKA');
    expect(log).toContain('THREAT');
    
    // Simulate cardiac arrest during treatment (6 hours later)
    session = triggerCardiacArrest(session);
    expect(session.phase).toBe('CARDIAC_ARREST');
    
    // ROSC
    session = achieveROSC(session);
    expect(session.phase).toBe('ONGOING');
  });
});

// ─── Trauma Scenario ────────────────────────────────────────

describe('Trauma Scenario', () => {
  it('starts at X for trauma patients', () => {
    let session = createSession(70, '20 years', true);
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
    
    expect(session.currentLetter).toBe('X');
    const questions = getCurrentQuestions(session);
    expect(questions[0].id).toBe('catastrophic_hemorrhage');
  });

  it('detects catastrophic hemorrhage and provides TXA', () => {
    let session = createSession(70, '20 years', true);
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
    session = answerQuestion(session, 'catastrophic_hemorrhage', 'yes');
    
    const bleed = session.threats.find(t => t.id === 'catastrophic_bleed');
    expect(bleed).toBeDefined();
    expect(bleed!.severity).toBe('critical');
    
    const txa = bleed!.interventions.find(i => i.action.includes('TXA'));
    expect(txa).toBeDefined();
    const txaDose = calcDose(txa!.dose!, 70);
    expect(txaDose).toContain('1000'); // 15 * 70 = 1050, but max is 1000
    expect(txaDose).toContain('MAX DOSE');
  });
});

// ─── Anaphylaxis Scenario ───────────────────────────────────

describe('Anaphylaxis Scenario', () => {
  it('detects anaphylaxis from combined findings', () => {
    let session = createSession(25, '8 years');
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
    
    session = answerQuestion(session, 'airway_status', 'patent');
    session = answerQuestion(session, 'breathing_effort', 'labored');
    session = answerQuestion(session, 'breathing_sounds', 'wheezing');
    session = answerQuestion(session, 'spo2', 'low');
    session = returnToPrimarySurvey(session);
    
    session = answerQuestion(session, 'pulse_status', 'rapid');
    session = answerQuestion(session, 'perfusion', 'poor');
    session = answerQuestion(session, 'bleeding', 'no');
    session = returnToPrimarySurvey(session);
    
    session = answerQuestion(session, 'consciousness', 'alert');
    session = answerQuestion(session, 'glucose', 'normal');
    session = answerQuestion(session, 'pupils', 'normal');
    session = answerQuestion(session, 'seizure_activity', 'no');
    
    session = answerQuestion(session, 'temperature', 'normal');
    session = answerQuestion(session, 'rash', 'urticaria');
    session = answerQuestion(session, 'other_exposure', 'allergic');
    
    const anaph = session.threats.find(t => t.id === 'anaphylaxis');
    expect(anaph).toBeDefined();
    
    // Should suggest anaphylaxis diagnosis
    const suggestions = getSuggestedDiagnoses(session);
    expect(suggestions.some(s => s.diagnosis.includes('Anaphylaxis'))).toBe(true);
  });
});
