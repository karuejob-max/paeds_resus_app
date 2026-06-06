/**
 * PALS Capstone Interactive Practical Engine
 * 
 * The instructor describes clinical findings, and the learner must manually
 * select the correct findings/interventions in ResusGPS. The engine validates
 * the learner's choices and provides real-time feedback.
 */

export type ResusGpsPage = 
  | 'pat_assessment'
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability'
  | 'exposure'
  | 'sample_history'
  | 'cardiac_arrest'
  | 'cpr_clock'
  | 'post_resuscitation';

/**
 * Instructor's verbal description of the clinical scenario at each stage.
 * The learner must translate this into ResusGPS selections.
 */
export type InstructorFinding = {
  page: ResusGpsPage;
  clinicalObjective: string; // e.g., "Complete PAT Assessment"
  instructorDescription: string; // e.g., "The child is pale and gasping..."
  targetFindings: string[]; // e.g., ["anxious", "increased_work_of_breathing", "poor_perfusion"]
  hints?: string[]; // Optional hints if learner is stuck
  successMessage: string;
  failureMessage?: string;
};

/**
 * Represents a learner's input/selection in ResusGPS.
 */
export type LearnerInput = {
  page: ResusGpsPage;
  selectedFindings: string[];
  timestamp: number;
  correct: boolean;
  feedback: string;
};

export type InteractiveScenarioState = {
  currentPage: ResusGpsPage;
  currentPhaseIndex: number; // Which phase of the scenario we're on
  instructorFinding: InstructorFinding | null;
  learnerInputs: LearnerInput[];
  cardiacArrestTriggered: boolean;
  cardiacArrestTime: number;
  score: number;
  correctAnswers: number;
  totalPhases: number;
  isPhaseComplete: boolean;
  feedback: string;
  feedbackType: 'success' | 'error' | 'info' | 'hint';
  showHint: boolean;
};

/**
 * Progressive scenario phases. Each phase has an instructor description
 * and target findings the learner must select.
 */
const INTERACTIVE_SCENARIO_PHASES: InstructorFinding[] = [
  {
    page: 'pat_assessment',
    clinicalObjective: 'Complete PAT Assessment',
    instructorDescription: 'A 2-year-old child is brought to the ED. Look at the child: they appear anxious and are working hard to breathe. Their skin is pale and cool to touch.',
    targetFindings: ['anxious', 'increased_work_of_breathing', 'poor_perfusion'],
    hints: [
      'Look at the child\'s appearance first (Appearance)',
      'Observe how hard they are breathing (Work of Breathing)',
      'Check their skin color and warmth (Circulation)',
    ],
    successMessage: 'Excellent! You correctly identified the PAT findings. This child is in respiratory distress with poor perfusion.',
  },
  {
    page: 'airway',
    clinicalObjective: 'Assess Airway & Provide Oxygen',
    instructorDescription: 'The child\'s airway is open, but they are gasping (RR 50). Their oxygen saturation is only 88%. They need oxygen immediately.',
    targetFindings: ['patent_airway', 'tachypnea', 'hypoxia', 'apply_high_flow_oxygen'],
    hints: [
      'Check if the airway is patent (open)',
      'Note the rapid breathing rate (tachypnea)',
      'Recognize the low oxygen saturation (hypoxia)',
      'Apply high-flow oxygen to correct hypoxia',
    ],
    successMessage: 'Perfect! You recognized hypoxia and applied oxygen. SpO2 should improve.',
  },
  {
    page: 'breathing',
    clinicalObjective: 'Assess Breathing & Monitor Response',
    instructorDescription: 'After oxygen, the SpO2 improves to 92%, but the child is still breathing fast (RR 48) and working hard. You hear decreased breath sounds at the bases.',
    targetFindings: ['decreased_breath_sounds', 'persistent_tachypnea', 'assess_lung_sounds', 'consider_respiratory_support'],
    hints: [
      'Listen carefully to the lungs (auscultation)',
      'Note that breathing is still fast despite oxygen',
      'Consider if the child needs more respiratory support',
    ],
    successMessage: 'Good assessment! The persistent tachypnea suggests pneumonia or pulmonary edema. Consider respiratory support.',
  },
  {
    page: 'circulation',
    clinicalObjective: 'Assess Circulation & Recognize Shock',
    instructorDescription: 'The child\'s heart is racing at 140 bpm. Blood pressure is low (85/50). Capillary refill is slow (3 seconds). Skin is still pale and cool.',
    targetFindings: ['tachycardia', 'hypotension', 'delayed_capillary_refill', 'poor_perfusion', 'recognize_shock'],
    hints: [
      'Check the heart rate (tachycardia)',
      'Check blood pressure (hypotension)',
      'Check capillary refill (delayed = poor perfusion)',
      'Recognize these signs indicate shock',
    ],
    successMessage: 'Excellent! You recognized shock. This child needs fluid resuscitation. Prepare a 20 mL/kg bolus.',
  },
  {
    page: 'disability',
    clinicalObjective: 'Assess Disability & Consciousness',
    instructorDescription: 'The child is alert and responding to voice. No seizures. Pupils are equal and reactive.',
    targetFindings: ['alert', 'responsive_to_voice', 'no_seizures', 'equal_reactive_pupils'],
    hints: [
      'Check consciousness level (alert, voice, pain, unresponsive)',
      'Look for any seizure activity',
      'Check pupil size and reactivity',
    ],
    successMessage: 'Good! The child\'s neurological status is stable. Continue resuscitation.',
  },
  {
    page: 'exposure',
    clinicalObjective: 'Assess Exposure & Look for Clues',
    instructorDescription: 'You expose the child and find a rash on the trunk and limbs. Temperature is 39.2°C. No other obvious injuries.',
    targetFindings: ['rash_present', 'fever', 'assess_rash_type', 'consider_sepsis'],
    hints: [
      'Look at the skin carefully (rash)',
      'Check temperature (fever)',
      'Consider what the rash and fever suggest',
    ],
    successMessage: 'Critical finding! Rash + fever + shock = sepsis. Prepare antibiotics and continue resuscitation.',
  },
  {
    page: 'sample_history',
    clinicalObjective: 'Obtain SAMPLE History',
    instructorDescription: 'Mother reports: child was well 2 days ago, then developed fever and cough. No allergies. Last meal was 4 hours ago. No medications.',
    targetFindings: ['acute_onset', 'fever_cough', 'no_allergies', 'recent_meal', 'no_medications'],
    hints: [
      'Ask about Symptoms (fever, cough)',
      'Ask about Allergies',
      'Ask about Medications',
      'Ask about Last meal',
      'Ask about Events leading up to this',
    ],
    successMessage: 'Good history! Acute fever + cough + shock = likely septic shock from pneumonia. Continue aggressive resuscitation.',
  },
  {
    page: 'cardiac_arrest',
    clinicalObjective: 'Recognize Cardiac Arrest & Start CPR',
    instructorDescription: 'Suddenly, the child becomes unresponsive. You cannot feel a pulse. The monitor shows asystole. Start CPR immediately!',
    targetFindings: ['unresponsive', 'no_pulse', 'asystole', 'start_cpr', 'call_for_help'],
    hints: [
      'Check responsiveness',
      'Check for a pulse (10 seconds max)',
      'Look at the cardiac monitor',
      'Start CPR immediately',
      'Call for help and get the crash cart',
    ],
    successMessage: 'You recognized cardiac arrest and started CPR. Continue high-quality CPR and prepare for advanced interventions.',
  },
  {
    page: 'cpr_clock',
    clinicalObjective: 'Manage CPR & Medications',
    instructorDescription: 'CPR is ongoing. At 3 minutes, give epinephrine 0.01 mg/kg IV. Continue CPR. At 5 minutes, reassess rhythm.',
    targetFindings: ['cpr_ongoing', 'epinephrine_given', 'correct_dose', 'rhythm_check_at_5_min'],
    hints: [
      'Calculate epinephrine dose: 0.01 mg/kg',
      'Give it IV/IO every 3-5 minutes',
      'Continue CPR between medications',
      'Reassess rhythm every 2 minutes',
    ],
    successMessage: 'Good medication management! Continue CPR and prepare for defibrillation if indicated.',
  },
  {
    page: 'post_resuscitation',
    clinicalObjective: 'Achieve ROSC & Post-Resuscitation Care',
    instructorDescription: 'After 8 minutes of CPR, you see a pulse! Heart rate is 80 bpm, BP is 95/60. The child is still unresponsive. Prepare for post-resuscitation care.',
    targetFindings: ['rosc_achieved', 'pulse_present', 'adequate_perfusion', 'continue_monitoring', 'prepare_icu'],
    hints: [
      'Confirm ROSC (return of spontaneous circulation)',
      'Check vital signs',
      'Prepare for ICU transfer',
      'Continue supportive care',
    ],
    successMessage: 'Excellent! You successfully resuscitated the child. Now focus on post-resuscitation care and preventing complications.',
  },
];

/**
 * Initialize the interactive scenario
 */
export function initializeInteractiveScenario(): InteractiveScenarioState {
  return {
    currentPage: 'pat_assessment',
    currentPhaseIndex: 0,
    instructorFinding: INTERACTIVE_SCENARIO_PHASES[0],
    learnerInputs: [],
    cardiacArrestTriggered: false,
    cardiacArrestTime: 0,
    score: 0,
    correctAnswers: 0,
    totalPhases: INTERACTIVE_SCENARIO_PHASES.length,
    isPhaseComplete: false,
    feedback: '',
    feedbackType: 'info',
    showHint: false,
  };
}

/**
 * Validate learner's selections against target findings
 */
export function validateLearnerInput(
  state: InteractiveScenarioState,
  selectedFindings: string[]
): InteractiveScenarioState {
  if (!state.instructorFinding) {
    return state;
  }

  const targetFindings = state.instructorFinding.targetFindings;
  const correct = selectedFindings.length > 0 &&
    selectedFindings.every(f => targetFindings.includes(f)) &&
    selectedFindings.length >= Math.ceil(targetFindings.length * 0.7); // 70% of targets needed

  const input: LearnerInput = {
    page: state.currentPage,
    selectedFindings,
    timestamp: Date.now(),
    correct,
    feedback: correct 
      ? state.instructorFinding.successMessage 
      : (state.instructorFinding.failureMessage || 'Not quite right. Try again or ask for a hint.'),
  };

    const newState: InteractiveScenarioState = {
    ...state,
    learnerInputs: [...state.learnerInputs, input],
    isPhaseComplete: correct,
    feedback: input.feedback,
    feedbackType: correct ? 'success' : 'error',
    score: correct ? state.score + 10 : state.score,
    correctAnswers: correct ? state.correctAnswers + 1 : state.correctAnswers,
  };

  return newState;
}

/**
 * Move to the next phase
 */
export function advanceToNextPhase(state: InteractiveScenarioState): InteractiveScenarioState {
  const nextPhaseIndex = state.currentPhaseIndex + 1;

  if (nextPhaseIndex >= INTERACTIVE_SCENARIO_PHASES.length) {
    // Scenario complete
    return {
      ...state,
      isPhaseComplete: true,
      feedback: 'Scenario complete! You successfully managed a pediatric septic shock case.',
      feedbackType: 'success' as const,
    };
  }

  const nextPhase = INTERACTIVE_SCENARIO_PHASES[nextPhaseIndex];
    return {
      ...state,
      currentPhaseIndex: nextPhaseIndex,
      currentPage: nextPhase.page,
      instructorFinding: nextPhase,
      isPhaseComplete: false,
      feedback: nextPhase.clinicalObjective,
      feedbackType: 'info' as const,
      showHint: false,
    };
}

/**
 * Show hint for current phase
 */
export function showHintForPhase(state: InteractiveScenarioState): InteractiveScenarioState {
  if (!state.instructorFinding || !state.instructorFinding.hints) {
    return state;
  }

  const hintIndex = state.learnerInputs.filter(i => i.page === state.currentPage).length;
  const hint = state.instructorFinding.hints[Math.min(hintIndex, state.instructorFinding.hints.length - 1)];

  return {
    ...state,
    showHint: true,
    feedback: hint,
    feedbackType: 'hint' as const,
  };
}

/**
 * Calculate final score
 */
export function calculateFinalScore(state: InteractiveScenarioState): number {
  const baseScore = (state.correctAnswers / state.totalPhases) * 100;
  const speedBonus = Math.max(0, 10 - (state.learnerInputs.length - state.totalPhases)); // Bonus for fewer attempts
  return Math.min(100, Math.round(baseScore + speedBonus));
}
