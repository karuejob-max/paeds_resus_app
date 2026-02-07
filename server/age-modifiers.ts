// Age-Specific Modifiers Engine
// Accounts for different clinical presentations across age groups

import type { PrimarySurveyData, Differential } from '../shared/clinical-types';

export type AgeGroup = 'neonate' | 'infant' | 'child' | 'adolescent' | 'adult' | 'elderly' | 'pregnant';

export interface AgeModifier {
  ageGroup: AgeGroup;
  conditionId: string;
  probabilityAdjustment: number; // +/- value to add to base probability
  presentationChanges: string[]; // Different symptoms/signs for this age group
  riskFactorChanges: string[]; // Age-specific risk factors
  interventionModifications: string[]; // Age-specific treatment changes
}

/**
 * Determines age group from patient age in years
 */
export function getAgeGroup(ageYears: number, isPregnant: boolean = false): AgeGroup {
  if (isPregnant) return 'pregnant';
  if (ageYears < 0.08) return 'neonate'; // <28 days
  if (ageYears < 1) return 'infant'; // 29 days - 1 year
  if (ageYears < 12) return 'child'; // 1-12 years
  if (ageYears < 18) return 'adolescent'; // 12-18 years
  if (ageYears < 65) return 'adult'; // 18-65 years
  return 'elderly'; // >65 years
}

/**
 * Age-specific modifiers database
 * Key format: `${conditionId}_${ageGroup}`
 */
export const ageModifiers: Record<string, AgeModifier> = {
  // SEPSIS - Age-specific presentations
  'sepsis_neonate': {
    ageGroup: 'neonate',
    conditionId: 'sepsis',
    probabilityAdjustment: 0.2, // Higher index of suspicion in neonates
    presentationChanges: [
      'Fever NOT required (hypothermia common: temp <36.5°C)',
      'Lethargy/poor feeding primary signs',
      'Apnea/bradycardia common',
      'Jaundice may be present',
      'Hypoglycemia common',
    ],
    riskFactorChanges: [
      'Maternal GBS colonization',
      'Prolonged rupture of membranes',
      'Maternal fever during labor',
      'Prematurity',
    ],
    interventionModifications: [
      'Ampicillin + Gentamicin (NOT ceftriaxone in <28 days)',
      'Blood culture from two sites',
      'Lumbar puncture if stable',
    ],
  },

  'sepsis_elderly': {
    ageGroup: 'elderly',
    conditionId: 'sepsis',
    probabilityAdjustment: 0.15,
    presentationChanges: [
      'Fever may be absent or blunted',
      'Confusion/altered mental status primary sign',
      'Hypothermia more common than fever',
      'Tachypnea may be only vital sign abnormality',
    ],
    riskFactorChanges: [
      'Immunosenescence',
      'Multiple comorbidities',
      'Polypharmacy',
      'Institutionalization',
    ],
    interventionModifications: [
      'Renal dose adjustment for antibiotics',
      'Avoid nephrotoxic agents if possible',
      'Lower fluid bolus volumes (10 ml/kg, reassess)',
    ],
  },

  // MYOCARDIAL INFARCTION - Age-specific presentations
  'mi_elderly': {
    ageGroup: 'elderly',
    conditionId: 'acute_mi',
    probabilityAdjustment: 0.25, // Silent MI more common
    presentationChanges: [
      'Chest pain may be ABSENT (silent MI in 30-40%)',
      'Dyspnea primary symptom',
      'Confusion/altered mental status',
      'Syncope',
      'Nausea/vomiting without chest pain',
    ],
    riskFactorChanges: [
      'Diabetes (neuropathy → silent MI)',
      'Previous MI',
      'Heart failure',
    ],
    interventionModifications: [
      'Aspirin dose same (162-325 mg)',
      'Caution with thrombolytics (bleeding risk)',
      'Consider primary PCI over thrombolysis',
    ],
  },

  'mi_pregnant': {
    ageGroup: 'pregnant',
    conditionId: 'acute_mi',
    probabilityAdjustment: -0.3, // Rare but catastrophic
    presentationChanges: [
      'Chest pain may be attributed to GERD/musculoskeletal',
      'Dyspnea may be attributed to pregnancy',
    ],
    riskFactorChanges: [
      'Peripartum cardiomyopathy',
      'Preeclampsia/eclampsia',
      'Cocaine use',
    ],
    interventionModifications: [
      'Aspirin safe in pregnancy',
      'Avoid ACE inhibitors (teratogenic)',
      'Thrombolytics: risk-benefit discussion',
      'Primary PCI preferred',
    ],
  },

  // DKA - Age and pregnancy-specific
  'dka_pregnant': {
    ageGroup: 'pregnant',
    conditionId: 'dka',
    probabilityAdjustment: 0.2,
    presentationChanges: [
      'Lower glucose threshold: >200 mg/dL (11 mmol/L) vs >250 mg/dL',
      'Occurs at lower glucose due to accelerated starvation',
      'Vomiting may be attributed to hyperemesis gravidarum',
    ],
    riskFactorChanges: [
      'Gestational diabetes',
      'Beta-agonist tocolytics',
      'Corticosteroids for fetal lung maturity',
    ],
    interventionModifications: [
      'More aggressive fluid resuscitation',
      'Insulin infusion same',
      'Monitor fetal heart rate',
      'Obstetric consultation',
    ],
  },

  'dka_child': {
    ageGroup: 'child',
    conditionId: 'dka',
    probabilityAdjustment: 0.15,
    presentationChanges: [
      'Abdominal pain prominent (may mimic appendicitis)',
      'Kussmaul breathing',
      'Fruity breath odor',
    ],
    riskFactorChanges: [
      'New-onset type 1 diabetes (30-40% present in DKA)',
      'Insulin omission (adolescents)',
    ],
    interventionModifications: [
      'CRITICAL: Cerebral edema risk (1-2%)',
      'Fluid resuscitation: 10 ml/kg bolus (NOT 20 ml/kg)',
      'Avoid rapid glucose correction',
      'Mannitol/hypertonic saline ready for cerebral edema',
    ],
  },

  // STROKE - Age-specific
  'stroke_child': {
    ageGroup: 'child',
    conditionId: 'stroke',
    probabilityAdjustment: -0.4, // Rare but important
    presentationChanges: [
      'Seizures more common presentation',
      'Altered mental status',
      'Hemiparesis',
    ],
    riskFactorChanges: [
      'Sickle cell disease (most common cause)',
      'Congenital heart disease',
      'Moyamoya disease',
      'Arterial dissection (trauma)',
    ],
    interventionModifications: [
      'tPA rarely used in children',
      'Sickle cell: exchange transfusion',
      'Neurology consultation',
    ],
  },

  'stroke_pregnant': {
    ageGroup: 'pregnant',
    conditionId: 'stroke',
    probabilityAdjustment: 0.15,
    presentationChanges: [
      'Headache may be attributed to preeclampsia',
      'Seizures may be attributed to eclampsia',
    ],
    riskFactorChanges: [
      'Preeclampsia/eclampsia',
      'Cerebral venous thrombosis',
      'Peripartum cardiomyopathy',
    ],
    interventionModifications: [
      'tPA: risk-benefit discussion (pregnancy category C)',
      'Rule out eclampsia first',
      'Magnesium sulfate if eclampsia',
    ],
  },

  // PNEUMONIA - Age-specific
  'pneumonia_neonate': {
    ageGroup: 'neonate',
    conditionId: 'pneumonia',
    probabilityAdjustment: 0.2,
    presentationChanges: [
      'Tachypnea primary sign',
      'Grunting',
      'Nasal flaring',
      'Subcostal retractions',
      'Apnea',
    ],
    riskFactorChanges: [
      'Group B Streptococcus',
      'E. coli',
      'Listeria',
    ],
    interventionModifications: [
      'Ampicillin + Gentamicin',
      'Blood culture',
      'Chest X-ray',
    ],
  },

  'pneumonia_elderly': {
    ageGroup: 'elderly',
    conditionId: 'pneumonia',
    probabilityAdjustment: 0.2,
    presentationChanges: [
      'Fever may be absent',
      'Confusion primary presentation',
      'Falls',
      'Functional decline',
    ],
    riskFactorChanges: [
      'Aspiration common',
      'Immunosenescence',
      'Comorbidities',
    ],
    interventionModifications: [
      'Broader antibiotic coverage',
      'Aspiration coverage (anaerobes)',
      'Lower threshold for admission',
    ],
  },

  // ANAPHYLAXIS - Age-specific
  'anaphylaxis_child': {
    ageGroup: 'child',
    conditionId: 'anaphylaxis',
    probabilityAdjustment: 0.1,
    presentationChanges: [
      'Abdominal pain prominent',
      'Vomiting',
      'Behavioral changes (sense of impending doom)',
    ],
    riskFactorChanges: [
      'Food allergies (peanuts, tree nuts, milk, eggs)',
      'Insect stings',
    ],
    interventionModifications: [
      'Epinephrine 0.01 mg/kg IM (max 0.3 mg)',
      'Repeat every 5-15 minutes if needed',
    ],
  },

  // HYPERKALEMIA - Age-specific
  'hyperkalemia_neonate': {
    ageGroup: 'neonate',
    conditionId: 'hyperkalemia',
    probabilityAdjustment: 0.15,
    presentationChanges: [
      'Bradycardia',
      'Arrhythmias',
      'Muscle weakness',
    ],
    riskFactorChanges: [
      'Prematurity',
      'Hemolysis',
      'Tissue breakdown',
      'Congenital adrenal hyperplasia',
    ],
    interventionModifications: [
      'Calcium gluconate 100 mg/kg IV (1 ml/kg of 10%)',
      'Insulin + glucose',
      'Sodium bicarbonate if acidotic',
    ],
  },

  'hyperkalemia_elderly': {
    ageGroup: 'elderly',
    conditionId: 'hyperkalemia',
    probabilityAdjustment: 0.2,
    presentationChanges: [
      'Weakness',
      'Arrhythmias',
    ],
    riskFactorChanges: [
      'Chronic kidney disease',
      'ACE inhibitors/ARBs',
      'Potassium-sparing diuretics',
      'NSAIDs',
    ],
    interventionModifications: [
      'Calcium gluconate 1 g IV',
      'Insulin + glucose (monitor for hypoglycemia)',
      'Dialysis if refractory',
    ],
  },

  // BRONCHIOLITIS - Age-specific (primarily infants)
  'bronchiolitis_infant': {
    ageGroup: 'infant',
    conditionId: 'bronchiolitis',
    probabilityAdjustment: 0.3, // Peak age
    presentationChanges: [
      'Wheezing',
      'Crackles',
      'Tachypnea',
      'Nasal flaring',
      'Retractions',
      'Feeding difficulty',
    ],
    riskFactorChanges: [
      'Age <2 years (peak 2-6 months)',
      'RSV season (winter)',
      'Prematurity',
      'Congenital heart disease',
    ],
    interventionModifications: [
      'Supportive care (oxygen, hydration)',
      'NO bronchodilators (ineffective)',
      'NO steroids (ineffective)',
      'High-flow nasal cannula if severe',
    ],
  },

  // CROUP - Age-specific
  'croup_child': {
    ageGroup: 'child',
    conditionId: 'croup',
    probabilityAdjustment: 0.3, // Peak age 6 months - 3 years
    presentationChanges: [
      'Barky cough (seal-like)',
      'Stridor (inspiratory)',
      'Hoarse voice',
      'Worse at night',
    ],
    riskFactorChanges: [
      'Age 6 months - 3 years',
      'Viral prodrome',
    ],
    interventionModifications: [
      'Dexamethasone 0.6 mg/kg PO/IM (single dose)',
      'Nebulized epinephrine if severe (0.5 ml/kg of 1:1000, max 5 ml)',
      'Cool mist (no evidence but traditional)',
    ],
  },

  // EPIGLOTTITIS - Age-specific
  'epiglottitis_child': {
    ageGroup: 'child',
    conditionId: 'epiglottitis',
    probabilityAdjustment: -0.3, // Rare post-Hib vaccine
    presentationChanges: [
      'Tripod positioning',
      'Drooling',
      'Toxic appearance',
      'Muffled voice',
      'High fever',
    ],
    riskFactorChanges: [
      'Unvaccinated (Hib)',
    ],
    interventionModifications: [
      'DO NOT examine throat (may precipitate airway obstruction)',
      'Keep child calm',
      'Prepare for emergency airway',
      'Ceftriaxone after airway secured',
    ],
  },
};

/**
 * Applies age-specific modifiers to a differential diagnosis
 */
export function applyAgeModifiers(
  differential: Differential,
  data: PrimarySurveyData
): Differential {
  const ageGroup = getAgeGroup(
    data.patientAge,
    data.patientType === 'pregnant_postpartum'
  );

  const modifierKey = `${differential.id}_${ageGroup}`;
  const modifier = ageModifiers[modifierKey];

  if (!modifier) {
    // No age-specific modifier for this condition/age group
    return differential;
  }

  // Apply probability adjustment
  const adjustedProbability = Math.max(
    0,
    Math.min(1, differential.probability + modifier.probabilityAdjustment)
  );

  // Add age-specific presentation changes to key findings
  const ageSpecificFindings = modifier.presentationChanges.map(
    (change) => `[Age-specific] ${change}`
  );

  return {
    ...differential,
    probability: adjustedProbability,
    keyFindings: [...differential.keyFindings, ...ageSpecificFindings],
  };
}

/**
 * Gets age-specific intervention modifications for a condition
 */
export function getAgeSpecificInterventions(
  conditionId: string,
  ageGroup: AgeGroup
): string[] {
  const modifierKey = `${conditionId}_${ageGroup}`;
  const modifier = ageModifiers[modifierKey];

  return modifier?.interventionModifications || [];
}
