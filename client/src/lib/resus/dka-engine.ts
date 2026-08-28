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

function formatMmollFromMgdl(mgdl: number): string {
  return (mgdl / 18).toFixed(1);
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
  if (!Number.isFinite(assessment.age) || assessment.age < 0) {
    throw new Error('A valid non-negative age is required for DKA guidance.');
  }
  if (!Number.isFinite(assessment.weightKg) || assessment.weightKg <= 0) {
    throw new Error('A valid positive dosing weight is required for DKA guidance.');
  }
  if (!Number.isFinite(assessment.pH) || !Number.isFinite(assessment.bicarbonate)) {
    throw new Error('Valid pH and bicarbonate values are required for DKA severity assessment.');
  }

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

  if (score >= 8 || assessment.pH < 7.1 || assessment.mentalStatus === 'unresponsive') {
    level = 'severe';
    classification = 'Severe DKA';
    riskOfCerebralEdema = assessment.age < 18;
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
    description: `${classification} - pH ${assessment.pH.toFixed(2)}, HCO3 ${assessment.bicarbonate} mmol/L (mEq/L equivalent)`,
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

  const estimatedDeficitMl = assessment.weightKg * (assessment.fluidDeficit / 100) * 1000;

  interventions.push({
    type: 'fluid_resuscitation_phase1',
    description: 'Initial isotonic fluid and perfusion assessment',
    indication: 'Use the selected age/context DKA protocol. If shock or poor perfusion is present, give a controlled isotonic aliquot and reassess before repeating.',
    dosing: `Estimated fluid deficit: ${estimatedDeficitMl.toFixed(0)} mL for planning only. Do not replace a fixed percentage of the deficit rapidly or use this estimate as an automatic bolus schedule. Select paediatric or adult DKA protocol and account for corrected sodium, osmolality, renal/cardiac status, and perfusion.`,
    frequency: 'Reassess haemodynamics, neurological status, glucose, sodium, and fluid balance after each intervention',
    monitoring: 'Blood pressure, heart rate, respiratory effort, urine output, neurological status, corrected sodium, osmolality, and signs of fluid overload',
  });

  interventions.push({
    type: 'fluid_resuscitation_phase2',
    description: 'Controlled deficit and maintenance replacement',
    indication: 'After initial stabilisation, replace deficit and maintenance using the selected age/context DKA protocol; avoid a generic time-and-volume schedule.',
    dosing: 'Use a protocol-calculated infusion rate with serial reassessment. Adjust for corrected sodium, glucose trend, neurological findings, kidney function, heart failure, and local crystalloid availability.',
    frequency: 'Continuous protocol-guided infusion with frequent reassessment',
    monitoring: 'Glucose, electrolytes, venous pH/bicarbonate, fluid balance, urine output, and neurological status',
  });

  interventions.push({
    type: 'maintenance_fluids',
    description: 'Protocol-guided maintenance fluid',
    indication: 'Ongoing hydration after initial stabilisation',
    dosing: 'Do not use a universal 4-2-1 or 100 mL/kg/day assumption across ages. Use the selected paediatric or adult DKA protocol and local fluid policy.',
    monitoring: 'Electrolytes, corrected sodium, osmolality, fluid balance, renal function, and signs of overload',
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

  if (assessment.age >= 18) {
    interventions.push({
      type: 'adult_dka_protocol_gate',
      description: 'Adult DKA insulin protocol required',
      indication: 'Adult DKA requires the current adult institutional protocol and senior review.',
      dosing: 'Use the approved adult DKA insulin, potassium, fluid, and glucose-addition protocol. Do not apply the paediatric no-bolus/rate wording from this engine.',
      monitoring: 'Hourly glucose and frequent electrolytes, ketones, acid-base status, fluid balance, and neurological assessment.',
    });
    return interventions;
  }

  // No insulin bolus in children (ISPAD) — infusion only
  // Continuous insulin infusion (0.05-0.1 U/kg/hour)
  const insulinInfusion = assessment.weightKg * 0.1;
  interventions.push({
    type: 'insulin_infusion_continuous',
    description: 'Continuous IV insulin infusion',
    indication: 'After fluids started and K+ >3.5 mmol/L — continue until ketosis resolving',
    dosing: `${(assessment.weightKg * 0.05).toFixed(2)}–${insulinInfusion.toFixed(1)} U/hour regular insulin IV (0.05–0.1 U/kg/h; no bolus in children)`,
    frequency: 'Continuous infusion',
    monitoring: 'Glucose hourly; ketones until clearing; do not stop for normoglycaemia alone',
  });

  interventions.push({
    type: 'glucose_management',
    description: 'Glucose + ketone targets',
    indication: 'Avoid stopping insulin when glucose normalises',
    dosing: `When glucose falls according to the selected protocol, add dextrose so insulin can continue until ketosis resolves. Do not stop insulin for normoglycaemia alone; use serial ketones, pH, bicarbonate, and clinical status.`,
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
    indication: 'Maintain K+ 3.5-5.5 mmol/L (mEq/L equivalent)',
    dosing: `Current K+: ${assessment.potassium} mmol/L (mEq/L equivalent) (${potassiumStatus})
If K+ < 3.5: Add 20-40 mmol/L (mEq/L equivalent) to IV fluids
If K+ 3.5-5.5: Add 20 mmol/L (mEq/L equivalent) to IV fluids
If K+ > 5.5: Withhold K+ supplementation`,
    monitoring: 'Serum K+ every 2-4 hours; ECG if K+ abnormal',
  });

  // Sodium management
  interventions.push({
    type: 'sodium_management',
    description: 'Sodium monitoring',
    indication: 'Monitor for hyponatremia',
    dosing: `Current Na+: ${assessment.sodium} mmol/L (mEq/L equivalent)
Use 0.9% NS for initial resuscitation
Monitor for pseudohyponatremia (due to hyperglycemia)`,
    monitoring: 'Serum Na+ every 4 hours',
  });

  // Phosphate management
  interventions.push({
    type: 'phosphate_management',
    description: 'Phosphate monitoring',
    indication: 'Monitor for hypophosphatemia',
    dosing: 'Monitor phosphate levels; supplement if < 1.5 mg/dL (<0.48 mmol/L)',
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
    dosing: `- Use the selected age/context DKA fluid protocol and monitor corrected sodium/osmolality
- Avoid rapid changes in glucose or osmolality
- Monitor for headache, altered mental status, irritability, bradycardia, hypertension, or seizures
- If cerebral oedema is suspected: treat immediately under the local paediatric/adult emergency protocol; do not delay for imaging and do not use an ungoverned universal dose`,
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
- Bicarbonate: ${assessment.bicarbonate} mmol/L (mEq/L equivalent)
- Anion Gap: ${assessment.anionGap}
- Ketonemia: ${assessment.ketonemia}
- Ketonuria: ${assessment.ketonuria}

Electrolytes:
- Potassium: ${assessment.potassium} mmol/L (mEq/L equivalent)
- Sodium: ${assessment.sodium} mmol/L (mEq/L equivalent)
- Chloride: ${assessment.chloride} mmol/L (mEq/L equivalent)

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
1. Fluid resuscitation: use the selected age/context DKA protocol with reassessment
2. Insulin therapy: start after appropriate fluid initiation and potassium safety check
3. Electrolyte Management: Monitor and supplement as needed
4. Cerebral Edema Prevention: Avoid rapid glucose decline

Follow-up: Reassess every 1-2 hours; monitor glucose decline rate
  `.trim();

  return summary;
}
