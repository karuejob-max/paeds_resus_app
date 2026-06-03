/**
 * Septic Shock Clinical Engine — FEAST-aware fluid teaching aligned with CST.
 */

import { SPO2_TARGET_MIN_PERCENT, SPO2_TARGET_RESUS_DETAIL } from '@shared/clinical-spo2-targets';

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

  // Initial bolus: 10 mL/kg aliquots up to 40–60 mL/kg total (FEAST-aware)
  const aliquotMl = assessment.weightKg * 10;
  const bolusRate = aliquotMl / 0.17; // ~10 min push

  interventions.push({
    type: 'fluid_bolus_initial',
    description: 'IV fluid aliquot: 10 mL/kg — reassess after EACH aliquot',
    indication: 'Septic shock with hypotension or poor perfusion. Repeat 10 mL/kg aliquots up to 40–60 mL/kg total OR until perfusion improves — stop if fluid overload (FEAST-aware in non-hypovolaemic shock).',
    dosing: `${aliquotMl.toFixed(0)} mL normal saline or Ringer's lactate per aliquot
Rate: push over 5–10 min (not a single 20 mL/kg bolus)
Cumulative target: 40–60 mL/kg with reassessment between aliquots`,
    monitoring: 'BP, HR, CRT, perfusion, urine output, lung sounds (pulmonary oedema)',
  });

  interventions.push({
    type: 'reassessment_post_bolus',
    description: 'Reassess perfusion after each 10 mL/kg aliquot',
    indication: 'Mandatory before repeating fluid — watch for overload',
    dosing: 'Reassess: BP, CRT, skin perfusion, lactate, respiratory status',
    monitoring: 'If still shocked without overload → next 10 mL/kg aliquot; if refractory → vasopressors',
  });

  if (severity.level !== 'compensated') {
    const secondAliquot = assessment.weightKg * 10;
    interventions.push({
      type: 'fluid_bolus_second',
      description: 'Second aliquot: 10 mL/kg (only if no overload and still shocked)',
      indication: 'Persistent hypotension or poor perfusion after first 10 mL/kg + reassessment',
      dosing: `${secondAliquot.toFixed(0)} mL — 10 mL/kg aliquot only (not 20 mL/kg single bolus)`,
      monitoring: 'Stop at 40–60 mL/kg cumulative or if crackles, hepatomegaly, falling SpO₂',
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

  // Empiric broad-spectrum — 80–100 mg/kg/day ceftriaxone (max 4 g/day); meningitis dose at upper range
  const ceftriaxoneDose = Math.min(assessment.weightKg * 100, 4000);
  const gentamicin = assessment.weightKg * 7.5;

  interventions.push({
    type: 'antibiotic_first_line',
    description: 'Ceftriaxone + Gentamicin (empiric coverage)',
    indication: 'Septic shock — give within 1 hour. If meningitis suspected, treat as meningitis (high-dose ceftriaxone + consider dexamethasone).',
    dosing: `Ceftriaxone: ${ceftriaxoneDose.toFixed(0)} mg/day IV (80–100 mg/kg/day, max 4000 mg/day)
Loading: ${(ceftriaxoneDose / 2).toFixed(0)} mg Q12H or per local protocol
Gentamicin: ${gentamicin.toFixed(1)} mg/day IV (${(gentamicin / 2).toFixed(1)} mg Q12H)`,
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
    indication: `Maintain SpO₂ ≥${SPO2_TARGET_MIN_PERCENT}% (${SPO2_TARGET_RESUS_DETAIL})`,
    dosing: SPO2_TARGET_RESUS_DETAIL,
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
- Fluid Resuscitation: URGENT (10 mL/kg aliquots — reassess after each; up to 40–60 mL/kg total)
- Antibiotics: URGENT (within 1 hour)

Follow-up: Reassess every 15-30 minutes; escalate if worsening
  `.trim();

  return summary;
}
