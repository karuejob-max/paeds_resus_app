/**
 * Phase Validation System for ABCDE Assessment
 * Enforces strict sequential progression through clinical assessment phases
 */

interface ABCDEAssessment {
  responsiveness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | null;
  airwayPatency: 'patent' | 'at-risk' | 'obstructed' | null;
  auscultationFindings: string[];
  breathingAdequate: boolean | null;
  respiratoryRate: number | null;
  spO2: number | null;
  breathingAuscultation: string[];
  pulsePresent: boolean | null;
  heartRate: number | null;
  systolicBP: number | null;
  pulseCharacter: 'strong-central-strong-peripheral' | 'strong-central-weak-peripheral' | 'weak-both' | null;
  skinPerfusion: 'warm' | 'cool' | 'cold' | null;
  capillaryRefill: number | null;
  circulationAuscultation: string[];
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | null;
  pupils: 'normal' | 'dilated' | 'constricted' | 'unequal' | null;
  glucose: number | null;
  seizureActivity: boolean | null;
  temperature: number | null;
  rash: boolean | null;
  rashType: string | null;
}

interface PhaseValidationResult {
  isComplete: boolean;
  errors: string[];
  criticalFindingsUnresolved: string[];
  canAdvance: boolean;
}

/**
 * AIRWAY (A) Phase Validation
 */
export const validateAirwayPhase = (assessment: ABCDEAssessment): PhaseValidationResult => {
  const errors: string[] = [];
  const criticalFindings: string[] = [];

  if (assessment.responsiveness === null) {
    errors.push('Responsiveness must be assessed (AVPU)');
  }

  if (assessment.airwayPatency === null) {
    errors.push('Airway patency must be assessed');
  }

  if (assessment.responsiveness === 'unresponsive') {
    criticalFindings.push('Child is unresponsive - airway protection required');
  }

  if (assessment.airwayPatency === 'obstructed') {
    criticalFindings.push('Airway is obstructed - immediate intervention required');
  }

  if (assessment.airwayPatency === 'at-risk') {
    criticalFindings.push('Airway at risk - close monitoring and preparation for intervention');
  }

  return {
    isComplete: errors.length === 0,
    errors,
    criticalFindingsUnresolved: criticalFindings,
    canAdvance: errors.length === 0 && criticalFindings.length === 0,
  };
};

/**
 * BREATHING (B) Phase Validation
 */
export const validateBreathingPhase = (assessment: ABCDEAssessment): PhaseValidationResult => {
  const errors: string[] = [];
  const criticalFindings: string[] = [];

  if (assessment.breathingAdequate === null) {
    errors.push('Breathing adequacy must be assessed');
  }

  if (assessment.respiratoryRate === null) {
    errors.push('Respiratory rate must be recorded');
  }

  if (assessment.spO2 === null) {
    errors.push('SpO2 must be recorded');
  }

  if (assessment.breathingAdequate === false) {
    criticalFindings.push('Breathing is inadequate - high-flow oxygen and airway assessment required');
  }

  if (assessment.spO2 !== null && assessment.spO2 < 90) {
    criticalFindings.push(`SpO2 critically low (${assessment.spO2}%) - high-flow oxygen required`);
  }

  return {
    isComplete: errors.length === 0,
    errors,
    criticalFindingsUnresolved: criticalFindings,
    canAdvance: errors.length === 0 && criticalFindings.length === 0,
  };
};

/**
 * CIRCULATION (C) Phase Validation
 */
export const validateCirculationPhase = (assessment: ABCDEAssessment): PhaseValidationResult => {
  const errors: string[] = [];
  const criticalFindings: string[] = [];

  if (assessment.pulsePresent === null) {
    errors.push('Pulse presence must be assessed');
  }

  if (assessment.heartRate === null) {
    errors.push('Heart rate must be recorded');
  }

  if (assessment.systolicBP === null) {
    errors.push('Systolic BP must be recorded');
  }

  if (assessment.skinPerfusion === null) {
    errors.push('Skin perfusion must be assessed');
  }

  if (assessment.capillaryRefill === null) {
    errors.push('Capillary refill must be assessed');
  }

  if (assessment.pulsePresent === false) {
    criticalFindings.push('NO PULSE DETECTED - START CPR IMMEDIATELY');
  }

  if (assessment.skinPerfusion === 'cold' || assessment.skinPerfusion === 'cool') {
    criticalFindings.push('Cold/cool extremities indicate shock - fluid resuscitation required');
  }

  if (assessment.capillaryRefill !== null && assessment.capillaryRefill > 2) {
    criticalFindings.push(`Prolonged capillary refill (${assessment.capillaryRefill}s) - shock present`);
  }

  return {
    isComplete: errors.length === 0,
    errors,
    criticalFindingsUnresolved: criticalFindings,
    canAdvance: errors.length === 0 && criticalFindings.length === 0,
  };
};

/**
 * DISABILITY (D) Phase Validation
 */
export const validateDisabilityPhase = (assessment: ABCDEAssessment): PhaseValidationResult => {
  const errors: string[] = [];
  const criticalFindings: string[] = [];

  if (assessment.consciousness === null) {
    errors.push('Consciousness level must be assessed (AVPU)');
  }

  if (assessment.pupils === null) {
    errors.push('Pupil assessment must be completed');
  }

  if (assessment.glucose === null) {
    errors.push('Blood glucose must be checked');
  }

  if (assessment.seizureActivity === null) {
    errors.push('Seizure activity must be assessed');
  }

  if (assessment.consciousness === 'unresponsive') {
    criticalFindings.push('Child is unresponsive - secure airway and assess for cause');
  }

  if (assessment.pupils === 'dilated' || assessment.pupils === 'constricted' || assessment.pupils === 'unequal') {
    criticalFindings.push(`Abnormal pupils (${assessment.pupils}) - assess for head injury or neurological emergency`);
  }

  if (assessment.glucose !== null && assessment.glucose < 70) {
    criticalFindings.push(`Hypoglycemia detected (${assessment.glucose} mg/dL) - give IV dextrose immediately`);
  }

  if (assessment.seizureActivity === true) {
    criticalFindings.push('Active seizure detected - give benzodiazepine and secure airway');
  }

  return {
    isComplete: errors.length === 0,
    errors,
    criticalFindingsUnresolved: criticalFindings,
    canAdvance: errors.length === 0 && criticalFindings.length === 0,
  };
};

/**
 * EXPOSURE (E) Phase Validation
 */
export const validateExposurePhase = (assessment: ABCDEAssessment): PhaseValidationResult => {
  const errors: string[] = [];
  const criticalFindings: string[] = [];

  if (assessment.temperature === null) {
    errors.push('Temperature must be recorded');
  }

  if (assessment.rash === null) {
    errors.push('Rash presence must be assessed');
  }

  if (assessment.temperature !== null && assessment.temperature > 38.5) {
    criticalFindings.push(`High fever (${assessment.temperature}°C) - assess for sepsis`);
  }

  if (assessment.temperature !== null && assessment.temperature < 36) {
    criticalFindings.push(`Hypothermia (${assessment.temperature}°C) - assess for shock or environmental exposure`);
  }

  if (assessment.rash === true) {
    criticalFindings.push('Rash present - assess for meningococcemia or other serious infection');
    if (!assessment.rashType) {
      errors.push('Rash type must be described');
    }
  }

  return {
    isComplete: errors.length === 0,
    errors,
    criticalFindingsUnresolved: criticalFindings,
    canAdvance: errors.length === 0 && criticalFindings.length === 0,
  };
};

export const getPhaseValidation = (
  phase: 'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure',
  assessment: ABCDEAssessment
): PhaseValidationResult => {
  switch (phase) {
    case 'airway':
      return validateAirwayPhase(assessment);
    case 'breathing':
      return validateBreathingPhase(assessment);
    case 'circulation':
      return validateCirculationPhase(assessment);
    case 'disability':
      return validateDisabilityPhase(assessment);
    case 'exposure':
      return validateExposurePhase(assessment);
    default:
      return { isComplete: false, errors: [], criticalFindingsUnresolved: [], canAdvance: false };
  }
};
