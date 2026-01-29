/**
 * Adaptive Reassessment Logic Engine
 * Routes clinical pathway based on reassessment response
 * Implements the DNA principle: "Improvement → continue pathway, No change → escalate, Deterioration → emergency escalation"
 */

export type ReassessmentResponse = 'better' | 'same' | 'worse' | 'unable';

export interface ReassessmentAction {
  type: 'continue' | 'escalate' | 'emergency' | 'reassess';
  title: string;
  guidance: string;
  nextSteps: string[];
  urgency: 'routine' | 'urgent' | 'critical';
}

/**
 * Get adaptive action based on reassessment response and phase
 */
export const getReassessmentAction = (
  response: ReassessmentResponse,
  phase: string,
  interventionCount: number
): ReassessmentAction => {
  switch (response) {
    case 'better':
      return {
        type: 'continue',
        title: 'IMPROVEMENT DETECTED',
        guidance: `Patient improving after ${phase} interventions. Continue current pathway.`,
        nextSteps: [
          `Continue ${phase} management`,
          'Proceed to next assessment phase',
          'Reassess in 5 minutes',
        ],
        urgency: 'routine',
      };

    case 'same':
      return {
        type: 'escalate',
        title: 'NO IMPROVEMENT - ESCALATE',
        guidance: `No change after ${interventionCount} intervention(s). Escalate to next level of care.`,
        nextSteps: [
          `Increase intervention intensity for ${phase}`,
          'Consider advanced interventions',
          'Prepare for escalation',
          'Notify senior clinician',
        ],
        urgency: 'urgent',
      };

    case 'worse':
      return {
        type: 'emergency',
        title: 'DETERIORATION - EMERGENCY ESCALATION',
        guidance: `Patient deteriorating despite interventions. EMERGENCY escalation required.`,
        nextSteps: [
          'ACTIVATE EMERGENCY RESPONSE',
          'Prepare for advanced airway management',
          'Prepare for ICU transfer',
          'Notify senior clinician IMMEDIATELY',
          'Consider cardiopulmonary resuscitation',
        ],
        urgency: 'critical',
      };

    case 'unable':
      return {
        type: 'reassess',
        title: 'UNABLE TO ASSESS - PROCEED WITH CAUTION',
        guidance: `Cannot assess patient response. Continue monitoring closely.`,
        nextSteps: [
          'Reassess patient status immediately',
          'Check for assessment barriers (sedation, noise, etc.)',
          'Continue current interventions',
          'Increase monitoring frequency',
        ],
        urgency: 'urgent',
      };
  }
};

/**
 * Hard-stop safety rules for specific phases
 * Prevents unsafe progression based on clinical findings
 */
export interface SafetyRule {
  id: string;
  phase: string;
  condition: string;
  blockAction: string;
  requiredIntervention: string;
}

export const HARD_STOP_SAFETY_RULES: SafetyRule[] = [
  {
    id: 'airway-not-secured',
    phase: 'breathing',
    condition: 'Airway not patent or at risk',
    blockAction: 'Cannot proceed to breathing assessment',
    requiredIntervention: 'Secure airway first (position, suction, airway adjunct)',
  },
  {
    id: 'breathing-inadequate-no-oxygen',
    phase: 'circulation',
    condition: 'Breathing inadequate without high-flow oxygen',
    blockAction: 'Cannot proceed to circulation assessment',
    requiredIntervention: 'Provide high-flow oxygen (10-15 L/min) and prepare for intubation',
  },
  {
    id: 'hypoglycemia-not-corrected',
    phase: 'exposure',
    condition: 'Glucose < 70 mg/dL',
    blockAction: 'Cannot proceed to exposure assessment',
    requiredIntervention: 'Correct hypoglycemia with IV dextrose immediately',
  },
  {
    id: 'fluid-overload-risk',
    phase: 'circulation',
    condition: 'Total fluids > 60 mL/kg without reassessment',
    blockAction: 'Cannot give more fluid boluses',
    requiredIntervention: 'Reassess for fluid overload (edema, crackles, hepatomegaly)',
  },
  {
    id: 'no-pulse-no-cpr',
    phase: 'disability',
    condition: 'No pulse detected',
    blockAction: 'Cannot proceed to disability assessment',
    requiredIntervention: 'Start CPR immediately (100-120 compressions/min)',
  },
];

/**
 * Check if safety rule blocks progression
 */
export const checkSafetyRuleViolation = (
  currentPhase: string,
  nextPhase: string,
  assessment: any
): SafetyRule | null => {
  const applicableRules = HARD_STOP_SAFETY_RULES.filter(
    (rule) => rule.phase === nextPhase
  );

  for (const rule of applicableRules) {
    // Check specific conditions
    if (rule.id === 'airway-not-secured' && assessment.airwayPatency !== 'patent') {
      return rule;
    }
    if (
      rule.id === 'breathing-inadequate-no-oxygen' &&
      assessment.breathingAdequate === false
    ) {
      return rule;
    }
    if (
      rule.id === 'hypoglycemia-not-corrected' &&
      assessment.glucose !== null &&
      assessment.glucose < 70
    ) {
      return rule;
    }
    if (rule.id === 'no-pulse-no-cpr' && assessment.pulsePresent === false) {
      return rule;
    }
  }

  return null;
};

/**
 * Escalation pathway recommendations based on intervention count and response
 */
export const getEscalationPathway = (
  phase: string,
  interventionCount: number,
  response: ReassessmentResponse
): string[] => {
  if (response === 'better') {
    return ['Continue current management', 'Proceed to next phase'];
  }

  if (response === 'worse') {
    return [
      'EMERGENCY ESCALATION',
      'Activate emergency response team',
      'Prepare for advanced interventions',
      'Consider ICU transfer',
    ];
  }

  // For 'same' or 'unable' - escalation based on intervention count
  if (interventionCount === 1) {
    return [
      'Try alternative intervention',
      'Increase intervention intensity',
      'Reassess in 2-3 minutes',
    ];
  } else if (interventionCount === 2) {
    return [
      'Prepare for advanced intervention',
      'Notify senior clinician',
      'Consider escalation to higher level of care',
    ];
  } else {
    return [
      'ESCALATE IMMEDIATELY',
      'Activate emergency response',
      'Prepare for ICU transfer',
      'Consider alternative diagnoses',
    ];
  }
};

/**
 * Generate clinical reasoning explanation for senior clinician override
 */
export const generateOverridePrompt = (
  action: ReassessmentAction,
  phase: string
): string => {
  return `
Senior Clinician Override Required

Recommended Action: ${action.title}
Phase: ${phase.toUpperCase()}
Urgency: ${action.urgency.toUpperCase()}

${action.guidance}

Recommended Next Steps:
${action.nextSteps.map((step) => `• ${step}`).join('\n')}

If you override this recommendation, please provide your clinical reasoning:
[Text field for override reason]

This override will be logged for quality improvement and audit purposes.
  `.trim();
};
