/**
 * Bronchiolitis Clinical Engine
 * 
 * Provides sequential assessment and evidence-based intervention guidance
 * for acute bronchiolitis in children (typically 2-24 months)
 * Based on WHO guidelines and pediatric respiratory protocols
 */

export interface BronchiolitisAssessment {
  age: number; // months
  weightKg: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  retractions: 'none' | 'mild' | 'moderate' | 'severe';
  wheeze: boolean;
  crackles: boolean;
  feedingDifficulty: boolean;
  lethargy: boolean;
  cyanosis: boolean;
}

export interface BronchiolitisSeverity {
  level: 'mild' | 'moderate' | 'severe';
  score: number;
  description: string;
  requiresHospitalization: boolean;
  requiresICU: boolean;
}

export interface BronchiolitisIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
}

/**
 * Assess bronchiolitis severity based on clinical findings
 * Scoring: 0-3 mild, 4-7 moderate, 8+ severe
 */
export function assessBronchiolitisSeverity(assessment: BronchiolitisAssessment): BronchiolitisSeverity {
  let score = 0;

  // Respiratory rate scoring
  if (assessment.respiratoryRate > 60) score += 3;
  else if (assessment.respiratoryRate > 50) score += 2;
  else if (assessment.respiratoryRate > 40) score += 1;

  // Oxygen saturation scoring
  if (assessment.oxygenSaturation < 90) score += 3;
  else if (assessment.oxygenSaturation < 92) score += 2;
  else if (assessment.oxygenSaturation < 94) score += 1;

  // Retractions scoring
  if (assessment.retractions === 'severe') score += 3;
  else if (assessment.retractions === 'moderate') score += 2;
  else if (assessment.retractions === 'mild') score += 1;

  // Clinical signs scoring
  if (assessment.cyanosis) score += 3;
  if (assessment.lethargy) score += 2;
  if (assessment.feedingDifficulty) score += 1;
  if (assessment.crackles) score += 1;

  let level: 'mild' | 'moderate' | 'severe';
  let description: string;
  let requiresHospitalization: boolean;
  let requiresICU: boolean;

  if (score >= 8) {
    level = 'severe';
    description = 'Severe bronchiolitis with respiratory distress and hypoxemia';
    requiresHospitalization = true;
    requiresICU = true;
  } else if (score >= 4) {
    level = 'moderate';
    description = 'Moderate bronchiolitis with significant respiratory involvement';
    requiresHospitalization = true;
    requiresICU = false;
  } else {
    level = 'mild';
    description = 'Mild bronchiolitis, may be managed outpatient with close follow-up';
    requiresHospitalization = false;
    requiresICU = false;
  }

  return {
    level,
    score,
    description,
    requiresHospitalization,
    requiresICU,
  };
}

/**
 * Generate intervention recommendations based on severity
 */
export function generateBronchiolitisInterventions(
  assessment: BronchiolitisAssessment,
  severity: BronchiolitisSeverity
): BronchiolitisIntervention[] {
  const interventions: BronchiolitisIntervention[] = [];

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

  // Respiratory support
  if (severity.level === 'severe' && assessment.oxygenSaturation < 90) {
    interventions.push({
      type: 'respiratory_support',
      description: 'High-flow nasal cannula or CPAP',
      indication: 'Severe hypoxemia and respiratory distress',
      dosing: 'HFNC: 1-2 L/kg/min; CPAP: 5-7 cmH2O',
      monitoring: 'Continuous monitoring, consider intubation if worsening',
    });
  }

  // Hydration
  if (assessment.feedingDifficulty) {
    const maintenanceMl = assessment.weightKg * 100; // Simplified calculation
    interventions.push({
      type: 'hydration',
      description: 'IV fluid support',
      indication: 'Feeding difficulty and respiratory distress',
      dosing: `Maintenance: ${maintenanceMl} mL/day IV`,
      monitoring: 'Urine output, electrolytes',
    });
  }

  // Bronchodilators (selective use)
  if (assessment.wheeze) {
    const salbutamolDose = assessment.weightKg * 0.15; // mg
    interventions.push({
      type: 'bronchodilator',
      description: 'Salbutamol nebulization',
      indication: 'Wheeze present',
      dosing: `${salbutamolDose.toFixed(2)}mg (0.15 mg/kg) nebulized`,
      frequency: 'Every 4-6 hours as needed',
      monitoring: 'Response to therapy, vital signs',
    });
  }

  // Steroids (if indicated)
  if (severity.level === 'moderate' || severity.level === 'severe') {
    const dexamethasone = assessment.weightKg * 0.15; // mg
    interventions.push({
      type: 'steroid',
      description: 'Dexamethasone',
      indication: 'Moderate to severe bronchiolitis',
      dosing: `${dexamethasone.toFixed(2)}mg (0.15 mg/kg) IV/PO`,
      frequency: 'Once daily for 3 days',
      monitoring: 'Response to therapy',
    });
  }

  // Ribavirin (for severe immunocompromised or RSV+)
  if (severity.level === 'severe' && severity.requiresICU) {
    interventions.push({
      type: 'antiviral',
      description: 'Ribavirin',
      indication: 'Severe bronchiolitis in immunocompromised child',
      dosing: 'Aerosol: 6g/day in 3 divided doses',
      frequency: 'Over 12-18 hours daily',
      monitoring: 'Viral load, clinical response',
    });
  }

  // Positioning and supportive care
  interventions.push({
    type: 'supportive_care',
    description: 'Positioning and secretion management',
    indication: 'All cases',
    dosing: 'Semi-upright position, gentle suctioning as needed',
    monitoring: 'Comfort, work of breathing',
  });

  return interventions;
}

/**
 * Determine admission criteria
 */
export function shouldAdmitBronchiolitis(assessment: BronchiolitisAssessment): boolean {
  // Admit if any of the following:
  if (assessment.oxygenSaturation < 92) return true;
  if (assessment.respiratoryRate > 60) return true;
  if (assessment.retractions === 'severe' || assessment.retractions === 'moderate') return true;
  if (assessment.feedingDifficulty) return true;
  if (assessment.lethargy || assessment.cyanosis) return true;
  if (assessment.age < 3) return true; // Very young infants

  return false;
}

/**
 * Determine ICU criteria
 */
export function shouldAdmitToICU(assessment: BronchiolitisAssessment): boolean {
  // ICU if any of the following:
  if (assessment.oxygenSaturation < 90) return true;
  if (assessment.respiratoryRate > 70) return true;
  if (assessment.retractions === 'severe') return true;
  if (assessment.cyanosis) return true;
  if (assessment.lethargy) return true;
  if (assessment.age < 2) return true; // Very young infants with severe disease

  return false;
}

/**
 * Generate clinical summary
 */
export function generateBronchiolitisSummary(
  assessment: BronchiolitisAssessment,
  severity: BronchiolitisSeverity
): string {
  const ageMonths = Math.round(assessment.age);
  const summary = `
BRONCHIOLITIS CLINICAL ASSESSMENT

Patient: ${ageMonths} months old, ${assessment.weightKg}kg

Severity: ${severity.level.toUpperCase()} (Score: ${severity.score}/15)
${severity.description}

Vital Signs & Findings:
- Respiratory Rate: ${assessment.respiratoryRate} breaths/min
- Oxygen Saturation: ${assessment.oxygenSaturation}%
- Retractions: ${assessment.retractions}
- Wheeze: ${assessment.wheeze ? 'Present' : 'Absent'}
- Crackles: ${assessment.crackles ? 'Present' : 'Absent'}
- Feeding Difficulty: ${assessment.feedingDifficulty ? 'Yes' : 'No'}
- Lethargy: ${assessment.lethargy ? 'Yes' : 'No'}
- Cyanosis: ${assessment.cyanosis ? 'Yes' : 'No'}

Recommendations:
- Hospitalization: ${severity.requiresHospitalization ? 'REQUIRED' : 'Consider outpatient management'}
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Ward admission appropriate'}

Follow-up: Close clinical monitoring, reassess in 2-4 hours
  `.trim();

  return summary;
}
