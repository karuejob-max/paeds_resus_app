import { describe, it, expect } from 'vitest';
import {
  abcdeLetterToGroupLabel,
  findInterventionNeedingReassessment,
  getPrimaryNextStepBanner,
  getReassessmentPromptForIntervention,
  getResusPhaseGuidance,
  groupActiveThreatsByLetter,
  isActiveResusPhase,
} from './resusGpsUxHelpers';
import {
  completeIntervention,
  createSession,
  startQuickAssessment,
  type Intervention,
  type ResusSession,
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

  it('shows fellowship primary banner on secondary survey without diagnosis', () => {
    const session = startQuickAssessment(createSession(12, '3y 0m 0w', false));
    session.phase = 'SECONDARY_SURVEY';
    const banner = getPrimaryNextStepBanner(session, { fellowshipSavedSessionId: null });
    expect(banner?.kind).toBe('fellowship_primary');
    expect(banner?.message).toMatch(/primary diagnosis/i);
  });

  it('detects active resus phases for compact chrome', () => {
    expect(isActiveResusPhase('INTERVENTION')).toBe(true);
    expect(isActiveResusPhase('SECONDARY_SURVEY')).toBe(false);
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
});
