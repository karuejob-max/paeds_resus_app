/**
 * Severe Pneumonia Clinical Engine
 * 
 * Provides sequential assessment and evidence-based intervention guidance
 * for community-acquired pneumonia (CAP) in children
 * Based on WHO IMCI guidelines and pediatric infectious disease protocols
 */

export interface PneumoniaAssessment {
  age: number; // years
  weightKg: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  temperature: number; // Celsius
  chestIndrawing: boolean;
  stridor: boolean;
  cyanosis: boolean;
  lethargy: boolean;
  feedingDifficulty: boolean;
  crackles: boolean;
  consolidation: boolean;
  pleuraEffusion: boolean;
}

export interface PneumoniaSeverity {
  level: 'mild' | 'moderate' | 'severe';
  classification: 'pneumonia' | 'severe_pneumonia' | 'very_severe_pneumonia';
  score: number;
  description: string;
  requiresHospitalization: boolean;
  requiresICU: boolean;
}

export interface PneumoniaIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
}

/**
 * Assess pneumonia severity based on WHO IMCI classification
 */
export function assessPneumoniaSeverity(assessment: PneumoniaAssessment): PneumoniaSeverity {
  let score = 0;
  let classification: 'pneumonia' | 'severe_pneumonia' | 'very_severe_pneumonia' = 'pneumonia';

  // Fast breathing (age-specific)
  const fastBreathingThreshold = assessment.age < 2 ? 50 : assessment.age < 5 ? 40 : 30;
  if (assessment.respiratoryRate > fastBreathingThreshold) score += 1;

  // Chest indrawing = severe pneumonia
  if (assessment.chestIndrawing) {
    classification = 'severe_pneumonia';
    score += 3;
  }

  // Danger signs = very severe pneumonia
  if (assessment.cyanosis || assessment.lethargy || assessment.stridor) {
    classification = 'very_severe_pneumonia';
    score += 3;
  }

  // Hypoxemia
  if (assessment.oxygenSaturation < 90) score += 3;
  else if (assessment.oxygenSaturation < 92) score += 2;
  else if (assessment.oxygenSaturation < 94) score += 1;

  // Clinical signs
  if (assessment.consolidation) score += 2;
  if (assessment.pleuraEffusion) score += 2;
  if (assessment.crackles) score += 1;
  if (assessment.feedingDifficulty) score += 1;

  // Fever
  if (assessment.temperature >= 39) score += 1;

  let level: 'mild' | 'moderate' | 'severe';
  let description: string;
  let requiresHospitalization: boolean;
  let requiresICU: boolean;

  if (classification === 'very_severe_pneumonia') {
    level = 'severe';
    description = 'Very severe pneumonia with danger signs - requires immediate ICU admission';
    requiresHospitalization = true;
    requiresICU = true;
  } else if (classification === 'severe_pneumonia') {
    level = 'severe';
    description = 'Severe pneumonia with chest indrawing - requires hospitalization';
    requiresHospitalization = true;
    requiresICU = score >= 8;
  } else {
    level = 'mild';
    description = 'Pneumonia - may be managed outpatient with close follow-up';
    requiresHospitalization = false;
    requiresICU = false;
  }

  return {
    level,
    classification,
    score,
    description,
    requiresHospitalization,
    requiresICU,
  };
}

/**
 * Generate antibiotic recommendations
 */
export function generateAntibioticRegimen(
  assessment: PneumoniaAssessment,
  severity: PneumoniaSeverity
): PneumoniaIntervention[] {
  const interventions: PneumoniaIntervention[] = [];

  if (severity.classification === 'very_severe_pneumonia') {
    // IV antibiotics for very severe
    const ceftriaxone = assessment.weightKg * 80; // mg/kg/day
    const gentamicin = assessment.weightKg * 7.5; // mg/kg/day

    interventions.push({
      type: 'antibiotic_iv_first_line',
      description: 'Ceftriaxone + Gentamicin',
      indication: 'Very severe pneumonia',
      dosing: `Ceftriaxone: ${ceftriaxone.toFixed(0)}mg/day IV (${(ceftriaxone / 2).toFixed(0)}mg Q12H)
Gentamicin: ${gentamicin.toFixed(1)}mg/day IV (${(gentamicin / 2).toFixed(1)}mg Q12H)`,
      frequency: 'Every 12 hours',
      monitoring: 'Renal function, hearing, clinical response',
    });

    // Consider adding vancomycin for resistant organisms
    const vancomycin = assessment.weightKg * 40; // mg/kg/day
    interventions.push({
      type: 'antibiotic_iv_additional',
      description: 'Vancomycin (if resistant organism suspected)',
      indication: 'Very severe pneumonia with risk factors for resistant organisms',
      dosing: `${vancomycin.toFixed(0)}mg/day IV (${(vancomycin / 4).toFixed(0)}mg Q6H)`,
      frequency: 'Every 6 hours',
      monitoring: 'Vancomycin levels, renal function',
    });
  } else if (severity.classification === 'severe_pneumonia') {
    // IV antibiotics for severe
    const ceftriaxone = assessment.weightKg * 80;
    interventions.push({
      type: 'antibiotic_iv',
      description: 'Ceftriaxone',
      indication: 'Severe pneumonia',
      dosing: `${ceftriaxone.toFixed(0)}mg/day IV (${(ceftriaxone / 2).toFixed(0)}mg Q12H)`,
      frequency: 'Every 12 hours',
      monitoring: 'Clinical response, renal function',
    });
  } else {
    // Oral antibiotics for mild pneumonia
    const amoxicillin = assessment.weightKg * 45; // mg/kg/day
    interventions.push({
      type: 'antibiotic_oral',
      description: 'Amoxicillin',
      indication: 'Mild pneumonia',
      dosing: `${amoxicillin.toFixed(0)}mg/day PO (${(amoxicillin / 3).toFixed(0)}mg TDS)`,
      frequency: 'Three times daily for 7 days',
      monitoring: 'Clinical response, follow-up in 48 hours',
    });
  }

  return interventions;
}

/**
 * Generate supportive care interventions
 */
export function generatePneumoniaSupportiveCare(
  assessment: PneumoniaAssessment,
  severity: PneumoniaSeverity
): PneumoniaIntervention[] {
  const interventions: PneumoniaIntervention[] = [];

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

  // Hydration
  if (assessment.feedingDifficulty) {
    const maintenanceMl = assessment.weightKg * 100;
    interventions.push({
      type: 'hydration',
      description: 'IV fluid support',
      indication: 'Feeding difficulty',
      dosing: `Maintenance: ${maintenanceMl} mL/day IV`,
      monitoring: 'Urine output, electrolytes',
    });
  }

  // Fever management
  if (assessment.temperature >= 38.5) {
    const paracetamol = assessment.weightKg * 15; // mg/dose
    interventions.push({
      type: 'antipyretic',
      description: 'Paracetamol',
      indication: 'Fever management',
      dosing: `${paracetamol.toFixed(0)}mg (15 mg/kg) PO/IV`,
      frequency: 'Every 4-6 hours as needed',
      monitoring: 'Temperature response',
    });
  }

  return interventions;
}

/**
 * Determine admission criteria (WHO IMCI)
 */
export function shouldAdmitPneumonia(assessment: PneumoniaAssessment): boolean {
  // Admit if any of the following:
  if (assessment.chestIndrawing) return true;
  if (assessment.oxygenSaturation < 92) return true;
  if (assessment.cyanosis || assessment.lethargy) return true;
  if (assessment.stridor) return true;
  if (assessment.feedingDifficulty) return true;
  if (assessment.age < 2) return true; // Very young children

  return false;
}

/**
 * Generate clinical summary
 */
export function generatePneumoniaSummary(
  assessment: PneumoniaAssessment,
  severity: PneumoniaSeverity
): string {
  const summary = `
PNEUMONIA CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg

Classification: ${severity.classification.replace(/_/g, ' ').toUpperCase()}
${severity.description}

Vital Signs & Findings:
- Respiratory Rate: ${assessment.respiratoryRate} breaths/min
- Oxygen Saturation: ${assessment.oxygenSaturation}%
- Temperature: ${assessment.temperature}°C
- Chest Indrawing: ${assessment.chestIndrawing ? 'Yes' : 'No'}
- Stridor: ${assessment.stridor ? 'Yes' : 'No'}
- Cyanosis: ${assessment.cyanosis ? 'Yes' : 'No'}
- Lethargy: ${assessment.lethargy ? 'Yes' : 'No'}
- Consolidation: ${assessment.consolidation ? 'Yes' : 'No'}
- Pleural Effusion: ${assessment.pleuraEffusion ? 'Yes' : 'No'}

Recommendations:
- Hospitalization: ${severity.requiresHospitalization ? 'REQUIRED' : 'Consider outpatient management'}
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Ward admission appropriate'}

Follow-up: Reassess in 48 hours; switch to oral antibiotics if improving
  `.trim();

  return summary;
}
