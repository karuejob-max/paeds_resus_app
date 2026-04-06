/**
 * FB-MAP-1: ResusGPS Pathway ↔ Fellowship Condition Mapping
 *
 * Maps ResusGPS assessment pathways to fellowship-qualifying conditions.
 * This config enables the system to track when a provider uses ResusGPS
 * for a specific condition, contributing to fellowship pillar B (≥3 cases per condition).
 *
 * Design principles:
 * - Extensible: add new pathways/conditions without breaking existing mappings
 * - Server-authoritative: all condition validation happens server-side
 * - Anti-gaming: requires minimum depth thresholds per pathway session
 * - MECE: each pathway maps to exactly one primary condition (no overlap)
 *
 * Reference:
 * - FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §4 (pillar B)
 * - PLATFORM_SOURCE_OF_TRUTH.md §17.2 (ResusGPS ≥3 cases per taught condition)
 */

/**
 * Fellowship-qualifying conditions
 * These are the clinical conditions that providers must demonstrate competency in
 * through ResusGPS usage (≥3 attributable cases per condition)
 */
export enum FellowshipCondition {
  // Shock conditions (CRITICAL - high mortality, common in low-resource settings)
  SEPTIC_SHOCK = 'septic_shock',
  HYPOVOLEMIC_SHOCK = 'hypovolemic_shock',
  CARDIOGENIC_SHOCK = 'cardiogenic_shock',
  ANAPHYLACTIC_SHOCK = 'anaphylactic_shock',
  OBSTRUCTIVE_SHOCK = 'obstructive_shock',
  NEUROGENIC_SHOCK = 'neurogenic_shock',

  // Respiratory emergencies
  SEVERE_ASTHMA = 'severe_asthma',
  BRONCHIOLITIS = 'bronchiolitis',
  SEVERE_PNEUMONIA = 'severe_pneumonia',
  ARDS = 'ards',
  LARYNGOTRACHEOBRONCHITIS = 'laryngotracheobronchitis', // Croup
  EPIGLOTTITIS = 'epiglottitis',

  // Cardiac emergencies
  CARDIAC_ARREST = 'cardiac_arrest',
  SVT = 'svt', // Supraventricular tachycardia
  BRADYCARDIA = 'bradycardia',

  // Metabolic emergencies
  DKA = 'dka', // Diabetic ketoacidosis
  HYPOGLYCEMIA = 'hypoglycemia',
  HYPERKALEMIA = 'hyperkalemia',

  // Neurological emergencies
  STATUS_EPILEPTICUS = 'status_epilepticus',
  MENINGITIS = 'meningitis',
  ENCEPHALITIS = 'encephalitis',

  // Other critical conditions
  ANAPHYLAXIS = 'anaphylaxis',
  TRAUMA = 'trauma',
  SEVERE_DEHYDRATION = 'severe_dehydration',
  POISONING = 'poisoning',
  BURNS = 'burns',
}

/**
 * ResusGPS pathway identifiers
 * These map to the actual assessment flows in ResusGPS
 */
export enum ResusGPSPathway {
  // ABCDE primary survey
  AIRWAY = 'airway',
  BREATHING = 'breathing',
  CIRCULATION = 'circulation',
  DISABILITY = 'disability',
  EXPOSURE = 'exposure',

  // Shock differentiation
  SHOCK_DIFFERENTIATION = 'shock_differentiation',

  // Specific condition modules
  SEPTIC_SHOCK_MODULE = 'septic_shock_module',
  CARDIAC_ARREST_MODULE = 'cardiac_arrest_module',
  ASTHMA_MODULE = 'asthma_module',
  DKA_MODULE = 'dka_module',
  STATUS_EPILEPTICUS_MODULE = 'status_epilepticus_module',
  ANAPHYLAXIS_MODULE = 'anaphylaxis_module',
  TRAUMA_MODULE = 'trauma_module',
}

/**
 * Pathway → Condition mapping
 * Defines which ResusGPS pathways contribute to which fellowship conditions
 */
export const PATHWAY_CONDITION_MAP: Record<
  ResusGPSPathway,
  FellowshipCondition[]
> = {
  // Primary survey pathways contribute to multiple conditions
  [ResusGPSPathway.AIRWAY]: [
    FellowshipCondition.CARDIAC_ARREST,
    FellowshipCondition.EPIGLOTTITIS,
    FellowshipCondition.LARYNGOTRACHEOBRONCHITIS,
    FellowshipCondition.SEVERE_ASTHMA,
  ],

  [ResusGPSPathway.BREATHING]: [
    FellowshipCondition.SEVERE_ASTHMA,
    FellowshipCondition.BRONCHIOLITIS,
    FellowshipCondition.SEVERE_PNEUMONIA,
    FellowshipCondition.ARDS,
    FellowshipCondition.LARYNGOTRACHEOBRONCHITIS,
    FellowshipCondition.EPIGLOTTITIS,
  ],

  [ResusGPSPathway.CIRCULATION]: [
    FellowshipCondition.SEPTIC_SHOCK,
    FellowshipCondition.HYPOVOLEMIC_SHOCK,
    FellowshipCondition.CARDIOGENIC_SHOCK,
    FellowshipCondition.ANAPHYLACTIC_SHOCK,
    FellowshipCondition.OBSTRUCTIVE_SHOCK,
    FellowshipCondition.NEUROGENIC_SHOCK,
    FellowshipCondition.CARDIAC_ARREST,
    FellowshipCondition.SEVERE_DEHYDRATION,
  ],

  [ResusGPSPathway.DISABILITY]: [
    FellowshipCondition.STATUS_EPILEPTICUS,
    FellowshipCondition.MENINGITIS,
    FellowshipCondition.ENCEPHALITIS,
    FellowshipCondition.HYPOGLYCEMIA,
    FellowshipCondition.DKA,
  ],

  [ResusGPSPathway.EXPOSURE]: [
    FellowshipCondition.TRAUMA,
    FellowshipCondition.BURNS,
    FellowshipCondition.POISONING,
  ],

  // Shock differentiation pathway
  [ResusGPSPathway.SHOCK_DIFFERENTIATION]: [
    FellowshipCondition.SEPTIC_SHOCK,
    FellowshipCondition.HYPOVOLEMIC_SHOCK,
    FellowshipCondition.CARDIOGENIC_SHOCK,
    FellowshipCondition.ANAPHYLACTIC_SHOCK,
    FellowshipCondition.OBSTRUCTIVE_SHOCK,
    FellowshipCondition.NEUROGENIC_SHOCK,
  ],

  // Condition-specific modules (primary condition + related)
  [ResusGPSPathway.SEPTIC_SHOCK_MODULE]: [
    FellowshipCondition.SEPTIC_SHOCK,
    FellowshipCondition.MENINGITIS,
  ],

  [ResusGPSPathway.CARDIAC_ARREST_MODULE]: [
    FellowshipCondition.CARDIAC_ARREST,
  ],

  [ResusGPSPathway.ASTHMA_MODULE]: [
    FellowshipCondition.SEVERE_ASTHMA,
  ],

  [ResusGPSPathway.DKA_MODULE]: [
    FellowshipCondition.DKA,
    FellowshipCondition.HYPOGLYCEMIA,
  ],

  [ResusGPSPathway.STATUS_EPILEPTICUS_MODULE]: [
    FellowshipCondition.STATUS_EPILEPTICUS,
  ],

  [ResusGPSPathway.ANAPHYLAXIS_MODULE]: [
    FellowshipCondition.ANAPHYLAXIS,
    FellowshipCondition.ANAPHYLACTIC_SHOCK,
  ],

  [ResusGPSPathway.TRAUMA_MODULE]: [
    FellowshipCondition.TRAUMA,
    FellowshipCondition.BURNS,
  ],
};

/**
 * Minimum depth thresholds per pathway
 * Anti-gaming: require meaningful engagement with the pathway
 * (e.g., not just opening and closing immediately)
 */
export const PATHWAY_DEPTH_THRESHOLDS: Record<ResusGPSPathway, {
  minDurationSeconds: number;
  minInteractionsCount: number;
  description: string;
}> = {
  [ResusGPSPathway.AIRWAY]: {
    minDurationSeconds: 120, // 2 minutes
    minInteractionsCount: 3, // At least 3 interactions (e.g., assess, intervene, reassess)
    description: 'Airway assessment and management',
  },

  [ResusGPSPathway.BREATHING]: {
    minDurationSeconds: 120,
    minInteractionsCount: 3,
    description: 'Breathing assessment and management',
  },

  [ResusGPSPathway.CIRCULATION]: {
    minDurationSeconds: 180, // 3 minutes (more complex)
    minInteractionsCount: 4,
    description: 'Circulation assessment and shock management',
  },

  [ResusGPSPathway.DISABILITY]: {
    minDurationSeconds: 120,
    minInteractionsCount: 3,
    description: 'Disability assessment and neurological management',
  },

  [ResusGPSPathway.EXPOSURE]: {
    minDurationSeconds: 90, // 1.5 minutes
    minInteractionsCount: 2,
    description: 'Exposure and environmental assessment',
  },

  [ResusGPSPathway.SHOCK_DIFFERENTIATION]: {
    minDurationSeconds: 240, // 4 minutes (complex differential)
    minInteractionsCount: 5,
    description: 'Shock type differentiation and management',
  },

  [ResusGPSPathway.SEPTIC_SHOCK_MODULE]: {
    minDurationSeconds: 300, // 5 minutes
    minInteractionsCount: 6,
    description: 'Septic shock module (recognition, fluids, antibiotics, escalation)',
  },

  [ResusGPSPathway.CARDIAC_ARREST_MODULE]: {
    minDurationSeconds: 300,
    minInteractionsCount: 6,
    description: 'Cardiac arrest module (CPR, defibrillation, medications)',
  },

  [ResusGPSPathway.ASTHMA_MODULE]: {
    minDurationSeconds: 240,
    minInteractionsCount: 5,
    description: 'Severe asthma module',
  },

  [ResusGPSPathway.DKA_MODULE]: {
    minDurationSeconds: 240,
    minInteractionsCount: 5,
    description: 'DKA module (diagnosis, fluids, insulin, monitoring)',
  },

  [ResusGPSPathway.STATUS_EPILEPTICUS_MODULE]: {
    minDurationSeconds: 240,
    minInteractionsCount: 5,
    description: 'Status epilepticus module (seizure management, medications)',
  },

  [ResusGPSPathway.ANAPHYLAXIS_MODULE]: {
    minDurationSeconds: 180,
    minInteractionsCount: 4,
    description: 'Anaphylaxis module (recognition, epinephrine, supportive care)',
  },

  [ResusGPSPathway.TRAUMA_MODULE]: {
    minDurationSeconds: 300,
    minInteractionsCount: 6,
    description: 'Trauma module (primary survey, hemorrhage control, stabilization)',
  },
};

/**
 * Get all conditions that can be attributed to a given pathway
 */
export function getConditionsForPathway(
  pathway: ResusGPSPathway
): FellowshipCondition[] {
  return PATHWAY_CONDITION_MAP[pathway] || [];
}

/**
 * Get all pathways that contribute to a given condition
 */
export function getPathwaysForCondition(
  condition: FellowshipCondition
): ResusGPSPathway[] {
  return Object.entries(PATHWAY_CONDITION_MAP)
    .filter(([_, conditions]) => conditions.includes(condition))
    .map(([pathway]) => pathway as ResusGPSPathway);
}

/**
 * Check if a pathway session meets minimum depth requirements
 */
export function isPathwaySessionValid(
  pathway: ResusGPSPathway,
  durationSeconds: number,
  interactionsCount: number
): boolean {
  const threshold = PATHWAY_DEPTH_THRESHOLDS[pathway];
  if (!threshold) return false;

  return (
    durationSeconds >= threshold.minDurationSeconds &&
    interactionsCount >= threshold.minInteractionsCount
  );
}

/**
 * Get human-readable description for a condition
 */
export function getConditionLabel(condition: FellowshipCondition): string {
  const labels: Record<FellowshipCondition, string> = {
    [FellowshipCondition.SEPTIC_SHOCK]: 'Septic Shock',
    [FellowshipCondition.HYPOVOLEMIC_SHOCK]: 'Hypovolemic Shock',
    [FellowshipCondition.CARDIOGENIC_SHOCK]: 'Cardiogenic Shock',
    [FellowshipCondition.ANAPHYLACTIC_SHOCK]: 'Anaphylactic Shock',
    [FellowshipCondition.OBSTRUCTIVE_SHOCK]: 'Obstructive Shock',
    [FellowshipCondition.NEUROGENIC_SHOCK]: 'Neurogenic Shock',
    [FellowshipCondition.SEVERE_ASTHMA]: 'Severe Asthma',
    [FellowshipCondition.BRONCHIOLITIS]: 'Bronchiolitis',
    [FellowshipCondition.SEVERE_PNEUMONIA]: 'Severe Pneumonia',
    [FellowshipCondition.ARDS]: 'ARDS',
    [FellowshipCondition.LARYNGOTRACHEOBRONCHITIS]: 'Croup (LTB)',
    [FellowshipCondition.EPIGLOTTITIS]: 'Epiglottitis',
    [FellowshipCondition.CARDIAC_ARREST]: 'Cardiac Arrest',
    [FellowshipCondition.SVT]: 'Supraventricular Tachycardia',
    [FellowshipCondition.BRADYCARDIA]: 'Bradycardia',
    [FellowshipCondition.DKA]: 'Diabetic Ketoacidosis',
    [FellowshipCondition.HYPOGLYCEMIA]: 'Hypoglycemia',
    [FellowshipCondition.HYPERKALEMIA]: 'Hyperkalemia',
    [FellowshipCondition.STATUS_EPILEPTICUS]: 'Status Epilepticus',
    [FellowshipCondition.MENINGITIS]: 'Meningitis',
    [FellowshipCondition.ENCEPHALITIS]: 'Encephalitis',
    [FellowshipCondition.ANAPHYLAXIS]: 'Anaphylaxis',
    [FellowshipCondition.TRAUMA]: 'Trauma',
    [FellowshipCondition.SEVERE_DEHYDRATION]: 'Severe Dehydration',
    [FellowshipCondition.POISONING]: 'Poisoning',
    [FellowshipCondition.BURNS]: 'Burns',
  };

  return labels[condition] || condition;
}

/**
 * Get human-readable description for a pathway
 */
export function getPathwayLabel(pathway: ResusGPSPathway): string {
  const labels: Record<ResusGPSPathway, string> = {
    [ResusGPSPathway.AIRWAY]: 'Airway (A)',
    [ResusGPSPathway.BREATHING]: 'Breathing (B)',
    [ResusGPSPathway.CIRCULATION]: 'Circulation (C)',
    [ResusGPSPathway.DISABILITY]: 'Disability (D)',
    [ResusGPSPathway.EXPOSURE]: 'Exposure (E)',
    [ResusGPSPathway.SHOCK_DIFFERENTIATION]: 'Shock Differentiation',
    [ResusGPSPathway.SEPTIC_SHOCK_MODULE]: 'Septic Shock Module',
    [ResusGPSPathway.CARDIAC_ARREST_MODULE]: 'Cardiac Arrest Module',
    [ResusGPSPathway.ASTHMA_MODULE]: 'Severe Asthma Module',
    [ResusGPSPathway.DKA_MODULE]: 'DKA Module',
    [ResusGPSPathway.STATUS_EPILEPTICUS_MODULE]: 'Status Epilepticus Module',
    [ResusGPSPathway.ANAPHYLAXIS_MODULE]: 'Anaphylaxis Module',
    [ResusGPSPathway.TRAUMA_MODULE]: 'Trauma Module',
  };

  return labels[pathway] || pathway;
}
