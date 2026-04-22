/**
 * Diabetic Ketoacidosis (DKA) Clinical Engine
 * 
 * Provides sequential assessment and evidence-based management for pediatric DKA
 * Based on ADA and ISPAD guidelines
 */

export interface DKAAssessment {
  age: number; // years
  weightKg: number;
  bloodGlucose: number; // mg/dL or mmol/L
  glucoseUnit: 'mg/dL' | 'mmol/L';
  pH: number;
  bicarbonate: number; // mEq/L
  anionGap: number;
  ketonemia: 'negative' | 'small' | 'moderate' | 'large';
  ketonuria: 'negative' | 'small' | 'moderate' | 'large';
  respiratoryRate: number;
  breathPattern: 'normal' | 'kussmaul' | 'rapid';
  mentalStatus: 'alert' | 'lethargic' | 'unresponsive';
  vomiting: boolean;
  abdominalPain: boolean;
  fluidDeficit: number; // % dehydration
  potassium: number; // mEq/L
  sodium: number; // mEq/L
  chloride: number; // mEq/L
  priorInsulin?: boolean;
}

export interface DKASeverity {
  level: 'mild' | 'moderate' | 'severe';
  classification: string;
  score: number;
  description: string;
  requiresICU: boolean;
  riskOfCerebralEdema: boolean;
}

export interface DKAIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
}

/**
 * Convert glucose units to mg/dL
 */
function normalizeGlucose(glucose: number, unit: 'mg/dL' | 'mmol/L'): number {
  return unit === 'mmol/L' ? glucose * 18 : glucose;
}

/**
 * Assess DKA severity
 */
export function assessDKASeverity(assessment: DKAAssessment): DKASeverity {
  let score = 0;
  const glucoseMgdl = normalizeGlucose(assessment.bloodGlucose, assessment.glucoseUnit);

  // pH assessment
  if (assessment.pH < 7.1) score += 3;
  else if (assessment.pH < 7.2) score += 2;
  else if (assessment.pH < 7.3) score += 1;

  // Bicarbonate assessment
  if (assessment.bicarbonate < 5) score += 3;
  else if (assessment.bicarbonate < 10) score += 2;
  else if (assessment.bicarbonate < 15) score += 1;

  // Anion gap
  if (assessment.anionGap > 16) score += 2;
  if (assessment.anionGap > 20) score += 1;

  // Ketonemia
  if (assessment.ketonemia === 'large') score += 2;
  if (assessment.ketonemia === 'moderate') score += 1;

  // Mental status
  if (assessment.mentalStatus === 'lethargic') score += 2;
  if (assessment.mentalStatus === 'unresponsive') score += 3;

  // Respiratory pattern
  if (assessment.breathPattern === 'kussmaul') score += 2;

  let level: 'mild' | 'moderate' | 'severe';
  let classification: string;
  let riskOfCerebralEdema: boolean;

  if (score >= 8 || assessment.pH < 7.1 || assessment.mentalStatus !== 'alert') {
    level = 'severe';
    classification = 'Severe DKA';
    riskOfCerebralEdema = true;
  } else if (score >= 5 || assessment.pH < 7.2) {
    level = 'moderate';
    classification = 'Moderate DKA';
    riskOfCerebralEdema = false;
  } else {
    level = 'mild';
    classification = 'Mild DKA';
    riskOfCerebralEdema = false;
  }

  return {
    level,
    classification,
    score,
    description: `${classification} - pH ${assessment.pH.toFixed(2)}, HCO3 ${assessment.bicarbonate} mEq/L`,
    requiresICU: level === 'severe',
    riskOfCerebralEdema,
  };
}

/**
 * Calculate fluid resuscitation for DKA
 */
export function calculateDKAFluidResuscitation(
  assessment: DKAAssessment,
  severity: DKASeverity
): DKAIntervention[] {
  const interventions: DKAIntervention[] = [];

  // Calculate total fluid deficit
  const totalDeficitMl = assessment.weightKg * 10 * (assessment.fluidDeficit / 100);

  // Phase 1: Initial resuscitation (first 30 minutes)
  const phase1Fluid = Math.min(totalDeficitMl * 0.5, assessment.weightKg * 20);
  interventions.push({
    type: 'fluid_resuscitation_phase1',
    description: 'Initial IV fluid resuscitation (Phase 1)',
    indication: 'Replace 50% of fluid deficit over 30 minutes',
    dosing: `${phase1Fluid.toFixed(0)}mL of 0.9% normal saline
Infusion rate: ${(phase1Fluid / 0.5).toFixed(0)}mL/hour`,
    frequency: 'Over 30 minutes',
    monitoring: 'Blood pressure, heart rate, urine output',
  });

  // Phase 2: Continued resuscitation (next 2.5 hours)
  const phase2Fluid = totalDeficitMl * 0.5;
  interventions.push({
    type: 'fluid_resuscitation_phase2',
    description: 'Continued IV fluid resuscitation (Phase 2)',
    indication: 'Replace remaining 50% of fluid deficit over 2.5 hours',
    dosing: `${phase2Fluid.toFixed(0)}mL of 0.9% normal saline
Infusion rate: ${(phase2Fluid / 2.5).toFixed(0)}mL/hour`,
    frequency: 'Over 2.5 hours',
    monitoring: 'Glucose, electrolytes, urine output',
  });

  // Maintenance fluids
  const maintenanceMl = assessment.weightKg * 100;
  interventions.push({
    type: 'maintenance_fluids',
    description: 'Maintenance IV fluids',
    indication: 'Ongoing hydration',
    dosing: `${maintenanceMl.toFixed(0)}mL/day of 0.45% normal saline
Typical rate: ${(maintenanceMl / 24).toFixed(0)}mL/hour`,
    monitoring: 'Electrolytes, fluid balance',
  });

  return interventions;
}

/**
 * Generate insulin therapy protocol
 */
export function generateInsulinProtocol(
  assessment: DKAAssessment,
  severity: DKASeverity
): DKAIntervention[] {
  const interventions: DKAIntervention[] = [];

  // Initial insulin bolus (0.1 U/kg)
  const initialBolus = assessment.weightKg * 0.1;
  interventions.push({
    type: 'insulin_bolus_initial',
    description: 'Initial IV insulin bolus',
    indication: 'Begin insulin therapy after fluid resuscitation started',
    dosing: `${initialBolus.toFixed(1)}U of regular insulin IV
(0.1 U/kg)`,
    frequency: 'One-time bolus',
    monitoring: 'Blood glucose, potassium',
  });

  // Continuous insulin infusion (0.1 U/kg/hour)
  const insulinInfusion = assessment.weightKg * 0.1;
  interventions.push({
    type: 'insulin_infusion_continuous',
    description: 'Continuous IV insulin infusion',
    indication: 'Maintain steady glucose decline',
    dosing: `${insulinInfusion.toFixed(1)}U/hour of regular insulin IV
(0.1 U/kg/hour)
Preparation: 50U regular insulin in 50mL 0.9% NS = 1U/mL`,
    frequency: 'Continuous infusion',
    monitoring: 'Blood glucose every 1 hour; adjust rate based on glucose decline',
  });

  // Glucose management
  interventions.push({
    type: 'glucose_management',
    description: 'Glucose monitoring and management',
    indication: 'Target glucose decline 50-100 mg/dL/hour',
    dosing: `If glucose < 250 mg/dL: Add dextrose to IV fluids (5-10% dextrose)
Continue insulin infusion until pH > 7.3 and HCO3 > 15`,
    frequency: 'Check glucose every 1 hour',
    monitoring: 'Ensure glucose decline is gradual (avoid rapid drop)',
  });

  return interventions;
}

/**
 * Generate electrolyte management protocol
 */
export function generateElectrolyteManagement(assessment: DKAAssessment): DKAIntervention[] {
  const interventions: DKAIntervention[] = [];

  // Potassium management
  let potassiumStatus: string;
  if (assessment.potassium < 3.5) {
    potassiumStatus = 'LOW - URGENT replacement needed';
  } else if (assessment.potassium < 5.5) {
    potassiumStatus = 'NORMAL - Monitor closely';
  } else {
    potassiumStatus = 'HIGH - Withhold K+ supplementation';
  }

  interventions.push({
    type: 'potassium_management',
    description: 'Potassium supplementation',
    indication: 'Maintain K+ 3.5-5.5 mEq/L',
    dosing: `Current K+: ${assessment.potassium} mEq/L (${potassiumStatus})
If K+ < 3.5: Add 20-40 mEq/L to IV fluids
If K+ 3.5-5.5: Add 20 mEq/L to IV fluids
If K+ > 5.5: Withhold K+ supplementation`,
    monitoring: 'Serum K+ every 2-4 hours; ECG if K+ abnormal',
  });

  // Sodium management
  interventions.push({
    type: 'sodium_management',
    description: 'Sodium monitoring',
    indication: 'Monitor for hyponatremia',
    dosing: `Current Na+: ${assessment.sodium} mEq/L
Use 0.9% NS for initial resuscitation
Monitor for pseudohyponatremia (due to hyperglycemia)`,
    monitoring: 'Serum Na+ every 4 hours',
  });

  // Phosphate management
  interventions.push({
    type: 'phosphate_management',
    description: 'Phosphate monitoring',
    indication: 'Monitor for hypophosphatemia',
    dosing: 'Monitor phosphate levels; supplement if < 1.5 mg/dL',
    monitoring: 'Serum phosphate every 4-6 hours',
  });

  return interventions;
}

/**
 * Generate cerebral edema prevention protocol
 */
export function generateCerebralEdemaProtocol(assessment: DKAAssessment): DKAIntervention[] {
  const interventions: DKAIntervention[] = [];

  interventions.push({
    type: 'cerebral_edema_prevention',
    description: 'Cerebral edema prevention measures',
    indication: 'Reduce risk of cerebral edema during DKA treatment',
    dosing: `- Avoid hypotonic fluids (use 0.9% NS)
- Avoid rapid glucose decline (target 50-100 mg/dL/hour)
- Monitor for signs: headache, altered mental status, seizures
- If cerebral edema suspected: Mannitol 0.25-1 g/kg IV or hypertonic saline`,
    monitoring: 'Continuous neurological assessment',
  });

  return interventions;
}

/**
 * Generate clinical summary
 */
export function generateDKASummary(assessment: DKAAssessment, severity: DKASeverity): string {
  const glucoseMgdl = normalizeGlucose(assessment.bloodGlucose, assessment.glucoseUnit);

  const summary = `
DIABETIC KETOACIDOSIS (DKA) CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg

Severity: ${severity.level.toUpperCase()}
${severity.description}

Laboratory Values:
- Blood Glucose: ${glucoseMgdl.toFixed(0)} mg/dL (${(glucoseMgdl / 18).toFixed(1)} mmol/L)
- pH: ${assessment.pH.toFixed(2)}
- Bicarbonate: ${assessment.bicarbonate} mEq/L
- Anion Gap: ${assessment.anionGap}
- Ketonemia: ${assessment.ketonemia}
- Ketonuria: ${assessment.ketonuria}

Electrolytes:
- Potassium: ${assessment.potassium} mEq/L
- Sodium: ${assessment.sodium} mEq/L
- Chloride: ${assessment.chloride} mEq/L

Clinical Findings:
- Respiratory Pattern: ${assessment.breathPattern}
- Mental Status: ${assessment.mentalStatus}
- Fluid Deficit: ${assessment.fluidDeficit}%
- Vomiting: ${assessment.vomiting ? 'Yes' : 'No'}
- Abdominal Pain: ${assessment.abdominalPain ? 'Yes' : 'No'}

Risk Assessment:
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Not indicated'}
- Cerebral Edema Risk: ${severity.riskOfCerebralEdema ? 'HIGH - Monitor closely' : 'Low'}

Treatment Plan:
1. Fluid Resuscitation: URGENT (0.9% NS)
2. Insulin Therapy: Start after fluids initiated
3. Electrolyte Management: Monitor and supplement as needed
4. Cerebral Edema Prevention: Avoid rapid glucose decline

Follow-up: Reassess every 1-2 hours; monitor glucose decline rate
  `.trim();

  return summary;
}
