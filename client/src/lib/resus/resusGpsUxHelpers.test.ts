import { describe, it, expect, vi } from 'vitest';
import {
  abcdeLetterToGroupLabel,
  deriveQuickAssessmentRecommendation,
  findInterventionNeedingReassessment,
  getPrimaryNextStepBanner,
  getReassessmentPromptForIntervention,
  getResusPhaseGuidance,
  scrollResusViewToTop,
  groupActiveThreatsByLetter,
  isActiveResusPhase,
  toggleQuickAssessmentCue,
  evaluateHeartRateForAge,
  evaluateGlucoseMmol,
  evaluateSpO2,
  formatVitalWithAgeContext,
  isVitalInputAbnormal,
  parsePatientAgeYears,
} from './resusGpsUxHelpers';
import {
  advanceSecondarySurveyStep,
  answerQuickAssessment,
  completeFluidReassessment,
  completeIntervention,
  createSession,
  startQuickAssessment,
  type Intervention,
  type ResusSession,
  getCurrentQuestions,
  answerPrimarySurvey,
  getForeignBodyAirwayGuidance,
  getAgeCategory,
  type Threat,
} from './abcdeEngine';

function sessionWithThreat(
  intervention: Partial<Intervention> & Pick<Intervention, 'id' | 'action'>,
  events: ResusSession['events'] = []
): ResusSession {
  const base = startQuickAssessment(createSession(20, '5y 0m 0w', false));
  const threat: Threat = {
    id: 'shock',
    letter: 'C',
    name: 'Shock',
    severity: 'critical',
    resolved: false,
    findings: [],
    interventions: [
      {
        id: intervention.id,
        action: intervention.action,
        status: intervention.status ?? 'completed',
        completedAt: intervention.completedAt ?? Date.now(),
        reassessmentChecks: intervention.reassessmentChecks,
      },
    ],
  };
  return {
    ...base,
    phase: 'INTERVENTION',
    threats: [threat],
    events,
  };
}

describe('resusGpsUxHelpers', () => {
  it('starts every new emergency at the explicit BLS assessment gate', () => {
    const session = startQuickAssessment(createSession(12, '2y 0m 0w', false));
    expect(session.phase).toBe('BLS_ASSESSMENT');
    expect(getResusPhaseGuidance(session)?.headline).toMatch(/BLS gate/i);
    expect(isActiveResusPhase(session.phase)).toBe(true);
  });

  it('routes suspected arrest directly to CPR-GPS and no-arrest cases to XABCDE', () => {
    const arrest = answerQuickAssessment(
      startQuickAssessment(createSession(8, '8m 0w 0d', false)),
      'cardiac_arrest'
    );
    expect(arrest.phase).toBe('CARDIAC_ARREST');
    expect(arrest.blsAssessment).toBe('cardiac_arrest');

    const nonArrest = answerQuickAssessment(
      startQuickAssessment(createSession(70, '20y 0m 0w', false)),
      'no_cardiac_arrest'
    );
    expect(nonArrest.phase).toBe('PRIMARY_SURVEY');
    expect(nonArrest.currentLetter).toBe('X');
    expect(nonArrest.blsAssessment).toBe('no_cardiac_arrest');
  });

  it('progresses non-trauma primary survey through X before airway', () => {
    let session = answerQuickAssessment(
      startQuickAssessment(createSession(15, '4y 0m 0w', false)),
      'no_cardiac_arrest'
    );
    const xQuestions = getCurrentQuestions(session);
    expect(xQuestions.length).toBeGreaterThan(0);
    for (const question of xQuestions) {
      const safeOption = question.options?.find((option) => option.severity === undefined);
      session = answerPrimarySurvey(session, question.id, safeOption?.value ?? 'no', question);
    }
    expect(session.currentLetter).toBe('A');
  });

  it('classifies days/weeks as neonatal and one month as infant', () => {
    expect(getAgeCategory('1 day')).toBe('neonate');
    expect(getAgeCategory('4 weeks')).toBe('neonate');
    expect(getAgeCategory('1 month')).toBe('infant');
    expect(getAgeCategory('30 years')).toBe('adult');
  });

  it('shows infant choking guidance for a 1-month-old', () => {
    const guidance = getForeignBodyAirwayGuidance('1 month');
    expect(guidance.population).toBe('infant');
    expect(guidance.title).toMatch(/5 back blows.*5 chest thrusts/i);
  });

  it('shows child/adult choking guidance for a 2-year-old and adult', () => {
    expect(getForeignBodyAirwayGuidance('2 years').title).toMatch(/5 back blows.*5 abdominal thrusts/i);
    expect(getForeignBodyAirwayGuidance('30 years').population).toBe('child_or_adult');
  });

  it('maps ABCDE letters to fellowship-style group labels', () => {
    expect(abcdeLetterToGroupLabel('A')).toBe('Airway');
    expect(abcdeLetterToGroupLabel('C')).toBe('Circulation');
    expect(abcdeLetterToGroupLabel('D')).toBe('Disability / Drugs');
  });

  it('groups active threats in XABCDE order', () => {
    const threats: Threat[] = [
      {
        id: 'b',
        letter: 'B',
        name: 'Hypoxia',
        severity: 'critical',
        resolved: false,
        findings: [],
        interventions: [],
      },
      {
        id: 'c',
        letter: 'C',
        name: 'Shock',
        severity: 'critical',
        resolved: false,
        findings: [],
        interventions: [],
      },
    ];
    const groups = groupActiveThreatsByLetter(threats);
    expect(groups.map((g) => g.letter)).toEqual(['B', 'C']);
    expect(groups[1].label).toBe('Circulation');
  });

  it('returns phase guidance for primary survey with reassessment hint on C', () => {
    const session = startQuickAssessment(createSession(15, '4y 0m 0w', false));
    session.phase = 'PRIMARY_SURVEY';
    session.currentLetter = 'C';
    const guidance = getResusPhaseGuidance(session);
    expect(guidance?.headline).toContain('C');
    expect(guidance?.detail).toMatch(/reassess perfusion/i);
  });

  it('prioritises reassessment nudge over phase guidance', () => {
    const session = sessionWithThreat({
      id: 'bolus-1',
      action: 'FLUID BOLUS 20 mL/kg',
      reassessmentChecks: [
        {
          id: 'r1',
          question: 'Signs of fluid overload?',
          type: 'complication',
          options: [{ label: 'No', value: 'no', action: 'continue' }],
        },
      ],
    });
    const banner = getPrimaryNextStepBanner(session, { fellowshipSavedSessionId: null });
    expect(banner?.kind).toBe('reassessment');
    expect(banner?.message).toMatch(/Re-check patient/i);
  });

  it('finds completed bolus needing reassessment when none logged', () => {
    const session = sessionWithThreat({
      id: 'bolus-2',
      action: 'FLUID BOLUS 20 mL/kg',
      reassessmentChecks: [
        {
          id: 'r1',
          question: 'Improved perfusion?',
          type: 'therapeutic_endpoint',
          options: [{ label: 'Yes', value: 'yes', action: 'resolved' }],
        },
      ],
    });
    expect(findInterventionNeedingReassessment(session)?.id).toBe('bolus-2');
  });

  it('clears reassessment need after reassessment event logged', () => {
    const completedAt = Date.now() - 5000;
    const session = sessionWithThreat(
      {
        id: 'bolus-3',
        action: 'FLUID BOLUS 20 mL/kg',
        completedAt,
        reassessmentChecks: [
          {
            id: 'r1',
            question: 'Improved perfusion?',
            type: 'therapeutic_endpoint',
            options: [{ label: 'Yes', value: 'yes', action: 'resolved' }],
          },
        ],
      },
      [
        {
          timestamp: completedAt + 1000,
          type: 'reassessment',
          detail: 'Reassessment (FLUID BOLUS 20 mL/kg): Improved perfusion? -> Yes',
          data: { interventionId: 'bolus-3' },
        },
      ]
    );
    expect(findInterventionNeedingReassessment(session)).toBeNull();
  });

  it('uses metabolic prompt for insulin interventions', () => {
    const prompt = getReassessmentPromptForIntervention({
      id: 'ins',
      action: 'Start INSULIN infusion',
      status: 'completed',
    });
    expect(prompt).toMatch(/glucose/i);
  });

  it('flags abnormal glucose during vital input', () => {
    expect(evaluateGlucoseMmol(28).abnormal).toBe(true);
    expect(isVitalInputAbnormal('glucose', 28, 10)).toBe(true);
    expect(isVitalInputAbnormal('glucose', 5.5, 10)).toBe(false);
  });

  it('flags hypoxia on SpO2 during input', () => {
    expect(evaluateSpO2(88).abnormal).toBe(true);
    expect(isVitalInputAbnormal('spo2', 88, null)).toBe(true);
  });

  it('shows phase guidance (not fellowship submit) on secondary survey without diagnosis', () => {
    const session = startQuickAssessment(createSession(12, '3y 0m 0w', false));
    session.phase = 'SECONDARY_SURVEY';
    const banner = getPrimaryNextStepBanner(session, { fellowshipSavedSessionId: null });
    expect(banner?.kind).toBe('phase');
    expect(banner?.message).toMatch(/SAMPLE|secondary survey/i);
    expect(banner?.kind).not.toBe('fellowship_primary');
  });

  it('detects active resus phases for compact chrome', () => {
    expect(isActiveResusPhase('INTERVENTION')).toBe(true);
    expect(isActiveResusPhase('SECONDARY_SURVEY')).toBe(false);
  });

  it('returns neutral quick assessment guidance with no cues selected', () => {
    const rec = deriveQuickAssessmentRecommendation(new Set());
    expect(rec.level).toBe('neutral');
    expect(rec.headline).toMatch(/tap anything abnormal/i);
    expect(rec.suggestedAnswer).toBeUndefined();
  });

  it('suggests sick when one concerning cue is selected', () => {
    const rec = deriveQuickAssessmentRecommendation(new Set(['b_grunting']));
    expect(rec.level).toBe('reassess');
    expect(rec.suggestedAnswer).toBe('sick');
  });

  it('suggests activate emergency when multiple concerning cues selected', () => {
    const rec = deriveQuickAssessmentRecommendation(new Set(['a_pale_gray', 'c_mottled']));
    expect(rec.level).toBe('sick');
    expect(rec.headline).toMatch(/looks sick/i);
    expect(rec.suggestedAnswer).toBe('sick');
  });

  it('toggles quick assessment cue selection', () => {
    let selected = new Set<string>();
    selected = toggleQuickAssessmentCue(selected, 'a_limp');
    expect(selected.has('a_limp')).toBe(true);
    selected = toggleQuickAssessmentCue(selected, 'a_limp');
    expect(selected.has('a_limp')).toBe(false);
  });

  it('returns BLS gate guidance aligned with the unified emergency flow', () => {
    const session = startQuickAssessment(createSession(10, '2y 0m 0w', false));
    const guidance = getResusPhaseGuidance(session);
    expect(guidance?.headline).toMatch(/BLS gate/i);
    expect(guidance?.detail).toMatch(/CPR-GPS.*XABCDE/i);
  });

  it('integrates with abcdeEngine completeIntervention lifecycle', () => {
    let session = startQuickAssessment(createSession(18, '6y 0m 0w', false));
    session.phase = 'INTERVENTION';
    session.threats = [
      {
        id: 'se',
        letter: 'D',
        name: 'Seizure',
        severity: 'critical',
        resolved: false,
        findings: [],
        interventions: [
          {
            id: 'benzo',
            action: 'MIDAZOLAM IV',
            status: 'pending',
            reassessmentChecks: [
              {
                id: 'gcs',
                question: 'Still seizing?',
                type: 'therapeutic_endpoint',
                options: [{ label: 'No', value: 'no', action: 'resolved' }],
              },
            ],
          },
        ],
      },
    ];
    session = completeIntervention(session, 'benzo');
    expect(findInterventionNeedingReassessment(session)?.action).toBe('MIDAZOLAM IV');
    expect(getReassessmentPromptForIntervention(session.threats[0].interventions[0])).toMatch(/GCS/i);
  });

  it('flags HR high for age 8y', () => {
    const result = evaluateHeartRateForAge(125, 8);
    expect(result.assessment).toBe('high');
    expect(result.displaySuffix).toContain('high for age');
  });

  it('shows expected range in vital context string', () => {
    const ctx = formatVitalWithAgeContext('rr', 35, 5);
    expect(ctx.abnormal).toBe(true);
    expect(ctx.context).toContain('high for age');
    expect(ctx.context).toContain('expected');
  });

  it('parsePatientAgeYears handles common formats', () => {
    expect(parsePatientAgeYears('5 years')).toBe(5);
    expect(parsePatientAgeYears('5y 0m 0w')).toBe(5);
    expect(parsePatientAgeYears('6 months')).toBeCloseTo(0.5, 1);
    expect(parsePatientAgeYears('1 day')).toBeCloseTo(1 / 365.25, 4);
    expect(parsePatientAgeYears('4 weeks')).toBeCloseTo(4 / 52, 2);
  });

  it('does not show fellowship submit banner during secondary survey SAMPLE step', () => {
    const session: ResusSession = {
      ...startQuickAssessment(createSession(20, '8y 0m 0w', false)),
      phase: 'SECONDARY_SURVEY',
      secondarySurveyStep: 'sample',
      definitiveDiagnosis: null,
      activeThreat: { id: 'hyperglycaemia', letter: 'E', name: 'Hyperglycaemia', severity: 'critical', resolved: false, findings: [], interventions: [] },
    };
    const banner = getPrimaryNextStepBanner(session, { fellowshipSavedSessionId: null });
    expect(banner?.kind).not.toBe('fellowship_primary');
    expect(banner?.kind).not.toBe('fellowship_saved');
    expect(banner?.message).toMatch(/secondary survey|SAMPLE|diagnostic/i);
  });

  it('shows fellowship save banner only after definitive care complete', () => {
    const session: ResusSession = {
      ...startQuickAssessment(createSession(20, '8y 0m 0w', false)),
      phase: 'ONGOING',
      definitiveDiagnosis: 'dka',
      definitiveCareProgress: { completedAt: Date.now(), steps: {} },
      rigorConditionCandidates: ['dka'],
    };
    const banner = getPrimaryNextStepBanner(session, { fellowshipSavedSessionId: null });
    expect(banner?.kind).toBe('fellowship_primary');
    expect(banner?.message).toMatch(/Save for Fellowship/i);
  });

  it('scrollResusViewToTop scrolls window to origin', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('window', { scrollTo });
    scrollResusViewToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    vi.unstubAllGlobals();
  });

  it('advanceSecondarySurveyStep autofills glucose from vitals', () => {
    let session = startQuickAssessment(createSession(20, '8y 0m 0w', false));
    session.phase = 'SECONDARY_SURVEY';
    session.secondarySurveyStep = 'sample';
    session.rigorConditionCandidates = ['dka'];
    session.vitalSigns = { ...session.vitalSigns, glucose: 22 };
    session = advanceSecondarySurveyStep(session);
    expect(session.secondarySurveyStep).toBe('evidence');
    expect(session.diagnosticEvidence?.dka_ev_glucose).toEqual({ status: 'value', value: '22' });
  });

  it('completeFluidReassessment clears pending fluid banner flag', () => {
    let session = startQuickAssessment(createSession(20, '8y 0m 0w', false));
    session.pendingFluidReassessment = true;
    session = completeFluidReassessment(session);
    expect(session.pendingFluidReassessment).toBe(false);
  });
});
