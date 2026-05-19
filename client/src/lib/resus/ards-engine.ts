/**
 * ARDS (Acute Respiratory Distress Syndrome) Clinical Engine
 * 
 * Provides sequential assessment and evidence-based ventilation management
 * for ARDS in children
 * Based on PALICC (Pediatric Acute Lung Injury Consensus Conference) guidelines
 */

export interface ARDSAssessment {
  age: number; // years
  weightKg: number;
  oxygenSaturation: number;
  fio2: number; // Fraction of inspired oxygen (0-1)
  peep: number; // Positive end-expiratory pressure (cmH2O)
  respiratoryRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  lactate: number; // mmol/L
  infiltrates: 'unilateral' | 'bilateral';
  primaryCause: string; // e.g., pneumonia, sepsis, aspiration
  ventilationMode: string; // e.g., CMV, SIMV, HFOV
  plateauPressure?: number; // cmH2O
  complianceStatic?: number; // mL/cmH2O
}

export interface ARDSSeverity {
  level: 'mild' | 'moderate' | 'severe';
  paoFioRatio: number;
  description: string;
  requiresICU: boolean;
  requiresAdvancedSupport: boolean;
}

export interface ARDSIntervention {
  type: string;
  description: string;
  indication: string;
  parameters?: string;
  monitoring?: string;
}

/**
 * Calculate PaO2/FiO2 ratio (P/F ratio) for ARDS severity classification
 * Note: Requires actual PaO2 from ABG; using SpO2 as proxy here
 */
export function calculatePFRatio(oxygenSaturation: number, fio2: number): number {
  // Estimate PaO2 from SpO2 using simplified formula
  // This is a rough approximation; actual PaO2 from ABG is more accurate
  let estimatedPaO2: number;

  if (oxygenSaturation >= 97) estimatedPaO2 = 120;
  else if (oxygenSaturation >= 95) estimatedPaO2 = 100;
  else if (oxygenSaturation >= 90) estimatedPaO2 = 80;
  else if (oxygenSaturation >= 85) estimatedPaO2 = 60;
  else estimatedPaO2 = 40;

  const fio2Percent = fio2 * 100;
  return estimatedPaO2 / (fio2Percent / 100);
}

/**
 * Assess ARDS severity based on PALICC criteria
 */
export function assessARDSSeverity(assessment: ARDSAssessment): ARDSSeverity {
  const pfRatio = calculatePFRatio(assessment.oxygenSaturation, assessment.fio2);

  let level: 'mild' | 'moderate' | 'severe';
  let description: string;
  let requiresAdvancedSupport: boolean;

  if (pfRatio <= 100) {
    level = 'severe';
    description = 'Severe ARDS - P/F ratio ≤ 100';
    requiresAdvancedSupport = true;
  } else if (pfRatio <= 200) {
    level = 'moderate';
    description = 'Moderate ARDS - P/F ratio 101-200';
    requiresAdvancedSupport = false;
  } else {
    level = 'mild';
    description = 'Mild ARDS - P/F ratio 201-300';
    requiresAdvancedSupport = false;
  }

  return {
    level,
    paoFioRatio: pfRatio,
    description,
    requiresICU: true,
    requiresAdvancedSupport,
  };
}

/**
 * Generate lung-protective ventilation strategy
 */
export function generateLungProtectiveStrategy(
  assessment: ARDSAssessment,
  severity: ARDSSeverity
): ARDSIntervention[] {
  const interventions: ARDSIntervention[] = [];

  // Tidal volume strategy
  const targetVt = assessment.weightKg * 6; // 6 mL/kg ideal body weight
  interventions.push({
    type: 'ventilation_strategy',
    description: 'Lung-protective ventilation with low tidal volumes',
    indication: 'All ARDS patients',
    parameters: `Target Vt: ${targetVt.toFixed(0)} mL (6 mL/kg IBW)
Plateau Pressure: Keep < 30 cmH2O
Rate: ${assessment.respiratoryRate} breaths/min
FiO2: Titrate to SpO2 88-95%`,
    monitoring: 'Plateau pressure, compliance, ABG every 4-6 hours',
  });

  // PEEP strategy
  let peepTarget = assessment.peep;
  if (severity.level === 'severe') {
    peepTarget = Math.max(12, assessment.peep);
  } else if (severity.level === 'moderate') {
    peepTarget = Math.max(8, assessment.peep);
  }

  interventions.push({
    type: 'peep_strategy',
    description: 'Appropriate PEEP titration',
    indication: 'Maintain oxygenation while avoiding volutrauma',
    parameters: `Target PEEP: ${peepTarget} cmH2O
Adjust based on oxygenation and hemodynamics`,
    monitoring: 'Compliance, oxygenation, blood pressure',
  });

  // Prone positioning for severe ARDS
  if (severity.level === 'severe' && assessment.oxygenSaturation < 88) {
    interventions.push({
      type: 'positioning',
      description: 'Prone positioning',
      indication: 'Severe ARDS with persistent hypoxemia',
      parameters: 'Prone position 16+ hours daily',
      monitoring: 'Oxygenation response, skin integrity, tube position',
    });
  }

  // Neuromuscular blockade for severe ARDS
  if (severity.level === 'severe' && assessment.plateauPressure && assessment.plateauPressure > 28) {
    const rocuroniumBolus = assessment.weightKg * 1.2; // mg
    interventions.push({
      type: 'neuromuscular_blockade',
      description: 'Neuromuscular blockade (Rocuronium)',
      indication: 'Severe ARDS with high plateau pressure',
      parameters: `Bolus: ${rocuroniumBolus.toFixed(0)}mg IV
Infusion: 0.5-1 mg/kg/hour`,
      monitoring: 'Train-of-four monitoring, sedation level',
    });
  }

  return interventions;
}

/**
 * Generate supportive care interventions
 */
export function generateARDSSupportiveCare(assessment: ARDSAssessment): ARDSIntervention[] {
  const interventions: ARDSIntervention[] = [];

  // Fluid management
  interventions.push({
    type: 'fluid_management',
    description: 'Conservative fluid strategy',
    indication: 'Reduce pulmonary edema',
    parameters: 'Negative fluid balance if hemodynamically stable',
    monitoring: 'Urine output, lactate, blood pressure',
  });

  // Sedation and analgesia
  interventions.push({
    type: 'sedation_analgesia',
    description: 'Adequate sedation and analgesia',
    indication: 'Facilitate mechanical ventilation',
    parameters: 'Propofol or midazolam + fentanyl infusion',
    monitoring: 'RASS score, comfort level',
  });

  // Stress ulcer prophylaxis
  const ranitidine = assessment.weightKg * 1; // mg/kg/dose
  interventions.push({
    type: 'stress_ulcer_prophylaxis',
    description: 'H2 blocker',
    indication: 'Prevent stress ulceration',
    parameters: `Ranitidine: ${ranitidine.toFixed(0)}mg IV Q6-8H`,
    monitoring: 'GI bleeding signs',
  });

  // DVT prophylaxis
  interventions.push({
    type: 'dvt_prophylaxis',
    description: 'DVT prophylaxis',
    indication: 'Prevent thromboembolism',
    parameters: 'Mechanical: Sequential compression devices\nPharmacologic: Consider if high risk',
    monitoring: 'Bleeding signs, leg swelling',
  });

  // Early mobilization
  interventions.push({
    type: 'early_mobilization',
    description: 'Early mobilization when possible',
    indication: 'Improve outcomes',
    parameters: 'Passive ROM, sitting in chair when stable',
    monitoring: 'Tolerance, hemodynamic stability',
  });

  return interventions;
}

/**
 * Determine criteria for advanced support (ECMO)
 */
export function shouldConsiderECMO(assessment: ARDSAssessment, severity: ARDSSeverity): boolean {
  // Consider ECMO if:
  if (severity.level === 'severe' && assessment.oxygenSaturation < 85) return true;
  if (severity.paoFioRatio < 80) return true;
  if (assessment.lactate > 5) return true;

  return false;
}

/**
 * Generate clinical summary
 */
export function generateARDSSummary(assessment: ARDSAssessment, severity: ARDSSeverity): string {
  const summary = `
ARDS CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg
Primary Cause: ${assessment.primaryCause}

Severity: ${severity.level.toUpperCase()}
${severity.description}
P/F Ratio: ${severity.paoFioRatio.toFixed(0)}

Current Ventilation:
- Mode: ${assessment.ventilationMode}
- FiO2: ${(assessment.fio2 * 100).toFixed(0)}%
- PEEP: ${assessment.peep} cmH2O
- RR: ${assessment.respiratoryRate} breaths/min
${assessment.plateauPressure ? `- Plateau Pressure: ${assessment.plateauPressure} cmH2O` : ''}
${assessment.complianceStatic ? `- Static Compliance: ${assessment.complianceStatic} mL/cmH2O` : ''}

Oxygenation & Perfusion:
- SpO2: ${assessment.oxygenSaturation}%
- BP: ${assessment.bloodPressure.systolic}/${assessment.bloodPressure.diastolic} mmHg
- Lactate: ${assessment.lactate} mmol/L

Recommendations:
- ICU Admission: REQUIRED
- Advanced Support (ECMO): ${shouldConsiderECMO(assessment, severity) ? 'CONSIDER' : 'Not indicated at this time'}
- Lung-Protective Ventilation: MANDATORY
- Conservative Fluid Strategy: RECOMMENDED

Follow-up: Reassess oxygenation and ventilation parameters every 4-6 hours
  `.trim();

  return summary;
}
