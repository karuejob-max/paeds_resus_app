// @ts-nocheck
// Intervention Recommender - Risk-Benefit Categorization
// Military Precision: Immediate vs Confirmatory Therapy

import type {
  Differential,
  Intervention,
  RequiredTest,
  ClinicalReasoningResult,
  PrimarySurveyData,
} from '../shared/clinical-types';
import { getAgeGroup, getAgeSpecificInterventions, type AgeGroup } from './age-modifiers';

/**
 * Recommends interventions based on differential diagnosis and risk-benefit analysis
 * Categories: Immediate (start now), Urgent (minimal confirmation), Confirmatory (wait for labs)
 */
export function recommendInterventions(
  topDifferential: Differential,
  surveyData: PrimarySurveyData
): {
  immediate: Intervention[];
  urgent: Intervention[];
  confirmatory: Intervention[];
  requiredTests: RequiredTest[];
} {
  const immediate: Intervention[] = [];
  const urgent: Intervention[] = [];
  const confirmatory: Intervention[] = [];
  const requiredTests: RequiredTest[] = [];

  const weight = surveyData.exposure.weight;

  switch (topDifferential.id) {
    case 'dka':
      // IMMEDIATE: Fluids (high benefit, low risk)
      immediate.push({
        id: 'dka_fluid_bolus',
        name: `Normal Saline Bolus: ${(weight * 10).toFixed(0)} mL (10 mL/kg)`,
        category: 'immediate',
        indication: 'DKA - Fluid resuscitation',
        contraindications: ['Signs of heart failure', 'Pulmonary edema'],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
        dosing: {
          calculation: '10 mL/kg',
          max_dose: 1000,
          route: 'IV over 10-15 minutes',
        },
        monitoring: ['Heart rate', 'Blood pressure', 'Urine output', 'Blood glucose hourly'],
      });

      // IMMEDIATE: Continuous monitoring
      immediate.push({
        id: 'dka_monitoring',
        name: 'Continuous Cardiac Monitoring',
        category: 'immediate',
        indication: 'DKA - Monitor for arrhythmias (hypokalemia risk)',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
      });

      // CONFIRMATORY: Insulin (wait for pH/ketones - risk of cerebral edema if HHS)
      confirmatory.push({
        id: 'dka_insulin',
        name: `Regular Insulin: ${(weight * 0.1).toFixed(2)} units/hr (0.1 units/kg/hr)`,
        category: 'confirmatory',
        indication: 'DKA - After confirmed ketoacidosis',
        contraindications: ['HHS without ketones'],
        requiredTests: [
          { name: 'pH', threshold: '<7.3', priority: 'stat' },
          { name: 'Ketones (blood or urine)', threshold: 'positive', priority: 'stat' },
        ],
        riskIfWrong: 'high',
        benefitIfRight: 'high',
        timeWindow: 'hours',
        dosing: {
          calculation: '0.1 units/kg/hr',
          route: 'IV infusion',
        },
        monitoring: ['Blood glucose hourly', 'Electrolytes every 2-4 hours', 'Neurological status'],
      });

      // REQUIRED TESTS
      requiredTests.push(
        { name: 'Venous blood gas (pH, HCO3, pCO2)', priority: 'stat' },
        { name: 'Blood or urine ketones', priority: 'stat' },
        { name: 'Basic metabolic panel (Na, K, Cl, BUN, Cr, glucose)', priority: 'stat' },
        { name: 'HbA1c (if new diagnosis)', priority: 'urgent' }
      );
      break;

    case 'septic_shock':
      // IMMEDIATE: Fluid bolus
      immediate.push({
        id: 'sepsis_fluid_bolus',
        name: `Normal Saline Bolus: ${(weight * 20).toFixed(0)} mL (20 mL/kg)`,
        category: 'immediate',
        indication: 'Septic shock - Fluid resuscitation',
        contraindications: ['Signs of heart failure', 'Pulmonary edema'],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '20 mL/kg',
          max_dose: 1000,
          route: 'IV over 5-10 minutes, may repeat up to 60 mL/kg',
        },
        monitoring: ['Heart rate', 'Blood pressure', 'Perfusion', 'Urine output'],
      });

      // URGENT: Antibiotics (within 1 hour - don't wait for all cultures)
      urgent.push({
        id: 'sepsis_antibiotics',
        name: 'Broad-spectrum Antibiotics (within 1 hour)',
        category: 'urgent',
        indication: 'Septic shock - Time-critical',
        contraindications: ['Known severe antibiotic allergy'],
        requiredTests: [
          { name: 'Blood cultures', threshold: 'before antibiotics if possible', priority: 'stat' },
        ],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        monitoring: ['Clinical response', 'Fever curve', 'WBC trend'],
      });

      requiredTests.push(
        { name: 'Blood cultures (2 sets)', priority: 'stat' },
        { name: 'Complete blood count', priority: 'stat' },
        { name: 'Lactate', priority: 'stat' },
        { name: 'Procalcitonin', priority: 'urgent' }
      );
      break;

    case 'eclampsia':
      // IMMEDIATE: Magnesium sulfate (life-saving, low risk)
      immediate.push({
        id: 'eclampsia_magnesium_loading',
        name: `Magnesium Sulfate Loading: ${Math.min(weight * 40, 4000).toFixed(0)} mg (40 mg/kg, max 4g)`,
        category: 'immediate',
        indication: 'Eclampsia - Seizure prophylaxis and treatment',
        contraindications: ['Myasthenia gravis', 'Heart block'],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '40 mg/kg',
          max_dose: 4000,
          route: 'IV over 15-20 minutes',
        },
        monitoring: ['Respiratory rate', 'Deep tendon reflexes', 'Urine output', 'Magnesium levels'],
      });

      // IMMEDIATE: Antihypertensive if severe hypertension
      if (surveyData.circulation.bloodPressure && surveyData.circulation.bloodPressure.systolic >= 160) {
        immediate.push({
          id: 'eclampsia_antihypertensive',
          name: 'Antihypertensive (Labetalol or Hydralazine)',
          category: 'immediate',
          indication: 'Severe hypertension (SBP ≥160 or DBP ≥110)',
          contraindications: ['Asthma (for labetalol)', 'Heart failure'],
          requiredTests: [],
          riskIfWrong: 'low',
          benefitIfRight: 'high',
          timeWindow: 'minutes',
        });
      }

      requiredTests.push(
        { name: 'Complete blood count (platelets)', priority: 'stat' },
        { name: 'Liver enzymes (AST, ALT)', priority: 'stat' },
        { name: 'Renal function (Cr, BUN)', priority: 'stat' },
        { name: 'Urine protein', priority: 'urgent' }
      );
      break;

    case 'pulmonary_embolism':
      // IMMEDIATE: Anticoagulation (high-risk condition, favorable risk-benefit)
      immediate.push({
        id: 'pe_heparin_bolus',
        name: `Unfractionated Heparin Bolus: ${(weight * 75).toFixed(0)} units (75 units/kg)`,
        category: 'immediate',
        indication: 'Suspected PE - Start before imaging',
        contraindications: ['Active bleeding', 'Recent surgery', 'Recent head injury', 'Known bleeding disorder'],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '75 units/kg',
          route: 'IV bolus',
        },
      });

      immediate.push({
        id: 'pe_heparin_infusion',
        name: `Unfractionated Heparin Infusion: ${(weight * 20).toFixed(0)} units/hr (20 units/kg/hr)`,
        category: 'immediate',
        indication: 'Suspected PE - Continuous anticoagulation',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '20 units/kg/hr',
          route: 'IV infusion',
        },
        monitoring: ['aPTT every 4-6 hours', 'Signs of bleeding'],
      });

      requiredTests.push(
        { name: 'CTPA (CT Pulmonary Angiography)', priority: 'stat' },
        { name: 'Lower limb Doppler ultrasound', priority: 'stat' },
        { name: 'D-dimer', priority: 'urgent' },
        { name: 'ECG', priority: 'stat' },
        { name: 'Troponin', priority: 'urgent' }
      );
      break;

    case 'hyperkalemia':
      // IMMEDIATE: Calcium (cardiac membrane stabilization - NO DELAY)
      immediate.push({
        id: 'hyperkalemia_calcium',
        name: 'Calcium Gluconate 10%: 10 mL (1 g) IV slow push',
        category: 'immediate',
        indication: 'Suspected hyperkalemia with ECG changes or arrest',
        contraindications: ['Digoxin toxicity (relative)'],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '1 g (10 mL of 10% solution)',
          route: 'IV over 2-5 minutes',
        },
        monitoring: ['ECG - repeat if no improvement in 5 minutes'],
      });

      // IMMEDIATE: Shift potassium intracellularly
      immediate.push({
        id: 'hyperkalemia_insulin_dextrose',
        name: 'Insulin 10 units + D50 50 mL IV push',
        category: 'immediate',
        indication: 'Shift K+ intracellularly',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
        monitoring: ['Blood glucose every 15-30 minutes'],
      });

      immediate.push({
        id: 'hyperkalemia_bicarbonate',
        name: 'Sodium Bicarbonate 8.4%: 50 mEq (50 mL) IV push',
        category: 'immediate',
        indication: 'Shift K+ intracellularly (especially if acidotic)',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
      });

      requiredTests.push(
        { name: 'Stat potassium (venous blood gas fastest)', priority: 'stat' },
        { name: 'Basic metabolic panel', priority: 'stat' },
        { name: 'ECG', priority: 'stat' }
      );
      break;

    case 'hypoglycemia':
      // IMMEDIATE: Glucose (definitive treatment, zero risk)
      if (surveyData.disability.blood_glucose && surveyData.disability.blood_glucose < 3) {
        immediate.push({
          id: 'hypoglycemia_dextrose',
          name: `Dextrose 10%: ${(weight * 5).toFixed(0)} mL (5 mL/kg) IV push`,
          category: 'immediate',
          indication: 'Hypoglycemia - Definitive treatment',
          contraindications: [],
          requiredTests: [],
          riskIfWrong: 'none',
          benefitIfRight: 'life_saving',
          timeWindow: 'minutes',
          dosing: {
            calculation: '5 mL/kg of D10 (or 2 mL/kg of D25, or 1 mL/kg of D50 in adults)',
            route: 'IV push',
          },
          monitoring: ['Blood glucose every 15 minutes until stable', 'Neurological status'],
        });
      }

      requiredTests.push(
        { name: 'Blood glucose (confirm)', priority: 'stat' },
        { name: 'Insulin level (if recurrent)', priority: 'urgent' },
        { name: 'C-peptide (if recurrent)', priority: 'urgent' }
      );
      break;

    case 'postpartum_hemorrhage':
      // IMMEDIATE: Uterotonic drugs
      immediate.push({
        id: 'pph_oxytocin',
        name: 'Oxytocin 10 units IM or 20 units in 1L NS IV',
        category: 'immediate',
        indication: 'Postpartum hemorrhage - Uterine contraction',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
      });

      // IMMEDIATE: Tranexamic acid (within 3 hours of delivery)
      if (surveyData.exposure.pregnancy_related?.days_postpartum && surveyData.exposure.pregnancy_related.days_postpartum === 0) {
        immediate.push({
          id: 'pph_tranexamic_acid',
          name: 'Tranexamic Acid 1 g IV over 10 minutes',
          category: 'immediate',
          indication: 'Postpartum hemorrhage - Antifibrinolytic',
          contraindications: ['History of thrombosis', 'Seizure disorder'],
          requiredTests: [],
          riskIfWrong: 'low',
          benefitIfRight: 'high',
          timeWindow: 'minutes',
        });
      }

      requiredTests.push(
        { name: 'Complete blood count (Hgb, platelets)', priority: 'stat' },
        { name: 'Coagulation panel (PT, aPTT, fibrinogen)', priority: 'stat' },
        { name: 'Type and crossmatch (4-6 units)', priority: 'stat' }
      );
      break;

    case 'anaphylaxis':
      // IMMEDIATE: Epinephrine (life-saving, zero delay)
      immediate.push({
        id: 'anaphylaxis_epinephrine',
        name: `Epinephrine 1:1000: ${(weight * 0.01).toFixed(2)} mL (0.01 mL/kg, max 0.5 mL) IM`,
        category: 'immediate',
        indication: 'Anaphylaxis - Definitive treatment',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '0.01 mL/kg of 1:1000 solution',
          max_dose: 0.5,
          route: 'IM (anterolateral thigh)',
        },
        monitoring: ['Heart rate', 'Blood pressure', 'Respiratory status', 'May repeat every 5-15 minutes'],
      });

      immediate.push({
        id: 'anaphylaxis_oxygen',
        name: 'High-flow Oxygen',
        category: 'immediate',
        indication: 'Anaphylaxis - Respiratory support',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
      });

      urgent.push({
        id: 'anaphylaxis_antihistamine',
        name: 'Diphenhydramine 1-2 mg/kg IV/IM',
        category: 'urgent',
        indication: 'Anaphylaxis - Adjunct therapy',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'moderate',
        timeWindow: 'minutes',
      });

      requiredTests.push(
        { name: 'Tryptase level (within 1-2 hours)', priority: 'urgent' }
      );
      break;

    case 'status_epilepticus':
      // IMMEDIATE: Benzodiazepines
      immediate.push({
        id: 'status_epilepticus_lorazepam',
        name: `Lorazepam: ${(weight * 0.1).toFixed(2)} mg (0.1 mg/kg, max 4 mg) IV`,
        category: 'immediate',
        indication: 'Status epilepticus - First-line',
        contraindications: ['Respiratory depression'],
        requiredTests: [],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
        dosing: {
          calculation: '0.1 mg/kg',
          max_dose: 4,
          route: 'IV over 2 minutes, may repeat once',
        },
        monitoring: ['Respiratory status', 'Seizure activity'],
      });

      // For pregnant patients, check if pregnancy-safe
      if (surveyData.patientType === 'pregnant_postpartum') {
        immediate.push({
          id: 'status_epilepticus_pregnancy_note',
          name: '⚠️ Pregnancy-Safe Anticonvulsants',
          category: 'immediate',
          indication: 'Avoid valproate (teratogenic)',
          contraindications: [],
          requiredTests: [],
          riskIfWrong: 'none',
          benefitIfRight: 'high',
          timeWindow: 'minutes',
        });
      }

      requiredTests.push(
        { name: 'Blood glucose (rule out hypoglycemia)', priority: 'stat' },
        { name: 'Electrolytes (Na, Ca, Mg)', priority: 'stat' },
        { name: 'Anticonvulsant levels (if known epilepsy)', priority: 'urgent' }
      );
      break;

    case 'status_asthmaticus':
      // IMMEDIATE: Bronchodilators
      immediate.push({
        id: 'asthma_albuterol',
        name: 'Albuterol 2.5-5 mg nebulized (continuous if severe)',
        category: 'immediate',
        indication: 'Status asthmaticus - Bronchodilation',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
        monitoring: ['Heart rate', 'Respiratory rate', 'SpO2', 'Peak flow'],
      });

      immediate.push({
        id: 'asthma_ipratropium',
        name: 'Ipratropium 0.5 mg nebulized (with albuterol)',
        category: 'immediate',
        indication: 'Status asthmaticus - Adjunct bronchodilation',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'moderate',
        timeWindow: 'minutes',
      });

      urgent.push({
        id: 'asthma_steroids',
        name: 'Methylprednisolone 1-2 mg/kg IV or Prednisone 1-2 mg/kg PO',
        category: 'urgent',
        indication: 'Status asthmaticus - Reduce inflammation',
        contraindications: [],
        requiredTests: [],
        riskIfWrong: 'none',
        benefitIfRight: 'high',
        timeWindow: 'minutes',
      });

      requiredTests.push(
        { name: 'Chest X-ray (if first episode or complications)', priority: 'urgent' },
        { name: 'Arterial blood gas (if severe)', priority: 'urgent' }
      );
      break;

    case 'neonatal_sepsis':
      // URGENT: Antibiotics (within 1 hour)
      urgent.push({
        id: 'neonatal_sepsis_antibiotics',
        name: 'Ampicillin + Gentamicin IV (within 1 hour)',
        category: 'urgent',
        indication: 'Neonatal sepsis - Empiric coverage',
        contraindications: [],
        requiredTests: [
          { name: 'Blood cultures', threshold: 'before antibiotics if possible', priority: 'stat' },
        ],
        riskIfWrong: 'low',
        benefitIfRight: 'life_saving',
        timeWindow: 'minutes',
      });

      requiredTests.push(
        { name: 'Blood cultures', priority: 'stat' },
        { name: 'Complete blood count', priority: 'stat' },
        { name: 'C-reactive protein', priority: 'stat' },
        { name: 'Lumbar puncture (if stable)', priority: 'urgent' }
      );
      break;
  }

  // Apply age-specific intervention modifications
  const ageGroup = getAgeGroup(surveyData.patientAge, surveyData.patientType === 'pregnant_postpartum');
  const ageSpecificModifications = getAgeSpecificInterventions(topDifferential.id, ageGroup);

  // Add age-specific modifications as additional immediate interventions
  if (ageSpecificModifications.length > 0) {
    immediate.push({
      id: `${topDifferential.id}_age_specific`,
      name: 'Age-Specific Modifications',
      category: 'immediate',
      indication: `${ageGroup} population`,
      contraindications: [],
      requiredTests: [],
      riskIfWrong: 'low',
      benefitIfRight: 'high',
      timeWindow: 'minutes',
      dosing: {
        calculation: 'See modifications below',
        route: 'Various',
      },
      monitoring: ageSpecificModifications,
    });
  }

  return {
    immediate,
    urgent,
    confirmatory,
    requiredTests,
  };
}
