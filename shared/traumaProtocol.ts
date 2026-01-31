/**
 * Pediatric Trauma Protocol
 * 
 * ATLS-based primary and secondary survey for pediatric trauma.
 * Includes C-spine immobilization, hemorrhage control, and burn resuscitation.
 */

export type TraumaCategory = 'blunt' | 'penetrating' | 'burn' | 'drowning' | 'crush';
export type HemorrhageClass = 'I' | 'II' | 'III' | 'IV';
export type BurnDepth = 'superficial' | 'partial_thickness' | 'full_thickness';

export interface TraumaAssessment {
  mechanism: TraumaCategory;
  gcsScore: number;
  hemorrhageClass: HemorrhageClass;
  cSpineStatus: 'cleared' | 'immobilized' | 'suspected_injury';
  airwayStatus: 'patent' | 'compromised' | 'obstructed';
  breathingStatus: 'adequate' | 'labored' | 'absent';
  circulationStatus: 'stable' | 'compensated_shock' | 'decompensated_shock';
}

/**
 * Primary Survey - ABCDE with C-spine
 */
export interface PrimarySurveyStep {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  assessments: string[];
  criticalFindings: string[];
  immediateInterventions: string[];
  cSpineConsideration?: string;
}

export const TRAUMA_PRIMARY_SURVEY: PrimarySurveyStep[] = [
  {
    id: 'TRAUMA-A',
    letter: 'A',
    title: 'Airway with C-spine Protection',
    assessments: [
      'Is the child speaking/crying? (patent airway)',
      'Any stridor, gurgling, or snoring?',
      'Visible foreign body or blood in mouth?',
      'Facial or neck trauma present?',
      'Mechanism suggests C-spine injury?',
    ],
    criticalFindings: [
      'Complete airway obstruction',
      'Severe facial trauma',
      'Expanding neck hematoma',
      'Stridor with respiratory distress',
    ],
    immediateInterventions: [
      'Jaw thrust (NOT head tilt in trauma)',
      'Suction blood/secretions',
      'Remove visible foreign body',
      'Oropharyngeal airway if unconscious',
      'Prepare for intubation with in-line stabilization',
    ],
    cSpineConsideration: 'Maintain manual in-line stabilization. Apply rigid collar when available. Assume C-spine injury until cleared.',
  },
  {
    id: 'TRAUMA-B',
    letter: 'B',
    title: 'Breathing and Ventilation',
    assessments: [
      'Respiratory rate and effort?',
      'Chest wall movement symmetrical?',
      'Breath sounds equal bilaterally?',
      'Trachea midline?',
      'Oxygen saturation?',
      'Signs of tension pneumothorax?',
    ],
    criticalFindings: [
      'Tension pneumothorax (deviated trachea, absent breath sounds, JVD)',
      'Open pneumothorax (sucking chest wound)',
      'Massive hemothorax',
      'Flail chest',
    ],
    immediateInterventions: [
      'High-flow oxygen (15L via non-rebreather)',
      'Needle decompression for tension pneumothorax',
      'Occlusive dressing (3-sided) for open pneumothorax',
      'Chest tube for hemothorax',
      'BVM ventilation if inadequate breathing',
    ],
  },
  {
    id: 'TRAUMA-C',
    letter: 'C',
    title: 'Circulation with Hemorrhage Control',
    assessments: [
      'Heart rate and rhythm?',
      'Blood pressure (if obtainable)?',
      'Capillary refill time?',
      'Skin color and temperature?',
      'Active external bleeding?',
      'Signs of internal bleeding (distended abdomen, pelvic instability)?',
    ],
    criticalFindings: [
      'Uncontrolled external hemorrhage',
      'Signs of Class III/IV hemorrhagic shock',
      'Pelvic instability',
      'Distended abdomen',
    ],
    immediateInterventions: [
      'Direct pressure on bleeding wounds',
      'Tourniquet for life-threatening limb hemorrhage',
      'Pelvic binder for suspected pelvic fracture',
      'IV access x2 (large bore)',
      'Warm crystalloid bolus 20 mL/kg',
      'Tranexamic acid (TXA) if significant hemorrhage',
      'Activate massive transfusion protocol if needed',
    ],
  },
  {
    id: 'TRAUMA-D',
    letter: 'D',
    title: 'Disability (Neurological)',
    assessments: [
      'Glasgow Coma Scale (GCS)?',
      'Pupil size and reactivity?',
      'Limb movement (all 4)?',
      'Signs of increased ICP?',
      'Blood glucose level?',
    ],
    criticalFindings: [
      'GCS ≤ 8 (coma)',
      'Unequal pupils or fixed dilated pupils',
      'Cushing triad (hypertension, bradycardia, irregular breathing)',
      'Focal neurological deficit',
    ],
    immediateInterventions: [
      'Protect airway if GCS ≤ 8',
      'Elevate head of bed 30° (if no spinal injury)',
      'Avoid hypotension and hypoxia',
      'Treat hypoglycemia if present',
      'Consider mannitol/hypertonic saline for herniation',
      'Urgent neurosurgical consultation',
    ],
  },
  {
    id: 'TRAUMA-E',
    letter: 'E',
    title: 'Exposure and Environment',
    assessments: [
      'Fully expose patient (log roll with C-spine precautions)',
      'Check entire body for injuries',
      'Core temperature?',
      'Signs of abuse or non-accidental trauma?',
    ],
    criticalFindings: [
      'Hypothermia (< 36°C)',
      'Previously unidentified injuries',
      'Signs of non-accidental trauma',
    ],
    immediateInterventions: [
      'Warm blankets and warm IV fluids',
      'Bair hugger if available',
      'Warm environment',
      'Document all injuries',
      'Consider child protection if NAT suspected',
    ],
  },
];

/**
 * Hemorrhage Classification (Pediatric)
 */
export interface HemorrhageClassification {
  class: HemorrhageClass;
  bloodLossPercent: string;
  heartRate: string;
  bloodPressure: string;
  capRefill: string;
  mentalStatus: string;
  urineOutput: string;
  fluidReplacement: string;
}

export const HEMORRHAGE_CLASSES: HemorrhageClassification[] = [
  {
    class: 'I',
    bloodLossPercent: '< 15%',
    heartRate: 'Normal or mildly elevated',
    bloodPressure: 'Normal',
    capRefill: '< 2 seconds',
    mentalStatus: 'Normal, anxious',
    urineOutput: '> 1 mL/kg/hr',
    fluidReplacement: 'Crystalloid if symptomatic',
  },
  {
    class: 'II',
    bloodLossPercent: '15-30%',
    heartRate: 'Tachycardia',
    bloodPressure: 'Normal (narrowed pulse pressure)',
    capRefill: '2-3 seconds',
    mentalStatus: 'Irritable, confused',
    urineOutput: '0.5-1 mL/kg/hr',
    fluidReplacement: 'Crystalloid 20 mL/kg, consider blood',
  },
  {
    class: 'III',
    bloodLossPercent: '30-40%',
    heartRate: 'Marked tachycardia',
    bloodPressure: 'Hypotension',
    capRefill: '> 3 seconds',
    mentalStatus: 'Confused, lethargic',
    urineOutput: '< 0.5 mL/kg/hr',
    fluidReplacement: 'Crystalloid + blood products',
  },
  {
    class: 'IV',
    bloodLossPercent: '> 40%',
    heartRate: 'Severe tachycardia or bradycardia',
    bloodPressure: 'Severe hypotension',
    capRefill: 'Absent',
    mentalStatus: 'Unresponsive',
    urineOutput: 'Minimal/absent',
    fluidReplacement: 'Massive transfusion protocol',
  },
];

/**
 * Classify hemorrhage based on vital signs
 */
export function classifyHemorrhage(
  heartRatePercent: number, // % above normal for age
  systolicBP: number,
  capRefill: number,
  mentalStatus: 'normal' | 'anxious' | 'confused' | 'lethargic' | 'unresponsive',
  ageYears: number
): HemorrhageClassification {
  // Get normal SBP for age (70 + 2*age for children > 1 year)
  const normalSBP = ageYears < 1 ? 70 : 70 + (2 * ageYears);
  const sbpPercent = (systolicBP / normalSBP) * 100;

  // Class IV: Severe shock
  if (mentalStatus === 'unresponsive' || sbpPercent < 60 || capRefill > 5) {
    return HEMORRHAGE_CLASSES[3];
  }

  // Class III: Decompensated shock
  if (mentalStatus === 'lethargic' || sbpPercent < 80 || capRefill > 3) {
    return HEMORRHAGE_CLASSES[2];
  }

  // Class II: Compensated shock
  if (mentalStatus === 'confused' || heartRatePercent > 30 || capRefill > 2) {
    return HEMORRHAGE_CLASSES[1];
  }

  // Class I: Minimal blood loss
  return HEMORRHAGE_CLASSES[0];
}

/**
 * Hemorrhage Control Interventions
 */
export interface HemorrhageIntervention {
  id: string;
  name: string;
  indication: string;
  technique: string[];
  warnings: string[];
  reassessment: string;
}

export const HEMORRHAGE_INTERVENTIONS: HemorrhageIntervention[] = [
  {
    id: 'DIRECT-PRESSURE',
    name: 'Direct Pressure',
    indication: 'First-line for all external bleeding',
    technique: [
      'Apply firm, direct pressure with sterile gauze',
      'Maintain continuous pressure for at least 3 minutes',
      'Do NOT remove gauze to check - add more on top',
      'Elevate bleeding extremity above heart level',
    ],
    warnings: [
      'Do not use on neck wounds (risk of airway compromise)',
      'Ineffective for arterial bleeding from major vessels',
    ],
    reassessment: 'Check after 3 minutes of continuous pressure',
  },
  {
    id: 'WOUND-PACKING',
    name: 'Wound Packing',
    indication: 'Deep wounds not controlled by direct pressure',
    technique: [
      'Pack wound tightly with hemostatic gauze if available',
      'If no hemostatic gauze, use plain gauze packed tightly',
      'Fill entire wound cavity',
      'Apply direct pressure over packing',
      'Secure with pressure dressing',
    ],
    warnings: [
      'Do NOT pack chest or abdominal wounds',
      'Ensure packing reaches deepest part of wound',
    ],
    reassessment: 'Check for bleeding through dressing',
  },
  {
    id: 'TOURNIQUET',
    name: 'Tourniquet',
    indication: 'Life-threatening limb hemorrhage not controlled by direct pressure',
    technique: [
      'Apply 2-3 inches above wound (NOT over joint)',
      'Tighten until bleeding stops',
      'Note time of application',
      'Do NOT cover tourniquet - must be visible',
      'Do NOT loosen once applied',
    ],
    warnings: [
      'Limb ischemia if prolonged (> 2 hours)',
      'May need second tourniquet if bleeding continues',
      'Painful - provide analgesia when possible',
    ],
    reassessment: 'Check distal pulses and bleeding control',
  },
  {
    id: 'PELVIC-BINDER',
    name: 'Pelvic Binder',
    indication: 'Suspected pelvic fracture with hemodynamic instability',
    technique: [
      'Place at level of greater trochanters',
      'Tighten to reduce pelvic volume',
      'Commercial binder preferred, sheet can be used',
      'Do NOT remove once applied',
    ],
    warnings: [
      'Do NOT apply if open pelvic fracture',
      'Avoid repeated pelvic examination',
    ],
    reassessment: 'Monitor hemodynamics and urine output',
  },
];

/**
 * Tranexamic Acid (TXA) Protocol
 */
export interface TXAProtocol {
  indication: string;
  contraindications: string[];
  dosing: {
    loadingDose: string;
    maintenanceDose: string;
    maxDose: string;
  };
  timing: string;
  warnings: string[];
}

export const TXA_PROTOCOL: TXAProtocol = {
  indication: 'Significant hemorrhage within 3 hours of injury',
  contraindications: [
    'More than 3 hours since injury',
    'Active thromboembolic disease',
    'History of seizures',
    'Hypersensitivity to TXA',
  ],
  dosing: {
    loadingDose: '15-20 mg/kg IV over 10 minutes (max 1g)',
    maintenanceDose: '2 mg/kg/hr infusion for 8 hours (or until bleeding controlled)',
    maxDose: '2g total in first 24 hours',
  },
  timing: 'Most effective if given within 1 hour of injury. Do NOT give if > 3 hours.',
  warnings: [
    'Give slowly to avoid hypotension',
    'Monitor for seizures',
    'Reduce dose in renal impairment',
  ],
};

/**
 * Calculate TXA dose
 */
export function calculateTXADose(weightKg: number): {
  loadingDose: { mg: number; mL: number };
  maintenanceRate: { mgPerHour: number; mLPerHour: number };
} {
  // TXA concentration: 100 mg/mL
  const loadingMg = Math.min(weightKg * 15, 1000); // 15 mg/kg, max 1g
  const loadingML = loadingMg / 100;

  const maintenanceMgPerHour = weightKg * 2; // 2 mg/kg/hr
  const maintenanceMLPerHour = maintenanceMgPerHour / 100;

  return {
    loadingDose: { mg: loadingMg, mL: loadingML },
    maintenanceRate: { mgPerHour: maintenanceMgPerHour, mLPerHour: maintenanceMLPerHour },
  };
}

/**
 * Burn Assessment
 */
export interface BurnAssessment {
  tbsaPercent: number;
  depth: BurnDepth;
  location: string[];
  inhalationInjury: boolean;
  circumferential: boolean;
}

/**
 * Pediatric Rule of Nines (modified for children)
 */
export const PEDIATRIC_BSA: Record<string, { infant: number; child: number; adolescent: number }> = {
  head: { infant: 18, child: 14, adolescent: 9 },
  neck: { infant: 2, child: 2, adolescent: 2 },
  anterior_trunk: { infant: 18, child: 18, adolescent: 18 },
  posterior_trunk: { infant: 18, child: 18, adolescent: 18 },
  arm_each: { infant: 9, child: 9, adolescent: 9 },
  leg_each: { infant: 14, child: 16, adolescent: 18 },
  genitalia: { infant: 1, child: 1, adolescent: 1 },
};

/**
 * Calculate TBSA using Lund-Browder or Rule of Nines
 */
export function calculateTBSA(
  ageYears: number,
  burnedAreas: { area: string; percentage: number }[]
): number {
  let totalTBSA = 0;

  for (const burn of burnedAreas) {
    totalTBSA += burn.percentage;
  }

  return Math.min(totalTBSA, 100);
}

/**
 * Parkland Formula for Burn Resuscitation
 * 
 * Total fluid in first 24 hours = 4 mL × weight (kg) × TBSA (%)
 * - Give half in first 8 hours from time of burn
 * - Give remaining half over next 16 hours
 */
export interface ParklandCalculation {
  totalFluid24hr: number; // mL
  firstHalfRate: number; // mL/hr (for first 8 hours)
  secondHalfRate: number; // mL/hr (for next 16 hours)
  fluidType: string;
  monitoringTargets: string[];
}

export function calculateParklandFormula(
  weightKg: number,
  tbsaPercent: number,
  hoursSinceBurn: number = 0
): ParklandCalculation {
  // Parkland: 4 mL × kg × %TBSA
  const totalFluid = 4 * weightKg * tbsaPercent;

  // First half in first 8 hours
  const firstHalf = totalFluid / 2;
  const remainingFirstPeriod = Math.max(8 - hoursSinceBurn, 0);
  const firstHalfRate = remainingFirstPeriod > 0 ? firstHalf / remainingFirstPeriod : 0;

  // Second half over next 16 hours
  const secondHalf = totalFluid / 2;
  const secondHalfRate = secondHalf / 16;

  return {
    totalFluid24hr: totalFluid,
    firstHalfRate: Math.round(firstHalfRate),
    secondHalfRate: Math.round(secondHalfRate),
    fluidType: 'Lactated Ringer\'s (preferred) or Normal Saline',
    monitoringTargets: [
      'Urine output: 1-2 mL/kg/hr (children), 0.5-1 mL/kg/hr (adolescents)',
      'Heart rate trending toward normal',
      'Capillary refill < 2 seconds',
      'Mental status improving',
      'Avoid fluid overload - adjust rate based on urine output',
    ],
  };
}

/**
 * Burn Resuscitation Thresholds
 */
export function needsBurnResuscitation(tbsaPercent: number, ageYears: number): boolean {
  // Children < 10 years: resuscitate if TBSA > 10%
  // Children ≥ 10 years: resuscitate if TBSA > 15%
  if (ageYears < 10) {
    return tbsaPercent > 10;
  }
  return tbsaPercent > 15;
}

/**
 * Burn Transfer Criteria
 */
export const BURN_TRANSFER_CRITERIA: string[] = [
  'Partial thickness burns > 10% TBSA',
  'Burns involving face, hands, feet, genitalia, perineum, major joints',
  'Full thickness burns of any size',
  'Electrical burns (including lightning)',
  'Chemical burns',
  'Inhalation injury',
  'Circumferential burns',
  'Burns with associated trauma',
  'Burns in children with pre-existing conditions',
  'Suspected child abuse',
];

/**
 * Check if burn meets transfer criteria
 */
export function meetsBurnTransferCriteria(
  tbsaPercent: number,
  depth: BurnDepth,
  locations: string[],
  inhalationInjury: boolean,
  circumferential: boolean,
  mechanism: 'thermal' | 'electrical' | 'chemical'
): { shouldTransfer: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (depth === 'partial_thickness' && tbsaPercent > 10) {
    reasons.push('Partial thickness burns > 10% TBSA');
  }

  if (depth === 'full_thickness') {
    reasons.push('Full thickness burns present');
  }

  const criticalLocations = ['face', 'hands', 'feet', 'genitalia', 'perineum', 'joints'];
  const affectedCritical = locations.filter((loc) =>
    criticalLocations.some((crit) => loc.toLowerCase().includes(crit))
  );
  if (affectedCritical.length > 0) {
    reasons.push(`Burns involving critical areas: ${affectedCritical.join(', ')}`);
  }

  if (inhalationInjury) {
    reasons.push('Inhalation injury present');
  }

  if (circumferential) {
    reasons.push('Circumferential burns present');
  }

  if (mechanism === 'electrical') {
    reasons.push('Electrical burn mechanism');
  }

  if (mechanism === 'chemical') {
    reasons.push('Chemical burn mechanism');
  }

  return {
    shouldTransfer: reasons.length > 0,
    reasons,
  };
}

/**
 * Trauma Drug Dosing
 */
export interface TraumaDrug {
  id: string;
  name: string;
  indication: string;
  dose: string;
  route: string;
  maxDose: string;
  notes: string[];
}

export const TRAUMA_DRUGS: TraumaDrug[] = [
  {
    id: 'TXA',
    name: 'Tranexamic Acid (TXA)',
    indication: 'Significant hemorrhage within 3 hours',
    dose: '15-20 mg/kg loading, then 2 mg/kg/hr',
    route: 'IV over 10 minutes',
    maxDose: '1g loading, 2g total',
    notes: ['Give within 3 hours of injury', 'Most effective within 1 hour'],
  },
  {
    id: 'MORPHINE',
    name: 'Morphine',
    indication: 'Severe pain in hemodynamically stable patient',
    dose: '0.1 mg/kg',
    route: 'IV slowly',
    maxDose: '10 mg',
    notes: ['Avoid in head injury', 'Have naloxone available', 'Monitor respiratory status'],
  },
  {
    id: 'FENTANYL',
    name: 'Fentanyl',
    indication: 'Severe pain, preferred in trauma',
    dose: '1-2 mcg/kg',
    route: 'IV or intranasal',
    maxDose: '100 mcg',
    notes: ['Less hypotension than morphine', 'Short duration - may need repeat'],
  },
  {
    id: 'KETAMINE',
    name: 'Ketamine',
    indication: 'Procedural sedation, analgesia in trauma',
    dose: '1-2 mg/kg IV or 4-5 mg/kg IM',
    route: 'IV or IM',
    maxDose: '100 mg IV, 500 mg IM',
    notes: ['Maintains airway reflexes', 'May increase ICP - use with caution in head injury'],
  },
  {
    id: 'MANNITOL',
    name: 'Mannitol 20%',
    indication: 'Signs of cerebral herniation',
    dose: '0.5-1 g/kg',
    route: 'IV over 15-20 minutes',
    maxDose: '1 g/kg',
    notes: ['Use only for herniation signs', 'Ensure adequate volume status first'],
  },
  {
    id: 'HYPERTONIC-SALINE',
    name: 'Hypertonic Saline 3%',
    indication: 'Cerebral edema, herniation',
    dose: '2-5 mL/kg',
    route: 'IV over 10-20 minutes',
    maxDose: '250 mL',
    notes: ['Alternative to mannitol', 'Monitor sodium levels'],
  },
];

/**
 * Calculate trauma drug dose
 */
export function calculateTraumaDrugDose(
  drugId: string,
  weightKg: number
): { dose: number; unit: string; maxDose: number; route: string } | null {
  const drug = TRAUMA_DRUGS.find((d) => d.id === drugId);
  if (!drug) return null;

  switch (drugId) {
    case 'TXA':
      return {
        dose: Math.min(weightKg * 15, 1000),
        unit: 'mg',
        maxDose: 1000,
        route: 'IV over 10 minutes',
      };
    case 'MORPHINE':
      return {
        dose: Math.min(weightKg * 0.1, 10),
        unit: 'mg',
        maxDose: 10,
        route: 'IV slowly',
      };
    case 'FENTANYL':
      return {
        dose: Math.min(weightKg * 1, 100),
        unit: 'mcg',
        maxDose: 100,
        route: 'IV or intranasal',
      };
    case 'KETAMINE':
      return {
        dose: Math.min(weightKg * 1.5, 100),
        unit: 'mg',
        maxDose: 100,
        route: 'IV',
      };
    case 'MANNITOL':
      return {
        dose: weightKg * 0.5,
        unit: 'g',
        maxDose: weightKg * 1,
        route: 'IV over 15-20 minutes',
      };
    case 'HYPERTONIC-SALINE':
      return {
        dose: Math.min(weightKg * 3, 250),
        unit: 'mL',
        maxDose: 250,
        route: 'IV over 10-20 minutes',
      };
    default:
      return null;
  }
}

/**
 * Glasgow Coma Scale (Pediatric)
 */
export interface GCSComponent {
  category: 'eye' | 'verbal' | 'motor';
  score: number;
  response: string;
  pediatricModification?: string;
}

export const PEDIATRIC_GCS: GCSComponent[] = [
  // Eye Opening
  { category: 'eye', score: 4, response: 'Spontaneous' },
  { category: 'eye', score: 3, response: 'To voice' },
  { category: 'eye', score: 2, response: 'To pain' },
  { category: 'eye', score: 1, response: 'None' },
  // Verbal (Pediatric)
  { category: 'verbal', score: 5, response: 'Oriented/coos, babbles', pediatricModification: 'Age-appropriate words or social smile' },
  { category: 'verbal', score: 4, response: 'Confused/irritable cry', pediatricModification: 'Cries but consolable' },
  { category: 'verbal', score: 3, response: 'Inappropriate words/cries to pain', pediatricModification: 'Inconsistently consolable, moaning' },
  { category: 'verbal', score: 2, response: 'Incomprehensible/agitated', pediatricModification: 'Inconsolable, agitated' },
  { category: 'verbal', score: 1, response: 'None' },
  // Motor
  { category: 'motor', score: 6, response: 'Obeys commands/normal movement' },
  { category: 'motor', score: 5, response: 'Localizes pain' },
  { category: 'motor', score: 4, response: 'Withdraws from pain' },
  { category: 'motor', score: 3, response: 'Flexion to pain (decorticate)' },
  { category: 'motor', score: 2, response: 'Extension to pain (decerebrate)' },
  { category: 'motor', score: 1, response: 'None' },
];

export function calculateGCS(eye: number, verbal: number, motor: number): {
  total: number;
  interpretation: string;
  airwayNeeded: boolean;
} {
  const total = eye + verbal + motor;

  let interpretation: string;
  let airwayNeeded = false;

  if (total <= 8) {
    interpretation = 'Severe brain injury - intubation required';
    airwayNeeded = true;
  } else if (total <= 12) {
    interpretation = 'Moderate brain injury';
  } else {
    interpretation = 'Mild brain injury';
  }

  return { total, interpretation, airwayNeeded };
}
