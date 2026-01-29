/**
 * Action Tracking & Audit Trail System
 * Tracks action completion, timing, and clinical notes for quality improvement and accountability
 */

export interface CompletedAction {
  actionId: string;
  actionTitle: string;
  phase: string;
  completedAt: Date;
  durationSeconds: number;
  clinicalNotes?: string;
  skipped?: boolean;
  skipReason?: string;
  vitalsAtCompletion?: {
    heartRate?: number;
    respiratoryRate?: number;
    spO2?: number;
    systolicBP?: number;
    capillaryRefill?: number;
  };
}

export interface ActionAuditTrail {
  caseId: string;
  patientAge: { years: number; months: number };
  patientWeight: number;
  startTime: Date;
  completedActions: CompletedAction[];
  totalTimeSeconds: number;
  phaseTimings: Record<string, number>; // phase -> seconds
  overallStatus: 'in-progress' | 'completed' | 'escalated' | 'abandoned';
}

/**
 * Create new audit trail for case
 */
export const createAuditTrail = (
  caseId: string,
  patientAge: { years: number; months: number },
  patientWeight: number
): ActionAuditTrail => {
  return {
    caseId,
    patientAge,
    patientWeight,
    startTime: new Date(),
    completedActions: [],
    totalTimeSeconds: 0,
    phaseTimings: {},
    overallStatus: 'in-progress',
  };
};

/**
 * Record action completion
 */
export const recordActionCompletion = (
  trail: ActionAuditTrail,
  actionId: string,
  actionTitle: string,
  phase: string,
  clinicalNotes?: string,
  vitals?: any
): ActionAuditTrail => {
  const now = new Date();
  const lastAction = trail.completedActions[trail.completedActions.length - 1];
  const durationSeconds = lastAction
    ? Math.round((now.getTime() - lastAction.completedAt.getTime()) / 1000)
    : Math.round((now.getTime() - trail.startTime.getTime()) / 1000);

  const completedAction: CompletedAction = {
    actionId,
    actionTitle,
    phase,
    completedAt: now,
    durationSeconds,
    clinicalNotes,
    vitalsAtCompletion: vitals,
  };

  return {
    ...trail,
    completedActions: [...trail.completedActions, completedAction],
    totalTimeSeconds: Math.round((now.getTime() - trail.startTime.getTime()) / 1000),
    phaseTimings: {
      ...trail.phaseTimings,
      [phase]: (trail.phaseTimings[phase] || 0) + durationSeconds,
    },
  };
};

/**
 * Record action skip
 */
export const recordActionSkip = (
  trail: ActionAuditTrail,
  actionId: string,
  actionTitle: string,
  phase: string,
  skipReason: string
): ActionAuditTrail => {
  const now = new Date();
  const lastAction = trail.completedActions[trail.completedActions.length - 1];
  const durationSeconds = lastAction
    ? Math.round((now.getTime() - lastAction.completedAt.getTime()) / 1000)
    : Math.round((now.getTime() - trail.startTime.getTime()) / 1000);

  const completedAction: CompletedAction = {
    actionId,
    actionTitle,
    phase,
    completedAt: now,
    durationSeconds,
    skipped: true,
    skipReason,
  };

  return {
    ...trail,
    completedActions: [...trail.completedActions, completedAction],
    totalTimeSeconds: Math.round((now.getTime() - trail.startTime.getTime()) / 1000),
  };
};

/**
 * Generate audit summary for quality review
 */
export const generateAuditSummary = (trail: ActionAuditTrail): string => {
  const totalMinutes = Math.round(trail.totalTimeSeconds / 60);
  const completedCount = trail.completedActions.filter((a) => !a.skipped).length;
  const skippedCount = trail.completedActions.filter((a) => a.skipped).length;

  let summary = `
CLINICAL CASE AUDIT TRAIL
========================

Patient: ${trail.patientAge.years}y ${trail.patientAge.months}m old, ${trail.patientWeight} kg
Case ID: ${trail.caseId}
Total Time: ${totalMinutes} minutes
Status: ${trail.overallStatus.toUpperCase()}

ACTIONS COMPLETED: ${completedCount}
ACTIONS SKIPPED: ${skippedCount}

PHASE TIMINGS:
${Object.entries(trail.phaseTimings)
  .map(([phase, seconds]) => `  ${phase.toUpperCase()}: ${Math.round(seconds / 60)} min`)
  .join('\n')}

ACTION SEQUENCE:
${trail.completedActions
  .map(
    (action, idx) => `
${idx + 1}. ${action.actionTitle} (${action.phase})
   Time: ${action.completedAt.toLocaleTimeString()}
   Duration: ${action.durationSeconds} seconds
   ${action.skipped ? `SKIPPED - Reason: ${action.skipReason}` : 'COMPLETED'}
   ${action.clinicalNotes ? `Notes: ${action.clinicalNotes}` : ''}
   ${
     action.vitalsAtCompletion
       ? `Vitals: HR=${action.vitalsAtCompletion.heartRate}, RR=${action.vitalsAtCompletion.respiratoryRate}, SpO2=${action.vitalsAtCompletion.spO2}%`
       : ''
   }
`
  )
  .join('\n')}

QUALITY METRICS:
- Average action time: ${Math.round(trail.totalTimeSeconds / trail.completedActions.length)} seconds
- Completion rate: ${Math.round((completedCount / trail.completedActions.length) * 100)}%
- Total actions: ${trail.completedActions.length}
  `.trim();

  return summary;
};

/**
 * Identify gaps in action sequence (skipped critical actions)
 */
export const identifyActionGaps = (trail: ActionAuditTrail): string[] => {
  const gaps: string[] = [];

  const skippedActions = trail.completedActions.filter((a) => a.skipped);
  const criticalPhases = ['airway', 'breathing', 'circulation'];

  for (const action of skippedActions) {
    if (criticalPhases.includes(action.phase)) {
      gaps.push(`Critical action skipped in ${action.phase} phase: ${action.actionTitle}`);
    }
  }

  return gaps;
};

/**
 * Calculate action efficiency score (0-100)
 * Based on: completion rate, time efficiency, no critical skips
 */
export const calculateEfficiencyScore = (trail: ActionAuditTrail): number => {
  let score = 100;

  // Deduct for skipped actions (10 points each)
  const skippedCount = trail.completedActions.filter((a) => a.skipped).length;
  score -= skippedCount * 10;

  // Deduct for critical phase skips (20 points each)
  const criticalSkips = trail.completedActions.filter(
    (a) => a.skipped && ['airway', 'breathing', 'circulation'].includes(a.phase)
  ).length;
  score -= criticalSkips * 20;

  // Bonus for quick action (if <5 min total, +10)
  if (trail.totalTimeSeconds < 300) {
    score += 10;
  }

  // Bonus for complete documentation (if all actions have notes, +5)
  const allDocumented = trail.completedActions.every((a) => a.clinicalNotes || a.skipped);
  if (allDocumented) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Export audit trail as JSON for storage/analysis
 */
export const exportAuditTrail = (trail: ActionAuditTrail): string => {
  return JSON.stringify(trail, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
};
