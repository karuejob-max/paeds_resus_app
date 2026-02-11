/**
 * ABCDE Engine v3 — Comprehensive Tests
 * 
 * Tests cover:
 * 1. Session creation (RL default, NS for neonates)
 * 2. Age category detection
 * 3. Quick Assessment flow
 * 4. AVPU at Airway (A) with age-appropriate interventions
 * 5. Choking pathway (effective/ineffective, infant vs child)
 * 6. Objective perfusion derivation (CRT + skin temp + pulse)
 * 7. Ringer's Lactate default fluid
 * 8. Fluid tracker (bolus count, mL/kg, fluid-refractory)
 * 9. Consistent 10 mL/kg dosing
 * 10. Drug name on every dose
 * 11. Heart failure → cautious bolusing
 * 12. Metabolic acidosis differentials (not DKA tunnel vision)
 * 13. Safety rules
 * 14. Mid-case patient info update
 * 15. Intervention lifecycle (pending → in_progress → completed)
 * 16. Reassessment checks on bolus interventions
 * 17. Cardiac arrest flow
 * 18. SAMPLE history
 * 19. Clinical record export
 * 20. Full sepsis scenario end-to-end
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
  exportClinicalRecord,
  updatePatientInfo,
  acknowledgeSafetyAlert,
  setDefinitiveDiagnosis,
  updateSAMPLE,
  primarySurveyQuestions,
  derivePerfusionState,
  getAgeCategory,
  type ResusSession,
  type AssessmentQuestion,
} from '@/lib/resus/abcdeEngine';

// ─── Helper: answer a question by ID ────────────────────────

function answer(session: ResusSession, questionId: string, value: string, numVal?: number, numVal2?: number): ResusSession {
  const allQuestions = Object.values(primarySurveyQuestions).flat();
  const q = allQuestions.find(q => q.id === questionId);
  if (!q) throw new Error(`Question not found: ${questionId}`);
  return answerPrimarySurvey(session, questionId, value, q, numVal, numVal2);
}

// ─── Helper: answer all questions for a letter with normal defaults ───

function answerLetterNormal(session: ResusSession, letter: string): ResusSession {
  const questions = primarySurveyQuestions[letter as keyof typeof primarySurveyQuestions];
  if (!questions) return session;
  let s = session;
  for (const q of questions) {
    if (getAnsweredQuestionIds(s).includes(q.id)) continue;
    if (q.inputType === 'select') {
      // Pick the first option with no severity or lowest severity
      const normalOpt = q.options?.find(o => !o.severity || o.severity === 'monitor') || q.options?.[0];
      if (normalOpt) s = answer(s, q.id, normalOpt.value);
    } else if (q.inputType === 'number' && q.numberConfig) {
      const normalVals: Record<string, number> = {
        heart_rate: 100, respiratory_rate: 20, spo2: 98, temperature: 37,
        glucose: 5.5, crt: 1, lactate: 1.0,
      };
      s = answer(s, q.id, '', normalVals[q.id] ?? (q.numberConfig.min + 1));
    } else if (q.inputType === 'number_pair' && q.numberPairConfig) {
      s = answer(s, q.id, '', 110, 70);
    }
  }
  return s;
}

// ─── Helper: get through A and B with normal findings ───────

function getToLetterC(weight = 18, age = '5 years'): ResusSession {
  let s = createSession(weight, age);
  s = startQuickAssessment(s);
  s = answerQuickAssessment(s, 'sick');
  s = answerLetterNormal(s, 'A');
  // If any urgent threats at A, handle them
  if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
  s = answerLetterNormal(s, 'B');
  if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
  return s;
}

// ═══════════════════════════════════════════════════════════════
// 1. Session Creation
// ═══════════════════════════════════════════════════════════════

describe('Session Creation', () => {
  it('creates a session in IDLE phase', () => {
    const s = createSession(18, '5 years');
    expect(s.phase).toBe('IDLE');
    expect(s.patientWeight).toBe(18);
    expect(s.patientAge).toBe('5 years');
    expect(s.fluidTracker.bolusCount).toBe(0);
    expect(s.fluidTracker.totalVolumeMl).toBe(0);
    expect(s.fluidTracker.isFluidRefractory).toBe(false);
  });

  it('defaults to Ringer\'s Lactate for children', () => {
    const s = createSession(18, '5 years');
    expect(s.fluidTracker.fluidType).toContain("Ringer");
  });

  it('defaults to Normal Saline for neonates', () => {
    const s = createSession(3.5, '2 days');
    expect(s.fluidTracker.fluidType).toContain('Normal Saline');
  });

  it('creates a trauma session starting at X', () => {
    const s = createSession(18, '5 years', true);
    expect(s.isTrauma).toBe(true);
    expect(s.currentLetter).toBe('X');
  });

  it('creates a session without weight or age', () => {
    const s = createSession();
    expect(s.patientWeight).toBeNull();
    expect(s.patientAge).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Age Category Detection
// ═══════════════════════════════════════════════════════════════

describe('Age Category Detection', () => {
  it('detects neonate from days', () => {
    expect(getAgeCategory('2 days')).toBe('neonate');
    expect(getAgeCategory('14 days')).toBe('neonate');
  });

  it('detects neonate from weeks', () => {
    expect(getAgeCategory('2 weeks')).toBe('neonate');
    expect(getAgeCategory('3 wk')).toBe('neonate');
  });

  it('detects infant from months', () => {
    expect(getAgeCategory('3 months')).toBe('infant');
    expect(getAgeCategory('11 mo')).toBe('infant');
  });

  it('detects child from years', () => {
    expect(getAgeCategory('5 years')).toBe('child');
    expect(getAgeCategory('10 yr')).toBe('child');
  });

  it('detects adolescent', () => {
    expect(getAgeCategory('14 years')).toBe('adolescent');
    expect(getAgeCategory('17 yr')).toBe('adolescent');
  });

  it('defaults to child when no age', () => {
    expect(getAgeCategory(null)).toBe('child');
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Quick Assessment Flow
// ═══════════════════════════════════════════════════════════════

describe('Quick Assessment Flow', () => {
  it('transitions IDLE → QUICK_ASSESSMENT → PRIMARY_SURVEY', () => {
    let s = createSession(18, '5 years');
    expect(s.phase).toBe('IDLE');
    s = startQuickAssessment(s);
    expect(s.phase).toBe('QUICK_ASSESSMENT');
    s = answerQuickAssessment(s, 'sick');
    expect(s.phase).toBe('PRIMARY_SURVEY');
    expect(s.quickAssessment).toBe('sick');
    expect(s.currentLetter).toBe('A');
  });

  it('starts at X for trauma', () => {
    let s = createSession(18, '5 years', true);
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    expect(s.currentLetter).toBe('X');
  });

  it('not_sick also starts PRIMARY_SURVEY at A', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'not_sick');
    expect(s.phase).toBe('PRIMARY_SURVEY');
    expect(s.currentLetter).toBe('A');
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. AVPU at Airway (A)
// ═══════════════════════════════════════════════════════════════

describe('AVPU at Airway (A)', () => {
  let session: ResusSession;

  beforeEach(() => {
    session = createSession(18, '5 years');
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
  });

  it('AVPU is the first question at A', () => {
    const questions = getCurrentQuestions(session);
    expect(questions[0].id).toBe('avpu');
    expect(questions[0].letter).toBe('A');
  });

  it('AVPU = Unresponsive triggers critical airway threat with OPA', () => {
    const s = answer(session, 'avpu', 'unresponsive');
    expect(s.phase).toBe('INTERVENTION');
    const threats = getActiveThreats(s);
    const airwayThreat = threats.find(t => t.id === 'unresponsive_airway');
    expect(airwayThreat).toBeDefined();
    expect(airwayThreat!.severity).toBe('critical');
    const opaIntervention = airwayThreat!.interventions.find(i => i.action.includes('OPA'));
    expect(opaIntervention).toBeDefined();
  });

  it('AVPU = Pain triggers urgent airway threat with NPA after all A questions', () => {
    let s = answer(session, 'avpu', 'pain');
    s = answer(s, 'airway_status', 'patent');
    s = answer(s, 'choking', 'no');
    s = answer(s, 'airway_sounds', 'clear');
    expect(s.phase).toBe('INTERVENTION');
    const threats = getActiveThreats(s);
    const airwayThreat = threats.find(t => t.id === 'pain_responsive_airway');
    expect(airwayThreat).toBeDefined();
  });

  it('AVPU = Alert does not trigger airway threat', () => {
    let s = answer(session, 'avpu', 'alert');
    s = answer(s, 'airway_status', 'patent');
    s = answer(s, 'choking', 'no');
    s = answer(s, 'airway_sounds', 'clear');
    const threats = getActiveThreats(s);
    expect(threats.find(t => t.id === 'unresponsive_airway')).toBeUndefined();
    expect(threats.find(t => t.id === 'pain_responsive_airway')).toBeUndefined();
  });

  it('infant gets NEUTRAL position, child gets SNIFFING position', () => {
    // Infant
    let infantS = createSession(6, '6 months');
    infantS = startQuickAssessment(infantS);
    infantS = answerQuickAssessment(infantS, 'sick');
    infantS = answer(infantS, 'avpu', 'unresponsive');
    const infantThreat = getActiveThreats(infantS).find(t => t.id === 'unresponsive_airway');
    expect(infantThreat!.interventions[0].action).toContain('NEUTRAL');

    // Child
    let childS = createSession(18, '5 years');
    childS = startQuickAssessment(childS);
    childS = answerQuickAssessment(childS, 'sick');
    childS = answer(childS, 'avpu', 'unresponsive');
    const childThreat = getActiveThreats(childS).find(t => t.id === 'unresponsive_airway');
    expect(childThreat!.interventions[0].action).toContain('SNIFFING');
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. Choking Pathway
// ═══════════════════════════════════════════════════════════════

describe('Choking Pathway', () => {
  let session: ResusSession;

  beforeEach(() => {
    session = createSession(18, '5 years');
    session = startQuickAssessment(session);
    session = answerQuickAssessment(session, 'sick');
    session = answer(session, 'avpu', 'alert');
    session = answer(session, 'airway_status', 'patent');
  });

  it('ineffective cough triggers critical choking with abdominal thrusts for child', () => {
    const s = answer(session, 'choking', 'ineffective_cough');
    expect(s.phase).toBe('INTERVENTION');
    const choking = getActiveThreats(s).find(t => t.id === 'choking_ineffective');
    expect(choking).toBeDefined();
    expect(choking!.severity).toBe('critical');
    const heimlich = choking!.interventions.find(i => i.action.includes('ABDOMINAL'));
    expect(heimlich).toBeDefined();
  });

  it('infant gets chest thrusts instead of abdominal thrusts', () => {
    let infantS = createSession(6, '6 months');
    infantS = startQuickAssessment(infantS);
    infantS = answerQuickAssessment(infantS, 'sick');
    infantS = answer(infantS, 'avpu', 'alert');
    infantS = answer(infantS, 'airway_status', 'patent');
    infantS = answer(infantS, 'choking', 'ineffective_cough');
    const choking = getActiveThreats(infantS).find(t => t.id === 'choking_ineffective');
    const chestThrusts = choking!.interventions.find(i => i.action.includes('CHEST THRUSTS'));
    expect(chestThrusts).toBeDefined();
    const abdominal = choking!.interventions.find(i => i.action.includes('ABDOMINAL'));
    expect(abdominal).toBeUndefined();
  });

  it('effective cough triggers monitoring, not physical intervention', () => {
    let s = answer(session, 'choking', 'effective_cough');
    s = answer(s, 'airway_sounds', 'clear');
    const choking = getActiveThreats(s).find(t => t.id === 'choking_effective');
    expect(choking).toBeDefined();
    expect(choking!.severity).toBe('urgent');
    const encourage = choking!.interventions.find(i => i.action.includes('ENCOURAGE'));
    expect(encourage).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. Objective Perfusion Derivation
// ═══════════════════════════════════════════════════════════════

describe('Objective Perfusion Derivation', () => {
  it('derives cold shock from CRT > 2 + cold skin', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    // CRT > 4 + cold + weak = severe_cold_shock
    expect(s.derivedPerfusion).toBe('severe_cold_shock');
  });

  it('derives warm shock from CRT ≤ 2 + warm/flushed + bounding', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'bounding');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 1);
    s = answer(s, 'skin_temperature', 'warm_flushed');
    expect(s.derivedPerfusion).toBe('warm_shock');
  });

  it('derives normal perfusion from CRT ≤ 2 + warm skin + strong pulse', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'strong');
    s = answer(s, 'heart_rate', '', 100);
    s = answer(s, 'crt', '', 1);
    s = answer(s, 'skin_temperature', 'warm');
    expect(s.derivedPerfusion).toBe('normal');
  });

  it('returns null if CRT not yet measured', () => {
    const s = getToLetterC();
    expect(derivePerfusionState(s)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. Ringer's Lactate Default Fluid
// ═══════════════════════════════════════════════════════════════

describe("Ringer's Lactate Default Fluid", () => {
  it("uses Ringer's Lactate for children in shock", () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    const threats = getActiveThreats(s);
    const shockThreat = threats.find(t => t.interventions.some(i => i.action.includes('BOLUS')));
    const bolus = shockThreat?.interventions.find(i => i.action.includes('BOLUS'));
    expect(bolus?.action).toContain("Ringer");
  });

  it('uses Normal Saline for neonates in shock', () => {
    let s = createSession(3.5, '2 days');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerLetterNormal(s, 'A');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answerLetterNormal(s, 'B');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 180);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    const threats = getActiveThreats(s);
    const shockThreat = threats.find(t => t.interventions.some(i => i.action.includes('BOLUS')));
    const bolus = shockThreat?.interventions.find(i => i.action.includes('BOLUS'));
    expect(bolus?.action).toContain('Normal Saline');
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. Fluid Tracker
// ═══════════════════════════════════════════════════════════════

describe('Fluid Tracker', () => {
  it('tracks bolus count and total volume on completeIntervention', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    const threats = getActiveThreats(s);
    const shockThreat = threats.find(t => t.interventions.some(i => i.action.includes('BOLUS')));
    const bolus = shockThreat?.interventions.find(i => i.action.includes('BOLUS'));
    if (bolus) {
      s = completeIntervention(s, bolus.id);
      expect(s.fluidTracker.bolusCount).toBe(1);
      expect(s.fluidTracker.totalVolumeMl).toBe(180); // 10 mL/kg * 18 kg
      expect(s.fluidTracker.totalVolumePerKg).toBe(10);
      expect(s.fluidTracker.isFluidRefractory).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. Consistent 10 mL/kg Dosing
// ═══════════════════════════════════════════════════════════════

describe('Consistent 10 mL/kg Dosing', () => {
  it('all bolus interventions use 10 mL/kg (not 20)', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    const threats = getActiveThreats(s);
    for (const threat of threats) {
      for (const intervention of threat.interventions) {
        if (intervention.dose && intervention.action.includes('BOLUS') && !intervention.action.includes('CAUTIOUS')) {
          expect(intervention.dose.dosePerKg).toBe(10);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. Drug Name on Every Dose
// ═══════════════════════════════════════════════════════════════

describe('Drug Name on Every Dose', () => {
  it('every intervention with a dose has a non-empty drug name', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answer(s, 'avpu', 'unresponsive');
    const threats = getActiveThreats(s);
    for (const threat of threats) {
      for (const intervention of threat.interventions) {
        if (intervention.dose) {
          expect(intervention.dose.drug).toBeTruthy();
          expect(intervention.dose.drug.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. Metabolic Acidosis Differentials
// ═══════════════════════════════════════════════════════════════

describe('Metabolic Acidosis Differentials', () => {
  it('deep labored breathing triggers metabolic acidosis, not just DKA', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerLetterNormal(s, 'A');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'breathing_effort', 'deep_labored');
    const threats = getActiveThreats(s);
    const metAcidosis = threats.find(t => t.id === 'metabolic_acidosis_breathing');
    expect(metAcidosis).toBeDefined();
    expect(metAcidosis!.name).toContain('Metabolic Acidosis');
    const diffDx = metAcidosis!.interventions.find(i => i.action.includes('Differential'));
    expect(diffDx).toBeDefined();
    expect(diffDx!.detail).toContain('DKA');
    expect(diffDx!.detail).toContain('Sepsis');
    expect(diffDx!.detail).toContain('Renal failure');
    expect(diffDx!.detail).toContain('Poisoning');
  });

  it('hyperglycemia + deep labored breathing suggests possible DKA with differentials', () => {
    let s = getToLetterC();
    s = answerLetterNormal(s, 'C');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'gcs_motor', '6');
    s = answer(s, 'glucose', '', 25);
    const diagnoses = getSuggestedDiagnoses(s);
    // Should have a DKA-related suggestion
    const dkaRelated = diagnoses.find(d => d.diagnosis.includes('DKA') || d.diagnosis.includes('Hyperglycemia'));
    expect(dkaRelated).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. Safety Rules
// ═══════════════════════════════════════════════════════════════

describe('Safety Rules', () => {
  it('excessive boluses alert fires at 3+ boluses', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    // Simulate 2 prior boluses
    s.bolusCount = 2;
    const threats = getActiveThreats(s);
    const shockThreat = threats.find(t => t.interventions.some(i => i.action.includes('BOLUS')));
    const bolus = shockThreat?.interventions.find(i => i.action.includes('BOLUS'));
    if (bolus) {
      s = completeIntervention(s, bolus.id);
      expect(s.bolusCount).toBe(3);
      const alert = s.safetyAlerts.find(a => a.id === 'excessive_boluses');
      expect(alert).toBeDefined();
      expect(alert!.message).toContain('3+');
    }
  });

  it('acknowledges safety alerts', () => {
    let s = createSession(18, '5 years');
    s.safetyAlerts.push({
      id: 'test_alert', message: 'Test', severity: 'warning',
      timestamp: Date.now(), acknowledged: false,
    });
    s = acknowledgeSafetyAlert(s, 'test_alert');
    expect(s.safetyAlerts.find(a => a.id === 'test_alert')!.acknowledged).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 13. Mid-Case Patient Info Update
// ═══════════════════════════════════════════════════════════════

describe('Mid-Case Patient Info Update', () => {
  it('updates weight and recalculates fluid tracker', () => {
    let s = createSession(null, null);
    s.fluidTracker.totalVolumeMl = 200;
    s = updatePatientInfo(s, 20, '5 years');
    expect(s.patientWeight).toBe(20);
    expect(s.patientAge).toBe('5 years');
    expect(s.fluidTracker.totalVolumePerKg).toBe(10);
  });

  it('updates fluid type when age changes to neonate', () => {
    let s = createSession(18, '5 years');
    expect(s.fluidTracker.fluidType).toContain("Ringer");
    s = updatePatientInfo(s, 3.5, '2 days');
    expect(s.fluidTracker.fluidType).toContain('Normal Saline');
  });

  it('logs the update event', () => {
    let s = createSession(18, '5 years');
    const eventsBefore = s.events.length;
    s = updatePatientInfo(s, 20, '6 years');
    expect(s.events.length).toBeGreaterThan(eventsBefore);
    expect(s.events[s.events.length - 1].type).toBe('patient_info_updated');
  });
});

// ═══════════════════════════════════════════════════════════════
// 14. Intervention Lifecycle
// ═══════════════════════════════════════════════════════════════

describe('Intervention Lifecycle', () => {
  it('tracks pending → in_progress → completed status', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answer(s, 'avpu', 'unresponsive');
    const threats = getActiveThreats(s);
    const intervention = threats[0].interventions[0];
    expect(intervention.status).toBe('pending');
    s = startIntervention(s, intervention.id);
    expect(getActiveThreats(s)[0].interventions[0].status).toBe('in_progress');
    s = completeIntervention(s, intervention.id);
    expect(getActiveThreats(s)[0].interventions[0].status).toBe('completed');
  });
});

// ═══════════════════════════════════════════════════════════════
// 15. Reassessment Checks on Bolus Interventions
// ═══════════════════════════════════════════════════════════════

describe('Reassessment Checks on Bolus Interventions', () => {
  it('bolus interventions have reassessment checks with complications and endpoints', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 5);
    s = answer(s, 'skin_temperature', 'cold');
    const threats = getActiveThreats(s);
    const shockThreat = threats.find(t => t.interventions.some(i => i.action.includes('BOLUS')));
    const bolus = shockThreat?.interventions.find(i => i.action.includes('BOLUS'));
    expect(bolus?.reassessmentChecks).toBeDefined();
    expect(bolus!.reassessmentChecks!.length).toBeGreaterThanOrEqual(2);
    const complication = bolus!.reassessmentChecks!.find(c => c.type === 'complication');
    expect(complication).toBeDefined();
    const endpoint = bolus!.reassessmentChecks!.find(c => c.type === 'therapeutic_endpoint');
    expect(endpoint).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 16. Cardiac Arrest Flow
// ═══════════════════════════════════════════════════════════════

describe('Cardiac Arrest Flow', () => {
  it('triggers cardiac arrest with CPR + Epinephrine', () => {
    let s = createSession(18, '5 years');
    s = triggerCardiacArrest(s);
    expect(s.phase).toBe('CARDIAC_ARREST');
    const arrest = getActiveThreats(s).find(t => t.id === 'cardiac_arrest');
    expect(arrest).toBeDefined();
    expect(arrest!.interventions.find(i => i.action.includes('CPR'))).toBeDefined();
    expect(arrest!.interventions.find(i => i.action.includes('EPINEPHRINE'))).toBeDefined();
  });

  it('ROSC transitions to ONGOING', () => {
    let s = createSession(18, '5 years');
    s = triggerCardiacArrest(s);
    s = achieveROSC(s);
    expect(s.phase).toBe('ONGOING');
  });
});

// ═══════════════════════════════════════════════════════════════
// 17. SAMPLE History
// ═══════════════════════════════════════════════════════════════

describe('SAMPLE History', () => {
  it('updates SAMPLE fields', () => {
    let s = createSession(18, '5 years');
    s = updateSAMPLE(s, 'signs', 'Fever for 3 days, vomiting');
    s = updateSAMPLE(s, 'allergies', 'Penicillin');
    s = updateSAMPLE(s, 'medications', 'None');
    expect(s.sampleHistory.signs).toBe('Fever for 3 days, vomiting');
    expect(s.sampleHistory.allergies).toBe('Penicillin');
    expect(s.sampleHistory.medications).toBe('None');
  });
});

// ═══════════════════════════════════════════════════════════════
// 18. Definitive Diagnosis
// ═══════════════════════════════════════════════════════════════

describe('Definitive Diagnosis', () => {
  it('sets diagnosis and transitions to DEFINITIVE_CARE', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = setDefinitiveDiagnosis(s, 'Septic Shock');
    expect(s.phase).toBe('DEFINITIVE_CARE');
    expect(s.definitiveDiagnosis).toBe('Septic Shock');
  });
});

// ═══════════════════════════════════════════════════════════════
// 19. Clinical Record Export
// ═══════════════════════════════════════════════════════════════

describe('Clinical Record Export', () => {
  it('exports a comprehensive clinical record', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answer(s, 'avpu', 'alert');
    const record = exportClinicalRecord(s);
    expect(record).toContain('ResusGPS');
    expect(record).toContain('Weight: 18 kg');
    expect(record).toContain('Age: 5 years');
    expect(record).toContain('FINDINGS');
    expect(record).toContain('EVENT LOG');
  });

  it('includes fluid tracker in export when boluses given', () => {
    let s = createSession(18, '5 years');
    s.fluidTracker.bolusCount = 2;
    s.fluidTracker.totalVolumeMl = 360;
    s.fluidTracker.totalVolumePerKg = 20;
    s.fluidTracker.fluidType = "Ringer's Lactate";
    const record = exportClinicalRecord(s);
    expect(record).toContain('FLUID RESUSCITATION');
    expect(record).toContain('Boluses given: 2');
    expect(record).toContain("Ringer's Lactate");
  });
});

// ═══════════════════════════════════════════════════════════════
// 20. Full Sepsis Scenario — End to End
// ═══════════════════════════════════════════════════════════════

describe('Full Sepsis Scenario — End to End', () => {
  it('walks through a complete warm shock sepsis presentation', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');

    // A: Voice responsive, patent airway
    s = answer(s, 'avpu', 'voice');
    s = answer(s, 'airway_status', 'patent');
    s = answer(s, 'choking', 'no');
    s = answer(s, 'airway_sounds', 'clear');
    // Voice is urgent → after all A answered → INTERVENTION
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);

    // B: Labored breathing, tachypnea, mild hypoxia
    s = answer(s, 'breathing_effort', 'labored');
    s = answer(s, 'respiratory_rate', '', 42);
    s = answer(s, 'spo2', '', 92);
    s = answer(s, 'breathing_sounds', 'clear');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);

    // C: Warm shock — bounding pulse, CRT 1, warm flushed
    s = answer(s, 'pulse_quality', 'bounding');
    s = answer(s, 'heart_rate', '', 160);
    s = answer(s, 'crt', '', 1);
    s = answer(s, 'skin_temperature', 'warm_flushed');
    expect(s.derivedPerfusion).toBe('warm_shock');

    s = answer(s, 'blood_pressure', '', 85, 40);
    s = answer(s, 'heart_sounds', 'normal');
    s = answer(s, 'bleeding', 'no');
    s = answer(s, 'heart_failure_signs', 'none');

    // Should detect warm shock
    const warmShock = getActiveThreats(s).find(t => t.id === 'warm_shock');
    expect(warmShock).toBeDefined();
    const bolus = warmShock?.interventions.find(i => i.action.includes('BOLUS'));
    expect(bolus?.action).toContain("Ringer");
    expect(bolus?.dose?.dosePerKg).toBe(10);

    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);

    // D: GCS motor 5, normal glucose, normal pupils, no seizure, elevated lactate
    s = answer(s, 'gcs_motor', '5');
    s = answer(s, 'glucose', '', 5.5);
    s = answer(s, 'pupils', 'normal');
    s = answer(s, 'seizure_activity', 'no');
    s = answer(s, 'lactate', '', 4.5);

    const lactateThreat = getActiveThreats(s).find(t => t.id === 'elevated_lactate');
    expect(lactateThreat).toBeDefined();

    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);

    // E: Fever, petechiae
    s = answer(s, 'temperature', '', 39.5);
    s = answer(s, 'rash', 'petechiae');
    s = answer(s, 'other_exposure', 'none');

    const feverThreat = getActiveThreats(s).find(t => t.id === 'fever_infection');
    expect(feverThreat).toBeDefined();

    // Should suggest sepsis
    const diagnoses = getSuggestedDiagnoses(s);
    const sepsis = diagnoses.find(d => d.diagnosis.includes('Sepsis'));
    expect(sepsis).toBeDefined();
    expect(sepsis!.confidence).toBe('high');
  });
});

// ═══════════════════════════════════════════════════════════════
// 21. Objective Vital Signs Storage
// ═══════════════════════════════════════════════════════════════

describe('Objective Vital Signs Storage', () => {
  it('stores HR, RR, SpO2 as numbers', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerLetterNormal(s, 'A');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'breathing_effort', 'normal');
    s = answer(s, 'respiratory_rate', '', 25);
    s = answer(s, 'spo2', '', 96);
    expect(s.vitalSigns.rr).toBe(25);
    expect(s.vitalSigns.spo2).toBe(96);
  });

  it('stores glucose and auto-calculates mg/dL', () => {
    let s = getToLetterC();
    s = answerLetterNormal(s, 'C');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'gcs_motor', '6');
    s = answer(s, 'glucose', '', 5.5);
    expect(s.vitalSigns.glucose).toBe(5.5);
    expect(s.vitalSigns.glucoseMgDl).toBe(99);
  });

  it('stores BP as systolic and diastolic', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'strong');
    s = answer(s, 'heart_rate', '', 100);
    s = answer(s, 'crt', '', 1);
    s = answer(s, 'skin_temperature', 'warm');
    s = answer(s, 'blood_pressure', '', 100, 60);
    expect(s.vitalSigns.sbp).toBe(100);
    expect(s.vitalSigns.dbp).toBe(60);
  });
});

// ═══════════════════════════════════════════════════════════════
// 22. Threat Detection from Objective Values
// ═══════════════════════════════════════════════════════════════

describe('Threat Detection from Objective Values', () => {
  it('detects hypoxia from SpO2 < 90', () => {
    let s = createSession(18, '5 years');
    s = startQuickAssessment(s);
    s = answerQuickAssessment(s, 'sick');
    s = answerLetterNormal(s, 'A');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'breathing_effort', 'labored');
    s = answer(s, 'respiratory_rate', '', 30);
    s = answer(s, 'spo2', '', 84);
    expect(s.phase).toBe('INTERVENTION');
    const hypoxia = s.threats.find(t => t.id === 'hypoxia');
    expect(hypoxia).toBeDefined();
    expect(hypoxia!.severity).toBe('critical');
  });

  it('detects hypoglycemia from glucose < 3.5', () => {
    let s = getToLetterC();
    s = answerLetterNormal(s, 'C');
    if (s.phase === 'INTERVENTION') s = returnToPrimarySurvey(s);
    s = answer(s, 'gcs_motor', '6');
    s = answer(s, 'glucose', '', 2.0);
    expect(s.phase).toBe('INTERVENTION');
    const hypo = s.threats.find(t => t.id === 'hypoglycemia');
    expect(hypo).toBeDefined();
    expect(s.vitalSigns.glucose).toBe(2.0);
  });

  it('detects severe bradycardia from objective HR', () => {
    let s = getToLetterC();
    s = answer(s, 'pulse_quality', 'weak');
    s = answer(s, 'heart_rate', '', 40);
    const brady = s.threats.find(t => t.id === 'severe_bradycardia');
    expect(brady).toBeDefined();
    expect(brady!.severity).toBe('critical');
  });
});
