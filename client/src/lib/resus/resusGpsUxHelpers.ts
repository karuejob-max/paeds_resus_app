import { getVitalSignRanges } from '@/lib/clinicalCalculations';
import {
  getAllPendingCritical,
  getPendingInterventions,
  type ABCDELetter,
  type Intervention,
  type Phase,
  type ResusSession,
  type Threat,
} from './abcdeEngine';

export type VitalAssessment = 'low' | 'normal' | 'high';

export interface VitalAgeEvaluation {
  assessment: VitalAssessment;
  rangeLabel: string;
  displaySuffix: string;
}

/** Parse patient age string to approximate years for vital sign bands. */
export function parsePatientAgeYears(ageStr: string | null | undefined): number | null {
  if (!ageStr?.trim()) return null;
  const s = ageStr.trim().toLowerCase();
  const yMatch = s.match(/(\d+(?:\.\d+)?)\s*y/);
  if (yMatch) return parseFloat(yMatch[1]);
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*m/);
  if (mMatch) return parseFloat(mMatch[1]) / 12;
  const wMatch = s.match(/(\d+(?:\.\d+)?)\s*w/);
  if (wMatch) return parseFloat(wMatch[1]) / 52;
  const num = parseFloat(s);
  if (!Number.isNaN(num) && num < 18) return num;
  return null;
}

function bandLabel(assessment: VitalAssessment): string {
  if (assessment === 'high') return 'high for age';
  if (assessment === 'low') return 'low for age';
  return 'normal for age';
}

export function evaluateHeartRateForAge(hr: number, ageYears: number): VitalAgeEvaluation {
  const { heartRate } = getVitalSignRanges(ageYears);
  const assessment: VitalAssessment =
    hr < heartRate.min ? 'low' : hr > heartRate.max ? 'high' : 'normal';
  return {
    assessment,
    rangeLabel: `${heartRate.min}–${heartRate.max} bpm`,
    displaySuffix: bandLabel(assessment),
  };
}

export function evaluateRespiratoryRateForAge(rr: number, ageYears: number): VitalAgeEvaluation {
  const { respiratoryRate } = getVitalSignRanges(ageYears);
  const assessment: VitalAssessment =
    rr < respiratoryRate.min ? 'low' : rr > respiratoryRate.max ? 'high' : 'normal';
  return {
    assessment,
    rangeLabel: `${respiratoryRate.min}–${respiratoryRate.max}/min`,
    displaySuffix: bandLabel(assessment),
  };
}

export function evaluateSystolicBpForAge(sbp: number, ageYears: number): VitalAgeEvaluation {
  const { systolicBP } = getVitalSignRanges(ageYears);
  const assessment: VitalAssessment =
    sbp < systolicBP.min ? 'low' : sbp > systolicBP.max ? 'high' : 'normal';
  return {
    assessment,
    rangeLabel: `${systolicBP.min}–${systolicBP.max} mmHg`,
    displaySuffix: bandLabel(assessment),
  };
}

export function formatVitalWithAgeContext(
  vital: 'hr' | 'rr' | 'sbp',
  value: number,
  ageYears: number | null
): { valueText: string; context?: string; abnormal: boolean } {
  if (ageYears == null) return { valueText: String(value), abnormal: false };
  const evalFn =
    vital === 'hr'
      ? evaluateHeartRateForAge
      : vital === 'rr'
        ? evaluateRespiratoryRateForAge
        : evaluateSystolicBpForAge;
  const result = evalFn(value, ageYears);
  return {
    valueText: String(value),
    context:
      result.assessment === 'normal'
        ? `(expected ${result.rangeLabel})`
        : `(${result.displaySuffix} — expected ${result.rangeLabel})`,
    abnormal: result.assessment !== 'normal',
  };
}
import {
  getFellowshipMicrocourseResusConditionLabel,
  isFellowshipMicrocourseResusCondition,
  normalizeToFellowshipResusConditionId,
  resolveFellowshipDiagnosisFromSession,
} from '@shared/fellowship-microcourse-resus-conditions';

export const ABCDE_GROUP_ORDER: ABCDELetter[] = ['X', 'A', 'B', 'C', 'D', 'E'];

/** Quick Assessment pillars — aligned with Seriously Ill Child / PAT teaching (no "PAT" label in UI). */
export type QuickAssessmentPillarId = 'appearance' | 'work_of_breathing' | 'circulation';

export interface QuickAssessmentCue {
  id: string;
  pillar: QuickAssessmentPillarId;
  label: string;
  /** Concerning finding — selecting any suggests sick / activate resus. */
  concerning: boolean;
}

export interface QuickAssessmentPillar {
  id: QuickAssessmentPillarId;
  label: string;
  /** One-line clinician cue for the card header. */
  scanFor: string;
  cues: QuickAssessmentCue[];
}

export const QUICK_ASSESSMENT_PILLARS: QuickAssessmentPillar[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    scanFor: 'How do they look and interact?',
    cues: [
      { id: 'a_pale_gray', pillar: 'appearance', label: 'Pale or gray', concerning: true },
      { id: 'a_limp', pillar: 'appearance', label: 'Limp / floppy', concerning: true },
      { id: 'a_not_interacting', pillar: 'appearance', label: 'Not interacting', concerning: true },
    ],
  },
  {
    id: 'work_of_breathing',
    label: 'Work of breathing',
    scanFor: 'Effort to move air — before you auscultate.',
    cues: [
      { id: 'b_nasal_flare', pillar: 'work_of_breathing', label: 'Nasal flare', concerning: true },
      { id: 'b_grunting', pillar: 'work_of_breathing', label: 'Grunting', concerning: true },
      { id: 'b_retractions', pillar: 'work_of_breathing', label: 'Retractions / head bobbing', concerning: true },
    ],
  },
  {
    id: 'circulation',
    label: 'Circulation to skin',
    scanFor: 'Perfusion at the bedside — skin and extremities.',
    cues: [
      { id: 'c_mottled', pillar: 'circulation', label: 'Mottled skin', concerning: true },
      { id: 'c_cool', pillar: 'circulation', label: 'Cool extremities', concerning: true },
      { id: 'c_delayed_crt', pillar: 'circulation', label: 'Delayed cap refill', concerning: true },
    ],
  },
];

export type QuickAssessmentRecommendationLevel = 'neutral' | 'sick' | 'reassess';

export interface QuickAssessmentRecommendation {
  level: QuickAssessmentRecommendationLevel;
  headline: string;
  detail: string;
  /** Maps to `answerQuickAssessment` when clinician confirms. */
  suggestedAnswer?: 'sick' | 'not_sick';
}

/** Derive guidance from tapped concerning cues — does not change phase machine. */
export function deriveQuickAssessmentRecommendation(
  selectedCueIds: ReadonlySet<string>
): QuickAssessmentRecommendation {
  const concerningCount = QUICK_ASSESSMENT_PILLARS.flatMap((p) => p.cues).filter(
    (c) => c.concerning && selectedCueIds.has(c.id)
  ).length;

  if (concerningCount >= 2) {
    return {
      level: 'sick',
      headline: 'Looks sick — activate emergency response',
      detail: 'Continue to ABCDE primary survey now.',
      suggestedAnswer: 'sick',
    };
  }

  if (concerningCount === 1) {
    return {
      level: 'reassess',
      headline: 'One warning sign — treat as sick until proven otherwise',
      detail: 'Start ABCDE; reassess after first interventions.',
      suggestedAnswer: 'sick',
    };
  }

  return {
    level: 'neutral',
    headline: 'Tap anything abnormal — or confirm below',
    detail: 'Next: structured ABCDE primary survey with vitals.',
  };
}

export function toggleQuickAssessmentCue(
  selected: ReadonlySet<string>,
  cueId: string
): Set<string> {
  const next = new Set(selected);
  if (next.has(cueId)) next.delete(cueId);
  else next.add(cueId);
  return next;
}

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
        headline: '3-second look — appearance, breathing effort, skin perfusion',
        detail: 'Any warning sign → sick → ABCDE primary survey',
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
      if (session.phase === 'DEFINITIVE_CARE') {
        return {
          headline: 'Definitive care — follow condition protocol steps below',
          detail: '10 mL/kg fluid aliquots, reassess after each intervention (CST / micro-course aligned)',
        };
      }
      return {
        headline: 'Tap Start definitive care for condition-based therapy',
        detail: 'Primary set — fellowship Save remains available',
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
