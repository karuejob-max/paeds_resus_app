/**
 * PALS Capstone Scenario Engine
 * 
 * Progressive, instructor-led scenario that unlocks findings as the learner
 * navigates through ResusGPS pages (PAT → A → B → C → D → E → SAMPLE → Arrest).
 * 
 * The simulation monitors ResusGPS page transitions and provides contextual
 * scenario findings at each step, validating clinical decisions.
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
  | 'post_resuscitation'
  | 'management'
  | 'advanced_management';

export type ScenarioFinding = {
  page: ResusGpsPage;
  title: string;
  description: string;
  vitals?: Record<string, string | number>;
  instruction?: string;
  expectedActions?: string[];
  clinicalContext?: string;
};

export type ScenarioState = {
  currentPage: ResusGpsPage;
  unlockedPages: ResusGpsPage[];
  findings: ScenarioFinding[];
  cardiacArrestTriggered: boolean;
  cardiacArrestTime: number; // elapsed time when arrest occurred
  completedActions: string[];
  score: number;
  feedback: string;
  feedbackType: 'success' | 'error' | 'info';
};

/**
 * Progressive scenario findings that unlock as the learner navigates ResusGPS.
 * Each page unlocks new findings and instructions.
 */
const SCENARIO_FINDINGS: Record<ResusGpsPage, ScenarioFinding> = {
  pat_assessment: {
    page: 'pat_assessment',
    title: 'Primary Assessment (PAT)',
    description: 'A 2-year-old child is brought to the emergency department with respiratory distress.',
    vitals: {
      appearance: 'Anxious, working hard to breathe',
      work_of_breathing: 'Increased, using accessory muscles',
      circulation: 'Pale, cool peripheries',
    },
    instruction: 'Assess the child using PAT (Appearance, Work of Breathing, Circulation). What do you observe?',
    expectedActions: ['assess_appearance', 'assess_work_of_breathing', 'assess_circulation'],
    clinicalContext: 'This child is showing signs of respiratory distress with poor perfusion.',
  },
  airway: {
    page: 'airway',
    title: 'Airway Assessment (A)',
    description: 'The child\'s airway is patent but she is tachypneic (RR 50).',
    vitals: {
      respiratory_rate: '50 breaths/min',
      oxygen_saturation: '88%',
      airway_status: 'Patent, no stridor',
    },
    instruction: 'Assess the airway. The child is hypoxic (SpO2 88%). What intervention do you recommend?',
    expectedActions: ['apply_oxygen', 'position_airway', 'consider_advanced_airway'],
    clinicalContext: 'Hypoxia requires immediate oxygen therapy. High-flow oxygen is indicated.',
  },
  breathing: {
    page: 'breathing',
    title: 'Breathing Assessment (B)',
    description: 'After oxygen therapy, SpO2 improves to 92%, but the child remains tachypneic.',
    vitals: {
      respiratory_rate: '48 breaths/min',
      oxygen_saturation: '92%',
      breath_sounds: 'Bilateral, but decreased at bases',
      work_of_breathing: 'Still increased',
    },
    instruction: 'The child is still working hard to breathe. Consider respiratory support. What is your next step?',
    expectedActions: ['assess_lung_sounds', 'consider_respiratory_support', 'monitor_spo2'],
    clinicalContext: 'Persistent tachypnea and work of breathing suggest possible pneumonia or pulmonary edema.',
  },
  circulation: {
    page: 'circulation',
    title: 'Circulation Assessment (C)',
    description: 'The child\'s heart rate is 140 bpm, BP is 85/50 mmHg, and capillary refill is 3 seconds.',
    vitals: {
      heart_rate: '140 bpm',
      blood_pressure: '85/50 mmHg',
      capillary_refill: '3 seconds',
      skin_perfusion: 'Pale, cool peripheries',
      urine_output: 'Decreased',
    },
    instruction: 'The child is in shock. Assess the type of shock and initiate fluid resuscitation.',
    expectedActions: ['assess_shock_type', 'establish_iv_access', 'administer_fluid_bolus'],
    clinicalContext: 'Signs of hypovolemic or septic shock. Fluid bolus 20 mL/kg of normal saline is indicated.',
  },
  disability: {
    page: 'disability',
    title: 'Disability Assessment (D)',
    description: 'The child is alert but increasingly irritable. AVPU: Alert.',
    vitals: {
      avpu: 'Alert',
      glucose: '95 mg/dL',
      pupil_response: 'Normal, reactive',
    },
    instruction: 'Assess neurological status. Check glucose and pupil response. Any signs of altered mental status?',
    expectedActions: ['assess_avpu', 'check_glucose', 'assess_pupils'],
    clinicalContext: 'Currently alert, but continued shock may lead to altered mental status.',
  },
  exposure: {
    page: 'exposure',
    title: 'Exposure Assessment (E)',
    description: 'Full body examination reveals a petechial rash on the trunk and lower extremities.',
    vitals: {
      rash: 'Petechial, non-blanching',
      temperature: '39.2°C (102.5°F)',
      skin_turgor: 'Decreased',
    },
    instruction: 'A petechial rash with fever and shock suggests meningococcemia. Initiate sepsis protocol.',
    expectedActions: ['identify_rash', 'obtain_blood_cultures', 'administer_antibiotics'],
    clinicalContext: 'Meningococcal sepsis is a medical emergency. Empiric antibiotics are critical.',
  },
  sample_history: {
    page: 'sample_history',
    title: 'SAMPLE History',
    description: 'Mother reports the child was well until 24 hours ago. Fever started yesterday evening.',
    vitals: {
      symptom_onset: '24 hours ago',
      fever_duration: '12 hours',
      recent_illness: 'None reported',
      medications: 'None',
      allergies: 'NKDA',
    },
    instruction: 'Obtain SAMPLE history. Key findings: acute onset fever, no prior illness, no medications.',
    expectedActions: ['obtain_history', 'identify_allergy_status', 'note_medication_list'],
    clinicalContext: 'Rapid progression from well to septic shock in 24 hours is classic for meningococcemia.',
  },
  cardiac_arrest: {
    page: 'cardiac_arrest',
    title: 'Cardiac Arrest',
    description: 'The child suddenly becomes unresponsive. No pulse palpable. Cardiac arrest!',
    vitals: {
      consciousness: 'Unresponsive',
      pulse: 'Absent',
      blood_pressure: 'Undetectable',
      rhythm: 'Asystole',
    },
    instruction: 'Initiate CPR immediately. Call for help. Start chest compressions at 100-120 bpm.',
    expectedActions: ['start_cpr', 'call_for_help', 'establish_airway', 'obtain_iv_access', 'administer_epinephrine'],
    clinicalContext: 'Septic shock has progressed to cardiac arrest. Aggressive resuscitation is required.',
  },
  cpr_clock: {
    page: 'cpr_clock',
    title: 'CPR Clock & Resuscitation',
    description: 'CPR in progress. Use the CPR Clock to manage compressions, airway, medications, and defibrillation.',
    instruction: 'Manage the resuscitation using the CPR Clock. Follow PALS guidelines for medication timing and defibrillation.',
    expectedActions: ['perform_cpr', 'administer_medications', 'manage_airway', 'defibrillate_if_indicated'],
    clinicalContext: 'PALS protocol: Epinephrine every 3-5 minutes, consider amiodarone if VF/pulseless VT.',
  },
  post_resuscitation: {
    page: 'post_resuscitation',
    title: 'Post-Resuscitation Care',
    description: 'ROSC achieved after 4 minutes of CPR. Child has a palpable pulse and is breathing.',
    vitals: {
      heart_rate: '95 bpm',
      blood_pressure: '78/45 mmHg',
      oxygen_saturation: '94%',
      respiratory_rate: '28 breaths/min',
    },
    instruction: 'Initiate post-resuscitation care: therapeutic hypothermia, sedation, arrange PICU transfer.',
    expectedActions: ['initiate_hypothermia', 'administer_sedation', 'arrange_transfer', 'obtain_imaging'],
    clinicalContext: 'Post-resuscitation syndrome requires intensive care. Therapeutic hypothermia improves neurological outcomes.',
  },
};

/**
 * Initialize the scenario state
 */
export function initializeScenarioState(): ScenarioState {
  return {
    currentPage: 'pat_assessment',
    unlockedPages: ['pat_assessment'],
    findings: [SCENARIO_FINDINGS.pat_assessment],
    cardiacArrestTriggered: false,
    cardiacArrestTime: 0,
    completedActions: [],
    score: 0,
    feedback: 'Welcome to the PALS Capstone Simulation. Start by assessing the patient using PAT.',
    feedbackType: 'info',
  };
}

/**
 * Handle page transition in ResusGPS
 * Unlocks new findings and validates progression
 */
export function handlePageTransition(
  state: ScenarioState,
  newPage: ResusGpsPage,
  elapsedTime: number
): ScenarioState {
  const pageSequence: ResusGpsPage[] = [
    'pat_assessment',
    'airway',
    'breathing',
    'circulation',
    'disability',
    'exposure',
    'sample_history',
  ];

  const currentIndex = pageSequence.indexOf(state.currentPage);
  const newIndex = pageSequence.indexOf(newPage);

  // Validate progression (allow moving forward or backward, but not skipping)
  if (newIndex > currentIndex + 1 && !state.cardiacArrestTriggered) {
    return {
      ...state,
      feedback: 'You skipped a step. Please complete the assessment in order.',
      feedbackType: 'error',
    };
  }

  // Unlock the new page and its findings
  const unlockedPages = [...state.unlockedPages];
  if (!unlockedPages.includes(newPage)) {
    unlockedPages.push(newPage);
  }

  const findings = [...state.findings];
  if (SCENARIO_FINDINGS[newPage] && !findings.find(f => f.page === newPage)) {
    findings.push(SCENARIO_FINDINGS[newPage]);
  }

  // Trigger cardiac arrest randomly after circulation assessment (10-30% chance)
  let cardiacArrestTriggered = state.cardiacArrestTriggered;
  let cardiacArrestTime = state.cardiacArrestTime;
  if (newPage === 'circulation' && !state.cardiacArrestTriggered && Math.random() < 0.2) {
    cardiacArrestTriggered = true;
    cardiacArrestTime = elapsedTime;
    unlockedPages.push('cardiac_arrest', 'cpr_clock');
    findings.push(SCENARIO_FINDINGS.cardiac_arrest);
  }

  return {
    ...state,
    currentPage: newPage,
    unlockedPages,
    findings,
    cardiacArrestTriggered,
    cardiacArrestTime,
    feedback: `Progressed to ${newPage}. ${SCENARIO_FINDINGS[newPage]?.instruction || ''}`,
    feedbackType: 'success',
  };
}

/**
 * Validate a clinical action taken in ResusGPS
 */
export function validateClinicalAction(
  state: ScenarioState,
  action: string,
  details?: Record<string, any>
): { isCorrect: boolean; feedback: string; pointsAwarded: number } {
  const currentFinding = state.findings.find(f => f.page === state.currentPage);
  const expectedActions = currentFinding?.expectedActions || [];

  if (!expectedActions.includes(action)) {
    return {
      isCorrect: false,
      feedback: `Incorrect action for this phase. Expected: ${expectedActions.join(', ')}`,
      pointsAwarded: 0,
    };
  }

  // Validate specific action details
  let pointsAwarded = 10;
  let feedback = `✓ Correct: ${action}`;

  if (action === 'administer_fluid_bolus' && details?.volume) {
    const expectedVolume = 20; // mL/kg
    if (Math.abs(details.volume - expectedVolume) > 5) {
      pointsAwarded = 5;
      feedback += ` (Volume slightly off: ${details.volume} mL/kg, expected ~${expectedVolume} mL/kg)`;
    }
  }

  if (action === 'administer_epinephrine' && details?.dose) {
    const expectedDose = 0.01; // mg/kg IV/IO
    if (Math.abs(details.dose - expectedDose) > 0.002) {
      pointsAwarded = 5;
      feedback += ` (Dose slightly off: ${details.dose} mg/kg, expected ${expectedDose} mg/kg)`;
    }
  }

  return {
    isCorrect: true,
    feedback,
    pointsAwarded,
  };
}

/**
 * Calculate final simulation score
 */
export function calculateFinalScore(
  state: ScenarioState,
  totalElapsedTime: number,
  rosc: boolean
): number {
  let score = state.score;

  // Bonus for ROSC
  if (rosc) {
    score += 20;
  }

  // Time penalty (deduct 1 point per 30 seconds over 10 minutes)
  const timeLimit = 600; // 10 minutes
  if (totalElapsedTime > timeLimit) {
    const timePenalty = Math.floor((totalElapsedTime - timeLimit) / 30);
    score -= timePenalty;
  }

  // Completion bonus
  if (state.unlockedPages.length >= 7) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get current scenario findings for display
 */
export function getCurrentScenarioFindings(state: ScenarioState): ScenarioFinding | null {
  return state.findings.find(f => f.page === state.currentPage) || null;
}

/**
 * Check if learner should progress to cardiac arrest
 */
export function shouldTriggerCardiacArrest(
  state: ScenarioState,
  elapsedTime: number
): boolean {
  // Arrest can happen after circulation assessment and before post-resuscitation
  if (
    state.unlockedPages.includes('circulation') &&
    !state.cardiacArrestTriggered &&
    elapsedTime > 120 // After 2 minutes
  ) {
    // 5% chance per second after 2 minutes
    return Math.random() < 0.05;
  }
  return false;
}
