/**
 * Status Asthmaticus Clinical Engine
 * 
 * Provides sequential decision support for severe asthma exacerbation management.
 * Follows AHA ECC and PALS guidelines with weight-based medication calculations.
 * 
 * Clinical Framework:
 * 1. ASSESS: Severity (mild, moderate, severe, life-threatening)
 * 2. INTERVENE: Oxygen, bronchodilators, corticosteroids, magnesium
 * 3. ESCALATE: ICU admission criteria and intubation readiness
 * 4. REASSESS: Response to therapy every 15-30 minutes
 */

export type AsthmaticSeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type AsthmaticPhase = 'assessment' | 'initial_treatment' | 'escalation' | 'reassessment' | 'icu_admission';

export interface AsthmaticEngineState {
  patientWeight: number; // kg
  patientAgeMonths: number;
  severity: AsthmaticSeverity;
  phase: AsthmaticPhase;
  
  // Clinical findings
  respiratoryRate: number;
  oxygenSaturation: number; // percentage
  peakFlowPercent?: number; // % of predicted
  accessoryMusclUse: boolean;
  speakingAbility: 'full_sentences' | 'phrases' | 'words' | 'unable';
  alertness: 'alert' | 'agitated' | 'drowsy' | 'unresponsive';
  
  // Treatment tracking
  oxygenStarted: boolean;
  salbutamolDoses: number;
  ipratropiumDoses: number;
  corticosteroidDoses: number;
  magnesiumDoses: number;
  
  // Time tracking
  symptomOnsetTime: number; // seconds from presentation
  lastBronchodilatorTime?: number;
  lastSteroidTime?: number;
  
  // Response assessment
  responseToInitialTherapy: 'good' | 'partial' | 'poor' | 'unknown';
}

/**
 * Assess severity based on clinical findings
 * Follows GINA and AHA guidelines
 */
export const assessSeverity = (findings: {
  respiratoryRate: number;
  oxygenSaturation: number;
  peakFlowPercent?: number;
  accessoryMusclUse: boolean;
  speakingAbility: string;
  alertness: string;
  patientAgeMonths: number;
}): AsthmaticSeverity => {
  const { respiratoryRate, oxygenSaturation, peakFlowPercent, accessoryMusclUse, speakingAbility, alertness, patientAgeMonths } = findings;

  // Life-threatening signs (immediate ICU criteria)
  if (
    alertness === 'drowsy' || 
    alertness === 'unresponsive' ||
    oxygenSaturation < 90 ||
    speakingAbility === 'unable' ||
    (peakFlowPercent && peakFlowPercent < 25)
  ) {
    return 'life_threatening';
  }

  // Severe asthma
  if (
    accessoryMusclUse &&
    speakingAbility === 'words' &&
    oxygenSaturation < 92 &&
    (peakFlowPercent && peakFlowPercent < 50)
  ) {
    return 'severe';
  }

  // Moderate asthma
  if (
    accessoryMusclUse &&
    (speakingAbility === 'phrases' || speakingAbility === 'words') &&
    oxygenSaturation < 95 &&
    (peakFlowPercent && peakFlowPercent < 80)
  ) {
    return 'moderate';
  }

  // Mild asthma
  return 'mild';
};

/**
 * Determine next clinical phase based on severity and response
 */
export const determinePhase = (state: AsthmaticEngineState): AsthmaticPhase => {
  if (state.alertness === 'unresponsive' || state.alertness === 'drowsy') {
    return 'icu_admission';
  }

  if (state.severity === 'life_threatening') {
    return 'escalation';
  }

  if (state.responseToInitialTherapy === 'poor' && state.phase === 'initial_treatment') {
    return 'escalation';
  }

  if (state.phase === 'initial_treatment' && state.responseToInitialTherapy === 'good') {
    return 'reassessment';
  }

  return state.phase;
};

/**
 * Calculate salbutamol (albuterol) dose
 * Nebulized: 0.15 mg/kg per dose (max 5 mg)
 * Can repeat every 15-20 minutes
 */
export const calculateSalbutamolDose = (patientWeight: number): { dose: number; unit: string; route: string; frequency: string } => {
  const dosePerKg = 0.15;
  const maxDose = 5;
  const dose = Math.min(patientWeight * dosePerKg, maxDose);

  return {
    dose: parseFloat(dose.toFixed(2)),
    unit: 'mg',
    route: 'Nebulized',
    frequency: 'Every 15-20 minutes (up to 3 doses in first hour)',
  };
};

/**
 * Calculate ipratropium dose (anticholinergic)
 * Nebulized: 0.25 mg per dose
 * Combined with salbutamol for severe asthma
 */
export const calculateIpratropiumDose = (patientWeight: number): { dose: number; unit: string; route: string; indication: string } => {
  return {
    dose: 0.25,
    unit: 'mg',
    route: 'Nebulized',
    indication: 'Combined with salbutamol for severe or life-threatening asthma',
  };
};

/**
 * Calculate corticosteroid dose
 * Prednisolone/Prednisone: 1-2 mg/kg (max 50 mg)
 * Dexamethasone: 0.6 mg/kg (max 10 mg)
 */
export const calculateCorticosteroidDose = (
  patientWeight: number,
  agent: 'prednisolone' | 'dexamethasone' = 'prednisolone'
): { dose: number; unit: string; route: string; frequency: string; notes: string } => {
  let dose: number;
  let frequency: string;
  let notes: string;

  if (agent === 'prednisolone') {
    dose = Math.min(patientWeight * 1.5, 50); // 1-2 mg/kg, max 50 mg
    frequency = 'Once daily for 3-5 days';
    notes = 'Can be given IV or PO';
  } else {
    dose = Math.min(patientWeight * 0.6, 10); // 0.6 mg/kg, max 10 mg
    frequency = 'Once daily for 1-2 days';
    notes = 'Single dose often sufficient; longer half-life than prednisolone';
  }

  return {
    dose: parseFloat(dose.toFixed(2)),
    unit: 'mg',
    route: 'IV or PO',
    frequency,
    notes,
  };
};

/**
 * Calculate magnesium sulfate dose (for severe/life-threatening asthma)
 * IV: 25-50 mg/kg (max 2 g) over 20 minutes
 */
export const calculateMagnesiumDose = (patientWeight: number): { dose: number; unit: string; route: string; duration: string; indication: string } => {
  const dose = Math.min(patientWeight * 40, 2000); // 25-50 mg/kg, max 2 g

  return {
    dose: parseFloat(dose.toFixed(0)),
    unit: 'mg',
    route: 'IV',
    duration: 'Over 20 minutes',
    indication: 'For severe or life-threatening asthma with poor response to initial therapy',
  };
};

/**
 * Determine medication eligibility based on severity and treatment history
 */
export const evaluateMedicationEligibility = (
  state: AsthmaticEngineState
): {
  salbutamolEligible: boolean;
  ipratropiumEligible: boolean;
  corticosteroidEligible: boolean;
  magnesiumEligible: boolean;
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  const timeSinceLast = (lastTime?: number) => (lastTime ? state.symptomOnsetTime - lastTime : Infinity);

  // Salbutamol (always eligible, can repeat every 15-20 minutes)
  const salbutamolEligible = !state.lastBronchodilatorTime || timeSinceLast(state.lastBronchodilatorTime) >= 900; // 15 minutes
  if (salbutamolEligible && state.salbutamolDoses < 3) {
    recommendations.push(`Give salbutamol dose ${state.salbutamolDoses + 1}`);
  }

  // Ipratropium (for severe/life-threatening, combined with salbutamol)
  const ipratropiumEligible = (state.severity === 'severe' || state.severity === 'life_threatening') && state.ipratropiumDoses === 0;
  if (ipratropiumEligible) {
    recommendations.push('Consider ipratropium combined with salbutamol for severe asthma');
  }

  // Corticosteroid (all severities, once per admission)
  const corticosteroidEligible = state.corticosteroidDoses === 0;
  if (corticosteroidEligible) {
    recommendations.push('Give corticosteroid (prednisolone or dexamethasone)');
  }

  // Magnesium (severe/life-threatening with poor response)
  const magnesiumEligible =
    (state.severity === 'severe' || state.severity === 'life_threatening') &&
    state.magnesiumDoses === 0 &&
    state.responseToInitialTherapy === 'poor';
  if (magnesiumEligible) {
    recommendations.push('Consider IV magnesium sulfate for poor response to initial therapy');
  }

  return {
    salbutamolEligible,
    ipratropiumEligible,
    corticosteroidEligible,
    magnesiumEligible,
    recommendations,
  };
};

/**
 * Determine ICU admission criteria
 */
export const evaluateIcuAdmissionCriteria = (state: AsthmaticEngineState): {
  requiresIcu: boolean;
  criteria: string[];
  recommendations: string[];
} => {
  const criteria: string[] = [];
  const recommendations: string[] = [];

  // Immediate ICU criteria
  if (state.alertness === 'drowsy' || state.alertness === 'unresponsive') {
    criteria.push('Altered consciousness (drowsy or unresponsive)');
    recommendations.push('Prepare for intubation and mechanical ventilation');
  }

  if (state.oxygenSaturation < 90) {
    criteria.push('Severe hypoxemia (SpO2 < 90%)');
    recommendations.push('Increase oxygen delivery; consider non-invasive ventilation');
  }

  if (state.speakingAbility === 'unable') {
    criteria.push('Unable to speak (severe airway obstruction)');
    recommendations.push('Prepare for emergency airway management');
  }

  if (state.responseToInitialTherapy === 'poor' && state.salbutamolDoses >= 3) {
    criteria.push('Poor response to aggressive bronchodilator therapy');
    recommendations.push('Consider ICU admission for continuous nebulization or IV therapy');
  }

  // Escalation criteria
  if (state.severity === 'life_threatening') {
    criteria.push('Life-threatening asthma classification');
    recommendations.push('Escalate to ICU; prepare for advanced airway management');
  }

  return {
    requiresIcu: criteria.length > 0,
    criteria,
    recommendations,
  };
};

/**
 * Assess response to initial therapy (after first 1-2 hours)
 */
export const assessTherapyResponse = (
  initialState: AsthmaticEngineState,
  currentState: AsthmaticEngineState
): 'good' | 'partial' | 'poor' => {
  // Good response: improved SpO2, decreased respiratory rate, reduced accessory muscle use
  if (
    currentState.oxygenSaturation >= initialState.oxygenSaturation + 3 &&
    currentState.respiratoryRate <= initialState.respiratoryRate - 5 &&
    !currentState.accessoryMusclUse
  ) {
    return 'good';
  }

  // Poor response: no improvement or worsening
  if (
    currentState.oxygenSaturation <= initialState.oxygenSaturation ||
    currentState.respiratoryRate >= initialState.respiratoryRate ||
    currentState.severity > initialState.severity
  ) {
    return 'poor';
  }

  // Partial response: some improvement but not complete
  return 'partial';
};

/**
 * Generate clinical recommendation based on current state
 */
export const generateRecommendation = (state: AsthmaticEngineState): string => {
  const severity = state.severity.toUpperCase().replace('_', ' ');

  if (state.alertness === 'unresponsive' || state.alertness === 'drowsy') {
    return `EMERGENCY: Patient has altered consciousness. Prepare for intubation and ICU admission immediately.`;
  }

  if (state.severity === 'life_threatening') {
    return `LIFE-THREATENING ASTHMA: Aggressive treatment required. Consider ICU admission, continuous nebulization, and IV magnesium.`;
  }

  if (state.responseToInitialTherapy === 'poor') {
    return `POOR RESPONSE TO THERAPY: Escalate care. Consider IV bronchodilators, magnesium sulfate, and ICU admission.`;
  }

  if (state.responseToInitialTherapy === 'good') {
    return `GOOD RESPONSE: Continue current therapy. Plan for discharge with follow-up and asthma action plan.`;
  }

  return `${severity} ASTHMA: Continue current management. Reassess in 15-30 minutes.`;
};
