// Multi-System Scoring Algorithm
// Detects overlapping life-threatening conditions and generates integrated treatment protocols

import type { Differential, Intervention, PrimarySurveyData } from '../shared/clinical-types';

/**
 * Threshold for considering a condition as "active" in multi-system scoring
 * If multiple conditions exceed this probability, they're considered overlapping
 */
const OVERLAP_THRESHOLD = 0.6; // 60% probability

/**
 * System categories for grouping related conditions
 */
export type SystemCategory =
  | 'cardiovascular'
  | 'respiratory'
  | 'neurological'
  | 'metabolic'
  | 'infectious'
  | 'obstetric'
  | 'trauma'
  | 'toxicologic'
  | 'hematologic';

/**
 * Maps condition IDs to their primary system categories
 */
const CONDITION_SYSTEMS: Record<string, SystemCategory[]> = {
  // Cardiovascular
  cardiac_arrest: ['cardiovascular'],
  mi: ['cardiovascular'],
  heart_failure: ['cardiovascular'],
  svt: ['cardiovascular'],
  vt: ['cardiovascular'],
  cardiac_tamponade: ['cardiovascular'],
  hypovolemic_shock: ['cardiovascular'],
  cardiogenic_shock: ['cardiovascular'],
  obstructive_shock: ['cardiovascular'],
  
  // Respiratory
  foreign_body: ['respiratory'],
  tension_pneumothorax: ['respiratory'],
  status_asthmaticus: ['respiratory'],
  anaphylaxis: ['respiratory', 'cardiovascular'], // Multi-system
  pneumonia: ['respiratory', 'infectious'],
  bronchiolitis: ['respiratory', 'infectious'],
  croup: ['respiratory'],
  epiglottitis: ['respiratory', 'infectious'],
  ards: ['respiratory'],
  aspiration: ['respiratory'],
  
  // Neurological
  stroke: ['neurological', 'cardiovascular'],
  eclampsia: ['neurological', 'obstetric', 'cardiovascular'], // Multi-system
  status_epilepticus: ['neurological'],
  meningitis: ['neurological', 'infectious'],
  encephalitis: ['neurological', 'infectious'],
  increased_icp: ['neurological'],
  
  // Metabolic/Endocrine
  dka: ['metabolic', 'cardiovascular'], // Multi-system (shock component)
  hypoglycemia: ['metabolic', 'neurological'],
  hyperkalemia: ['metabolic', 'cardiovascular'],
  thyroid_storm: ['metabolic', 'cardiovascular'],
  adrenal_crisis: ['metabolic', 'cardiovascular'],
  
  // Infectious
  septic_shock: ['infectious', 'cardiovascular'], // Multi-system
  neonatal_sepsis: ['infectious', 'cardiovascular'],
  
  // Obstetric
  postpartum_hemorrhage: ['obstetric', 'cardiovascular'],
  maternal_cardiac_arrest: ['obstetric', 'cardiovascular'],
  
  // Trauma
  tbi: ['trauma', 'neurological'],
  abdominal_trauma: ['trauma', 'cardiovascular'],
  
  // Toxicologic
  opioid_overdose: ['toxicologic', 'respiratory', 'neurological'],
};

/**
 * Known dangerous overlaps that require integrated protocols
 */
interface DangerousOverlap {
  conditions: string[];
  name: string;
  priority: 'critical' | 'high' | 'moderate';
  interactions: string[];
  integratedProtocol: string;
}

const DANGEROUS_OVERLAPS: DangerousOverlap[] = [
  {
    conditions: ['eclampsia', 'stroke'],
    name: 'Eclampsia + Stroke',
    priority: 'critical',
    interactions: [
      'Both cause elevated BP - aggressive BP control needed',
      'Magnesium may mask stroke symptoms',
      'Urgent neurology consult required',
    ],
    integratedProtocol: 'eclampsia_stroke_protocol',
  },
  {
    conditions: ['septic_shock', 'dka'],
    name: 'Sepsis + DKA',
    priority: 'critical',
    interactions: [
      'Both cause shock - aggressive fluid resuscitation needed',
      'Infection triggers DKA - treat both simultaneously',
      'Antibiotics within 1 hour + insulin after initial fluids',
    ],
    integratedProtocol: 'sepsis_dka_protocol',
  },
  {
    conditions: ['anaphylaxis', 'status_asthmaticus'],
    name: 'Anaphylaxis + Asthma',
    priority: 'critical',
    interactions: [
      'Both cause bronchospasm - epinephrine + bronchodilators',
      'Anaphylaxis can trigger asthma exacerbation',
      'Steroids benefit both conditions',
    ],
    integratedProtocol: 'anaphylaxis_asthma_protocol',
  },
  {
    conditions: ['maternal_cardiac_arrest', 'postpartum_hemorrhage'],
    name: 'Maternal Cardiac Arrest + PPH',
    priority: 'critical',
    interactions: [
      'Hemorrhage likely cause of arrest',
      'CPR + left uterine displacement + massive transfusion',
      'Perimortem cesarean if >20 weeks + no ROSC in 4 minutes',
    ],
    integratedProtocol: 'maternal_arrest_pph_protocol',
  },
  {
    conditions: ['heart_failure', 'pneumonia'],
    name: 'Heart Failure + Pneumonia',
    priority: 'high',
    interactions: [
      'Fluids for sepsis may worsen heart failure',
      'Monitor for crackles, JVD, hepatomegaly after each bolus',
      'Early vasopressor support if fluid intolerant',
    ],
    integratedProtocol: 'heart_failure_pneumonia_protocol',
  },
  {
    conditions: ['meningitis', 'septic_shock'],
    name: 'Meningitis + Septic Shock',
    priority: 'critical',
    interactions: [
      'Meningococcemia causes both',
      'Antibiotics + steroids + fluids + vasopressors',
      'Dexamethasone before or with first antibiotic dose',
    ],
    integratedProtocol: 'meningitis_septic_shock_protocol',
  },
  {
    conditions: ['dka', 'septic_shock', 'hypovolemic_shock'],
    name: 'DKA + Sepsis + Shock (Triple Threat)',
    priority: 'critical',
    interactions: [
      'Infection + dehydration + acidosis',
      'Aggressive fluids + antibiotics + insulin',
      'High mortality - ICU admission',
    ],
    integratedProtocol: 'triple_threat_protocol',
  },
];

/**
 * Detects overlapping conditions from differential list
 */
export function detectOverlappingConditions(
  differentials: Differential[]
): {
  overlapping: Differential[];
  dangerousOverlaps: DangerousOverlap[];
  systemsInvolved: SystemCategory[];
} {
  // Filter differentials above overlap threshold
  const overlapping = differentials.filter((d) => d.probability >= OVERLAP_THRESHOLD);

  // Identify dangerous overlaps
  const dangerousOverlaps: DangerousOverlap[] = [];
  const overlappingIds = overlapping.map((d) => d.id);

  for (const overlap of DANGEROUS_OVERLAPS) {
    const hasAllConditions = overlap.conditions.every((condId) =>
      overlappingIds.includes(condId)
    );
    if (hasAllConditions) {
      dangerousOverlaps.push(overlap);
    }
  }

  // Identify all systems involved
  const systemsSet = new Set<SystemCategory>();
  for (const diff of overlapping) {
    const systems = CONDITION_SYSTEMS[diff.id] || [];
    systems.forEach((sys) => systemsSet.add(sys));
  }
  const systemsInvolved = Array.from(systemsSet);

  return {
    overlapping,
    dangerousOverlaps,
    systemsInvolved,
  };
}

/**
 * Generates integrated treatment protocol for overlapping conditions
 */
export function generateIntegratedProtocol(
  overlapping: Differential[],
  dangerousOverlaps: DangerousOverlap[],
  surveyData: PrimarySurveyData
): {
  immediateInterventions: Intervention[];
  systemInteractionWarnings: string[];
  prioritySequence: string[];
  conflictResolutions: string[];
} {
  const immediateInterventions: Intervention[] = [];
  const systemInteractionWarnings: string[] = [];
  const prioritySequence: string[] = [];
  const conflictResolutions: string[] = [];

  // If dangerous overlaps detected, use integrated protocols
  if (dangerousOverlaps.length > 0) {
    for (const overlap of dangerousOverlaps) {
      systemInteractionWarnings.push(...overlap.interactions);
      
      // Add integrated protocol interventions based on overlap type
      switch (overlap.integratedProtocol) {
        case 'eclampsia_stroke_protocol':
          immediateInterventions.push({
            id: 'eclampsia_stroke_integrated',
            name: 'Eclampsia + Stroke Integrated Protocol',
            category: 'immediate',
            indication: 'Overlapping eclampsia and stroke',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'high',
            benefitIfRight: 'high',
            timeWindow: 'minutes',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IV',
            },
            monitoring: [
              '1. Magnesium sulfate 4-6g IV over 15-20 min (eclampsia)',
              '2. Labetalol 10-20mg IV or hydralazine 5-10mg IV (BP control)',
              '3. URGENT neurology consult (stroke assessment)',
              '4. CT head (differentiate hemorrhagic vs ischemic)',
              '5. Continue magnesium maintenance 1-2g/hr',
              '6. Target BP <160/110 but >140/90 (avoid hypoperfusion)',
            ],
          });
          prioritySequence.push('ABC stabilization', 'Magnesium (eclampsia)', 'BP control', 'Neurology consult', 'Imaging');
          break;

        case 'sepsis_dka_protocol':
          immediateInterventions.push({
            id: 'sepsis_dka_integrated',
            name: 'Sepsis + DKA Integrated Protocol',
            category: 'immediate',
            indication: 'Overlapping sepsis and DKA',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'high',
            benefitIfRight: 'high',
            timeWindow: 'minutes',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IV',
            },
            monitoring: [
              '1. Normal saline 20 mL/kg bolus (shock resuscitation)',
              '2. Blood cultures + broad-spectrum antibiotics within 1 hour',
              '3. Insulin 0.1 units/kg/hr AFTER initial fluid bolus',
              '4. Repeat 10 mL/kg boluses until shock resolves',
              '5. Monitor glucose hourly, lactate, blood gas',
              '6. ICU admission',
            ],
          });
          prioritySequence.push('ABC stabilization', 'Fluids (shock)', 'Antibiotics (sepsis)', 'Insulin (DKA)', 'ICU transfer');
          conflictResolutions.push('Fluids first (shock takes priority), then insulin (DKA)');
          break;

        case 'anaphylaxis_asthma_protocol':
          immediateInterventions.push({
            id: 'anaphylaxis_asthma_integrated',
            name: 'Anaphylaxis + Asthma Integrated Protocol',
            category: 'immediate',
            indication: 'Overlapping anaphylaxis and asthma',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'high',
            benefitIfRight: 'high',
            timeWindow: 'seconds',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IM/Nebulized',
            },
            monitoring: [
              '1. Epinephrine 0.01 mg/kg IM (max 0.5mg) - IMMEDIATE',
              '2. Albuterol nebulizer 2.5-5mg continuous',
              '3. Ipratropium nebulizer 0.5mg',
              '4. Methylprednisolone 1-2 mg/kg IV or prednisone 1-2 mg/kg PO',
              '5. H1 blocker: Diphenhydramine 1 mg/kg IV',
              '6. Repeat epinephrine q5-15min if no improvement',
            ],
          });
          prioritySequence.push('Epinephrine (anaphylaxis)', 'Bronchodilators (asthma)', 'Steroids (both)', 'Antihistamines');
          break;

        case 'maternal_arrest_pph_protocol':
          immediateInterventions.push({
            id: 'maternal_arrest_pph_integrated',
            name: 'Maternal Cardiac Arrest + PPH Integrated Protocol',
            category: 'immediate',
            indication: 'Maternal cardiac arrest with postpartum hemorrhage',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'fatal',
            benefitIfRight: 'life-saving',
            timeWindow: 'seconds',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IV/IM',
            },
            monitoring: [
              '1. CPR with left uterine displacement (tilt table or manual)',
              '2. Activate massive transfusion protocol',
              '3. Tranexamic acid 1g IV over 10 min',
              '4. Uterotonic drugs (oxytocin, misoprostol, carboprost)',
              '5. Perimortem cesarean if >20 weeks + no ROSC in 4 minutes',
              '6. Treat reversible causes (5 Hs, 5 Ts + obstetric causes)',
            ],
          });
          prioritySequence.push('CPR + left uterine displacement', 'Massive transfusion', 'Uterotonics', 'Perimortem cesarean (if indicated)');
          break;

        case 'heart_failure_pneumonia_protocol':
          immediateInterventions.push({
            id: 'heart_failure_pneumonia_integrated',
            name: 'Heart Failure + Pneumonia Integrated Protocol',
            category: 'immediate',
            indication: 'Heart failure with pneumonia',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'high',
            benefitIfRight: 'high',
            timeWindow: 'minutes',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IV',
            },
            monitoring: [
              '1. Oxygen to maintain SpO2 >92%',
              '2. Antibiotics (ceftriaxone + azithromycin)',
              '3. Furosemide 0.5-1 mg/kg IV (heart failure)',
              '4. CAUTIOUS fluid boluses 5-10 mL/kg (if shock)',
              '5. Monitor for crackles, JVD, hepatomegaly after each bolus',
              '6. Early vasopressor support if fluid intolerant',
            ],
          });
          systemInteractionWarnings.push('⚠️ CRITICAL: Fluids for sepsis may worsen heart failure. Use small boluses (5-10 mL/kg) and reassess frequently.');
          conflictResolutions.push('Fluids vs diuretics: Use small boluses, monitor closely, early vasopressors if fluid intolerant');
          break;

        case 'meningitis_septic_shock_protocol':
          immediateInterventions.push({
            id: 'meningitis_septic_shock_integrated',
            name: 'Meningitis + Septic Shock Integrated Protocol',
            category: 'immediate',
            indication: 'Meningitis with septic shock',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'critical',
            benefitIfRight: 'life_saving',
            timeWindow: 'minutes',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IV',
            },
            monitoring: [
              '1. Dexamethasone 0.15 mg/kg IV (before or with first antibiotic)',
              '2. Ceftriaxone 100 mg/kg IV (max 4g) + vancomycin 15 mg/kg IV',
              '3. Normal saline 20 mL/kg bolus (shock resuscitation)',
              '4. Repeat boluses until shock resolves',
              '5. Vasopressors if fluid-refractory shock',
              '6. Lumbar puncture AFTER stabilization (if safe)',
            ],
          });
          prioritySequence.push('ABC stabilization', 'Steroids + antibiotics', 'Fluids (shock)', 'Vasopressors (if needed)', 'LP (after stabilization)');
          break;

        case 'triple_threat_protocol':
          immediateInterventions.push({
            id: 'triple_threat_integrated',
            name: 'DKA + Sepsis + Shock (Triple Threat) Protocol',
            category: 'immediate',
            indication: 'DKA with sepsis and shock',
            contraindications: [],
            requiredTests: [],
            riskIfWrong: 'critical',
            benefitIfRight: 'life_saving',
            timeWindow: 'minutes',
            dosing: {
              calculation: 'See protocol steps',
              route: 'IV',
            },
            monitoring: [
              '1. AGGRESSIVE fluid resuscitation: 20 mL/kg boluses until shock resolves',
              '2. Blood cultures + broad-spectrum antibiotics within 1 hour',
              '3. Insulin 0.1 units/kg/hr AFTER initial fluid resuscitation',
              '4. Correct electrolytes (K, Mg, Phos)',
              '5. Monitor glucose, lactate, blood gas hourly',
              '6. IMMEDIATE ICU admission - high mortality',
            ],
          });
          systemInteractionWarnings.push('⚠️ CRITICAL: Triple threat (DKA + sepsis + shock) has very high mortality. Aggressive resuscitation + ICU admission mandatory.');
          prioritySequence.push('ABC stabilization', 'Aggressive fluids (shock)', 'Antibiotics (sepsis)', 'Insulin (DKA)', 'ICU transfer');
          break;
      }
    }
  }

  // Add general multi-system warnings
  if (overlapping.length >= 2) {
    systemInteractionWarnings.push(
      `Multiple life-threatening conditions detected (${overlapping.length}). Treat all simultaneously with integrated protocol.`
    );
  }

  return {
    immediateInterventions,
    systemInteractionWarnings,
    prioritySequence,
    conflictResolutions,
  };
}

/**
 * Priority sequencing: ABC threats always come first
 */
export function prioritizeInterventions(
  interventions: Intervention[],
  surveyData: PrimarySurveyData
): Intervention[] {
  const priorityOrder = {
    // ABC threats (immediate life-threatening)
    foreign_body: 1,
    tension_pneumothorax: 2,
    cardiac_tamponade: 3,
    maternal_cardiac_arrest: 4,
    cardiac_arrest: 5,
    anaphylaxis: 6,
    
    // Shock (cardiovascular collapse)
    hypovolemic_shock: 10,
    septic_shock: 11,
    cardiogenic_shock: 12,
    obstructive_shock: 13,
    
    // Respiratory failure
    status_asthmaticus: 20,
    epiglottitis: 21,
    croup: 22,
    
    // Neurological emergencies
    status_epilepticus: 30,
    stroke: 31,
    eclampsia: 32,
    
    // Metabolic emergencies
    dka: 40,
    hyperkalemia: 41,
    hypoglycemia: 42,
    
    // Infections
    meningitis: 50,
    sepsis: 51,
    
    // Default
    default: 100,
  };

  return interventions.sort((a, b) => {
    const priorityA = priorityOrder[a.id as keyof typeof priorityOrder] || priorityOrder.default;
    const priorityB = priorityOrder[b.id as keyof typeof priorityOrder] || priorityOrder.default;
    return priorityA - priorityB;
  });
}
