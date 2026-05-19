/**
 * Septic Shock Clinical Engine
 * 
 * Provides sequential assessment and evidence-based management for pediatric septic shock
 * Based on Surviving Sepsis Campaign guidelines and ACCM/PCCM recommendations
 */

export interface SepticShockAssessment {
  age: number; // years
  weightKg: number;
  temperature: number; // Celsius
  heartRate: number;
  respiratoryRate: number;
  systolicBP: number;
  diastolicBP: number;
  capillaryRefillTime: number; // seconds
  skinPerfusion: 'warm' | 'cool' | 'mottled' | 'cyanotic';
  urinationStatus: 'normal' | 'decreased' | 'absent';
  mentalStatus: 'alert' | 'lethargic' | 'unresponsive';
  lactate: number; // mmol/L
  suspectedSource: string; // e.g., pneumonia, UTI, meningitis
  priorFluidGiven?: number; // mL
}

export interface ShockSeverity {
  level: 'compensated' | 'uncompensated' | 'refractory';
  classification: 'warm_shock' | 'cold_shock' | 'mixed_shock';
  score: number;
  description: string;
  requiresICU: boolean;
  requiresVasopressors: boolean;
}

export interface ShockIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
}

/**
 * Calculate age-appropriate blood pressure percentiles
 */
function getNormalBPRange(ageYears: number): { systolic: [number, number]; diastolic: [number, number] } {
  if (ageYears < 1) return { systolic: [70, 100], diastolic: [40, 60] };
  if (ageYears < 3) return { systolic: [80, 110], diastolic: [50, 70] };
  if (ageYears < 6) return { systolic: [90, 120], diastolic: [55, 75] };
  if (ageYears < 10) return { systolic: [100, 130], diastolic: [60, 80] };
  return { systolic: [110, 140], diastolic: [65, 85] };
}

/**
 * Assess septic shock severity
 */
export function assessSepticShockSeverity(assessment: SepticShockAssessment): ShockSeverity {
  let score = 0;
  let classification: 'warm_shock' | 'cold_shock' | 'mixed_shock' = 'warm_shock';

  const bpRange = getNormalBPRange(assessment.age);
  const isHypotensive = assessment.systolicBP < bpRange.systolic[0];

  // Perfusion assessment
  if (assessment.capillaryRefillTime > 2) score += 2;
  if (assessment.skinPerfusion === 'cool') score += 2;
  if (assessment.skinPerfusion === 'mottled') score += 3;
  if (assessment.skinPerfusion === 'cyanotic') score += 4;

  // Shock classification based on perfusion
  if (assessment.capillaryRefillTime <= 2 && assessment.skinPerfusion === 'warm') {
    classification = 'warm_shock';
  } else if (assessment.capillaryRefillTime > 2 && assessment.skinPerfusion === 'cool') {
    classification = 'cold_shock';
  } else {
    classification = 'mixed_shock';
  }

  // Hypotension
  if (isHypotensive) score += 3;

  // Tachycardia
  const ageBasedHR = assessment.age < 1 ? 160 : assessment.age < 3 ? 150 : assessment.age < 6 ? 130 : 110;
  if (assessment.heartRate > ageBasedHR) score += 1;

  // Altered mental status
  if (assessment.mentalStatus === 'lethargic') score += 2;
  if (assessment.mentalStatus === 'unresponsive') score += 3;

  // Lactate elevation
  if (assessment.lactate > 4) score += 2;
  if (assessment.lactate > 2) score += 1;

  // Oliguria
  if (assessment.urinationStatus === 'decreased') score += 1;
  if (assessment.urinationStatus === 'absent') score += 2;

  let level: 'compensated' | 'uncompensated' | 'refractory';
  let description: string;
  let requiresVasopressors: boolean;

  if (score >= 10 || (isHypotensive && assessment.lactate > 4)) {
    level = 'refractory';
    description = 'Refractory septic shock - requires immediate ICU and vasopressor support';
    requiresVasopressors = true;
  } else if (score >= 6 || isHypotensive) {
    level = 'uncompensated';
    description = 'Uncompensated septic shock - requires aggressive fluid resuscitation';
    requiresVasopressors = false;
  } else {
    level = 'compensated';
    description = 'Compensated septic shock - requires fluid resuscitation and monitoring';
    requiresVasopressors = false;
  }

  return {
    level,
    classification,
    score,
    description,
    requiresICU: level !== 'compensated',
    requiresVasopressors,
  };
}

/**
 * Calculate fluid resuscitation requirements
 */
export function calculateFluidResuscitation(
  assessment: SepticShockAssessment,
  severity: ShockSeverity
): ShockIntervention[] {
  const interventions: ShockIntervention[] = [];

  // Initial bolus: 20 mL/kg over 15-30 minutes
  const initialBolus = assessment.weightKg * 20;
  const bolusRate = initialBolus / 0.5; // mL/hour for 30-minute infusion

  interventions.push({
    type: 'fluid_bolus_initial',
    description: 'Initial IV fluid bolus (20 mL/kg)',
    indication: 'Septic shock with hypotension or poor perfusion',
    dosing: `${initialBolus.toFixed(0)}mL of normal saline or Ringer's lactate
Infusion rate: ${bolusRate.toFixed(0)}mL/hour
Duration: 30 minutes`,
    monitoring: 'Blood pressure, heart rate, perfusion, urine output',
  });

  // Reassessment after first bolus
  interventions.push({
    type: 'reassessment_post_bolus',
    description: 'Reassess perfusion after first bolus',
    indication: 'Determine need for additional fluid or vasopressors',
    dosing: 'Reassess: BP, CRT, skin perfusion, lactate',
    monitoring: 'If still hypotensive or poor perfusion → second bolus or vasopressors',
  });

  // Second bolus if needed
  if (severity.level !== 'compensated') {
    const secondBolus = assessment.weightKg * 20;
    interventions.push({
      type: 'fluid_bolus_second',
      description: 'Second IV fluid bolus (20 mL/kg)',
      indication: 'Persistent hypotension or poor perfusion after first bolus',
      dosing: `${secondBolus.toFixed(0)}mL of normal saline or Ringer's lactate
Infusion rate: ${(secondBolus / 0.5).toFixed(0)}mL/hour
Duration: 30 minutes`,
      monitoring: 'Blood pressure, perfusion, urine output',
    });
  }

  // Maintenance fluids
  const maintenanceMl = assessment.weightKg * 100;
  interventions.push({
    type: 'maintenance_fluids',
    description: 'Maintenance IV fluids',
    indication: 'Ongoing hydration after resuscitation',
    dosing: `${maintenanceMl.toFixed(0)}mL/day of normal saline
Typical rate: ${(maintenanceMl / 24).toFixed(0)}mL/hour`,
    monitoring: 'Urine output, electrolytes, fluid balance',
  });

  return interventions;
}

/**
 * Generate antibiotic regimen
 */
export function generateAntibioticRegimen(assessment: SepticShockAssessment): ShockIntervention[] {
  const interventions: ShockIntervention[] = [];

  // Empiric broad-spectrum coverage
  const ceftriaxone = assessment.weightKg * 80;
  const gentamicin = assessment.weightKg * 7.5;

  interventions.push({
    type: 'antibiotic_first_line',
    description: 'Ceftriaxone + Gentamicin (empiric coverage)',
    indication: 'Septic shock - empiric broad-spectrum coverage',
    dosing: `Ceftriaxone: ${ceftriaxone.toFixed(0)}mg/day IV (${(ceftriaxone / 2).toFixed(0)}mg Q12H)
Gentamicin: ${gentamicin.toFixed(1)}mg/day IV (${(gentamicin / 2).toFixed(1)}mg Q12H)`,
    frequency: 'Every 12 hours',
    monitoring: 'Renal function, hearing, clinical response',
  });

  // Consider adding vancomycin for resistant organisms
  const vancomycin = assessment.weightKg * 40;
  interventions.push({
    type: 'antibiotic_additional',
    description: 'Vancomycin (if resistant organism suspected)',
    indication: 'High-risk for resistant organisms (MRSA, etc.)',
    dosing: `${vancomycin.toFixed(0)}mg/day IV (${(vancomycin / 4).toFixed(0)}mg Q6H)`,
    frequency: 'Every 6 hours',
    monitoring: 'Vancomycin levels, renal function',
  });

  // Source-specific antibiotics
  if (assessment.suspectedSource.includes('meningitis')) {
    interventions.push({
      type: 'antibiotic_source_specific',
      description: 'Add Cefotaxime (for meningitis coverage)',
      indication: 'Suspected meningitis',
      dosing: `${(assessment.weightKg * 200).toFixed(0)}mg/day IV (${(assessment.weightKg * 50).toFixed(0)}mg Q6H)`,
      frequency: 'Every 6 hours',
      monitoring: 'CSF penetration, clinical response',
    });
  }

  return interventions;
}

/**
 * Generate vasopressor recommendations
 */
export function generateVasopressorRegimen(assessment: SepticShockAssessment): ShockIntervention[] {
  const interventions: ShockIntervention[] = [];

  // Norepinephrine is first-line vasopressor
  interventions.push({
    type: 'vasopressor_first_line',
    description: 'Norepinephrine infusion',
    indication: 'Refractory septic shock (hypotension despite fluid resuscitation)',
    dosing: `Starting dose: 0.05 mcg/kg/minute IV
Titrate: 0.05-1.3 mcg/kg/minute to maintain MAP > 65 mmHg`,
    frequency: 'Continuous infusion',
    monitoring: 'Blood pressure, heart rate, perfusion, lactate, urine output',
  });

  // Epinephrine if norepinephrine inadequate
  interventions.push({
    type: 'vasopressor_additional',
    description: 'Epinephrine (if norepinephrine inadequate)',
    indication: 'Refractory shock despite norepinephrine',
    dosing: `Starting dose: 0.05 mcg/kg/minute IV
Titrate: 0.05-1.5 mcg/kg/minute`,
    frequency: 'Continuous infusion',
    monitoring: 'Blood pressure, heart rate, lactate, perfusion',
  });

  return interventions;
}

/**
 * Generate supportive care interventions
 */
export function generateSupportiveCare(assessment: SepticShockAssessment): ShockIntervention[] {
  const interventions: ShockIntervention[] = [];

  // Oxygen therapy
  interventions.push({
    type: 'oxygen_therapy',
    description: 'Supplemental oxygen',
    indication: 'Maintain SpO2 > 92%',
    dosing: 'Titrate to maintain SpO2 > 92%',
    monitoring: 'Continuous pulse oximetry',
  });

  // Glucose management
  interventions.push({
    type: 'glucose_management',
    description: 'Glucose monitoring and management',
    indication: 'Maintain glucose 100-180 mg/dL (5.6-10 mmol/L)',
    dosing: 'Check glucose every 1-2 hours; treat hypoglycemia with dextrose',
    monitoring: 'Blood glucose, insulin if needed',
  });

  // Stress ulcer prophylaxis
  const ranitidine = assessment.weightKg * 1;
  interventions.push({
    type: 'stress_ulcer_prophylaxis',
    description: 'H2 blocker',
    indication: 'Prevent stress ulceration',
    dosing: `Ranitidine: ${ranitidine.toFixed(0)}mg IV Q6-8H`,
    monitoring: 'GI bleeding signs',
  });

  // DVT prophylaxis
  interventions.push({
    type: 'dvt_prophylaxis',
    description: 'DVT prophylaxis',
    indication: 'Prevent thromboembolism',
    dosing: 'Mechanical: Sequential compression devices',
    monitoring: 'Leg swelling, bleeding signs',
  });

  return interventions;
}

/**
 * Generate clinical summary
 */
export function generateSepticShockSummary(
  assessment: SepticShockAssessment,
  severity: ShockSeverity
): string {
  const summary = `
SEPTIC SHOCK CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg
Suspected Source: ${assessment.suspectedSource}

Shock Classification: ${severity.classification.replace(/_/g, ' ').toUpperCase()}
Severity: ${severity.level.toUpperCase()}
${severity.description}

Vital Signs & Perfusion:
- Temperature: ${assessment.temperature}°C
- Heart Rate: ${assessment.heartRate} bpm
- Respiratory Rate: ${assessment.respiratoryRate} breaths/min
- BP: ${assessment.systolicBP}/${assessment.diastolicBP} mmHg
- Capillary Refill: ${assessment.capillaryRefillTime} seconds
- Skin Perfusion: ${assessment.skinPerfusion}
- Mental Status: ${assessment.mentalStatus}

Laboratory:
- Lactate: ${assessment.lactate} mmol/L
- Urine Output: ${assessment.urinationStatus}

Recommendations:
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Consider if deteriorating'}
- Vasopressors: ${severity.requiresVasopressors ? 'REQUIRED' : 'Not indicated at this time'}
- Fluid Resuscitation: URGENT (20 mL/kg bolus)
- Antibiotics: URGENT (within 1 hour)

Follow-up: Reassess every 15-30 minutes; escalate if worsening
  `.trim();

  return summary;
}
