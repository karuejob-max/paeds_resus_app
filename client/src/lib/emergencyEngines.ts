/**
 * Modular Emergency Engines
 * Independent clinical decision engines for life-threatening pediatric emergencies
 * Each engine auto-triggers based on assessment findings and provides structured management
 */

import { Action } from '@/components/ActionCard';

export interface EmergencyEngine {
  id: string;
  name: string;
  description: string;
  triggerCriteria: (assessment: any) => boolean;
  severity: 'critical' | 'urgent';
  actions: Action[];
  monitoring: string[];
  contraindications?: string[];
}

export interface AssessmentFindings {
  // Airway
  airwayPatency?: 'patent' | 'at-risk' | 'obstructed';
  stridor?: boolean;
  drooling?: boolean;

  // Breathing
  respiratoryRate?: number;
  spO2?: number;
  workOfBreathing?: 'normal' | 'increased' | 'severe';
  breathSounds?: 'clear' | 'decreased' | 'absent';
  grunting?: boolean;
  nasal_flare?: boolean;
  retractions?: boolean;

  // Circulation
  heartRate?: number;
  systolicBP?: number;
  capillaryRefill?: number;
  temperatureGradient?: number;
  skinColor?: 'pink' | 'pale' | 'mottled' | 'cyanotic';
  pulseQuality?: 'strong' | 'weak' | 'thready' | 'absent';
  urinOutput?: number;
  lactate?: number;

  // Disability
  avpu?: 'alert' | 'verbal' | 'pain' | 'unresponsive';
  glucose?: number;
  seizures?: boolean;
  pupilSize?: 'normal' | 'dilated' | 'constricted';
  pupilReactivity?: 'reactive' | 'sluggish' | 'fixed';

  // Exposure
  temperature?: number;
  rash?: boolean;
  rashType?: 'petechial' | 'purpuric' | 'maculopapular' | 'other';
  signs_of_abuse?: boolean;

  // Additional findings
  fever?: boolean;
  hypothermia?: boolean;
  hypoglycemia?: boolean;
  hyperglycemia?: boolean;
  metabolicAcidosis?: boolean;
  hypoxemia?: boolean;
  hypotension?: boolean;
  tachycardia?: boolean;
  bradycardia?: boolean;
}

/**
 * SEPTIC SHOCK ENGINE
 * Recognition: Fever/hypothermia + signs of infection + 2+ SIRS criteria + perfusion abnormality
 * Management: Antibiotics, fluids, vasopressors
 */
export const createSepticShockEngine = (weight: number, age: { years: number; months: number }): EmergencyEngine => {
  const ageYears = age.years + age.months / 12;

  return {
    id: 'septic-shock',
    name: 'Septic Shock Engine',
    description: 'Recognition and management of septic shock in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const hasFever = assessment.fever || (assessment.temperature && assessment.temperature > 38.5);
      const hasHypothermia = assessment.hypothermia || (assessment.temperature && assessment.temperature < 36);
      const hasInfectionSource = hasFever || hasHypothermia;

      const sirsCount = [
        !!(assessment.respiratoryRate && (
          (ageYears < 1 && assessment.respiratoryRate > 40) ||
          (ageYears < 5 && assessment.respiratoryRate > 35) ||
          (ageYears >= 5 && assessment.respiratoryRate > 30)
        )),
        !!(assessment.heartRate && (
          (ageYears < 1 && assessment.heartRate > 160) ||
          (ageYears < 5 && assessment.heartRate > 150) ||
          (ageYears >= 5 && assessment.heartRate > 110)
        )),
        !!(assessment.temperature && (assessment.temperature > 38.5 || assessment.temperature < 36)),
        !!(assessment.workOfBreathing === 'increased' || assessment.workOfBreathing === 'severe'),
      ].filter(Boolean).length;

      const hasPerfusionAbnormality =
        !!(assessment.capillaryRefill && assessment.capillaryRefill > 2) ||
        assessment.skinColor === 'mottled' ||
        assessment.skinColor === 'pale' ||
        !!(assessment.lactate && assessment.lactate > 2) ||
        !!(assessment.systolicBP && assessment.systolicBP < 90 + 2 * ageYears);

      return !!(hasInfectionSource && sirsCount >= 2 && hasPerfusionAbnormality);
    },
    severity: 'critical',
    actions: [
      {
        id: 'sepsis-1-recognize',
        sequence: 1,
        title: 'Recognize Septic Shock',
        description: 'Confirm presence of infection source, fever/hypothermia, SIRS criteria, and perfusion abnormality',
        rationale: 'Early recognition of septic shock is critical for survival. Every hour delay in treatment increases mortality.',
        expectedOutcome: 'Septic shock confirmed, team alerted, management initiated',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Immediate',
        monitoring: ['Temperature', 'Heart rate', 'Respiratory rate', 'Perfusion signs', 'Lactate'],
      },
      {
        id: 'sepsis-2-cultures',
        sequence: 2,
        title: 'Obtain Blood Cultures',
        description: 'Draw blood cultures BEFORE antibiotics (if possible without delaying treatment)',
        rationale: 'Cultures guide antibiotic de-escalation and identify resistant organisms',
        expectedOutcome: 'Blood cultures obtained for organism identification',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: '5 minutes',
        monitoring: ['Culture results (48-72 hours)'],
      },
      {
        id: 'sepsis-3-fluids',
        sequence: 3,
        title: 'Administer Fluid Bolus',
        description: `Give RL 20 mL/kg IV over 15 minutes. Reassess perfusion after each 10 mL/kg.`,
        rationale: 'Fluid resuscitation is first-line for septic shock. Restores circulating volume and improves perfusion.',
        expectedOutcome: 'Improved perfusion: CRT <2 sec, HR normalizing, BP improving, urine output increasing',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: '15 minutes',
        dosing: {
          weight,
          calculation: '20 mL/kg bolus over 15 min',
          dose: `${weight * 20} mL RL`,
          route: 'IV or IO',
        },
        monitoring: ['Perfusion signs', 'Heart rate', 'Blood pressure', 'Urine output', 'Edema/crackles'],
      },
      {
        id: 'sepsis-4-antibiotics',
        sequence: 4,
        title: 'Administer Broad-Spectrum Antibiotics',
        description: 'Give empiric antibiotics within 1 hour of recognition. Adjust based on culture results.',
        rationale: 'Antibiotics reduce bacterial load and improve survival. Empiric coverage needed before culture results.',
        expectedOutcome: 'Bacterial load reduced, fever response, clinical improvement',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Within 1 hour',
        monitoring: ['Temperature', 'Perfusion signs', 'Culture results', 'Antibiotic levels'],
      },
      {
        id: 'sepsis-5-vasopressors',
        sequence: 5,
        title: 'Consider Vasopressors if Hypotensive After Fluids',
        description: 'If SBP remains <90 + 2×age after 60 mL/kg fluids, start epinephrine 0.05-0.1 mcg/kg/min IV',
        rationale: 'Vasopressors maintain perfusion pressure when fluids alone insufficient',
        expectedOutcome: 'Blood pressure normalized, perfusion maintained',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'After fluid reassessment',
        dosing: {
          weight,
          calculation: 'Epinephrine 0.05-0.1 mcg/kg/min',
          dose: `${(weight * 0.05).toFixed(1)}-${(weight * 0.1).toFixed(1)} mcg/min`,
          route: 'IV infusion',
        },
        prerequisites: ['IV access established', 'Fluids given (60 mL/kg)', 'Still hypotensive'],
        monitoring: ['Blood pressure', 'Perfusion', 'Urine output', 'Lactate clearance'],
      },
    ],
    monitoring: [
      'Temperature (target normothermia)',
      'Heart rate (should decrease with treatment)',
      'Blood pressure (target age-appropriate)',
      'Capillary refill (target <2 sec)',
      'Urine output (target 0.5-1 mL/kg/hr)',
      'Lactate (target <2 mmol/L)',
      'Skin perfusion (target pink, warm)',
      'Mental status (target alert)',
    ],
  };
};

/**
 * RESPIRATORY FAILURE ENGINE
 * Recognition: Inadequate breathing + hypoxemia/hypercarbia
 * Management: Oxygen, airway adjuncts, BVM, intubation
 */
export const createRespiratoryFailureEngine = (weight: number, age: { years: number; months: number }): EmergencyEngine => {
  const ageYears = age.years + age.months / 12;

  return {
    id: 'respiratory-failure',
    name: 'Respiratory Failure Engine',
    description: 'Recognition and management of respiratory failure in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const inadequateBreathing =
        assessment.breathSounds === 'decreased' ||
        assessment.breathSounds === 'absent' ||
        assessment.grunting ||
        assessment.retractions ||
        assessment.nasal_flare;

      const hypoxemia = !!(assessment.spO2 && assessment.spO2 < 90);

      return inadequateBreathing || hypoxemia;
    },
    severity: 'critical',
    actions: [
      {
        id: 'resp-1-oxygen',
        sequence: 1,
        title: 'Apply High-Flow Oxygen',
        description: 'Apply oxygen via non-rebreather mask at 10-15 L/min to achieve SpO2 >94%',
        rationale: 'Hypoxemia is immediately life-threatening. Oxygen is first-line intervention.',
        expectedOutcome: 'SpO2 >94%, improved oxygenation',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: 'Immediate',
        monitoring: ['SpO2 (target >94%)', 'Respiratory effort', 'Color'],
      },
      {
        id: 'resp-2-position',
        sequence: 2,
        title: 'Position for Optimal Breathing',
        description: 'Place in sniffing position (head extension, neck flexion for infants; neutral for older children)',
        rationale: 'Optimal positioning maximizes airway diameter and air exchange',
        expectedOutcome: 'Improved air movement, easier breathing',
        urgency: 'urgent',
        phase: 'breathing',
        timeframe: 'Immediate',
        monitoring: ['Respiratory effort', 'Air movement', 'SpO2'],
      },
      {
        id: 'resp-3-assess',
        sequence: 3,
        title: 'Assess Breathing Adequacy',
        description: 'Check: respiratory rate, work of breathing, air movement, breath sounds, chest rise',
        rationale: 'Determines if breathing is adequate or inadequate, guiding need for ventilation support',
        expectedOutcome: 'Clear assessment of breathing status',
        urgency: 'urgent',
        phase: 'breathing',
        timeframe: '30 seconds',
        monitoring: [
          `Respiratory rate (normal: <1yr 30-40, 1-5yr 25-30, >5yr 20-25)`,
          'Work of breathing',
          'Air movement (bilateral, equal)',
          'Breath sounds',
        ],
      },
      {
        id: 'resp-4-bvm',
        sequence: 4,
        title: 'Provide Bag-Valve-Mask Ventilation',
        description: `Use appropriate mask size with 100% oxygen. Ventilate at 20 breaths/min.`,
        rationale: 'Inadequate breathing requires ventilation support to prevent hypoxemia',
        expectedOutcome: 'Adequate ventilation, SpO2 >94%, improved respiratory status',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: '1-2 minutes',
        dosing: {
          weight,
          calculation: `Tidal volume: 6-8 mL/kg, Rate: 20/min`,
          dose: `${(weight * 6).toFixed(0)}-${(weight * 8).toFixed(0)} mL per breath`,
          route: 'Bag-valve-mask',
        },
        monitoring: ['Chest rise', 'SpO2', 'Breath sounds', 'Gastric distension'],
      },
      {
        id: 'resp-5-intubation',
        sequence: 5,
        title: 'Prepare for Intubation',
        description: 'If BVM ineffective or unable to maintain airway, prepare for endotracheal intubation',
        rationale: 'Intubation secures airway and allows controlled ventilation',
        expectedOutcome: 'Secured airway, controlled ventilation, SpO2 >94%',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: '5-10 minutes',
        dosing: {
          weight,
          calculation: `ETT size = age/4 + 4 mm`,
          dose: `${(ageYears / 4 + 4).toFixed(1)} mm`,
          route: 'Endotracheal',
        },
        prerequisites: ['BVM attempted', 'Still inadequate ventilation', 'Airway patent'],
        monitoring: ['ETT position', 'Breath sounds (bilateral)', 'SpO2', 'Chest rise', 'Tube condensation'],
      },
    ],
    monitoring: [
      'SpO2 (target >94%)',
      'Respiratory rate (age-appropriate)',
      'Work of breathing (should decrease)',
      'Breath sounds (bilateral, equal)',
      'Chest rise (adequate)',
      'Color (target pink)',
      'Mental status (target alert)',
      'Capillary refill (target <2 sec)',
    ],
  };
};

/**
 * STATUS EPILEPTICUS ENGINE
 * Recognition: Continuous seizure >5 minutes or repeated seizures without recovery
 * Management: Benzodiazepines, anticonvulsants, airway management
 */
export const createStatusEpilepticusEngine = (weight: number): EmergencyEngine => {
  return {
    id: 'status-epilepticus',
    name: 'Status Epilepticus Engine',
    description: 'Recognition and management of status epilepticus in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      return assessment.seizures === true;
    },
    severity: 'critical',
    actions: [
      {
        id: 'seizure-1-safety',
        sequence: 1,
        title: 'Ensure Scene Safety',
        description: 'Protect from injury, remove nearby objects, do NOT restrain',
        rationale: 'Prevents secondary injury during seizure activity',
        expectedOutcome: 'Child protected from injury',
        urgency: 'critical',
        phase: 'disability',
        timeframe: 'Immediate',
        monitoring: ['Seizure activity', 'Injuries'],
      },
      {
        id: 'seizure-2-position',
        sequence: 2,
        title: 'Position on Side',
        description: 'Place in recovery position (left lateral decubitus) to prevent aspiration',
        rationale: 'Prevents aspiration of secretions or vomit',
        expectedOutcome: 'Airway protected, aspiration prevented',
        urgency: 'critical',
        phase: 'airway',
        timeframe: 'Immediate',
        monitoring: ['Airway patency', 'Breathing'],
      },
      {
        id: 'seizure-3-oxygen',
        sequence: 3,
        title: 'Apply Oxygen',
        description: 'Apply high-flow oxygen to prevent hypoxemia during seizure',
        rationale: 'Seizures increase metabolic demand and risk of hypoxemia',
        expectedOutcome: 'SpO2 >94%',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: 'Immediate',
        monitoring: ['SpO2', 'Respiratory effort'],
      },
      {
        id: 'seizure-4-benzodiazepine',
        sequence: 4,
        title: 'Administer First-Line Benzodiazepine',
        description: 'Give diazepam 0.1-0.3 mg/kg IV/IO (max 10 mg) or lorazepam 0.05-0.1 mg/kg IV/IO (max 4 mg)',
        rationale: 'Benzodiazepines are first-line for acute seizure termination',
        expectedOutcome: 'Seizure termination within 2-5 minutes',
        urgency: 'critical',
        phase: 'disability',
        timeframe: 'Within 5 minutes of seizure onset',
        dosing: {
          weight,
          calculation: 'Diazepam 0.1-0.3 mg/kg IV or Lorazepam 0.05-0.1 mg/kg IV',
          dose: `Diazepam ${(weight * 0.1).toFixed(1)}-${(weight * 0.3).toFixed(1)} mg or Lorazepam ${(weight * 0.05).toFixed(1)}-${(weight * 0.1).toFixed(1)} mg`,
          route: 'IV or IO',
        },
        prerequisites: ['IV or IO access', 'Airway patent', 'Oxygen applied'],
        monitoring: ['Seizure cessation', 'Respiratory depression', 'Blood pressure'],
      },
      {
        id: 'seizure-5-anticonvulsant',
        sequence: 5,
        title: 'Administer Second-Line Anticonvulsant',
        description: 'If seizure continues after 5 min, give phenytoin 15-20 mg/kg IV or levetiracetam 20-30 mg/kg IV',
        rationale: 'Second-line agents for seizures refractory to benzodiazepines',
        expectedOutcome: 'Seizure termination',
        urgency: 'critical',
        phase: 'disability',
        timeframe: '5-10 minutes after first-line',
        dosing: {
          weight,
          calculation: 'Phenytoin 15-20 mg/kg IV or Levetiracetam 20-30 mg/kg IV',
          dose: `Phenytoin ${(weight * 15).toFixed(0)}-${(weight * 20).toFixed(0)} mg or Levetiracetam ${(weight * 20).toFixed(0)}-${(weight * 30).toFixed(0)} mg`,
          route: 'IV',
        },
        prerequisites: ['Benzodiazepine given', 'Seizure continuing'],
        monitoring: ['Seizure cessation', 'Cardiac rhythm', 'Blood pressure'],
      },
      {
        id: 'seizure-6-intubation',
        sequence: 6,
        title: 'Prepare for Intubation if Refractory',
        description: 'If seizure continues after 20 min, prepare for intubation and ICU care',
        rationale: 'Refractory status epilepticus requires airway protection and sedation',
        expectedOutcome: 'Secured airway, controlled ventilation',
        urgency: 'critical',
        phase: 'airway',
        timeframe: '20 minutes after onset',
        prerequisites: ['Multiple anticonvulsants given', 'Seizure continuing'],
        monitoring: ['Airway', 'Ventilation', 'Seizure activity'],
      },
    ],
    monitoring: [
      'Seizure activity (timing, duration, type)',
      'SpO2 (target >94%)',
      'Heart rate',
      'Blood pressure',
      'Respiratory effort',
      'Pupil size and reactivity',
      'Post-ictal state',
      'Blood glucose (check for hypoglycemia)',
    ],
  };
};

/**
 * DKA ENGINE
 * Recognition: Hyperglycemia + metabolic acidosis + ketosis
 * Management: Fluids, insulin, electrolyte monitoring
 */
export const createDKAEngine = (weight: number): EmergencyEngine => {
  return {
    id: 'dka',
    name: 'DKA Engine',
    description: 'Recognition and management of diabetic ketoacidosis in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const hyperglycemia = !!(assessment.glucose && assessment.glucose > 250);
      const metabolicAcidosis = assessment.metabolicAcidosis === true;
      return hyperglycemia && metabolicAcidosis;
    },
    severity: 'critical',
    actions: [
      {
        id: 'dka-1-recognize',
        sequence: 1,
        title: 'Recognize DKA',
        description: 'Confirm hyperglycemia (>250 mg/dL), metabolic acidosis (pH <7.3, HCO3 <15), and ketosis',
        rationale: 'Early recognition guides aggressive management to prevent cerebral edema',
        expectedOutcome: 'DKA confirmed, severity assessed, management initiated',
        urgency: 'critical',
        phase: 'disability',
        timeframe: 'Immediate',
        monitoring: ['Glucose', 'pH', 'HCO3', 'Ketones', 'Osmolality'],
      },
      {
        id: 'dka-2-fluids',
        sequence: 2,
        title: 'Initiate Fluid Resuscitation',
        description: 'Give RL 10-20 mL/kg IV over 1 hour to restore intravascular volume',
        rationale: 'DKA causes severe dehydration. Fluids restore perfusion and dilute glucose.',
        expectedOutcome: 'Improved perfusion, urine output, glucose dilution',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: '1 hour',
        dosing: {
          weight,
          calculation: '10-20 mL/kg over 1 hour',
          dose: `${weight * 10}-${weight * 20} mL RL`,
          route: 'IV',
        },
        monitoring: ['Urine output', 'Perfusion', 'Glucose', 'Osmolality'],
      },
      {
        id: 'dka-3-insulin',
        sequence: 3,
        title: 'Start Insulin Infusion',
        description: 'After initial fluids, start insulin 0.1 units/kg/hr IV infusion',
        rationale: 'Insulin stops ketone production and lowers glucose gradually (avoid cerebral edema)',
        expectedOutcome: 'Glucose decreases 50-100 mg/dL/hr, acidosis improves',
        urgency: 'critical',
        phase: 'disability',
        timeframe: 'After initial fluid bolus',
        dosing: {
          weight,
          calculation: '0.1 units/kg/hr IV infusion',
          dose: `${(weight * 0.1).toFixed(1)} units/hr`,
          route: 'IV infusion',
        },
        prerequisites: ['IV access', 'Initial fluids given', 'Glucose >250'],
        monitoring: ['Glucose (target 50-100 mg/dL/hr decrease)', 'pH', 'HCO3', 'Potassium'],
      },
      {
        id: 'dka-4-electrolytes',
        sequence: 4,
        title: 'Monitor and Correct Electrolytes',
        description: 'Check K+, Na+, Cl-, HCO3 frequently. Replace K+ if <5.5 mEq/L',
        rationale: 'DKA causes severe electrolyte abnormalities. Hypokalemia can cause cardiac arrhythmias.',
        expectedOutcome: 'Electrolytes normalized, cardiac rhythm stable',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: 'Ongoing during treatment',
        monitoring: ['Potassium (target 4-5 mEq/L)', 'Sodium', 'Chloride', 'HCO3', 'Cardiac rhythm'],
      },
    ],
    monitoring: [
      'Glucose (target 50-100 mg/dL/hr decrease)',
      'pH (target >7.3)',
      'HCO3 (target >15 mEq/L)',
      'Potassium (target 4-5 mEq/L)',
      'Osmolality (target <320 mOsm/kg)',
      'Urine output (target 0.5-1 mL/kg/hr)',
      'Mental status (watch for cerebral edema)',
      'Cardiac rhythm',
    ],
  };
};

/**
 * ANAPHYLAXIS ENGINE
 * Recognition: Acute onset + 2+ systems affected + exposure to allergen
 * Management: Epinephrine, airway, fluids, antihistamines
 */
export const createAnaphylaxisEngine = (weight: number): EmergencyEngine => {
  return {
    id: 'anaphylaxis',
    name: 'Anaphylaxis Engine',
    description: 'Recognition and management of anaphylaxis in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const skinSigns = assessment.rash === true;
      const respiratorySigns = assessment.workOfBreathing === 'increased' || assessment.workOfBreathing === 'severe';
      const cardiovascularSigns =
        assessment.hypotension ||
        !!(assessment.systolicBP && assessment.systolicBP < 90 + 2 * (assessment.temperature || 0));
      const gastrointestinalSigns = false; // Would need additional assessment fields

      const systemsAffected = [skinSigns, respiratorySigns, cardiovascularSigns, gastrointestinalSigns].filter(
        Boolean
      ).length;

      return systemsAffected >= 2;
    },
    severity: 'critical',
    actions: [
      {
        id: 'ana-1-recognize',
        sequence: 1,
        title: 'Recognize Anaphylaxis',
        description: 'Confirm acute onset + 2+ systems: skin (urticaria, flushing), respiratory (stridor, wheeze), cardiovascular (hypotension), GI (vomiting)',
        rationale: 'Early recognition of anaphylaxis is critical for survival',
        expectedOutcome: 'Anaphylaxis confirmed, team alerted',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Immediate',
        monitoring: ['Respiratory status', 'Blood pressure', 'Heart rate', 'Skin signs'],
      },
      {
        id: 'ana-2-epinephrine',
        sequence: 2,
        title: 'Administer Epinephrine IM',
        description: 'Give epinephrine 0.01 mg/kg IM (max 0.5 mg) into anterolateral thigh immediately',
        rationale: 'Epinephrine is the only treatment for anaphylaxis. IM route preferred for rapid absorption.',
        expectedOutcome: 'Symptoms resolve within 5-15 minutes',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Immediate',
        dosing: {
          weight,
          calculation: '0.01 mg/kg IM (1:1000 concentration)',
          dose: `${(weight * 0.01).toFixed(2)} mg IM`,
          route: 'Intramuscular (anterolateral thigh)',
        },
        monitoring: ['Respiratory status', 'Blood pressure', 'Heart rate', 'Skin signs'],
      },
      {
        id: 'ana-3-oxygen',
        sequence: 3,
        title: 'Apply Oxygen and Position',
        description: 'Apply high-flow oxygen, position supine with legs elevated (prevent shock)',
        rationale: 'Supports oxygenation and maintains perfusion',
        expectedOutcome: 'SpO2 >94%, improved perfusion',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: 'Immediate',
        monitoring: ['SpO2', 'Respiratory effort', 'Blood pressure'],
      },
      {
        id: 'ana-4-iv-access',
        sequence: 4,
        title: 'Establish IV Access and Give Fluids',
        description: 'Start IV, give RL 20 mL/kg bolus over 15 minutes',
        rationale: 'Fluids support perfusion and prevent shock',
        expectedOutcome: 'Improved perfusion, blood pressure normalized',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: '15 minutes',
        dosing: {
          weight,
          calculation: '20 mL/kg bolus over 15 min',
          dose: `${weight * 20} mL RL`,
          route: 'IV',
        },
        monitoring: ['Blood pressure', 'Heart rate', 'Perfusion signs'],
      },
      {
        id: 'ana-5-antihistamines',
        sequence: 5,
        title: 'Administer Antihistamines and Steroids',
        description: 'Give diphenhydramine 1 mg/kg IV (max 50 mg) and methylprednisolone 1-2 mg/kg IV',
        rationale: 'Antihistamines and steroids prevent biphasic reactions',
        expectedOutcome: 'Prevention of recurrent symptoms',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: 'After epinephrine and fluids',
        dosing: {
          weight,
          calculation: 'Diphenhydramine 1 mg/kg IV + Methylprednisolone 1-2 mg/kg IV',
          dose: `${weight} mg diphenhydramine + ${weight}-${weight * 2} mg methylprednisolone`,
          route: 'IV',
        },
        monitoring: ['Symptoms', 'Respiratory status'],
      },
    ],
    monitoring: [
      'Respiratory status (stridor, wheeze)',
      'Blood pressure (target age-appropriate)',
      'Heart rate',
      'SpO2 (target >94%)',
      'Skin signs (urticaria, flushing)',
      'GI symptoms (vomiting, diarrhea)',
      'Mental status',
      'Watch for biphasic reaction (can occur 1-72 hours later)',
    ],
  };
};

/**
 * Get all applicable emergency engines for current assessment
 */
export const getApplicableEngines = (
  assessment: AssessmentFindings,
  weight: number,
  age: { years: number; months: number }
): EmergencyEngine[] => {
  const engines = [
    createSepticShockEngine(weight, age),
    createRespiratoryFailureEngine(weight, age),
    createStatusEpilepticusEngine(weight),
    createDKAEngine(weight),
    createAnaphylaxisEngine(weight),
  ];

  return engines.filter((engine) => engine.triggerCriteria(assessment));
};
