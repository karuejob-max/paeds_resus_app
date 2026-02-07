// Shock Differentiation Algorithm
// Critical for fluid management - giving fluids to cardiogenic shock kills

import type { PrimarySurveyData, Differential } from '../shared/clinical-types';

export type ShockType =
  | 'hypovolemic'
  | 'cardiogenic'
  | 'obstructive'
  | 'distributive_septic'
  | 'distributive_anaphylactic'
  | 'neurogenic'
  | 'undifferentiated';

export interface ShockAnalysis {
  type: ShockType;
  probability: number;
  evidence: string[];
  fluidRecommendation: 'bolus' | 'cautious' | 'avoid';
  immediateActions: string[];
}

/**
 * Differentiates shock types based on clinical findings
 * CRITICAL: Treatment is opposite for different shock types
 * - Hypovolemic → aggressive fluids
 * - Cardiogenic → diuretics (fluids kill)
 * - Obstructive → remove obstruction
 * - Distributive → fluids + vasopressors
 */
export function differentiateShock(data: PrimarySurveyData): ShockAnalysis[] {
  const analyses: ShockAnalysis[] = [];

  // Only run if patient is in shock
  if (data.physiologicState !== 'shock' && 
      data.circulation.perfusion.capillary_refill === 'normal' &&
      data.circulation.perfusion.skin_temperature === 'warm') {
    return [];
  }

  // Analyze for each shock type
  analyses.push(analyzeHypovolemicShock(data));
  analyses.push(analyzeCardiogenicShock(data));
  analyses.push(analyzeObstructiveShock(data));
  analyses.push(analyzeSepticShock(data));
  analyses.push(analyzeAnaphylacticShock(data));
  analyses.push(analyzeNeurogenicShock(data));

  // Sort by probability
  return analyses.sort((a, b) => b.probability - a.probability);
}

/**
 * Hypovolemic Shock Analysis
 * Causes: Hemorrhage, dehydration, burns
 * Key features: History of fluid loss, flat JVP, clear lungs
 */
function analyzeHypovolemicShock(data: PrimarySurveyData): ShockAnalysis {
  let probability = 0;
  const evidence: string[] = [];

  // History of fluid loss (strongest predictor)
  if (data.circulation.history?.bleeding) {
    probability += 0.4;
    evidence.push('Active bleeding');
  }
  if (data.circulation.history?.diarrhea || data.circulation.history?.vomiting) {
    probability += 0.3;
    evidence.push('Fluid losses (diarrhea/vomiting)');
  }
  if (data.exposure.visible_injuries?.burns) {
    probability += 0.3;
    evidence.push('Burns (fluid losses)');
  }

  // JVP not elevated (rules out cardiogenic/obstructive)
  if (data.circulation.jvp === 'not_visible' || data.circulation.jvp === 'normal') {
    probability += 0.2;
    evidence.push('JVP not elevated');
  }

  // Clear lung fields (rules out cardiogenic)
  if (!data.breathing.auscultation?.crackles && 
      !data.circulation.signs_of_heart_failure?.pulmonary_edema) {
    probability += 0.1;
    evidence.push('Clear lung fields');
  }

  // Poor perfusion
  if (data.circulation.perfusion.capillary_refill !== 'normal') {
    probability += 0.1;
    evidence.push('Delayed capillary refill');
  }

  // Tachycardia
  if (data.circulation.heartRate > 120) {
    probability += 0.05;
    evidence.push('Tachycardia');
  }

  return {
    type: 'hypovolemic',
    probability: Math.min(probability, 0.99),
    evidence,
    fluidRecommendation: 'bolus',
    immediateActions: [
      '20 mL/kg bolus of crystalloid (NS or Ringer\'s lactate)',
      'Repeat boluses as needed (up to 60 mL/kg)',
      'Control bleeding if hemorrhagic',
      'Monitor for fluid overload (lung sounds, work of breathing)',
    ],
  };
}

/**
 * Cardiogenic Shock Analysis
 * Causes: MI, myocarditis, heart failure, arrhythmias
 * Key features: Elevated JVP, crackles, hepatomegaly
 * CRITICAL: Fluids kill - need diuretics + inotropes
 */
function analyzeCardiogenicShock(data: PrimarySurveyData): ShockAnalysis {
  let probability = 0;
  const evidence: string[] = [];

  // Elevated JVP (strongest predictor)
  if (data.circulation.jvp === 'elevated') {
    probability += 0.4;
    evidence.push('Elevated JVP');
  }

  // Pulmonary edema (crackles on auscultation)
  if (data.breathing.auscultation?.crackles || 
      data.circulation.signs_of_heart_failure?.pulmonary_edema) {
    probability += 0.3;
    evidence.push('Pulmonary edema (crackles)');
  }

  // Hepatomegaly
  if (data.circulation.signs_of_heart_failure?.hepatomegaly) {
    probability += 0.2;
    evidence.push('Hepatomegaly');
  }

  // Peripheral edema
  if (data.circulation.signs_of_heart_failure?.peripheral_edema) {
    probability += 0.1;
    evidence.push('Peripheral edema');
  }

  // Murmur (structural heart disease)
  if (data.circulation.murmur) {
    probability += 0.1;
    evidence.push('Heart murmur');
  }

  // Chest pain (MI)
  // TODO: Add chest pain to primary survey
  
  // Age factor (MI more common in adults)
  if (data.patientType === 'adult' && data.exposure.age_years && data.exposure.age_years > 40) {
    probability += 0.05;
  }

  return {
    type: 'cardiogenic',
    probability: Math.min(probability, 0.99),
    evidence,
    fluidRecommendation: 'avoid',
    immediateActions: [
      '⚠️ DO NOT GIVE FLUID BOLUSES (will worsen pulmonary edema)',
      'Furosemide 1 mg/kg IV (diuretic)',
      'Consider inotropes (dobutamine, milrinone)',
      'Oxygen to maintain SpO2 >94%',
      'ECG (rule out MI, arrhythmia)',
      'Urgent cardiology consult',
    ],
  };
}

/**
 * Obstructive Shock Analysis
 * Causes: Tension pneumothorax, cardiac tamponade, massive PE
 * Key features: Elevated JVP, clear lungs, mechanical obstruction
 * Treatment: Remove obstruction (needle decompression, pericardiocentesis)
 */
function analyzeObstructiveShock(data: PrimarySurveyData): ShockAnalysis {
  let probability = 0;
  const evidence: string[] = [];

  // Elevated JVP (obstructed venous return)
  if (data.circulation.jvp === 'elevated') {
    probability += 0.3;
    evidence.push('Elevated JVP');
  }

  // Clear lungs (rules out cardiogenic)
  if (!data.breathing.auscultation?.crackles) {
    probability += 0.1;
    evidence.push('Clear lung fields');
  }

  // Tension pneumothorax features
  if (data.breathing.auscultation?.decreased_air_entry || 
      data.breathing.auscultation?.silent_chest) {
    probability += 0.3;
    evidence.push('Decreased air entry (tension pneumothorax?)');
  }

  // Trauma history (tension pneumothorax, tamponade)
  if (data.exposure.trauma_history?.mechanism) {
    probability += 0.2;
    evidence.push(`Trauma (${data.exposure.trauma_history.mechanism})`);
  }

  // Hypoxia (PE, tension pneumothorax)
  if (data.breathing.spO2 < 90) {
    probability += 0.1;
    evidence.push('Severe hypoxia');
  }

  return {
    type: 'obstructive',
    probability: Math.min(probability, 0.99),
    evidence,
    fluidRecommendation: 'cautious',
    immediateActions: [
      'Identify and remove obstruction:',
      '  - Tension pneumothorax → Needle decompression (2nd intercostal space, midclavicular line)',
      '  - Cardiac tamponade → Pericardiocentesis',
      '  - Massive PE → Thrombolysis (if confirmed)',
      'Cautious fluid bolus (10 mL/kg) while preparing definitive treatment',
      'Urgent imaging (CXR, ultrasound, CTPA)',
    ],
  };
}

/**
 * Septic Shock Analysis (Distributive)
 * Causes: Bacterial, viral, fungal infections
 * Key features: Fever/hypothermia, warm peripheries initially, source of infection
 */
function analyzeSepticShock(data: PrimarySurveyData): ShockAnalysis {
  let probability = 0;
  const evidence: string[] = [];

  // Fever or hypothermia
  if (data.exposure.temperature > 38 || data.exposure.temperature < 36) {
    probability += 0.3;
    evidence.push(`Temperature ${data.exposure.temperature}°C`);
  }

  // Warm shock (early septic shock)
  if (data.circulation.perfusion.skin_temperature === 'warm' && 
      data.circulation.perfusion.capillary_refill !== 'normal') {
    probability += 0.2;
    evidence.push('Warm shock (early septic)');
  }

  // Altered mental status
  if (data.disability.avpu !== 'alert') {
    probability += 0.2;
    evidence.push(`Altered mental status (${data.disability.avpu})`);
  }

  // Tachycardia
  if (data.circulation.heartRate > 140) {
    probability += 0.1;
    evidence.push('Tachycardia');
  }

  // Tachypnea
  if (data.breathing.rate > 40) {
    probability += 0.1;
    evidence.push('Tachypnea');
  }

  // Petechiae/purpura (meningococcemia)
  if (data.exposure.skin_findings?.petechiae || data.exposure.skin_findings?.purpura) {
    probability += 0.2;
    evidence.push('Petechiae/purpura (meningococcemia?)');
  }

  return {
    type: 'distributive_septic',
    probability: Math.min(probability, 0.99),
    evidence,
    fluidRecommendation: 'bolus',
    immediateActions: [
      '20 mL/kg bolus of crystalloid (repeat up to 60 mL/kg in first hour)',
      'Broad-spectrum antibiotics within 1 hour (ceftriaxone + vancomycin)',
      'Blood cultures BEFORE antibiotics (but don\'t delay antibiotics)',
      'Source control (drain abscess, remove infected catheter)',
      'Consider vasopressors if fluid-refractory (norepinephrine)',
    ],
  };
}

/**
 * Anaphylactic Shock Analysis (Distributive)
 * Causes: Allergen exposure (food, drugs, insect stings)
 * Key features: Acute onset, allergen exposure, urticaria, angioedema, bronchospasm
 */
function analyzeAnaphylacticShock(data: PrimarySurveyData): ShockAnalysis {
  let probability = 0;
  const evidence: string[] = [];

  // Respiratory distress + shock (hallmark of anaphylaxis)
  if (data.physiologicState === 'severe_respiratory_distress' || 
      data.breathing.effort === 'increased') {
    probability += 0.3;
    evidence.push('Respiratory distress');
  }

  // Wheezing (bronchospasm)
  if (data.breathing.auscultation?.wheezing) {
    probability += 0.2;
    evidence.push('Wheezing (bronchospasm)');
  }

  // Stridor (upper airway edema)
  if (data.airway.observations.stridor || data.breathing.auscultation?.stridor) {
    probability += 0.2;
    evidence.push('Stridor (upper airway edema)');
  }

  // Urticaria/flushing
  if (data.exposure.skin_findings?.flushing || data.exposure.visible_injuries?.rash) {
    probability += 0.2;
    evidence.push('Urticaria/flushing');
  }

  // Acute onset (<2 hours)
  // TODO: Add time of symptom onset to primary survey

  // Known allergen exposure
  // TODO: Add allergen exposure to toxin_exposure

  return {
    type: 'distributive_anaphylactic',
    probability: Math.min(probability, 0.99),
    evidence,
    fluidRecommendation: 'bolus',
    immediateActions: [
      'Epinephrine 0.01 mg/kg IM (max 0.5 mg) - IMMEDIATE, DO NOT DELAY',
      'Repeat epinephrine every 5-15 minutes if no improvement',
      '20 mL/kg bolus of crystalloid',
      'H1 blocker: Diphenhydramine 1 mg/kg IV',
      'H2 blocker: Ranitidine 1 mg/kg IV',
      'Corticosteroids: Methylprednisolone 1-2 mg/kg IV',
      'Bronchodilators if wheezing: Salbutamol nebulizer',
    ],
  };
}

/**
 * Neurogenic Shock Analysis (Distributive)
 * Causes: Spinal cord injury (usually C-spine or high T-spine)
 * Key features: Hypotension + bradycardia (paradoxical), warm peripheries, trauma history
 */
function analyzeNeurogenicShock(data: PrimarySurveyData): ShockAnalysis {
  let probability = 0;
  const evidence: string[] = [];

  // Trauma history (spinal cord injury)
  if (data.exposure.trauma_history?.mechanism) {
    probability += 0.3;
    evidence.push(`Trauma (${data.exposure.trauma_history.mechanism})`);
  }

  // Bradycardia + hypotension (paradoxical - usually tachycardia in shock)
  if (data.circulation.heartRate < 60 && 
      data.circulation.bloodPressure && 
      data.circulation.bloodPressure.systolic < 90) {
    probability += 0.4;
    evidence.push('Bradycardia + hypotension (neurogenic pattern)');
  }

  // Warm peripheries despite shock (loss of sympathetic tone)
  if (data.circulation.perfusion.skin_temperature === 'warm' && 
      data.circulation.perfusion.capillary_refill !== 'normal') {
    probability += 0.2;
    evidence.push('Warm peripheries despite shock');
  }

  // Motor/sensory deficit
  // TODO: Add neurological exam to disability assessment

  return {
    type: 'neurogenic',
    probability: Math.min(probability, 0.99),
    evidence,
    fluidRecommendation: 'cautious',
    immediateActions: [
      'Spinal immobilization (C-collar, backboard)',
      'Cautious fluid bolus (10 mL/kg) - avoid overload',
      'Vasopressors if fluid-refractory (norepinephrine)',
      'Atropine if severe bradycardia (<40 bpm)',
      'Urgent neurosurgery consult',
      'MRI spine to identify level of injury',
    ],
  };
}

/**
 * Convert shock analysis to Differential format
 */
export function shockAnalysisToDifferential(analysis: ShockAnalysis): Differential {
  const diagnosisNames: Record<ShockType, string> = {
    hypovolemic: 'Hypovolemic Shock',
    cardiogenic: 'Cardiogenic Shock',
    obstructive: 'Obstructive Shock',
    distributive_septic: 'Septic Shock',
    distributive_anaphylactic: 'Anaphylactic Shock',
    neurogenic: 'Neurogenic Shock',
    undifferentiated: 'Undifferentiated Shock',
  };

  return {
    id: `shock_${analysis.type}`,
    diagnosis: diagnosisNames[analysis.type],
    probability: analysis.probability,
    evidence: analysis.evidence,
    missing: [],
    nextQuestions: [],
    category: 'immediate_threat',
  };
}
