/**
 * PALS Capstone Practical Engine
 * 
 * A self-contained "Clinical Practical Exam" where learners:
 * 1. Assess findings based on instructor description
 * 2. Perform interventions
 * 3. Click "Continue" to move to the next assessment phase
 * 
 * The flow is: Assessment -> Intervention -> Continue -> Next Phase
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

export type PhaseStage = 'assessment' | 'intervention' | 'complete';

/**
 * Instructor's verbal description and clinical context for each phase
 */
export type PracticalPhase = {
  page: ResusGpsPage;
  clinicalObjective: string;
  instructorDescription: string;
  
  // Assessment: What findings should the learner identify?
  assessmentFindings: {
    name: string;
    description: string;
    critical: boolean; // Must be selected to pass
  }[];
  
  // Intervention: What actions should the learner take?
  interventions: {
    name: string;
    description: string;
    required: boolean; // Must be selected to proceed
    dose?: string; // e.g., "20 mL/kg"
    route?: string; // e.g., "IV/IO"
  }[];
  
  // Validation feedback
  successMessage: string;
  hints?: string[];
};

export type PracticalScenarioState = {
  currentPhaseIndex: number;
  currentPhase: PracticalPhase | null;
  currentStage: PhaseStage; // 'assessment' | 'intervention' | 'complete'
  
  // Assessment tracking
  selectedAssessmentFindings: string[];
  assessmentCorrect: boolean;
  assessmentFeedback: string;
  
  // Intervention tracking
  selectedInterventions: string[];
  interventionCorrect: boolean;
  interventionFeedback: string;
  
  // Overall progress
  score: number;
  correctPhases: number;
  totalPhases: number;
  isScenarioComplete: boolean;
  finalFeedback: string;
};

/**
 * All practical phases for the PALS Capstone
 */
const PRACTICAL_PHASES: PracticalPhase[] = [
  {
    page: 'pat_assessment',
    clinicalObjective: 'Primary Assessment (PAT)',
    instructorDescription: 'A 2-year-old child is brought to the ED. Look at the child: they appear anxious and are working hard to breathe. Their skin is pale and cool to touch.',
    assessmentFindings: [
      { name: 'Anxious appearance', description: 'Child looks frightened and distressed', critical: true },
      { name: 'Increased work of breathing', description: 'Using accessory muscles, retracting', critical: true },
      { name: 'Poor perfusion', description: 'Pale, cool skin; slow capillary refill', critical: true },
    ],
    interventions: [
      { name: 'Position for comfort', description: 'Allow child to sit in position of comfort', required: false },
      { name: 'Apply pulse oximetry', description: 'Attach SpO2 monitor', required: true },
      { name: 'Prepare for oxygen', description: 'Have oxygen source ready', required: true },
    ],
    successMessage: '✓ Excellent PAT assessment! You correctly identified respiratory distress with poor perfusion.',
    hints: [
      'Look at the child\'s overall appearance (Appearance)',
      'Observe their breathing effort (Work of Breathing)',
      'Check their skin color and warmth (Circulation)',
    ],
  },
  {
    page: 'airway',
    clinicalObjective: 'Airway Assessment (A)',
    instructorDescription: 'The child\'s airway is open, but they are gasping (RR 50). Their oxygen saturation is only 88%. They need oxygen immediately.',
    assessmentFindings: [
      { name: 'Patent airway', description: 'No stridor, no drooling, child can speak', critical: true },
      { name: 'Tachypnea', description: 'Respiratory rate 50 breaths/min', critical: true },
      { name: 'Hypoxia', description: 'SpO2 88%', critical: true },
    ],
    interventions: [
      { name: 'Apply high-flow oxygen', description: '10-15 L/min via non-rebreather mask', required: true },
      { name: 'Position airway', description: 'Neutral head position, sniffing position if needed', required: true },
      { name: 'Prepare airway adjunct', description: 'Have airway equipment at bedside', required: false },
    ],
    successMessage: '✓ Perfect! You recognized hypoxia and applied oxygen. SpO2 should improve shortly.',
    hints: [
      'Check if the airway is open (patent)',
      'Note the rapid breathing (tachypnea)',
      'Recognize the low oxygen saturation (hypoxia)',
      'High-flow oxygen is the priority intervention',
    ],
  },
  {
    page: 'breathing',
    clinicalObjective: 'Breathing Assessment (B)',
    instructorDescription: 'After oxygen, SpO2 improves to 92%, but the child is still breathing fast (RR 48) and working hard. You hear decreased breath sounds at the bases.',
    assessmentFindings: [
      { name: 'Decreased breath sounds at bases', description: 'Suggests pneumonia or pulmonary edema', critical: true },
      { name: 'Persistent tachypnea', description: 'RR still 48 despite oxygen', critical: true },
      { name: 'Continued work of breathing', description: 'Still using accessory muscles', critical: false },
    ],
    interventions: [
      { name: 'Perform auscultation', description: 'Listen to lungs bilaterally', required: true },
      { name: 'Consider respiratory support', description: 'Prepare for possible CPAP or mechanical ventilation', required: true },
      { name: 'Obtain chest X-ray', description: 'Confirm pneumonia or other pathology', required: false },
    ],
    successMessage: '✓ Good assessment! The decreased breath sounds suggest pneumonia. Prepare for possible respiratory support.',
    hints: [
      'Listen carefully to the lungs (auscultation)',
      'Note that breathing is still fast despite oxygen',
      'Consider what the decreased breath sounds mean',
      'Prepare for escalated respiratory support',
    ],
  },
  {
    page: 'circulation',
    clinicalObjective: 'Circulation Assessment (C)',
    instructorDescription: 'The child\'s heart is racing at 140 bpm. Blood pressure is low (85/50). Capillary refill is slow (3 seconds). Skin is still pale and cool.',
    assessmentFindings: [
      { name: 'Tachycardia', description: 'Heart rate 140 bpm', critical: true },
      { name: 'Hypotension', description: 'BP 85/50 mmHg (low for age)', critical: true },
      { name: 'Delayed capillary refill', description: '3 seconds (normal is <2 seconds)', critical: true },
      { name: 'Poor perfusion', description: 'Pale, cool peripheries', critical: true },
    ],
    interventions: [
      { name: 'Establish IV access', description: 'Insert peripheral IV or IO', required: true },
      { name: 'Prepare fluid bolus', description: '20 mL/kg normal saline (240 mL for 12 kg child)', required: true },
      { name: 'Administer fluid bolus', description: 'Run bolus over 15-20 minutes', required: true },
      { name: 'Prepare vasopressors', description: 'Have epinephrine ready if no response to fluids', required: false },
    ],
    successMessage: '✓ Excellent! You recognized shock and initiated fluid resuscitation. Monitor response closely.',
    hints: [
      'Check the heart rate (tachycardia)',
      'Check blood pressure (hypotension)',
      'Check capillary refill (delayed = poor perfusion)',
      'Recognize these signs = shock requiring immediate fluids',
    ],
  },
  {
    page: 'disability',
    clinicalObjective: 'Disability Assessment (D)',
    instructorDescription: 'The child is alert and responding to voice. No seizures. Pupils are equal and reactive. No focal neurological deficits.',
    assessmentFindings: [
      { name: 'Alert consciousness', description: 'Child is awake and responsive to voice', critical: true },
      { name: 'No seizures', description: 'No convulsive activity observed', critical: true },
      { name: 'Equal reactive pupils', description: 'Pupils 3mm, equal, reactive to light', critical: false },
      { name: 'Normal motor response', description: 'Moves all extremities', critical: false },
    ],
    interventions: [
      { name: 'Perform AVPU assessment', description: 'Alert, Voice, Pain, Unresponsive', required: true },
      { name: 'Check pupils', description: 'Size, equality, reactivity', required: true },
      { name: 'Assess motor/sensory', description: 'Check for focal deficits', required: false },
      { name: 'Prepare seizure precautions', description: 'Have benzodiazepines ready', required: false },
    ],
    successMessage: '✓ Good! Neurological status is stable. Continue resuscitation.',
    hints: [
      'Check consciousness level',
      'Look for any seizure activity',
      'Check pupil size and reactivity',
      'Assess for focal neurological deficits',
    ],
  },
  {
    page: 'exposure',
    clinicalObjective: 'Exposure Assessment (E)',
    instructorDescription: 'You expose the child and find a petechial rash on the trunk and limbs. Temperature is 39.2°C. No other obvious injuries.',
    assessmentFindings: [
      { name: 'Petechial rash', description: 'Non-blanching rash on trunk and limbs', critical: true },
      { name: 'Fever', description: 'Temperature 39.2°C', critical: true },
      { name: 'No obvious injuries', description: 'No trauma, no bleeding', critical: false },
    ],
    interventions: [
      { name: 'Recognize sepsis', description: 'Fever + rash + shock = septic shock', required: true },
      { name: 'Prepare antibiotics', description: 'Ceftriaxone or cefotaxime IV', required: true },
      { name: 'Culture blood', description: 'Draw blood cultures before antibiotics', required: true },
      { name: 'Continue fluid resuscitation', description: 'Aggressive fluids for septic shock', required: true },
    ],
    successMessage: '✓ Critical finding! Petechiae + fever + shock = meningococcal sepsis. Antibiotics are urgent.',
    hints: [
      'Look carefully at the skin (rash)',
      'Check temperature (fever)',
      'Consider what the rash and fever suggest',
      'This is a medical emergency requiring immediate antibiotics',
    ],
  },
  {
    page: 'sample_history',
    clinicalObjective: 'SAMPLE History',
    instructorDescription: 'Mother reports: child was well 2 days ago, then developed fever and cough. No known allergies. Last meal was 4 hours ago. No chronic medications.',
    assessmentFindings: [
      { name: 'Acute onset', description: 'Well 2 days ago, now critically ill', critical: true },
      { name: 'Fever and cough', description: 'Respiratory symptoms', critical: true },
      { name: 'No allergies', description: 'Safe to give any medication', critical: false },
      { name: 'Recent meal', description: 'Last ate 4 hours ago', critical: false },
    ],
    interventions: [
      { name: 'Obtain full SAMPLE', description: 'Symptoms, Allergies, Medications, PMHx, Last meal, Events', required: true },
      { name: 'Document timeline', description: 'When did symptoms start?', required: true },
      { name: 'Contact infection control', description: 'Possible meningococcal disease', required: true },
      { name: 'Notify ICU', description: 'Prepare for possible ICU admission', required: false },
    ],
    successMessage: '✓ Good history! Acute fever + cough + shock = likely septic shock from pneumonia/meningitis.',
    hints: [
      'Ask about Symptoms (fever, cough)',
      'Ask about Allergies',
      'Ask about Medications',
      'Ask about Last meal',
      'Ask about Events leading up to this',
    ],
  },
  {
    page: 'cardiac_arrest',
    clinicalObjective: 'Cardiac Arrest Recognition & CPR',
    instructorDescription: 'Suddenly, the child becomes unresponsive. You cannot feel a pulse. The monitor shows asystole. START CPR IMMEDIATELY!',
    assessmentFindings: [
      { name: 'Unresponsive', description: 'No response to voice or pain', critical: true },
      { name: 'No pulse', description: 'No pulse palpated for 10 seconds', critical: true },
      { name: 'Asystole on monitor', description: 'Flat line, no electrical activity', critical: true },
    ],
    interventions: [
      { name: 'Start CPR immediately', description: 'Begin chest compressions at 100-120/min', required: true },
      { name: 'Call for help', description: 'Activate code blue, get crash cart', required: true },
      { name: 'Attach defibrillator', description: 'Place pads, analyze rhythm', required: true },
      { name: 'Prepare medications', description: 'Epinephrine 0.01 mg/kg IV/IO', required: true },
    ],
    successMessage: '✓ You recognized cardiac arrest and started CPR. Continue high-quality CPR and prepare for advanced interventions.',
    hints: [
      'Check responsiveness (unresponsive)',
      'Check for a pulse (10 seconds max)',
      'Look at the cardiac monitor (asystole)',
      'START CPR IMMEDIATELY',
      'Call for help and get the crash cart',
    ],
  },
  {
    page: 'cpr_clock',
    clinicalObjective: 'CPR Management & Medications',
    instructorDescription: 'CPR is ongoing. At 3 minutes, give epinephrine 0.01 mg/kg IV. Continue CPR. At 5 minutes, reassess rhythm.',
    assessmentFindings: [
      { name: 'CPR ongoing', description: 'Compressions at 100-120/min', critical: true },
      { name: 'Rhythm check at 2 min', description: 'Reassess every 2 minutes', critical: true },
      { name: 'Medication timing', description: 'Epinephrine every 3-5 minutes', critical: true },
    ],
    interventions: [
      { name: 'Continue CPR', description: 'Maintain compressions without interruption', required: true },
      { name: 'Give epinephrine', description: '0.01 mg/kg IV/IO at 3 minutes', required: true },
      { name: 'Reassess rhythm', description: 'Every 2 minutes', required: true },
      { name: 'Prepare defibrillation', description: 'If VF/pulseless VT develops', required: false },
    ],
    successMessage: '✓ Good medication management! Continue CPR and monitor for rhythm change.',
    hints: [
      'Calculate epinephrine dose: 0.01 mg/kg',
      'Give it IV/IO every 3-5 minutes',
      'Continue CPR between medications',
      'Reassess rhythm every 2 minutes',
    ],
  },
  {
    page: 'post_resuscitation',
    clinicalObjective: 'ROSC & Post-Resuscitation Care',
    instructorDescription: 'After 8 minutes of CPR, you see a pulse! Heart rate is 80 bpm, BP is 95/60. The child is still unresponsive. Prepare for post-resuscitation care.',
    assessmentFindings: [
      { name: 'ROSC achieved', description: 'Return of spontaneous circulation', critical: true },
      { name: 'Pulse present', description: 'Palpable pulse, HR 80 bpm', critical: true },
      { name: 'Adequate perfusion', description: 'BP 95/60, improving color', critical: true },
      { name: 'Still unresponsive', description: 'Post-resuscitation encephalopathy', critical: false },
    ],
    interventions: [
      { name: 'Confirm ROSC', description: 'Pulse check, monitor, capnography', required: true },
      { name: 'Continue supportive care', description: 'Oxygen, fluids, monitoring', required: true },
      { name: 'Prepare for ICU transfer', description: 'Arrange transport', required: true },
      { name: 'Initiate therapeutic hypothermia', description: 'Consider if available', required: false },
    ],
    successMessage: '✓ Excellent! You successfully resuscitated the child. Now focus on post-resuscitation care and preventing complications.',
    hints: [
      'Confirm ROSC (return of spontaneous circulation)',
      'Check vital signs',
      'Prepare for ICU transfer',
      'Continue supportive care',
    ],
  },
];

/**
 * Initialize the practical scenario
 */
export function initializePracticalScenario(): PracticalScenarioState {
  return {
    currentPhaseIndex: 0,
    currentPhase: PRACTICAL_PHASES[0],
    currentStage: 'assessment',
    selectedAssessmentFindings: [],
    assessmentCorrect: false,
    assessmentFeedback: '',
    selectedInterventions: [],
    interventionCorrect: false,
    interventionFeedback: '',
    score: 0,
    correctPhases: 0,
    totalPhases: PRACTICAL_PHASES.length,
    isScenarioComplete: false,
    finalFeedback: '',
  };
}

/**
 * Validate learner's assessment findings
 */
export function validateAssessment(
  state: PracticalScenarioState,
  selectedFindings: string[]
): PracticalScenarioState {
  if (!state.currentPhase) return state;

  const criticalFindings = state.currentPhase.assessmentFindings
    .filter((f) => f.critical)
    .map((f) => f.name);

  const correct = criticalFindings.every((f) => selectedFindings.includes(f));

  return {
    ...state,
    selectedAssessmentFindings: selectedFindings,
    assessmentCorrect: correct,
    assessmentFeedback: correct
      ? '✓ Assessment correct! Now choose the appropriate interventions.'
      : '✗ Not quite right. Make sure you\'ve selected all critical findings.',
    currentStage: 'intervention',
  };
}

/**
 * Validate learner's interventions
 */
export function validateIntervention(
  state: PracticalScenarioState,
  selectedInterventions: string[]
): PracticalScenarioState {
  if (!state.currentPhase) return state;

  const requiredInterventions = state.currentPhase.interventions
    .filter((i) => i.required)
    .map((i) => i.name);

  const correct = requiredInterventions.every((i) => selectedInterventions.includes(i));

  return {
    ...state,
    selectedInterventions: selectedInterventions,
    interventionCorrect: correct,
    interventionFeedback: correct
      ? state.currentPhase.successMessage
      : '✗ Missing required interventions. Review and try again.',
    currentStage: correct ? 'complete' : 'intervention',
  };
}

/**
 * Move to the next phase
 */
export function advancePhase(state: PracticalScenarioState): PracticalScenarioState {
  const nextPhaseIndex = state.currentPhaseIndex + 1;

  if (nextPhaseIndex >= PRACTICAL_PHASES.length) {
    // Scenario complete
    const finalScore = calculateFinalScore(state);
    return {
      ...state,
      isScenarioComplete: true,
      score: finalScore,
      finalFeedback: `Scenario Complete! Final Score: ${finalScore}%`,
    };
  }

  const nextPhase = PRACTICAL_PHASES[nextPhaseIndex];
  return {
    ...state,
    currentPhaseIndex: nextPhaseIndex,
    currentPhase: nextPhase,
    currentStage: 'assessment',
    selectedAssessmentFindings: [],
    assessmentCorrect: false,
    assessmentFeedback: '',
    selectedInterventions: [],
    interventionCorrect: false,
    interventionFeedback: '',
    correctPhases: state.assessmentCorrect && state.interventionCorrect
      ? state.correctPhases + 1
      : state.correctPhases,
    score: state.assessmentCorrect && state.interventionCorrect
      ? state.score + 10
      : state.score,
  };
}

/**
 * Calculate final score
 */
export function calculateFinalScore(state: PracticalScenarioState): number {
  const baseScore = (state.correctPhases / state.totalPhases) * 100;
  return Math.min(100, Math.round(baseScore));
}
