/**
 * Anaphylactic Shock Clinical Engine
 * 
 * Provides rapid decision support for anaphylaxis management.
 * Follows AHA ECC and World Allergy Organization (WAO) guidelines.
 * Time-critical: Epinephrine must be given within minutes.
 * 
 * Clinical Framework:
 * 1. RECOGNIZE: Anaphylaxis symptoms (respiratory, cardiovascular, skin, GI)
 * 2. TREAT: Epinephrine IM immediately (0.01 mg/kg, max 0.5 mg)
 * 3. SUPPORT: IV access, oxygen, antihistamines, corticosteroids
 * 4. MONITOR: Biphasic reactions (recurrence 1-72 hours)
 * 5. ESCALATE: ICU if cardiovascular collapse
 */

export type AnaphylaxisSeverity = 'mild' | 'moderate' | 'severe' | 'cardiovascular_collapse';
export type AnaphylaxisPhase = 'recognition' | 'epinephrine_given' | 'supportive_care' | 'monitoring' | 'icu_admission';
export type AnaphylaxisSystemInvolved = 'respiratory' | 'cardiovascular' | 'cutaneous' | 'gastrointestinal' | 'neurological';

export interface AnaphylaxisEngineState {
  patientWeight: number; // kg
  patientAgeMonths: number;
  severity: AnaphylaxisSeverity;
  phase: AnaphylaxisPhase;
  
  // Clinical findings
  systemsInvolved: AnaphylaxisSystemInvolved[];
  respiratoryRate: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation: number; // percentage
  skinFindings: 'urticaria' | 'angioedema' | 'flushing' | 'none';
  wheezing: boolean;
  stridor: boolean;
  hypotension: boolean;
  
  // Treatment tracking
  epinephrineDoses: number;
  lastEpinephrineTime?: number;
  ivAccessEstablished: boolean;
  antihistamineDoses: number;
  corticosteroidDoses: number;
  
  // Time tracking
  symptomOnsetTime: number; // seconds from presentation
  recognitionTime: number; // seconds from presentation to recognition
  
  // Trigger identification
  knownTrigger?: string; // e.g., "peanut", "penicillin", "bee sting"
  triggerExposureTime?: number;
}

/**
 * Assess anaphylaxis severity based on clinical findings
 * Follows WAO and AHA guidelines
 */
export const assessSeverity = (findings: {
  systemsInvolved: string[];
  respiratoryRate: number;
  heartRate: number;
  bloodPressureSystolic: number;
  oxygenSaturation: number;
  wheezing: boolean;
  stridor: boolean;
  hypotension: boolean;
  patientAgeMonths: number;
}): AnaphylaxisSeverity => {
  const { systemsInvolved, oxygenSaturation, wheezing, stridor, hypotension, bloodPressureSystolic, patientAgeMonths } = findings;

  // Cardiovascular collapse (shock) - only if hypotension is true
  if (hypotension) {
    return 'cardiovascular_collapse';
  }

  // Severe: respiratory compromise
  if ((wheezing || stridor) && oxygenSaturation < 94) {
    return 'severe';
  }

  // Severe: multiple system involvement with respiratory or cardiovascular signs
  if (systemsInvolved.length >= 2 && (wheezing || stridor)) {
    return 'severe';
  }

  // Moderate: respiratory or cardiovascular signs
  if (wheezing || stridor) {
    return 'moderate';
  }

  // Mild: single system involvement (usually cutaneous)
  return 'mild';
};

/**
 * Calculate epinephrine IM dose for anaphylaxis
 * IM: 0.01 mg/kg (max 0.5 mg) - FIRST LINE
 * Can repeat every 5-15 minutes if needed
 */
export const calculateEpinephrineImDose = (patientWeight: number): {
  dose: number;
  unit: string;
  concentration: string;
  volume: number;
  volumeUnit: string;
  route: string;
  site: string;
  frequency: string;
} => {
  const dosePerKg = 0.01;
  const maxDose = 0.5;
  const dose = Math.min(patientWeight * dosePerKg, maxDose);

  // Standard concentration: 1:1000 (1 mg/mL)
  const volume = dose; // 1 mg/mL, so volume in mL = dose in mg

  return {
    dose: parseFloat(dose.toFixed(3)),
    unit: 'mg',
    concentration: '1:1000 (1 mg/mL)',
    volume: parseFloat(volume.toFixed(2)),
    volumeUnit: 'mL',
    route: 'IM (intramuscular)',
    site: 'Anterolateral thigh (preferred)',
    frequency: 'Repeat every 5-15 minutes if symptoms persist',
  };
};

/**
 * Calculate epinephrine IV dose (if IM failed or cardiovascular collapse)
 * IV: 0.01 mg/kg bolus (max 0.5 mg), then infusion
 */
export const calculateEpinephrineIvDose = (patientWeight: number): {
  bolus: { dose: number; unit: string; concentration: string; volume: number; volumeUnit: string };
  infusion: { concentration: string; initialRate: number; rateUnit: string };
  indication: string;
} => {
  const bolusDose = Math.min(patientWeight * 0.01, 0.5);
  const bolusMl = bolusDose / 0.1; // 1:10,000 concentration (0.1 mg/mL)

  return {
    bolus: {
      dose: parseFloat(bolusDose.toFixed(3)),
      unit: 'mg',
      concentration: '1:10,000 (0.1 mg/mL)',
      volume: parseFloat(bolusMl.toFixed(2)),
      volumeUnit: 'mL',
    },
    infusion: {
      concentration: '1:10,000 (0.1 mg/mL)',
      initialRate: 0.1, // mL/kg/min
      rateUnit: 'mL/kg/min',
    },
    indication: 'IV access established and IM epinephrine failed, or cardiovascular collapse',
  };
};

/**
 * Calculate antihistamine dose (H1 blocker)
 * Diphenhydramine: 1-1.5 mg/kg IV/IM (max 50 mg)
 */
export const calculateAntihistamineDose = (patientWeight: number): {
  dose: number;
  unit: string;
  agent: string;
  route: string;
  frequency: string;
} => {
  const dose = Math.min(patientWeight * 1.25, 50); // 1-1.5 mg/kg, max 50 mg

  return {
    dose: parseFloat(dose.toFixed(1)),
    unit: 'mg',
    agent: 'Diphenhydramine',
    route: 'IV or IM',
    frequency: 'Once, after epinephrine and IV access',
  };
};

/**
 * Calculate corticosteroid dose (prevent biphasic reaction)
 * Methylprednisolone: 1-2 mg/kg IV (max 125 mg)
 */
export const calculateCorticosteroidDose = (patientWeight: number): {
  dose: number;
  unit: string;
  agent: string;
  route: string;
  frequency: string;
  indication: string;
} => {
  const dose = Math.min(patientWeight * 1.5, 125); // 1-2 mg/kg, max 125 mg

  return {
    dose: parseFloat(dose.toFixed(1)),
    unit: 'mg',
    agent: 'Methylprednisolone',
    route: 'IV',
    frequency: 'Once, after epinephrine',
    indication: 'Prevent biphasic anaphylaxis (recurrence 1-72 hours later)',
  };
};

/**
 * Determine next clinical phase based on severity and treatment
 */
export const determinePhase = (state: AnaphylaxisEngineState): AnaphylaxisPhase => {
  if (state.severity === 'cardiovascular_collapse') {
    return 'icu_admission';
  }

  if (state.epinephrineDoses === 0) {
    return 'recognition';
  }

  if (state.epinephrineDoses > 0 && state.antihistamineDoses === 0) {
    return 'epinephrine_given';
  }

  if (state.antihistamineDoses > 0) {
    return 'supportive_care';
  }

  return 'monitoring';
};

/**
 * Evaluate epinephrine eligibility and timing
 */
export const evaluateEpinephrineEligibility = (
  state: AnaphylaxisEngineState
): {
  eligible: boolean;
  urgent: boolean;
  timeSinceLast?: number;
  recommendation: string;
} => {
  const timeSinceLast = state.lastEpinephrineTime ? state.symptomOnsetTime - state.lastEpinephrineTime : Infinity;

  // First dose: always eligible
  if (state.epinephrineDoses === 0) {
    return {
      eligible: true,
      urgent: true,
      recommendation: 'GIVE EPINEPHRINE IM IMMEDIATELY (0.01 mg/kg, max 0.5 mg)',
    };
  }

  // Repeat dose: every 5-15 minutes if symptoms persist
  if (timeSinceLast >= 300) {
    // 5 minutes
    return {
      eligible: true,
      urgent: state.severity === 'severe' || state.severity === 'cardiovascular_collapse',
      timeSinceLast,
      recommendation: `Repeat epinephrine (dose ${state.epinephrineDoses + 1})`,
    };
  }

  return {
    eligible: false,
    urgent: false,
    timeSinceLast,
    recommendation: `Wait ${300 - timeSinceLast}s before next epinephrine dose`,
  };
};

/**
 * Evaluate ICU admission criteria
 */
export const evaluateIcuAdmissionCriteria = (state: AnaphylaxisEngineState): {
  requiresIcu: boolean;
  criteria: string[];
  recommendations: string[];
} => {
  const criteria: string[] = [];
  const recommendations: string[] = [];

  if (state.severity === 'cardiovascular_collapse') {
    criteria.push('Cardiovascular collapse (hypotension, shock)');
    recommendations.push('Aggressive fluid resuscitation, continuous epinephrine infusion, ICU monitoring');
  }

  if (state.wheezing && state.oxygenSaturation < 94) {
    criteria.push('Severe bronchospasm with hypoxemia');
    recommendations.push('Consider ICU for continuous monitoring and advanced airway management');
  }

  if (state.stridor) {
    criteria.push('Laryngeal edema (stridor)');
    recommendations.push('Prepare for emergency airway management; ICU admission');
  }

  if (state.epinephrineDoses > 2) {
    criteria.push('Multiple epinephrine doses required');
    recommendations.push('Consider ICU admission for continuous epinephrine infusion');
  }

  return {
    requiresIcu: criteria.length > 0,
    criteria,
    recommendations,
  };
};

/**
 * Identify potential trigger (for prevention counseling)
 */
export const identifyTrigger = (context: {
  recentFoodIntake?: string;
  recentMedicationExposure?: string;
  insectStingHistory?: boolean;
  latexExposure?: boolean;
  exerciseRelated?: boolean;
}): string[] => {
  const triggers: string[] = [];

  if (context.recentFoodIntake) triggers.push(`Food: ${context.recentFoodIntake}`);
  if (context.recentMedicationExposure) triggers.push(`Medication: ${context.recentMedicationExposure}`);
  if (context.insectStingHistory) triggers.push('Insect sting');
  if (context.latexExposure) triggers.push('Latex exposure');
  if (context.exerciseRelated) triggers.push('Exercise-induced');

  return triggers.length > 0 ? triggers : ['Unknown trigger'];
};

/**
 * Generate clinical recommendation based on current state
 */
export const generateRecommendation = (state: AnaphylaxisEngineState): string => {
  if (state.epinephrineDoses === 0) {
    return `ANAPHYLAXIS RECOGNIZED: Give epinephrine IM 0.01 mg/kg (max 0.5 mg) in anterolateral thigh IMMEDIATELY.`;
  }

  if (state.severity === 'cardiovascular_collapse') {
    return `ANAPHYLACTIC SHOCK: Aggressive fluid resuscitation, continuous epinephrine infusion, ICU admission. Prepare for intubation.`;
  }

  if (state.antihistamineDoses === 0) {
    return `Epinephrine given. Establish IV access and give antihistamine + corticosteroid to prevent biphasic reaction.`;
  }

  if (state.severity === 'severe') {
    return `Severe anaphylaxis. Monitor closely for 4-8 hours for biphasic reaction. Consider ICU observation.`;
  }

  return `Anaphylaxis managed. Observe for 4-8 hours. Prescribe epinephrine auto-injector and refer to allergy specialist.`;
};
