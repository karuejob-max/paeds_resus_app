/**
 * Upper Airway Obstruction Clinical Engine
 * 
 * Provides sequential assessment and emergency management for:
 * - Croup (Laryngotracheobronchitis)
 * - Epiglottitis
 * - Laryngeal stridor
 * Based on pediatric airway emergency protocols
 */

export interface UpperAirwayAssessment {
  age: number; // years
  weightKg: number;
  stridor: 'inspiratory' | 'biphasic' | 'expiratory' | 'none';
  stridorSeverity: 'mild' | 'moderate' | 'severe';
  cough: 'barky' | 'weak' | 'absent' | 'normal';
  voice: 'hoarse' | 'muffled' | 'normal';
  drooling: boolean;
  tripoding: boolean;
  cyanosis: boolean;
  lethargy: boolean;
  temperature: number; // Celsius
  oxygenSaturation: number;
  respiratoryRate: number;
  retractions: 'none' | 'mild' | 'moderate' | 'severe';
  diagnosis: 'croup' | 'epiglottitis' | 'unknown';
}

export interface UpperAirwaySeverity {
  level: 'mild' | 'moderate' | 'severe' | 'critical';
  diagnosis: string;
  score: number;
  description: string;
  requiresHospitalization: boolean;
  requiresICU: boolean;
  requiresAirwaySecuring: boolean;
  riskOfCompleteObstruction: boolean;
}

export interface UpperAirwayIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
}

/**
 * Assess upper airway obstruction severity
 */
export function assessUpperAirwaySeverity(assessment: UpperAirwayAssessment): UpperAirwaySeverity {
  let score = 0;
  let requiresAirwaySecuring = false;
  let riskOfCompleteObstruction = false;

  // Stridor severity scoring
  if (assessment.stridorSeverity === 'severe') score += 3;
  else if (assessment.stridorSeverity === 'moderate') score += 2;
  else if (assessment.stridorSeverity === 'mild') score += 1;

  // Danger signs
  if (assessment.cyanosis) {
    score += 3;
    requiresAirwaySecuring = true;
    riskOfCompleteObstruction = true;
  }
  if (assessment.lethargy) {
    score += 3;
    requiresAirwaySecuring = true;
  }
  if (assessment.tripoding) {
    score += 2;
    riskOfCompleteObstruction = true;
  }
  if (assessment.drooling) {
    score += 2;
    riskOfCompleteObstruction = true;
  }

  // Retractions
  if (assessment.retractions === 'severe') score += 2;
  else if (assessment.retractions === 'moderate') score += 1;

  // Stridor type
  if (assessment.stridor === 'biphasic') score += 1;

  // Diagnosis-specific scoring
  let diagnosis = assessment.diagnosis;
  let level: 'mild' | 'moderate' | 'severe' | 'critical';
  let description: string;

  if (assessment.diagnosis === 'epiglottitis') {
    // Epiglottitis is always considered severe/critical
    level = 'critical';
    description = 'EPIGLOTTITIS - Medical emergency requiring immediate airway management';
    requiresAirwaySecuring = true;
    riskOfCompleteObstruction = true;
  } else if (score >= 8) {
    level = 'critical';
    description = 'Critical upper airway obstruction with imminent risk of complete obstruction';
    requiresAirwaySecuring = true;
    riskOfCompleteObstruction = true;
  } else if (score >= 5) {
    level = 'severe';
    description = 'Severe upper airway obstruction requiring urgent intervention';
    requiresAirwaySecuring = false;
    riskOfCompleteObstruction = true;
  } else if (score >= 2) {
    level = 'moderate';
    description = 'Moderate upper airway obstruction';
    requiresAirwaySecuring = false;
    riskOfCompleteObstruction = false;
  } else {
    level = 'mild';
    description = 'Mild upper airway obstruction';
    requiresAirwaySecuring = false;
    riskOfCompleteObstruction = false;
  }

  return {
    level,
    diagnosis: diagnosis === 'unknown' ? 'Laryngeal obstruction (etiology TBD)' : diagnosis.toUpperCase(),
    score,
    description,
    requiresHospitalization: level !== 'mild',
    requiresICU: level === 'critical' || level === 'severe',
    requiresAirwaySecuring,
    riskOfCompleteObstruction,
  };
}

/**
 * Generate interventions for Croup
 */
export function generateCroupInterventions(assessment: UpperAirwayAssessment): UpperAirwayIntervention[] {
  const interventions: UpperAirwayIntervention[] = [];

  // Dexamethasone (first-line for croup)
  const dexamethasone = assessment.weightKg * 0.6; // mg
  interventions.push({
    type: 'steroid',
    description: 'Dexamethasone',
    indication: 'All croup cases',
    dosing: `${dexamethasone.toFixed(2)}mg (0.6 mg/kg) IV/PO`,
    frequency: 'Single dose',
    monitoring: 'Symptom improvement',
  });

  // Nebulized epinephrine for moderate-severe croup
  if (assessment.stridorSeverity === 'moderate' || assessment.stridorSeverity === 'severe') {
    const epinephrine = assessment.weightKg * 0.05; // mL of 1:1000
    interventions.push({
      type: 'bronchodilator',
      description: 'Nebulized epinephrine (1:1000)',
      indication: 'Moderate to severe croup',
      dosing: `${(epinephrine * 1000).toFixed(0)}mcg (${epinephrine.toFixed(2)}mL of 1:1000) nebulized`,
      frequency: 'Every 1-2 hours as needed',
      monitoring: 'Stridor improvement, rebound symptoms',
    });
  }

  // Oxygen therapy
  if (assessment.oxygenSaturation < 92) {
    interventions.push({
      type: 'oxygen_therapy',
      description: 'Supplemental oxygen',
      indication: `SpO2 < 92% (current: ${assessment.oxygenSaturation}%)`,
      dosing: 'Titrate to maintain SpO2 > 92%',
      monitoring: 'Continuous pulse oximetry',
    });
  }

  // Humidified air
  interventions.push({
    type: 'supportive_care',
    description: 'Humidified air/steam therapy',
    indication: 'All croup cases',
    dosing: 'Humidified oxygen or steam inhalation',
    frequency: 'Continuous or as tolerated',
    monitoring: 'Comfort, stridor improvement',
  });

  return interventions;
}

/**
 * Generate interventions for Epiglottitis
 */
export function generateEpiglottitisInterventions(assessment: UpperAirwayAssessment): UpperAirwayIntervention[] {
  const interventions: UpperAirwayIntervention[] = [];

  // CRITICAL: Prepare for emergency intubation
  interventions.push({
    type: 'airway_management',
    description: 'EMERGENCY: Prepare for intubation',
    indication: 'Epiglottitis - high risk of complete airway obstruction',
    dosing: 'Have emergency equipment at bedside: intubation kit, cricothyrotomy kit, tracheostomy kit',
    monitoring: 'Continuous observation, be prepared for emergency airway intervention',
  });

  // Antibiotics (empiric broad-spectrum)
  const ceftriaxone = assessment.weightKg * 80; // mg/kg/day
  const vancomycin = assessment.weightKg * 40; // mg/kg/day

  interventions.push({
    type: 'antibiotic',
    description: 'Ceftriaxone + Vancomycin',
    indication: 'Epiglottitis - empiric coverage for H. influenzae and other pathogens',
    dosing: `Ceftriaxone: ${ceftriaxone.toFixed(0)}mg/day IV (${(ceftriaxone / 2).toFixed(0)}mg Q12H)
Vancomycin: ${vancomycin.toFixed(0)}mg/day IV (${(vancomycin / 4).toFixed(0)}mg Q6H)`,
    frequency: 'Continuous',
    monitoring: 'Renal function, clinical response',
  });

  // Dexamethasone
  const dexamethasone = assessment.weightKg * 0.6;
  interventions.push({
    type: 'steroid',
    description: 'Dexamethasone',
    indication: 'Reduce airway edema',
    dosing: `${dexamethasone.toFixed(2)}mg (0.6 mg/kg) IV`,
    frequency: 'Every 6 hours for 24-48 hours',
    monitoring: 'Airway status',
  });

  // Oxygen therapy
  interventions.push({
    type: 'oxygen_therapy',
    description: 'High-flow oxygen',
    indication: 'Maintain oxygenation',
    dosing: 'Titrate to maintain SpO2 > 94%',
    monitoring: 'Continuous pulse oximetry',
  });

  return interventions;
}

/**
 * Determine if immediate airway intervention is needed
 */
export function needsImmediateAirwayIntervention(assessment: UpperAirwayAssessment): boolean {
  // Immediate intervention needed if:
  if (assessment.diagnosis === 'epiglottitis') return true;
  if (assessment.cyanosis) return true;
  if (assessment.lethargy) return true;
  if (assessment.stridor === 'biphasic' && assessment.stridorSeverity === 'severe') return true;
  if (assessment.oxygenSaturation < 90) return true;

  return false;
}

/**
 * Generate clinical summary
 */
export function generateUpperAirwaySummary(
  assessment: UpperAirwayAssessment,
  severity: UpperAirwaySeverity
): string {
  const summary = `
UPPER AIRWAY OBSTRUCTION CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg
Diagnosis: ${severity.diagnosis}

Severity: ${severity.level.toUpperCase()}
${severity.description}

Clinical Findings:
- Stridor: ${assessment.stridor} (${assessment.stridorSeverity})
- Cough: ${assessment.cough}
- Voice: ${assessment.voice}
- Temperature: ${assessment.temperature}°C
- SpO2: ${assessment.oxygenSaturation}%
- RR: ${assessment.respiratoryRate} breaths/min
- Retractions: ${assessment.retractions}
- Drooling: ${assessment.drooling ? 'Yes' : 'No'}
- Tripoding: ${assessment.tripoding ? 'Yes' : 'No'}
- Cyanosis: ${assessment.cyanosis ? 'Yes' : 'No'}
- Lethargy: ${assessment.lethargy ? 'Yes' : 'No'}

Recommendations:
- Hospitalization: ${severity.requiresHospitalization ? 'REQUIRED' : 'Consider outpatient management'}
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Ward admission appropriate'}
- Airway Securing: ${severity.requiresAirwaySecuring ? 'PREPARE FOR EMERGENCY INTUBATION' : 'Not indicated at this time'}
- Risk of Complete Obstruction: ${severity.riskOfCompleteObstruction ? 'HIGH - Continuous monitoring essential' : 'Low'}

IMMEDIATE ACTIONS:
${needsImmediateAirwayIntervention(assessment) ? '⚠️ EMERGENCY AIRWAY INTERVENTION NEEDED\n- Call senior clinician immediately\n- Have emergency equipment at bedside\n- Prepare for intubation' : '- Continuous observation\n- Prepare for potential airway intervention'}

Follow-up: Reassess every 30-60 minutes; escalate if worsening
  `.trim();

  return summary;
}
