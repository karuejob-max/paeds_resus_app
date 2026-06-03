import {
  getAllPendingCritical,
  getPendingInterventions,
  type ABCDELetter,
  type Intervention,
  type Phase,
  type ResusSession,
  type Threat,
} from './abcdeEngine';
import {
  getFellowshipMicrocourseResusConditionLabel,
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
  resolveFellowshipDiagnosisFromSession,
} from '@shared/fellowship-microcourse-resus-conditions';

export const ABCDE_GROUP_ORDER: ABCDELetter[] = ['X', 'A', 'B', 'C', 'D', 'E'];

const LETTER_GROUP_LABEL: Record<ABCDELetter, string> = {
  X: 'Exsanguination',
  A: 'Airway',
  B: 'Breathing',
  C: 'Circulation',
  D: 'Disability / Drugs',
  E: 'Exposure',
};

export function abcdeLetterToGroupLabel(letter: ABCDELetter): string {
  return LETTER_GROUP_LABEL[letter];
}

/** Group unresolved threats by XABCDE letter for intervention tracker sections. */
export function groupActiveThreatsByLetter(threats: Threat[]): Array<{ letter: ABCDELetter; label: string; threats: Threat[] }> {
  const byLetter = new Map<ABCDELetter, Threat[]>();
  for (const threat of threats) {
    if (threat.resolved) continue;
    const list = byLetter.get(threat.letter) ?? [];
    list.push(threat);
    byLetter.set(threat.letter, list);
  }
  return ABCDE_GROUP_ORDER.filter((letter) => byLetter.has(letter)).map((letter) => ({
    letter,
    label: LETTER_GROUP_LABEL[letter],
    threats: byLetter.get(letter)!,
  }));
}

export function isActiveResusPhase(phase: Phase): boolean {
  return phase === 'PRIMARY_SURVEY' || phase === 'INTERVENTION' || phase === 'CARDIAC_ARREST';
}

export function isPostPrimaryPhase(phase: Phase): boolean {
  return phase === 'SECONDARY_SURVEY' || phase === 'DEFINITIVE_CARE' || phase === 'ONGOING';
}

/** Single-line phase guidance aligned with fellowship micro-course reassessment patterns. */
export function getResusPhaseGuidance(session: ResusSession): { headline: string; detail?: string } | null {
  switch (session.phase) {
    case 'QUICK_ASSESSMENT':
      return {
        headline: '3-second look: appearance, work of breathing, circulation to skin',
        detail: 'Sick → activate emergency response and ABCDE',
      };
    case 'PRIMARY_SURVEY':
      return {
        headline: `Complete ${session.currentLetter} — objective vitals and findings`,
        detail: session.currentLetter === 'C'
          ? 'After fluids or drugs: reassess perfusion before repeating bolus (shock micro-course)'
          : session.currentLetter === 'D'
            ? 'Check GCS and glucose if metabolic acidosis suspected (DKA / SE pathways)'
            : undefined,
      };
    case 'INTERVENTION': {
      const critical = getAllPendingCritical(session);
      if (critical.length > 0) {
        return {
          headline: `Now: ${critical[0].intervention.action}`,
          detail:
            critical.length > 1
              ? `${critical.length - 1} more critical action${critical.length > 2 ? 's' : ''} pending`
              : 'Log start → done, then re-check the patient',
        };
      }
      const pending = session.threats
        .filter((t) => !t.resolved)
        .flatMap((t) => getPendingInterventions(t));
      if (pending.length > 0) {
        return {
          headline: 'Finish or defer remaining interventions',
          detail: 'Return to primary survey when immediate threats are treated',
        };
      }
      return {
        headline: 'Interventions addressed — re-check patient before continuing',
        detail: 'Repeat ABCDE or set working diagnosis',
      };
    }
    case 'CARDIAC_ARREST':
      return {
        headline: 'Push hard & fast — rhythm check every 2 minutes',
        detail: 'Minimize interruptions; reassess perfusion after ROSC',
      };
    case 'SECONDARY_SURVEY':
    case 'DEFINITIVE_CARE':
    case 'ONGOING':
      if (!session.definitiveDiagnosis) {
        return {
          headline: 'Set primary diagnosis — it drives fellowship credit',
          detail: 'Co-diagnoses document complexity; primary maps to micro-course Pillar B',
        };
      }
      return {
        headline: 'Document, save for fellowship, export handoff',
        detail: 'Primary diagnosis already set — credit saves automatically when eligible',
      };
    default:
      return null;
  }
}

export type NextStepBannerKind = 'phase' | 'reassessment' | 'fellowship_primary' | 'fellowship_saved';

export interface PrimaryNextStepBanner {
  kind: NextStepBannerKind;
  message: string;
  detail?: string;
  interventionId?: string;
}

/** Consolidated next-step banner — one priority message, no competing alerts. */
export function getPrimaryNextStepBanner(
  session: ResusSession,
  options: {
    fellowshipSavedSessionId: string | null;
    pendingReassessmentInterventionId?: string | null;
  }
): PrimaryNextStepBanner | null {
  if (session.phase === 'IDLE' || session.phase === 'QUICK_ASSESSMENT') return null;

  const pendingReassessment = options.pendingReassessmentInterventionId
    ? findInterventionById(session, options.pendingReassessmentInterventionId)
    : findInterventionNeedingReassessment(session);

  if (pendingReassessment) {
    return {
      kind: 'reassessment',
      message: getReassessmentPromptForIntervention(pendingReassessment),
      detail: `After: ${pendingReassessment.action}`,
      interventionId: pendingReassessment.id,
    };
  }

  if (isPostPrimaryPhase(session.phase)) {
    const fellowshipId = resolveFellowshipDiagnosisFromSession(session);
    const isSaved = options.fellowshipSavedSessionId === session.id;

    if (isSaved && fellowshipId !== 'unknown') {
      const label = getFellowshipMicrocourseResusConditionLabel(fellowshipId);
      return {
        kind: 'fellowship_saved',
        message: `Saved for fellowship — ${label}`,
        detail: 'Export or start a new case when handoff is complete',
      };
    }

    if (!session.definitiveDiagnosis) {
      return {
        kind: 'fellowship_primary',
        message: 'Next step: set primary diagnosis for fellowship credit',
        detail: 'Primary drives Pillar B; co-diagnoses are optional',
      };
    }

    if (
      isFellowshipMicrocourseResusCondition(normalizeToFellowshipResusConditionId(session.definitiveDiagnosis)) &&
      !isSaved
    ) {
      return {
        kind: 'fellowship_primary',
        message: 'Tap Save for Fellowship credit when documentation is complete',
        detail: 'Auto-save runs when primary + clinical activity are logged',
      };
    }
  }

  const guidance = getResusPhaseGuidance(session);
  if (!guidance) return null;

  return {
    kind: 'phase',
    message: guidance.headline,
    detail: guidance.detail,
  };
}

function findInterventionById(session: ResusSession, id: string): Intervention | null {
  for (const threat of session.threats) {
    const hit = threat.interventions.find((i) => i.id === id);
    if (hit) return hit;
  }
  return null;
}

/** Completed intervention with reassessment checks but no logged reassessment yet. */
export function findInterventionNeedingReassessment(session: ResusSession): Intervention | null {
  for (const threat of session.threats) {
    for (const intervention of threat.interventions) {
      if (intervention.status !== 'completed') continue;
      if (!intervention.reassessmentChecks?.length) continue;
      if (!intervention.completedAt) continue;

      const hasReassessment = session.events.some(
        (e) =>
          e.type === 'reassessment' &&
          e.timestamp >= intervention.completedAt! &&
          (e.data?.interventionId === intervention.id || e.detail.includes(intervention.action))
      );
      if (!hasReassessment) return intervention;
    }
  }
  return null;
}

/** Short reassessment prompt aligned with DKA / SE / shock / ABCDE micro-course teaching. */
export function getReassessmentPromptForIntervention(intervention: Intervention): string {
  const action = intervention.action.toUpperCase();
  if (action.includes('BOLUS') || action.includes('FLUID')) {
    return 'Re-check patient: HR, BP, CRT, perfusion — before next bolus';
  }
  if (action.includes('INSULIN') || action.includes('DKA')) {
    return 'Re-check glucose and K+ before continuing insulin or fluids';
  }
  if (action.includes('BENZO') || action.includes('MIDAZOLAM') || action.includes('DIAZEPAM') || action.includes('SEIZURE')) {
    return 'Re-check GCS and seizure activity — repeat dose only if still seizing';
  }
  if (action.includes('ADRENALIN') || action.includes('EPINEPHRINE') || action.includes('VASOPRESS')) {
    return 'Re-check perfusion and BP after vasoactive support';
  }
  if (intervention.reassessmentChecks?.[0]?.question) {
    return intervention.reassessmentChecks[0].question;
  }
  return 'Re-check patient — vitals and clinical response';
}

export function countCompletedInterventions(threats: Threat[]): number {
  return threats.reduce(
    (sum, t) => sum + t.interventions.filter((i) => i.status === 'completed').length,
    0
  );
}

export function countTotalInterventions(threats: Threat[]): number {
  return threats.reduce((sum, t) => sum + t.interventions.length, 0);
}
