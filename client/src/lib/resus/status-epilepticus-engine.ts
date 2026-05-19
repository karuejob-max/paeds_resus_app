/**
 * Status Epilepticus Clinical Engine
 * 
 * Provides sequential assessment and evidence-based management for pediatric status epilepticus
 * Based on AES and ILAE guidelines
 */

export interface StatusEpilepticusAssessment {
  age: number; // years
  weightKg: number;
  seizureDuration: number; // minutes
  seizureType: 'generalized_tonic_clonic' | 'focal' | 'absence' | 'myoclonic' | 'atonic' | 'mixed';
  consciousness: 'alert' | 'drowsy' | 'unresponsive';
  airwayPatency: 'patent' | 'compromised' | 'obstructed';
  oxygenSaturation: number; // %
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number; // Celsius
  priorSeizures: boolean;
  priorAntiepileptics: string[]; // e.g., ['phenytoin', 'levetiracetam']
  knownEtiology: string; // e.g., 'idiopathic', 'infection', 'trauma', 'metabolic'
  bloodGlucose: number; // mg/dL
  lastMedicationTime?: number; // minutes ago
}

export interface StatusEpilepticusSeverity {
  level: 'early_se' | 'established_se' | 'refractory_se' | 'super_refractory_se';
  classification: string;
  description: string;
  requiresICU: boolean;
  requiresIntubation: boolean;
  requiresAnesthesia: boolean;
}

export interface StatusEpilepticusIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
  timeWindow?: string;
}

/**
 * Assess status epilepticus severity
 */
export function assessStatusEpilepticusSeverity(
  assessment: StatusEpilepticusAssessment
): StatusEpilepticusSeverity {
  let level: 'early_se' | 'established_se' | 'refractory_se' | 'super_refractory_se';
  let description: string;

  // Classification based on duration
  if (assessment.seizureDuration < 5) {
    level = 'early_se';
    description = 'Early Status Epilepticus (< 5 minutes) - First-line therapy indicated';
  } else if (assessment.seizureDuration < 30) {
    level = 'established_se';
    description = 'Established Status Epilepticus (5-30 minutes) - Second-line therapy if first-line fails';
  } else if (assessment.seizureDuration < 60) {
    level = 'refractory_se';
    description = 'Refractory Status Epilepticus (30-60 minutes) - Third-line therapy + ICU';
  } else {
    level = 'super_refractory_se';
    description = 'Super-Refractory Status Epilepticus (> 60 minutes) - Anesthesia + ICU';
  }

  const requiresIntubation = assessment.consciousness === 'unresponsive' || assessment.airwayPatency !== 'patent';
  const requiresAnesthesia = level === 'refractory_se' || level === 'super_refractory_se';

  return {
    level,
    classification: `${level.replace(/_/g, ' ').toUpperCase()}`,
    description,
    requiresICU: level !== 'early_se',
    requiresIntubation,
    requiresAnesthesia,
  };
}

/**
 * Generate first-line seizure management (0-5 minutes)
 */
export function generateFirstLineTherapy(
  assessment: StatusEpilepticusAssessment
): StatusEpilepticusIntervention[] {
  const interventions: StatusEpilepticusIntervention[] = [];

  // Benzodiazepine - first-line
  const lorazepam = assessment.weightKg * 0.1; // max 4mg
  const lorazepamDose = Math.min(lorazepam, 4);

  interventions.push({
    type: 'benzodiazepine_first_line',
    description: 'Lorazepam IV (first-line)',
    indication: 'Initial seizure management',
    dosing: `${lorazepamDose.toFixed(1)}mg IV
(0.1 mg/kg, max 4mg)`,
    frequency: 'One-time dose',
    timeWindow: '0-5 minutes',
    monitoring: 'Seizure cessation, respiratory status, blood pressure',
  });

  // Alternative: Diazepam if IV access not available
  const diazepam = assessment.weightKg * 0.3; // max 10mg
  const diazepamDose = Math.min(diazepam, 10);

  interventions.push({
    type: 'benzodiazepine_alternative',
    description: 'Diazepam IV (if lorazepam unavailable)',
    indication: 'Alternative first-line if lorazepam not available',
    dosing: `${diazepamDose.toFixed(1)}mg IV
(0.3 mg/kg, max 10mg)`,
    frequency: 'One-time dose',
    timeWindow: '0-5 minutes',
    monitoring: 'Seizure cessation, respiratory status',
  });

  // Rectal diazepam if no IV access
  const rectalDiazepam = assessment.weightKg * 0.5; // max 20mg
  const rectalDose = Math.min(rectalDiazepam, 20);

  interventions.push({
    type: 'benzodiazepine_rectal',
    description: 'Diazepam rectal (if no IV access)',
    indication: 'Alternative route if IV access not available',
    dosing: `${rectalDose.toFixed(1)}mg rectally
(0.5 mg/kg, max 20mg)`,
    frequency: 'One-time dose',
    timeWindow: '0-5 minutes',
    monitoring: 'Seizure cessation',
  });

  // Supportive care
  interventions.push({
    type: 'supportive_care_initial',
    description: 'Initial supportive care',
    indication: 'Maintain airway and oxygenation',
    dosing: `- Position on side
- Clear airway of secretions
- Supplemental oxygen to maintain SpO2 > 94%
- Establish IV access if possible`,
    monitoring: 'Airway patency, oxygen saturation, vital signs',
  });

  return interventions;
}

/**
 * Generate second-line seizure management (5-30 minutes)
 */
export function generateSecondLineTherapy(
  assessment: StatusEpilepticusAssessment
): StatusEpilepticusIntervention[] {
  const interventions: StatusEpilepticusIntervention[] = [];

  // Phenytoin
  const phenytoin = assessment.weightKg * 20; // max 1000mg
  const phenytoinDose = Math.min(phenytoin, 1000);

  interventions.push({
    type: 'antiepileptic_phenytoin',
    description: 'Phenytoin IV (second-line)',
    indication: 'If seizures continue after benzodiazepine',
    dosing: `${phenytoinDose.toFixed(0)}mg IV
(20 mg/kg, max 1000mg)
Dilute in normal saline; infuse over 15-20 minutes`,
    frequency: 'One-time dose',
    timeWindow: '5-30 minutes',
    monitoring: 'Seizure cessation, cardiac rhythm, blood pressure',
  });

  // Levetiracetam - alternative second-line
  const levetiracetam = assessment.weightKg * 30; // max 1500mg
  const levetiracetamDose = Math.min(levetiracetam, 1500);

  interventions.push({
    type: 'antiepileptic_levetiracetam',
    description: 'Levetiracetam IV (alternative second-line)',
    indication: 'If phenytoin contraindicated or unavailable',
    dosing: `${levetiracetamDose.toFixed(0)}mg IV
(30 mg/kg, max 1500mg)
Infuse over 5-10 minutes`,
    frequency: 'One-time dose',
    timeWindow: '5-30 minutes',
    monitoring: 'Seizure cessation, behavioral changes',
  });

  // Valproic acid - alternative second-line
  const valproicAcid = assessment.weightKg * 30; // max 1500mg
  const valproicAcidDose = Math.min(valproicAcid, 1500);

  interventions.push({
    type: 'antiepileptic_valproic_acid',
    description: 'Valproic acid IV (alternative second-line)',
    indication: 'If phenytoin/levetiracetam contraindicated',
    dosing: `${valproicAcidDose.toFixed(0)}mg IV
(30 mg/kg, max 1500mg)
Infuse over 5-10 minutes`,
    frequency: 'One-time dose',
    timeWindow: '5-30 minutes',
    monitoring: 'Seizure cessation, liver function',
  });

  return interventions;
}

/**
 * Generate third-line seizure management (30-60 minutes)
 */
export function generateThirdLineTherapy(
  assessment: StatusEpilepticusAssessment
): StatusEpilepticusIntervention[] {
  const interventions: StatusEpilepticusIntervention[] = [];

  // Anesthetic induction
  interventions.push({
    type: 'anesthesia_induction',
    description: 'Anesthetic induction (third-line)',
    indication: 'Refractory status epilepticus (30-60 minutes)',
    dosing: `Propofol: 1-2 mg/kg IV bolus, then 2-10 mg/kg/hour infusion
OR
Midazolam: 0.15 mg/kg IV bolus, then 0.1-0.4 mg/kg/hour infusion`,
    frequency: 'Continuous infusion',
    timeWindow: '30-60 minutes',
    monitoring: 'EEG monitoring, vital signs, sedation level',
  });

  // Intubation
  interventions.push({
    type: 'airway_management_intubation',
    description: 'Endotracheal intubation',
    indication: 'Airway protection during anesthesia',
    dosing: `Rapid sequence intubation with appropriate sedation
ETT size: ${(assessment.age / 4 + 4).toFixed(0)}mm ID`,
    frequency: 'One-time procedure',
    monitoring: 'Tube position confirmation, ventilation adequacy',
  });

  // ICU admission
  interventions.push({
    type: 'icu_admission',
    description: 'ICU admission',
    indication: 'Refractory status epilepticus requiring continuous monitoring',
    dosing: 'Transfer to ICU for continuous EEG monitoring and management',
    monitoring: 'Continuous EEG, vital signs, sedation level',
  });

  return interventions;
}

/**
 * Generate supportive care and monitoring
 */
export function generateSupportiveCareAndMonitoring(
  assessment: StatusEpilepticusAssessment
): StatusEpilepticusIntervention[] {
  const interventions: StatusEpilepticusIntervention[] = [];

  // Glucose management
  interventions.push({
    type: 'glucose_management',
    description: 'Glucose monitoring and management',
    indication: 'Maintain glucose 100-180 mg/dL',
    dosing: `Check glucose immediately
If < 60 mg/dL: Give dextrose (2-5 mL/kg of 10% dextrose)`,
    monitoring: 'Blood glucose every 1-2 hours',
  });

  // Temperature management
  interventions.push({
    type: 'temperature_management',
    description: 'Temperature monitoring',
    indication: 'Detect and manage fever',
    dosing: 'Maintain normothermia; use cooling measures if fever',
    monitoring: 'Core temperature continuously',
  });

  // Infection workup
  interventions.push({
    type: 'infection_workup',
    description: 'Infection investigation',
    indication: 'Rule out infectious causes',
    dosing: `- Blood cultures
- Lumbar puncture (if no contraindications)
- Empiric antibiotics if infection suspected`,
    monitoring: 'Culture results, CSF analysis',
  });

  // Metabolic workup
  interventions.push({
    type: 'metabolic_workup',
    description: 'Metabolic assessment',
    indication: 'Identify metabolic causes',
    dosing: `- Electrolytes (Na, K, Ca, Mg, PO4)
- Liver and renal function
- Blood gas analysis`,
    monitoring: 'Laboratory results',
  });

  return interventions;
}

/**
 * Generate clinical summary
 */
export function generateStatusEpilepticusSummary(
  assessment: StatusEpilepticusAssessment,
  severity: StatusEpilepticusSeverity
): string {
  const summary = `
STATUS EPILEPTICUS CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg

Severity: ${severity.classification}
${severity.description}

Seizure Characteristics:
- Duration: ${assessment.seizureDuration} minutes
- Type: ${assessment.seizureType.replace(/_/g, ' ').toUpperCase()}
- Consciousness: ${assessment.consciousness}
- Airway: ${assessment.airwayPatency}

Vital Signs:
- Heart Rate: ${assessment.heartRate} bpm
- Respiratory Rate: ${assessment.respiratoryRate} breaths/min
- BP: ${assessment.bloodPressure.systolic}/${assessment.bloodPressure.diastolic} mmHg
- Temperature: ${assessment.temperature}°C
- SpO2: ${assessment.oxygenSaturation}%

Laboratory:
- Blood Glucose: ${assessment.bloodGlucose} mg/dL
- Prior Antiepileptics: ${assessment.priorAntiepileptics.join(', ') || 'None'}

Risk Assessment:
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Not indicated'}
- Intubation: ${severity.requiresIntubation ? 'REQUIRED' : 'Not indicated'}
- Anesthesia: ${severity.requiresAnesthesia ? 'REQUIRED' : 'Not indicated'}

Treatment Timeline:
0-5 min: First-line benzodiazepine
5-30 min: Second-line antiepileptic (phenytoin/levetiracetam)
30-60 min: Third-line therapy (anesthesia + ICU)

Follow-up: Reassess every 5 minutes; escalate if seizures persist
  `.trim();

  return summary;
}
