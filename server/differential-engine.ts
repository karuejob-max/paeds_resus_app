// Differential Diagnosis Engine - Pattern Recognition Algorithms
// Military Precision: Zero diagnostic burden on provider

import type {
  PrimarySurveyData,
  Differential,
  ClinicalQuestion,
} from '../shared/clinical-types';
import { differentiateShock, shockAnalysisToDifferential } from './shock-differentiation';

/**
 * Analyzes primary survey data and generates ranked differential diagnoses
 * using pattern recognition algorithms
 */
export function generateDifferentials(data: PrimarySurveyData): Differential[] {
  const differentials: Differential[] = [];

  // DKA Pattern Recognition
  const dkaScore = analyzeDKA(data);
  if (dkaScore.probability > 0.3) {
    differentials.push(dkaScore);
  }

  // Septic Shock Pattern
  const sepsisScore = analyzeSepsis(data);
  if (sepsisScore.probability > 0.3) {
    differentials.push(sepsisScore);
  }

  // Eclampsia Pattern (pregnant/postpartum only)
  if (data.patientType === 'pregnant_postpartum') {
    const eclampsiaScore = analyzeEclampsia(data);
    if (eclampsiaScore.probability > 0.3) {
      differentials.push(eclampsiaScore);
    }
  }

  // Status Epilepticus Pattern
  const statusEpilepticus = analyzeStatusEpilepticus(data);
  if (statusEpilepticus.probability > 0.3) {
    differentials.push(statusEpilepticus);
  }

  // Anaphylaxis Pattern
  const anaphylaxis = analyzeAnaphylaxis(data);
  if (anaphylaxis.probability > 0.3) {
    differentials.push(anaphylaxis);
  }

  // Pulmonary Embolism Pattern
  const pe = analyzePulmonaryEmbolism(data);
  if (pe.probability > 0.3) {
    differentials.push(pe);
  }

  // Hyperkalemia Pattern
  const hyperkalemia = analyzeHyperkalemia(data);
  if (hyperkalemia.probability > 0.3) {
    differentials.push(hyperkalemia);
  }

  // Hypoglycemia Pattern
  const hypoglycemia = analyzeHypoglycemia(data);
  if (hypoglycemia.probability > 0.3) {
    differentials.push(hypoglycemia);
  }

  // Postpartum Hemorrhage Pattern (pregnant/postpartum only)
  if (data.patientType === 'pregnant_postpartum') {
    const pph = analyzePostpartumHemorrhage(data);
    if (pph.probability > 0.3) {
      differentials.push(pph);
    }
  }

  // Asthma/Status Asthmaticus Pattern
  const asthma = analyzeAsthma(data);
  if (asthma.probability > 0.3) {
    differentials.push(asthma);
  }

  // Neonatal Sepsis Pattern (neonate only)
  if (data.patientType === 'neonate') {
    const neonatalSepsis = analyzeNeonatalSepsis(data);
    if (neonatalSepsis.probability > 0.3) {
      differentials.push(neonatalSepsis);
    }
  }

  // === TIER 1 EMERGENCIES (Time-critical, high-frequency) ===

  // Shock Differentiation (CRITICAL - prevents deadly fluid management errors)
  const shockAnalyses = differentiateShock(data);
  shockAnalyses.forEach(analysis => {
    if (analysis.probability > 0.3) {
      differentials.push(shockAnalysisToDifferential(analysis));
    }
  });

  // Foreign Body Aspiration
  const foreignBody = analyzeForeignBodyAspiration(data);
  if (foreignBody.probability > 0.3) {
    differentials.push(foreignBody);
  }

  // Tension Pneumothorax
  const tensionPneumo = analyzeTensionPneumothorax(data);
  if (tensionPneumo.probability > 0.3) {
    differentials.push(tensionPneumo);
  }

  // Cardiac Tamponade
  const tamponade = analyzeCardiacTamponade(data);
  if (tamponade.probability > 0.3) {
    differentials.push(tamponade);
  }

  // Acute Myocardial Infarction
  const mi = analyzeMyocardialInfarction(data);
  if (mi.probability > 0.3) {
    differentials.push(mi);
  }

  // Stroke
  const stroke = analyzeStroke(data);
  if (stroke.probability > 0.3) {
    differentials.push(stroke);
  }

  // Bacterial Meningitis
  const meningitis = analyzeMeningitis(data);
  if (meningitis.probability > 0.3) {
    differentials.push(meningitis);
  }

  // Opioid Overdose
  const opioidOD = analyzeOpioidOverdose(data);
  if (opioidOD.probability > 0.3) {
    differentials.push(opioidOD);
  }

  // Severe Burns
  const burns = analyzeSevereBurns(data);
  if (burns.probability > 0.3) {
    differentials.push(burns);
  }

  // Sort by probability (highest first)
  return differentials.sort((a, b) => b.probability - a.probability);
}

/**
 * DKA Pattern Recognition Algorithm
 * Key features: Hyperglycemia + Kussmaul breathing + Shock + Polyuria/Vomiting
 */
function analyzeDKA(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Hyperglycemia (strongest predictor)
  if (data.disability.blood_glucose && data.disability.blood_glucose > 11) {
    probability += 0.4;
    evidence.push(`Hyperglycemia (${data.disability.blood_glucose} mmol/L)`);
  } else {
    missing.push('blood_glucose');
  }

  // Kussmaul breathing (metabolic acidosis)
  if (data.breathing.pattern === 'deep_kussmaul') {
    probability += 0.3;
    evidence.push('Kussmaul breathing (deep, rapid)');
  } else {
    missing.push('kussmaul_breathing');
  }

  // Shock state
  if (
    data.physiologicState === 'shock' ||
    data.circulation.perfusion.capillary_refill !== 'normal' ||
    data.circulation.perfusion.skin_temperature === 'cold'
  ) {
    probability += 0.15;
    evidence.push('Shock/poor perfusion');
  }

  // Polyuria (osmotic diuresis)
  if (data.circulation.history?.polyuria) {
    probability += 0.1;
    evidence.push('Polyuria (osmotic diuresis)');
  } else {
    missing.push('polyuria_history');
  }

  // Vomiting
  if (data.airway.observations.vomiting || data.circulation.history?.vomiting) {
    probability += 0.05;
    evidence.push('Vomiting');
  }

  // Age factor (more common in children/adolescents)
  if (data.patientType === 'child' && data.exposure.age_years && data.exposure.age_years > 5) {
    probability += 0.05;
  }

  return {
    id: 'dka',
    diagnosis: 'Diabetic Ketoacidosis (DKA)',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Fruity/sweet breath smell (ketones)?',
      'Abdominal pain?',
      'Known diabetes or new diagnosis?',
      'Recent illness or infection?',
    ],
    category: 'critical',
  };
}

/**
 * Septic Shock Pattern Recognition
 * Key features: Fever + Shock + Altered mental status + Tachycardia/Tachypnea
 */
function analyzeSepsis(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Fever or hypothermia
  if (data.exposure.temperature > 38 || data.exposure.temperature < 36) {
    probability += 0.3;
    evidence.push(`Temperature ${data.exposure.temperature}°C`);
  } else {
    missing.push('fever');
  }

  // Shock state
  if (
    data.physiologicState === 'shock' ||
    data.circulation.perfusion.capillary_refill !== 'normal'
  ) {
    probability += 0.3;
    evidence.push('Shock/poor perfusion');
  }

  // Altered mental status
  if (data.disability.avpu !== 'alert') {
    probability += 0.2;
    evidence.push(`Altered mental status (${data.disability.avpu})`);
  }

  // Tachycardia (age-appropriate)
  // TODO: Add age-appropriate tachycardia thresholds
  if (data.circulation.heartRate > 140) {
    probability += 0.1;
    evidence.push('Tachycardia');
  }

  // Tachypnea
  if (data.breathing.rate > 40) {
    probability += 0.1;
    evidence.push('Tachypnea');
  }

  return {
    id: 'septic_shock',
    diagnosis: 'Septic Shock',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Source of infection (pneumonia, UTI, meningitis)?',
      'Recent illness or surgery?',
      'Immunocompromised?',
      'Rash or petechiae?',
    ],
    category: 'critical',
  };
}

/**
 * Eclampsia Pattern Recognition (Pregnant/Postpartum only)
 * Key features: Seizure + High BP + Pregnancy/Postpartum + Headache/Visual changes
 */
function analyzeEclampsia(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Seizure (required)
  if (data.disability.seizure?.active || data.disability.seizure?.just_stopped) {
    probability += 0.4;
    evidence.push('Seizure activity');
  } else if (data.physiologicState === 'seizure') {
    probability += 0.4;
    evidence.push('Seizure reported');
  } else {
    return {
      id: 'eclampsia',
      diagnosis: 'Eclampsia',
      probability: 0,
      evidence: [],
      missing: ['seizure'],
      nextQuestions: [],
      category: 'critical',
    };
  }

  // High blood pressure
  if (data.circulation.bloodPressure && data.circulation.bloodPressure.systolic > 140) {
    probability += 0.3;
    evidence.push(`Hypertension (${data.circulation.bloodPressure.systolic}/${data.circulation.bloodPressure.diastolic})`);
  } else {
    missing.push('blood_pressure');
  }

  // Pregnancy/Postpartum status (already filtered by caller)
  probability += 0.2;
  evidence.push('Pregnant or postpartum');

  // Additional risk factors
  if (data.exposure.pregnancy_related?.gestational_age_weeks && data.exposure.pregnancy_related.gestational_age_weeks > 20) {
    probability += 0.1;
    evidence.push(`Gestational age ${data.exposure.pregnancy_related.gestational_age_weeks} weeks`);
  }

  return {
    id: 'eclampsia',
    diagnosis: 'Eclampsia',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Severe headache?',
      'Vision changes (blurred, spots)?',
      'Swelling (hands, face, feet)?',
      'Right upper quadrant pain?',
      'Known preeclampsia diagnosis?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Status Epilepticus Pattern Recognition
 * Key features: Prolonged seizure (>5 min) or recurrent seizures
 */
function analyzeStatusEpilepticus(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Active seizure or just stopped
  if (data.disability.seizure?.active) {
    probability += 0.5;
    evidence.push('Seizure active now');
  } else if (data.disability.seizure?.just_stopped) {
    probability += 0.3;
    evidence.push('Seizure just stopped');
  } else if (data.physiologicState === 'seizure') {
    probability += 0.4;
    evidence.push('Seizure reported');
  } else {
    return {
      id: 'status_epilepticus',
      diagnosis: 'Status Epilepticus',
      probability: 0,
      evidence: [],
      missing: ['seizure'],
      nextQuestions: [],
      category: 'critical',
    };
  }

  // Duration >5 minutes (status epilepticus definition)
  if (data.disability.seizure?.duration_minutes && data.disability.seizure.duration_minutes >= 5) {
    probability += 0.3;
    evidence.push(`Seizure duration ${data.disability.seizure.duration_minutes} minutes`);
  } else {
    missing.push('seizure_duration');
  }

  // Post-ictal state (not waking up after seizure)
  if (data.disability.seizure?.just_stopped && data.disability.avpu !== 'alert') {
    probability += 0.1;
    evidence.push('Not waking up after seizure');
  }

  // For pregnant patients, need to differentiate from eclampsia
  if (data.patientType === 'pregnant_postpartum') {
    // Lower probability if no eclampsia features
    if (!data.circulation.bloodPressure || data.circulation.bloodPressure.systolic < 140) {
      probability += 0.1;
      evidence.push('No hypertension (less likely eclampsia)');
    }
  }

  return {
    id: 'status_epilepticus',
    diagnosis: 'Status Epilepticus',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Known epilepsy or seizure disorder?',
      'Recent head injury?',
      'Medication non-compliance?',
      'Fever present (febrile seizure)?',
      'For pregnant patients: High BP, headache, or vision changes (eclampsia)?',
    ],
    category: 'critical',
  };
}

/**
 * Anaphylaxis Pattern Recognition
 * Key features: Respiratory distress + Skin changes + Recent allergen exposure + Shock
 */
function analyzeAnaphylaxis(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Respiratory distress (required)
  if (
    data.physiologicState === 'severe_respiratory_distress' ||
    data.breathing.effort === 'increased' ||
    data.breathing.auscultation?.wheezing
  ) {
    probability += 0.3;
    evidence.push('Respiratory distress');
  } else {
    missing.push('respiratory_distress');
  }

  // Shock/hypotension
  if (
    data.physiologicState === 'shock' ||
    data.circulation.perfusion.capillary_refill !== 'normal'
  ) {
    probability += 0.3;
    evidence.push('Shock/poor perfusion');
  }

  // Stridor (upper airway swelling)
  if (data.airway.observations.stridor || data.breathing.auscultation?.stridor) {
    probability += 0.2;
    evidence.push('Stridor (upper airway swelling)');
  }

  // Skin findings (need to ask)
  missing.push('skin_findings');
  missing.push('allergen_exposure');

  return {
    id: 'anaphylaxis',
    diagnosis: 'Anaphylaxis',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Swelling of face, lips, or tongue?',
      'Rash, hives, or itching?',
      'Recent exposure to allergen (food, medication, bee sting)?',
      'Known allergies?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Pulmonary Embolism Pattern Recognition
 * Key features: Respiratory distress + Chest pain + Unilateral leg swelling/pain + Risk factors
 */
function analyzePulmonaryEmbolism(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Respiratory distress
  if (
    data.physiologicState === 'severe_respiratory_distress' ||
    data.breathing.spO2 < 94
  ) {
    probability += 0.3;
    evidence.push('Respiratory distress/hypoxia');
  } else {
    missing.push('respiratory_distress');
  }

  // Tachycardia
  if (data.circulation.heartRate > 100) {
    probability += 0.2;
    evidence.push('Tachycardia');
  }

  // Age factor (more common in adolescents/adults)
  if (data.patientType === 'child' && data.exposure.age_years && data.exposure.age_years < 12) {
    probability -= 0.2; // Less likely in young children
  } else if (data.patientType === 'adult' || data.patientType === 'pregnant_postpartum') {
    probability += 0.1;
  }

  // Pregnancy (risk factor)
  if (data.patientType === 'pregnant_postpartum') {
    probability += 0.1;
    evidence.push('Pregnancy (risk factor)');
  }

  missing.push('chest_pain');
  missing.push('leg_pain_swelling');
  missing.push('risk_factors');

  return {
    id: 'pulmonary_embolism',
    diagnosis: 'Pulmonary Embolism',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Chest pain (sharp, worse with breathing)?',
      'Unilateral leg pain or swelling (calf pain)?',
      'Recent surgery or immobilization?',
      'Oral contraceptives or hormone therapy?',
      'Recent long travel (plane, car)?',
    ],
    category: 'critical',
  };
}

/**
 * Hyperkalemia Pattern Recognition
 * Key features: Oliguria + ECG changes + Renal failure history + Cardiac arrest
 */
function analyzeHyperkalemia(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Cardiac arrest (PEA)
  if (data.physiologicState === 'cardiac_arrest') {
    probability += 0.3;
    evidence.push('Cardiac arrest (PEA)');
  }

  // Oliguria/anuria
  if (data.circulation.history?.oliguria) {
    probability += 0.3;
    evidence.push('Reduced urine output');
  } else {
    missing.push('urine_output');
  }

  // Bradycardia or arrhythmia
  if (data.circulation.rhythm === 'bradycardia' || data.circulation.rhythm === 'irregular') {
    probability += 0.2;
    evidence.push('Cardiac rhythm abnormality');
  }

  missing.push('ecg_changes');
  missing.push('renal_history');

  return {
    id: 'hyperkalemia',
    diagnosis: 'Hyperkalemia',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'ECG shows peaked T waves, wide QRS, or other changes?',
      'History of kidney disease or dialysis?',
      'Recent crush injury or rhabdomyolysis?',
      'Medications (ACE inhibitors, potassium supplements)?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Hypoglycemia Pattern Recognition
 * Key features: Low blood glucose + Altered mental status + Sweating/Tremor
 */
function analyzeHypoglycemia(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Low blood glucose (definitive)
  if (data.disability.blood_glucose && data.disability.blood_glucose < 3) {
    probability += 0.9;
    evidence.push(`Hypoglycemia (${data.disability.blood_glucose} mmol/L)`);
  } else if (data.disability.blood_glucose && data.disability.blood_glucose < 4) {
    probability += 0.5;
    evidence.push(`Low-normal glucose (${data.disability.blood_glucose} mmol/L)`);
  } else {
    missing.push('blood_glucose');
  }

  // Altered mental status
  if (data.disability.avpu !== 'alert' || data.physiologicState === 'unresponsive') {
    probability += 0.1;
    evidence.push('Altered mental status');
  }

  // Seizure (can be caused by hypoglycemia)
  if (data.disability.seizure?.active || data.disability.seizure?.just_stopped) {
    probability += 0.05;
    evidence.push('Seizure (possible hypoglycemic cause)');
  }

  return {
    id: 'hypoglycemia',
    diagnosis: 'Hypoglycemia',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Known diabetes?',
      'Missed meals or prolonged fasting?',
      'Recent insulin or oral hypoglycemic medication?',
      'Sweating, tremor, or palpitations?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Postpartum Hemorrhage Pattern Recognition (Pregnant/Postpartum only)
 * Key features: Heavy bleeding + Postpartum + Shock
 */
function analyzePostpartumHemorrhage(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Postpartum status (required)
  if (!data.exposure.pregnancy_related?.postpartum) {
    return {
      id: 'postpartum_hemorrhage',
      diagnosis: 'Postpartum Hemorrhage',
      probability: 0,
      evidence: [],
      missing: ['postpartum_status'],
      nextQuestions: [],
      category: 'immediate_threat',
    };
  }

  probability += 0.4;
  evidence.push('Postpartum status');

  // Severe bleeding
  if (data.physiologicState === 'severe_bleeding') {
    probability += 0.5;
    evidence.push('Severe bleeding reported');
  } else {
    missing.push('bleeding_assessment');
  }

  // Shock
  if (
    data.physiologicState === 'shock' ||
    data.circulation.perfusion.capillary_refill !== 'normal'
  ) {
    probability += 0.1;
    evidence.push('Shock/poor perfusion');
  }

  return {
    id: 'postpartum_hemorrhage',
    diagnosis: 'Postpartum Hemorrhage',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'How much blood loss (estimated)?',
      'Uterus firm or soft (boggy)?',
      'Placenta delivered completely?',
      'Perineal or vaginal lacerations?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Asthma/Status Asthmaticus Pattern Recognition
 * Key features: Wheezing + Respiratory distress + Known asthma + Poor response to treatment
 */
function analyzeAsthma(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Wheezing
  if (data.breathing.auscultation?.wheezing) {
    probability += 0.4;
    evidence.push('Wheezing');
  } else {
    missing.push('wheezing');
  }

  // Respiratory distress
  if (
    data.physiologicState === 'severe_respiratory_distress' ||
    data.breathing.effort === 'increased'
  ) {
    probability += 0.3;
    evidence.push('Respiratory distress');
  }

  // Silent chest (ominous sign - status asthmaticus)
  if (data.breathing.auscultation?.silent_chest) {
    probability += 0.2;
    evidence.push('Silent chest (severe obstruction)');
  }

  // Low SpO2
  if (data.breathing.spO2 < 92) {
    probability += 0.1;
    evidence.push('Hypoxia');
  }

  missing.push('asthma_history');
  missing.push('trigger');

  return {
    id: 'status_asthmaticus',
    diagnosis: 'Asthma / Status Asthmaticus',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Known asthma history?',
      'Recent trigger (infection, allergen, exercise)?',
      'Medications used (bronchodilators, steroids)?',
      'Previous ICU admissions for asthma?',
    ],
    category: 'critical',
  };
}

/**
 * Neonatal Sepsis Pattern Recognition (Neonate only)
 * Key features: Fever/hypothermia + Poor feeding + Lethargy + Age <28 days
 */
function analyzeNeonatalSepsis(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Age <28 days (already filtered by caller)
  probability += 0.2;
  evidence.push('Neonate (0-28 days)');

  // Fever or hypothermia
  if (data.exposure.temperature > 38 || data.exposure.temperature < 36) {
    probability += 0.3;
    evidence.push(`Temperature ${data.exposure.temperature}°C`);
  } else {
    missing.push('fever');
  }

  // Poor feeding
  if (data.circulation.history?.poor_feeding) {
    probability += 0.2;
    evidence.push('Poor feeding');
  } else {
    missing.push('feeding_history');
  }

  // Lethargy
  if (data.disability.avpu !== 'alert') {
    probability += 0.2;
    evidence.push('Lethargy');
  }

  // Respiratory distress
  if (data.breathing.effort === 'increased' || data.breathing.rate > 60) {
    probability += 0.1;
    evidence.push('Respiratory distress');
  }

  return {
    id: 'neonatal_sepsis',
    diagnosis: 'Neonatal Sepsis',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Maternal risk factors (prolonged rupture of membranes, chorioamnionitis)?',
      'Jaundice present?',
      'Seizures or abnormal movements?',
      'Umbilical stump infection?',
    ],
    category: 'critical',
  };
}


// ============================================================================
// TIER 1 EMERGENCY ALGORITHMS (Time-critical, minutes to death)
// ============================================================================

/**
 * Foreign Body Aspiration Analysis
 * Causes: Choking on food, toys, small objects
 * Key features: Sudden onset, witnessed choking, stridor, inability to speak/cry
 * Time to death: MINUTES
 */
function analyzeForeignBodyAspiration(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Airway obstruction
  if (data.airway.status === 'obstructed') {
    probability += 0.5;
    evidence.push('Airway obstructed');
  }

  // Stridor (partial obstruction)
  if (data.airway.observations.stridor || data.breathing.auscultation?.stridor) {
    probability += 0.3;
    evidence.push('Stridor (partial airway obstruction)');
  }

  // Sudden onset respiratory distress
  if (data.physiologicState === 'severe_respiratory_distress') {
    probability += 0.2;
    evidence.push('Severe respiratory distress');
  }

  // Age factor (infants and toddlers at highest risk)
  if (data.patientType === 'child' && data.exposure.age_years && data.exposure.age_years < 5) {
    probability += 0.1;
    evidence.push('High-risk age group (<5 years)');
  }

  // Hypoxia
  if (data.breathing.spO2 < 90) {
    probability += 0.1;
    evidence.push('Severe hypoxia');
  }

  return {
    id: 'foreign_body_aspiration',
    diagnosis: 'Foreign Body Aspiration (Choking)',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Witnessed choking episode?',
      'Eating or playing with small objects before onset?',
      'Sudden onset of symptoms?',
      'Able to speak/cry?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Tension Pneumothorax Analysis
 * Causes: Trauma, mechanical ventilation, spontaneous (tall thin males)
 * Key features: Decreased air entry, tracheal deviation, hypotension, JVP elevated
 * Time to death: MINUTES
 */
function analyzeTensionPneumothorax(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Decreased or absent air entry (strongest predictor)
  if (data.breathing.auscultation?.decreased_air_entry || 
      data.breathing.auscultation?.silent_chest) {
    probability += 0.4;
    evidence.push('Decreased/absent air entry');
  }

  // Hypotension + shock (obstructive shock)
  if (data.physiologicState === 'shock' || 
      (data.circulation.bloodPressure && data.circulation.bloodPressure.systolic < 90)) {
    probability += 0.3;
    evidence.push('Hypotension/shock');
  }

  // Elevated JVP (obstructed venous return)
  if (data.circulation.jvp === 'elevated') {
    probability += 0.2;
    evidence.push('Elevated JVP');
  }

  // Trauma history
  if (data.exposure.trauma_history?.mechanism) {
    probability += 0.2;
    evidence.push(`Trauma (${data.exposure.trauma_history.mechanism})`);
  }

  // Severe hypoxia
  if (data.breathing.spO2 < 85) {
    probability += 0.1;
    evidence.push('Severe hypoxia');
  }

  // Tachycardia
  if (data.circulation.heartRate > 120) {
    probability += 0.05;
    evidence.push('Tachycardia');
  }

  return {
    id: 'tension_pneumothorax',
    diagnosis: 'Tension Pneumothorax',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Tracheal deviation?',
      'Recent chest trauma or procedure?',
      'On mechanical ventilation?',
      'Subcutaneous emphysema?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Cardiac Tamponade Analysis
 * Causes: Trauma (penetrating > blunt), pericarditis, malignancy
 * Key features: Beck's triad (hypotension, elevated JVP, muffled heart sounds)
 * Time to death: MINUTES to HOURS
 */
function analyzeCardiacTamponade(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Elevated JVP (required for diagnosis)
  if (data.circulation.jvp === 'elevated') {
    probability += 0.4;
    evidence.push('Elevated JVP');
  } else {
    missing.push('jvp_assessment');
  }

  // Hypotension/shock
  if (data.physiologicState === 'shock' || 
      (data.circulation.bloodPressure && data.circulation.bloodPressure.systolic < 90)) {
    probability += 0.3;
    evidence.push('Hypotension/shock');
  }

  // Trauma history (especially penetrating chest trauma)
  if (data.exposure.trauma_history?.mechanism === 'penetrating') {
    probability += 0.3;
    evidence.push('Penetrating chest trauma');
  } else if (data.exposure.trauma_history?.mechanism) {
    probability += 0.1;
    evidence.push(`Trauma (${data.exposure.trauma_history.mechanism})`);
  }

  // Clear lung fields (rules out cardiogenic shock)
  if (!data.breathing.auscultation?.crackles) {
    probability += 0.1;
    evidence.push('Clear lung fields');
  }

  // Tachycardia
  if (data.circulation.heartRate > 120) {
    probability += 0.05;
    evidence.push('Tachycardia');
  }

  return {
    id: 'cardiac_tamponade',
    diagnosis: 'Cardiac Tamponade',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Muffled/distant heart sounds?',
      'Pulsus paradoxus (BP drops >10 mmHg on inspiration)?',
      'Recent chest trauma or cardiac procedure?',
      'History of pericarditis or malignancy?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Acute Myocardial Infarction Analysis
 * Causes: Coronary artery occlusion (atherosclerosis, thrombosis)
 * Key features: Chest pain, ECG changes, cardiac biomarkers
 * Time to death: HOURS (but treatment window <90 min for PCI, <12 hours for thrombolysis)
 */
function analyzeMyocardialInfarction(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Age factor (rare in children, common in adults >40)
  if (data.patientType === 'adult' && data.exposure.age_years && data.exposure.age_years > 40) {
    probability += 0.2;
    evidence.push('Age >40 years');
  } else if (data.patientType === 'child') {
    // Rare in children - lower threshold
    return {
      id: 'myocardial_infarction',
      diagnosis: 'Acute Myocardial Infarction',
      probability: 0.05,
      evidence: ['Rare in pediatric population'],
      missing: [],
      nextQuestions: [],
      category: 'critical',
    };
  }

  // Chest pain
  // TODO: Add chest pain to primary survey
  missing.push('chest_pain');

  // Shock/cardiogenic shock
  if (data.physiologicState === 'shock') {
    probability += 0.3;
    evidence.push('Shock (possible cardiogenic)');
  }

  // Elevated JVP (heart failure from MI)
  if (data.circulation.jvp === 'elevated') {
    probability += 0.2;
    evidence.push('Elevated JVP (heart failure)');
  }

  // Crackles (pulmonary edema from heart failure)
  if (data.breathing.auscultation?.crackles) {
    probability += 0.2;
    evidence.push('Pulmonary edema');
  }

  // Diaphoresis (sweating)
  // TODO: Add to skin findings

  return {
    id: 'myocardial_infarction',
    diagnosis: 'Acute Myocardial Infarction (STEMI/NSTEMI)',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Chest pain (crushing, radiating to arm/jaw)?',
      'Shortness of breath?',
      'Nausea/vomiting?',
      'Diaphoresis (sweating)?',
      'Risk factors (diabetes, hypertension, smoking, family history)?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Stroke Analysis (Ischemic or Hemorrhagic)
 * Causes: Thrombosis, embolism, hemorrhage
 * Key features: Sudden onset focal neurological deficit, altered mental status
 * Time to death: HOURS (but treatment window <4.5 hours for tPA)
 */
function analyzeStroke(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Altered mental status
  if (data.disability.avpu !== 'alert') {
    probability += 0.3;
    evidence.push(`Altered mental status (${data.disability.avpu})`);
  }

  // Unequal pupils (mass effect from hemorrhage)
  if (data.disability.pupils.size_left !== data.disability.pupils.size_right ||
      data.disability.pupils.reactive_left !== data.disability.pupils.reactive_right) {
    probability += 0.3;
    evidence.push('Unequal/unreactive pupils');
  }

  // Posturing (severe brain injury)
  if (data.disability.posturing !== 'none') {
    probability += 0.2;
    evidence.push(`Posturing (${data.disability.posturing})`);
  }

  // Hypertension (risk factor + hemorrhagic stroke cause)
  if (data.circulation.bloodPressure && data.circulation.bloodPressure.systolic > 180) {
    probability += 0.2;
    evidence.push('Severe hypertension');
  }

  // Age factor (more common in elderly)
  if (data.patientType === 'adult' && data.exposure.age_years && data.exposure.age_years > 60) {
    probability += 0.1;
    evidence.push('Age >60 years');
  }

  // Pregnancy (increased stroke risk)
  if (data.patientType === 'pregnant_postpartum') {
    probability += 0.1;
    evidence.push('Pregnancy (increased stroke risk)');
  }

  return {
    id: 'stroke',
    diagnosis: 'Stroke (Ischemic/Hemorrhagic)',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Sudden onset of symptoms?',
      'Facial droop?',
      'Arm/leg weakness (one-sided)?',
      'Speech difficulty?',
      'Severe headache (worst of life)?',
      'Time of symptom onset? (Critical for tPA eligibility)',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Bacterial Meningitis Analysis
 * Causes: Streptococcus pneumoniae, Neisseria meningitidis, Haemophilus influenzae
 * Key features: Fever, altered mental status, neck stiffness, petechiae
 * Time to death: HOURS
 */
function analyzeMeningitis(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Fever
  if (data.exposure.temperature > 38) {
    probability += 0.3;
    evidence.push(`Fever (${data.exposure.temperature}°C)`);
  } else {
    missing.push('fever');
  }

  // Altered mental status
  if (data.disability.avpu !== 'alert') {
    probability += 0.3;
    evidence.push(`Altered mental status (${data.disability.avpu})`);
  }

  // Petechiae/purpura (meningococcemia)
  if (data.exposure.skin_findings?.petechiae || data.exposure.skin_findings?.purpura) {
    probability += 0.3;
    evidence.push('Petechiae/purpura (meningococcemia)');
  }

  // Shock (septic shock from meningococcemia)
  if (data.physiologicState === 'shock') {
    probability += 0.2;
    evidence.push('Shock');
  }

  // Seizure (CNS infection)
  if (data.disability.seizure?.active || data.disability.seizure?.just_stopped) {
    probability += 0.1;
    evidence.push('Seizure');
  }

  // Neck stiffness
  // TODO: Add to disability assessment
  missing.push('neck_stiffness');

  return {
    id: 'bacterial_meningitis',
    diagnosis: 'Bacterial Meningitis',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Neck stiffness/pain with neck flexion?',
      'Severe headache?',
      'Photophobia (light sensitivity)?',
      'Recent upper respiratory infection?',
      'Immunization status (Hib, pneumococcal, meningococcal)?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Opioid Overdose Analysis
 * Causes: Heroin, fentanyl, morphine, codeine, tramadol
 * Key features: Respiratory depression, pinpoint pupils, altered mental status
 * Time to death: MINUTES (respiratory arrest)
 */
function analyzeOpioidOverdose(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Toxin exposure history
  if (data.exposure.toxin_exposure?.substance) {
    probability += 0.4;
    evidence.push(`Toxin exposure: ${data.exposure.toxin_exposure.substance}`);
  } else {
    missing.push('toxin_exposure_history');
  }

  // Respiratory depression (hallmark)
  if (data.breathing.rate < 10 || data.physiologicState === 'respiratory_arrest') {
    probability += 0.4;
    evidence.push('Severe respiratory depression');
  }

  // Pinpoint pupils (miosis)
  if (data.disability.pupils.size_left < 2 && data.disability.pupils.size_right < 2) {
    probability += 0.3;
    evidence.push('Pinpoint pupils (miosis)');
  }

  // Altered mental status
  if (data.disability.avpu !== 'alert') {
    probability += 0.2;
    evidence.push(`Altered mental status (${data.disability.avpu})`);
  }

  // Hypoxia
  if (data.breathing.spO2 < 90) {
    probability += 0.1;
    evidence.push('Hypoxia');
  }

  return {
    id: 'opioid_overdose',
    diagnosis: 'Opioid Overdose',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Known opioid use (prescribed or recreational)?',
      'Found with drug paraphernalia?',
      'Witnessed ingestion/injection?',
      'Time since exposure?',
    ],
    category: 'immediate_threat',
  };
}

/**
 * Severe Burns Analysis
 * Causes: Thermal, chemical, electrical
 * Key features: Visible burns, shock (fluid losses), airway compromise (inhalation)
 * Time to death: HOURS (shock, airway obstruction)
 */
function analyzeSevereBurns(data: PrimarySurveyData): Differential {
  let probability = 0;
  const evidence: string[] = [];
  const missing: string[] = [];

  // Visible burns
  if (data.exposure.visible_injuries?.burns) {
    probability += 0.5;
    evidence.push('Visible burns');
  } else {
    return {
      id: 'severe_burns',
      diagnosis: 'Severe Burns',
      probability: 0,
      evidence: [],
      missing: ['visible_burns'],
      nextQuestions: [],
      category: 'critical',
    };
  }

  // Trauma history (burn mechanism)
  if (data.exposure.trauma_history?.mechanism === 'burn') {
    probability += 0.3;
    evidence.push('Burn mechanism confirmed');
  }

  // Shock (fluid losses from burns)
  if (data.physiologicState === 'shock') {
    probability += 0.2;
    evidence.push('Shock (fluid losses)');
  }

  // Airway compromise (inhalation injury)
  if (data.airway.status === 'obstructed' || 
      data.airway.observations.stridor ||
      data.breathing.auscultation?.stridor) {
    probability += 0.2;
    evidence.push('Airway compromise (inhalation injury)');
  }

  // Hypoxia (smoke inhalation)
  if (data.breathing.spO2 < 90) {
    probability += 0.1;
    evidence.push('Hypoxia (smoke inhalation)');
  }

  return {
    id: 'severe_burns',
    diagnosis: 'Severe Burns',
    probability: Math.min(probability, 0.99),
    evidence,
    missing,
    nextQuestions: [
      'Burn mechanism (flame, scald, chemical, electrical)?',
      'Enclosed space fire (smoke inhalation)?',
      'Estimated body surface area burned (%)?',
      'Depth of burns (superficial, partial thickness, full thickness)?',
      'Circumferential burns (chest, limbs)?',
    ],
    category: 'immediate_threat',
  };
}
