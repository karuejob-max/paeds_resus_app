/**
 * Advanced Clinical Protocols with Full Escalation Pathways
 * GPS-like rerouting for pediatric emergencies
 * 
 * Design Philosophy: Think like a tensed provider with a sick child.
 * Don't assume they know it - guide every step.
 * Goal: Send the patient home neurologically fit.
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type ShockType = 'hypovolemic' | 'cardiogenic' | 'septic' | 'anaphylactic' | 'obstructive' | 'undifferentiated';
export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type TherapyLine = 'first' | 'second' | 'third' | 'fourth' | 'fifth';

export interface AssessmentFinding {
  parameter: string;
  value: string | number | boolean;
  interpretation: 'normal' | 'abnormal' | 'critical';
  clinicalSignificance: string;
}

export interface TherapyStep {
  line: TherapyLine;
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  maxDose: string;
  dilution?: string;
  administrationTime?: string;
  monitoring: string[];
  contraindications: string[];
  sideEffects: string[];
  escalationTrigger: string;
  deescalationCriteria?: string;
}

export interface EscalationPathway {
  condition: string;
  currentLine: TherapyLine;
  assessmentRequired: string[];
  escalationCriteria: string;
  nextStep: TherapyStep;
  referralIndication: string;
}

export interface ShockAssessmentStep {
  order: number;
  parameter: string;
  method: string;
  normalFinding: string;
  abnormalFindings: { finding: string; interpretation: string; shockType: ShockType[] }[];
  clinicalTip: string;
}

export interface FluidBolusTracker {
  bolusNumber: number;
  volume: number; // mL/kg
  totalGiven: number; // mL/kg cumulative
  timeGiven: Date;
  reassessmentRequired: ShockReassessmentItem[];
  outcome: 'improved' | 'no_change' | 'worsened' | 'overloaded' | 'pending';
}

export interface ShockReassessmentItem {
  parameter: string;
  preBolusValue: string;
  postBolusValue: string;
  improved: boolean;
  overloadSign: boolean;
}

// ============================================================================
// STATUS ASTHMATICUS - COMPLETE ESCALATION PATHWAY
// ============================================================================

export const asthmaEscalationProtocol: TherapyStep[] = [
  // FIRST LINE - Bronchodilators + Steroids
  {
    line: 'first',
    drug: 'Salbutamol',
    dose: '2.5 mg (<20 kg) or 5 mg (≥20 kg)',
    route: 'Nebulized',
    frequency: 'Every 20 minutes × 3, then hourly',
    maxDose: '15 mg in first hour',
    monitoring: ['Heart rate', 'SpO2', 'Respiratory rate', 'Work of breathing', 'Wheeze intensity'],
    contraindications: ['Known hypersensitivity'],
    sideEffects: ['Tachycardia', 'Tremor', 'Hypokalemia'],
    escalationTrigger: 'No improvement after 3 doses OR SpO2 <92% OR severe distress persists'
  },
  {
    line: 'first',
    drug: 'Ipratropium bromide',
    dose: '250 mcg (<20 kg) or 500 mcg (≥20 kg)',
    route: 'Nebulized with salbutamol',
    frequency: 'Every 20 minutes × 3',
    maxDose: '1500 mcg in first hour',
    monitoring: ['Heart rate', 'Respiratory rate'],
    contraindications: ['Glaucoma', 'Urinary retention'],
    sideEffects: ['Dry mouth', 'Urinary retention'],
    escalationTrigger: 'Combined with salbutamol - escalate if no improvement'
  },
  {
    line: 'first',
    drug: 'Prednisolone',
    dose: '1-2 mg/kg',
    route: 'PO',
    frequency: 'Once daily',
    maxDose: '60 mg',
    monitoring: ['Blood glucose', 'Blood pressure'],
    contraindications: ['Active varicella', 'Systemic fungal infection'],
    sideEffects: ['Hyperglycemia', 'Mood changes', 'Increased appetite'],
    escalationTrigger: 'If unable to take PO, switch to IV steroid'
  },
  // Alternative steroids
  {
    line: 'first',
    drug: 'Dexamethasone',
    dose: '0.6 mg/kg',
    route: 'PO/IV/IM',
    frequency: 'Once daily × 1-2 days',
    maxDose: '16 mg',
    monitoring: ['Blood glucose'],
    contraindications: ['Active infection without antibiotics'],
    sideEffects: ['Hyperglycemia', 'Insomnia'],
    escalationTrigger: 'Alternative to prednisolone - same escalation criteria'
  },
  {
    line: 'first',
    drug: 'Methylprednisolone',
    dose: '1-2 mg/kg',
    route: 'IV',
    frequency: 'Every 6 hours',
    maxDose: '60 mg/dose',
    monitoring: ['Blood glucose', 'Blood pressure'],
    contraindications: ['Active varicella'],
    sideEffects: ['Hyperglycemia', 'Hypertension'],
    escalationTrigger: 'For severe cases requiring IV steroid'
  },
  {
    line: 'first',
    drug: 'Hydrocortisone',
    dose: '4-5 mg/kg',
    route: 'IV',
    frequency: 'Every 6 hours',
    maxDose: '100 mg/dose',
    monitoring: ['Blood glucose', 'Blood pressure', 'Electrolytes'],
    contraindications: ['Active systemic infection without antibiotics'],
    sideEffects: ['Hyperglycemia', 'Fluid retention'],
    escalationTrigger: 'Alternative IV steroid option'
  },

  // SECOND LINE - Magnesium Sulfate
  {
    line: 'second',
    drug: 'Magnesium Sulfate',
    dose: '25-50 mg/kg',
    route: 'IV infusion',
    frequency: 'Single dose over 20-30 minutes',
    maxDose: '2 g',
    dilution: 'Dilute in NS to make 20 mg/mL concentration',
    administrationTime: '20-30 minutes (faster if life-threatening)',
    monitoring: [
      'Blood pressure every 5 minutes during infusion',
      'Heart rate',
      'Deep tendon reflexes',
      'Respiratory rate',
      'SpO2'
    ],
    contraindications: [
      'Heart block',
      'Myasthenia gravis',
      'Severe renal impairment (reduce dose by 50%)'
    ],
    sideEffects: [
      'Hypotension (slow infusion if occurs)',
      'Flushing',
      'Muscle weakness',
      'Respiratory depression (rare at these doses)'
    ],
    escalationTrigger: 'No improvement within 30 minutes of completion → escalate to continuous salbutamol'
  },

  // THIRD LINE - Continuous IV Bronchodilators
  {
    line: 'third',
    drug: 'Salbutamol IV',
    dose: 'Loading: 5-15 mcg/kg over 10 min, then 1-5 mcg/kg/min',
    route: 'IV continuous infusion',
    frequency: 'Continuous - titrate to effect',
    maxDose: '20 mcg/kg/min',
    dilution: 'Add 5 mg (5 mL of 1 mg/mL) to 45 mL NS = 100 mcg/mL',
    monitoring: [
      'Continuous cardiac monitoring (ECG)',
      'Heart rate (target <200)',
      'Blood pressure',
      'Serum potassium every 4-6 hours',
      'Serum lactate',
      'Blood glucose'
    ],
    contraindications: [
      'Uncontrolled arrhythmia',
      'Severe hypokalemia (<3.0 mmol/L) - correct first'
    ],
    sideEffects: [
      'Severe tachycardia',
      'Hypokalemia',
      'Lactic acidosis',
      'Tremor',
      'Arrhythmias'
    ],
    escalationTrigger: 'No improvement at max dose OR cardiac instability → add aminophylline',
    deescalationCriteria: 'Wean by 1 mcg/kg/min every 30-60 min when improving'
  },
  {
    line: 'third',
    drug: 'Aminophylline',
    dose: 'Loading: 5-6 mg/kg over 20-30 min (omit if on oral theophylline), then 0.5-1 mg/kg/hr',
    route: 'IV infusion',
    frequency: 'Continuous',
    maxDose: '1.2 mg/kg/hr',
    dilution: 'Dilute loading dose in 50-100 mL NS',
    monitoring: [
      'Serum theophylline level (target 10-15 mcg/mL)',
      'Heart rate',
      'Blood pressure',
      'Nausea/vomiting',
      'Seizure activity'
    ],
    contraindications: [
      'Active seizure disorder',
      'Severe cardiac arrhythmia',
      'Concurrent erythromycin/ciprofloxacin (reduce dose 50%)'
    ],
    sideEffects: [
      'Nausea/vomiting',
      'Tachycardia',
      'Seizures (at toxic levels)',
      'Arrhythmias'
    ],
    escalationTrigger: 'No improvement OR toxicity → consider ketamine'
  },

  // FOURTH LINE - Ketamine for Refractory Bronchospasm
  {
    line: 'fourth',
    drug: 'Ketamine',
    dose: 'Bolus: 1-2 mg/kg, then 0.5-2 mg/kg/hr infusion',
    route: 'IV',
    frequency: 'Continuous infusion',
    maxDose: '3 mg/kg/hr',
    dilution: 'Add 200 mg to 200 mL NS = 1 mg/mL',
    monitoring: [
      'Level of sedation',
      'Blood pressure',
      'Heart rate',
      'Secretions',
      'Emergence reactions'
    ],
    contraindications: [
      'Severe hypertension',
      'Raised intracranial pressure',
      'Psychosis history',
      'Thyrotoxicosis'
    ],
    sideEffects: [
      'Increased secretions (have suction ready)',
      'Emergence reactions (give midazolam 0.05 mg/kg)',
      'Hypertension',
      'Laryngospasm (rare)'
    ],
    escalationTrigger: 'Respiratory failure despite ketamine → intubation and mechanical ventilation'
  },

  // FIFTH LINE - Mechanical Ventilation
  {
    line: 'fifth',
    drug: 'Mechanical Ventilation',
    dose: 'See ventilator settings below',
    route: 'ETT',
    frequency: 'Continuous',
    maxDose: 'N/A',
    monitoring: [
      'Peak inspiratory pressure (keep <35 cmH2O)',
      'Plateau pressure (keep <30 cmH2O)',
      'Auto-PEEP',
      'SpO2',
      'ETCO2',
      'Blood gas every 2-4 hours'
    ],
    contraindications: [],
    sideEffects: [
      'Barotrauma',
      'Pneumothorax',
      'Hypotension from air trapping'
    ],
    escalationTrigger: 'ECMO consideration if refractory hypoxemia'
  }
];

export const asthmaVentilatorSettings = {
  mode: 'Volume Control or Pressure Control',
  tidalVolume: '6-8 mL/kg ideal body weight',
  respiratoryRate: '8-12 breaths/min (allow permissive hypercapnia)',
  inspiratoryTime: '0.8-1.2 seconds',
  ieRatio: '1:3 to 1:5 (prolonged expiration)',
  peep: '0-5 cmH2O (low PEEP to prevent air trapping)',
  fio2: 'Start 100%, wean to SpO2 92-96%',
  targetPlateau: '<30 cmH2O',
  targetPeak: '<35 cmH2O',
  permissiveHypercapnia: 'Accept pH >7.20, PaCO2 up to 80-90 mmHg',
  sedation: 'Deep sedation required - propofol + fentanyl or ketamine',
  paralysis: 'Consider rocuronium 0.6-1.2 mg/kg if severe air trapping'
};

// ============================================================================
// SHOCK DIFFERENTIATION ALGORITHM
// ============================================================================

export const shockAssessmentSteps: ShockAssessmentStep[] = [
  {
    order: 1,
    parameter: 'Central vs Peripheral Pulses',
    method: 'Palpate carotid/femoral (central) and radial/dorsalis pedis (peripheral) simultaneously',
    normalFinding: 'Both strong and equal',
    abnormalFindings: [
      { finding: 'Weak peripheral, strong central', interpretation: 'Compensated shock - peripheral vasoconstriction', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: 'Both weak', interpretation: 'Decompensated shock', shockType: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'] },
      { finding: 'Bounding peripheral', interpretation: 'Warm/distributive shock (early sepsis, anaphylaxis)', shockType: ['septic', 'anaphylactic'] },
      { finding: 'Unequal (arm vs arm or arm vs leg)', interpretation: 'Consider aortic dissection, coarctation', shockType: ['obstructive'] }
    ],
    clinicalTip: 'In infants, use brachial pulse instead of radial'
  },
  {
    order: 2,
    parameter: 'Palmar Pallor',
    method: 'Open palm, compare to your palm or inner conjunctiva',
    normalFinding: 'Pink palm creases',
    abnormalFindings: [
      { finding: 'Pale palm creases', interpretation: 'Moderate anemia (Hb 7-10 g/dL) or poor perfusion', shockType: ['hypovolemic'] },
      { finding: 'Severe pallor (white)', interpretation: 'Severe anemia (Hb <7 g/dL) or severe shock', shockType: ['hypovolemic'] }
    ],
    clinicalTip: 'Pallor + tachycardia + history of bleeding = hemorrhagic shock until proven otherwise'
  },
  {
    order: 3,
    parameter: 'Peripheral Cyanosis',
    method: 'Inspect nail beds, lips, earlobes',
    normalFinding: 'Pink',
    abnormalFindings: [
      { finding: 'Blue nail beds only (peripheral)', interpretation: 'Poor peripheral perfusion, cold exposure', shockType: ['hypovolemic', 'cardiogenic'] },
      { finding: 'Blue lips and tongue (central)', interpretation: 'Hypoxemia - check SpO2, consider cardiac cause', shockType: ['cardiogenic', 'obstructive'] },
      { finding: 'Mottled skin', interpretation: 'Severe shock with microcirculatory failure', shockType: ['septic', 'cardiogenic'] }
    ],
    clinicalTip: 'Central cyanosis not improving with oxygen = cardiac shunt or severe lung disease'
  },
  {
    order: 4,
    parameter: 'Capillary Refill Time',
    method: 'Press sternum or fingertip for 5 seconds, release, count seconds to pink',
    normalFinding: '<2 seconds',
    abnormalFindings: [
      { finding: '2-3 seconds', interpretation: 'Mild-moderate perfusion deficit', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: '3-5 seconds', interpretation: 'Moderate-severe shock', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: '>5 seconds', interpretation: 'Severe shock - immediate intervention needed', shockType: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'] },
      { finding: 'Flash refill (<1 second)', interpretation: 'Vasodilation - warm shock', shockType: ['septic', 'anaphylactic'] }
    ],
    clinicalTip: 'Test on sternum in cold environments as extremities may be falsely prolonged'
  },
  {
    order: 5,
    parameter: 'Temperature Gradient',
    method: 'Run back of hand from foot up leg, note where temperature changes from cool to warm',
    normalFinding: 'Warm throughout or cool only at toes',
    abnormalFindings: [
      { finding: 'Cool to ankle', interpretation: 'Mild peripheral shutdown', shockType: ['hypovolemic', 'cardiogenic'] },
      { finding: 'Cool to mid-calf', interpretation: 'Moderate shock', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: 'Cool to knee', interpretation: 'Severe shock', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: 'Cool to mid-thigh or higher', interpretation: 'Profound shock - critical', shockType: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'] },
      { finding: 'Warm throughout with tachycardia', interpretation: 'Warm/distributive shock', shockType: ['septic', 'anaphylactic'] }
    ],
    clinicalTip: 'Document the level (e.g., "cool to knee") for trending response to treatment'
  },
  {
    order: 6,
    parameter: 'Blood Pressure',
    method: 'Use appropriate cuff size (width 40% of arm circumference)',
    normalFinding: 'Systolic: 70 + (2 × age in years) for children 1-10 years',
    abnormalFindings: [
      { finding: 'Normal BP with other shock signs', interpretation: 'Compensated shock - DO NOT be reassured', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: 'Systolic <70 + (2 × age)', interpretation: 'Hypotensive shock - decompensated', shockType: ['hypovolemic', 'septic', 'cardiogenic', 'obstructive'] },
      { finding: 'Wide pulse pressure', interpretation: 'Septic shock (early) or aortic regurgitation', shockType: ['septic'] },
      { finding: 'Narrow pulse pressure', interpretation: 'Cardiogenic or late septic shock', shockType: ['cardiogenic', 'septic'] },
      { finding: 'Pulsus paradoxus >10 mmHg', interpretation: 'Cardiac tamponade or severe asthma', shockType: ['obstructive'] }
    ],
    clinicalTip: 'Hypotension is a LATE sign in children - treat shock before BP drops'
  },
  {
    order: 7,
    parameter: 'Heart Sounds Auscultation',
    method: 'Listen at apex, left sternal border, and base',
    normalFinding: 'S1 S2 clear, no murmurs or added sounds',
    abnormalFindings: [
      { finding: 'Gallop rhythm (S3)', interpretation: 'Volume overload or heart failure', shockType: ['cardiogenic'] },
      { finding: 'New murmur', interpretation: 'Valve dysfunction, VSD, endocarditis', shockType: ['cardiogenic', 'septic'] },
      { finding: 'Muffled heart sounds', interpretation: 'Pericardial effusion/tamponade', shockType: ['obstructive'] },
      { finding: 'Rub', interpretation: 'Pericarditis', shockType: ['obstructive'] }
    ],
    clinicalTip: 'Known heart disease + shock = cardiogenic until proven otherwise'
  },
  {
    order: 8,
    parameter: 'ECG Rhythm (3 or 5 lead)',
    method: 'Attach leads, assess rate, rhythm, QRS width',
    normalFinding: 'Sinus rhythm, age-appropriate rate, narrow QRS',
    abnormalFindings: [
      { finding: 'Sinus tachycardia', interpretation: 'Compensatory - treat underlying cause', shockType: ['hypovolemic', 'septic', 'anaphylactic'] },
      { finding: 'SVT (rate >220 infant, >180 child, narrow QRS)', interpretation: 'May be cause of cardiogenic shock', shockType: ['cardiogenic'] },
      { finding: 'Wide complex tachycardia', interpretation: 'VT until proven otherwise - unstable = cardiovert', shockType: ['cardiogenic'] },
      { finding: 'Bradycardia with hypotension', interpretation: 'Pre-arrest - prepare for CPR', shockType: ['cardiogenic', 'obstructive'] },
      { finding: 'Peaked T waves, wide QRS', interpretation: 'Hyperkalemia - give calcium immediately', shockType: ['undifferentiated'] },
      { finding: 'Low voltage, electrical alternans', interpretation: 'Pericardial effusion', shockType: ['obstructive'] }
    ],
    clinicalTip: 'Arrhythmia in shock may be due to electrolyte disturbance - check K+, Ca2+, Mg2+'
  },
  {
    order: 9,
    parameter: 'Jugular Venous Distension (JVD)',
    method: 'Position at 45°, look for pulsation above clavicle',
    normalFinding: 'Not visible above clavicle at 45°',
    abnormalFindings: [
      { finding: 'JVD present', interpretation: 'Elevated right heart pressure', shockType: ['cardiogenic', 'obstructive'] },
      { finding: 'Flat JVP even when supine', interpretation: 'Hypovolemia', shockType: ['hypovolemic'] }
    ],
    clinicalTip: 'JVD + hypotension + muffled heart sounds = Beck\'s triad (tamponade)'
  },
  {
    order: 10,
    parameter: 'Periorbital Edema',
    method: 'Inspect around eyes for puffiness',
    normalFinding: 'No edema',
    abnormalFindings: [
      { finding: 'Periorbital edema present', interpretation: 'Fluid overload or nephrotic syndrome', shockType: ['cardiogenic'] }
    ],
    clinicalTip: 'If present before fluid resuscitation, be cautious with boluses'
  },
  {
    order: 11,
    parameter: 'Hepatomegaly',
    method: 'Palpate from right iliac fossa upward, percuss liver span',
    normalFinding: 'Liver edge at or just below costal margin',
    abnormalFindings: [
      { finding: 'Liver >2 cm below costal margin', interpretation: 'Hepatomegaly - right heart failure or fluid overload', shockType: ['cardiogenic'] },
      { finding: 'Tender hepatomegaly', interpretation: 'Acute congestion', shockType: ['cardiogenic'] },
      { finding: 'Increasing hepatomegaly during resuscitation', interpretation: 'STOP FLUIDS - fluid overload', shockType: ['cardiogenic'] }
    ],
    clinicalTip: 'Mark liver edge with pen before fluids - recheck after each bolus'
  },
  {
    order: 12,
    parameter: 'Pedal Edema',
    method: 'Press over tibial bone for 5 seconds, check for pitting',
    normalFinding: 'No pitting',
    abnormalFindings: [
      { finding: 'Pitting edema present', interpretation: 'Fluid overload or hypoalbuminemia', shockType: ['cardiogenic'] }
    ],
    clinicalTip: 'In bedridden patients, check sacral area instead'
  },
  {
    order: 13,
    parameter: 'Urine Output',
    method: 'Ask mother about diaper changes or urination frequency in last 6-12 hours',
    normalFinding: '>1 mL/kg/hr (6+ wet diapers/day in infant)',
    abnormalFindings: [
      { finding: '<1 mL/kg/hr or <4 wet diapers/day', interpretation: 'Oliguria - poor renal perfusion', shockType: ['hypovolemic', 'septic', 'cardiogenic'] },
      { finding: 'Polyuria with dehydration', interpretation: 'Consider DKA', shockType: ['hypovolemic'] },
      { finding: 'No urine for >6 hours', interpretation: 'Severe shock or acute kidney injury', shockType: ['hypovolemic', 'septic', 'cardiogenic'] }
    ],
    clinicalTip: 'Insert urinary catheter early in severe shock to monitor output hourly'
  }
];

// ============================================================================
// SHOCK HISTORY QUESTIONS FOR DIFFERENTIATION
// ============================================================================

export const shockHistoryQuestions = [
  {
    question: 'Has the child had diarrhea and/or vomiting?',
    yesInterpretation: 'Hypovolemic shock likely - calculate fluid deficit',
    suggestedShockType: 'hypovolemic' as ShockType,
    followUp: 'How many episodes? Any blood in stool? How long?'
  },
  {
    question: 'Has the child been urinating more than usual (polyuria)?',
    yesInterpretation: 'Consider DKA - check glucose and ketones',
    suggestedShockType: 'hypovolemic' as ShockType,
    followUp: 'Any excessive thirst? Weight loss? Known diabetic?'
  },
  {
    question: 'Has there been any bleeding (visible or suspected)?',
    yesInterpretation: 'Hemorrhagic shock - type and crossmatch, prepare blood',
    suggestedShockType: 'hypovolemic' as ShockType,
    followUp: 'Where is the bleeding? Trauma? Melena? Hematemesis?'
  },
  {
    question: 'Does the child have known heart disease?',
    yesInterpretation: 'Cardiogenic shock likely - cautious fluids, early inotropes',
    suggestedShockType: 'cardiogenic' as ShockType,
    followUp: 'What heart condition? On any cardiac medications? Recent surgery?'
  },
  {
    question: 'Has the child had fever at home?',
    yesInterpretation: 'Septic shock likely - antibiotics within 1 hour',
    suggestedShockType: 'septic' as ShockType,
    followUp: 'How high? How long? Any source identified? Immunocompromised?'
  },
  {
    question: 'Has the child eaten anything new, been stung by insect, or developed hives?',
    yesInterpretation: 'Anaphylactic shock - give epinephrine IM immediately',
    suggestedShockType: 'anaphylactic' as ShockType,
    followUp: 'What was the trigger? Any swelling of face/tongue? Difficulty breathing?'
  },
  {
    question: 'Was the onset sudden or gradual?',
    yesInterpretation: 'Sudden onset suggests anaphylaxis, PE, arrhythmia, or tamponade',
    suggestedShockType: 'obstructive' as ShockType,
    followUp: 'What was child doing when it started? Any chest pain?'
  },
  {
    question: 'Any recent trauma or surgery?',
    yesInterpretation: 'Consider hemorrhage, tension pneumothorax, or tamponade',
    suggestedShockType: 'obstructive' as ShockType,
    followUp: 'Mechanism of injury? Chest trauma? Abdominal trauma?'
  }
];

// ============================================================================
// IV/IO ACCESS PROTOCOL WITH TIMER
// ============================================================================

export interface AccessAttempt {
  type: 'IV' | 'IO';
  site: string;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  success: boolean;
  gauge?: string;
}

export const ivIoAccessProtocol = {
  ivFirstAttempt: {
    sites: ['Dorsum of hand', 'Antecubital fossa', 'Saphenous vein at ankle'],
    timeLimit: 90, // seconds
    tips: [
      'Use largest gauge possible (22G minimum for boluses)',
      'Warm the limb to dilate veins',
      'Use tourniquet proximal to site',
      'In dehydrated children, scalp veins may be visible'
    ]
  },
  ioEscalation: {
    trigger: 'IV not obtained within 90 seconds OR 2 failed attempts',
    sites: [
      { name: 'Proximal tibia', description: '1-2 cm below tibial tuberosity, medial flat surface', ageRange: 'All ages' },
      { name: 'Distal tibia', description: '1-2 cm above medial malleolus', ageRange: 'All ages' },
      { name: 'Distal femur', description: '1-2 cm above lateral condyle, anterior midline', ageRange: 'Infants' },
      { name: 'Humeral head', description: 'Greater tubercle, arm adducted and internally rotated', ageRange: '>6 years' }
    ],
    needleSize: {
      '<3 kg': '15 mm needle',
      '3-39 kg': '25 mm needle',
      '>40 kg': '45 mm needle'
    },
    technique: [
      '1. Clean site with antiseptic',
      '2. Stabilize limb',
      '3. Insert needle perpendicular to bone',
      '4. Advance with rotating motion until "pop" felt',
      '5. Remove stylet',
      '6. Aspirate for marrow (may not always get)',
      '7. Flush with 5-10 mL NS',
      '8. Secure and connect fluids'
    ],
    contraindications: [
      'Fracture in target bone',
      'Previous IO in same bone within 24 hours',
      'Infection at insertion site',
      'Osteogenesis imperfecta'
    ]
  }
};

// ============================================================================
// FLUID BOLUS PROTOCOL WITH REASSESSMENT
// ============================================================================

export const fluidBolusProtocol = {
  standardBolus: {
    volume: 10, // mL/kg - per FEAST trial recommendation
    fluid: 'Normal Saline (0.9% NaCl) or Lactated Ringer\'s',
    rate: 'Over 5-10 minutes (push-pull with 50 mL syringes if needed)',
    maxTotal: 60, // mL/kg before mandatory reassessment for inotropes
  },
  
  cardiogenicBolus: {
    volume: 5, // mL/kg - smaller boluses
    fluid: 'Normal Saline',
    rate: 'Over 10-15 minutes',
    maxTotal: 20, // mL/kg - much lower threshold
    warning: 'Watch closely for worsening - hepatomegaly, crackles, JVD'
  },
  
  reassessmentChecklist: [
    {
      parameter: 'Heart rate',
      improved: 'Decreasing toward normal',
      worsened: 'Increasing or unchanged',
      action: 'Continue if improved, escalate if worsened'
    },
    {
      parameter: 'Capillary refill',
      improved: '<2 seconds',
      worsened: 'Still >3 seconds',
      action: 'Continue if improved, escalate if worsened'
    },
    {
      parameter: 'Mental status',
      improved: 'More alert, interactive',
      worsened: 'Same or more lethargic',
      action: 'Continue if improved, consider other causes if worsened'
    },
    {
      parameter: 'Peripheral pulses',
      improved: 'Stronger, easier to feel',
      worsened: 'Still weak or weaker',
      action: 'Continue if improved, escalate if worsened'
    },
    {
      parameter: 'Urine output',
      improved: 'Producing urine',
      worsened: 'Still anuric',
      action: 'May take time - continue monitoring'
    },
    {
      parameter: 'Blood pressure',
      improved: 'Increasing toward normal',
      worsened: 'Still hypotensive',
      action: 'Continue if improved, add vasopressor if worsened'
    },
    {
      parameter: 'Hepatomegaly',
      improved: 'No change from baseline',
      worsened: 'Increasing liver size',
      action: 'STOP FLUIDS if increasing - start inotrope'
    },
    {
      parameter: 'Lung crackles',
      improved: 'None',
      worsened: 'New crackles heard',
      action: 'STOP FLUIDS - consider diuretic and inotrope'
    },
    {
      parameter: 'JVD',
      improved: 'Not elevated',
      worsened: 'New or increasing JVD',
      action: 'STOP FLUIDS - fluid overload'
    },
    {
      parameter: 'SpO2',
      improved: 'Stable or improving',
      worsened: 'Dropping',
      action: 'STOP FLUIDS if dropping - pulmonary edema'
    }
  ],
  
  overloadSigns: [
    'New or increasing hepatomegaly',
    'New lung crackles/rales',
    'New or worsening JVD',
    'Periorbital edema',
    'Gallop rhythm (S3)',
    'Decreasing SpO2 during fluid administration',
    'Worsening respiratory distress'
  ],
  
  overloadAction: {
    immediate: [
      'STOP all fluid boluses',
      'Sit patient upright',
      'Give oxygen',
      'Prepare furosemide 1 mg/kg IV',
      'Start inotrope (see escalation pathway)'
    ]
  }
};

// ============================================================================
// INOTROPE/VASOPRESSOR ESCALATION PATHWAY
// ============================================================================

export const inotropeVasopressorProtocol = {
  firstLine: {
    coldShock: {
      drug: 'Epinephrine',
      indication: 'Cold shock (cool extremities, weak pulses, prolonged CRT)',
      dose: '0.05-0.3 mcg/kg/min',
      startDose: '0.1 mcg/kg/min',
      maxDose: '1 mcg/kg/min',
      dilution: 'Add 0.6 mg × weight(kg) to 100 mL D5W. Run at 1 mL/hr = 0.1 mcg/kg/min',
      titration: 'Increase by 0.05 mcg/kg/min every 5-10 minutes to effect',
      monitoring: ['Heart rate', 'Blood pressure', 'Lactate', 'Glucose', 'Extremity perfusion'],
      sideEffects: ['Tachycardia', 'Arrhythmias', 'Hyperglycemia', 'Tissue necrosis if extravasates']
    },
    warmShock: {
      drug: 'Norepinephrine',
      indication: 'Warm shock (warm extremities, bounding pulses, flash CRT, wide pulse pressure)',
      dose: '0.05-0.3 mcg/kg/min',
      startDose: '0.1 mcg/kg/min',
      maxDose: '2 mcg/kg/min',
      dilution: 'Add 0.6 mg × weight(kg) to 100 mL D5W. Run at 1 mL/hr = 0.1 mcg/kg/min',
      titration: 'Increase by 0.05 mcg/kg/min every 5-10 minutes to target MAP',
      monitoring: ['Blood pressure', 'Heart rate', 'Urine output', 'Lactate'],
      sideEffects: ['Severe vasoconstriction', 'Tissue ischemia', 'Arrhythmias']
    }
  },
  
  secondLine: {
    dopamine: {
      drug: 'Dopamine',
      indication: 'Alternative first-line if epinephrine/norepinephrine unavailable',
      dose: '5-20 mcg/kg/min',
      startDose: '5 mcg/kg/min',
      maxDose: '20 mcg/kg/min',
      dilution: 'Add 6 mg × weight(kg) to 100 mL D5W. Run at 1 mL/hr = 1 mcg/kg/min',
      titration: 'Increase by 2.5 mcg/kg/min every 5-10 minutes',
      doseEffects: {
        low: '2-5 mcg/kg/min - renal/splanchnic vasodilation (dopaminergic)',
        medium: '5-10 mcg/kg/min - increased contractility (beta)',
        high: '10-20 mcg/kg/min - vasoconstriction (alpha)'
      },
      monitoring: ['Heart rate', 'Blood pressure', 'Urine output', 'Arrhythmias'],
      sideEffects: ['Tachycardia', 'Arrhythmias', 'Tissue necrosis']
    },
    dobutamine: {
      drug: 'Dobutamine',
      indication: 'Cardiogenic shock with adequate BP, need for inotropy without vasoconstriction',
      dose: '5-20 mcg/kg/min',
      startDose: '5 mcg/kg/min',
      maxDose: '20 mcg/kg/min',
      dilution: 'Add 6 mg × weight(kg) to 100 mL D5W. Run at 1 mL/hr = 1 mcg/kg/min',
      titration: 'Increase by 2.5 mcg/kg/min every 10-15 minutes',
      monitoring: ['Heart rate', 'Blood pressure (may drop)', 'Cardiac output'],
      sideEffects: ['Hypotension (vasodilation)', 'Tachycardia', 'Arrhythmias'],
      warning: 'May cause hypotension - often combined with norepinephrine'
    }
  },
  
  thirdLine: {
    vasopressin: {
      drug: 'Vasopressin',
      indication: 'Catecholamine-resistant shock',
      dose: '0.0003-0.002 units/kg/min',
      startDose: '0.0005 units/kg/min',
      maxDose: '0.002 units/kg/min',
      dilution: 'Add 0.1 units × weight(kg) to 100 mL D5W. Run at 0.5 mL/hr = 0.0005 units/kg/min',
      monitoring: ['Blood pressure', 'Urine output', 'Sodium', 'Skin perfusion'],
      sideEffects: ['Severe vasoconstriction', 'Skin necrosis', 'Hyponatremia', 'Mesenteric ischemia']
    },
    hydrocortisone: {
      drug: 'Hydrocortisone',
      indication: 'Catecholamine-resistant shock (suspected adrenal insufficiency)',
      dose: '1-2 mg/kg bolus, then 50-100 mg/m²/day divided q6h',
      maxDose: '100 mg/dose',
      route: 'IV',
      monitoring: ['Blood pressure response', 'Glucose'],
      sideEffects: ['Hyperglycemia', 'Immunosuppression'],
      note: 'Draw cortisol level before giving if possible, but do not delay treatment'
    }
  }
};

// ============================================================================
// LAB SAMPLE COLLECTION PROMPTS
// ============================================================================

export const labSamplePrompts = {
  shockWorkup: [
    { test: 'Blood glucose', urgency: 'STAT', reason: 'Hypoglycemia common in shock, worsens outcomes' },
    { test: 'Blood gas (VBG or ABG)', urgency: 'STAT', reason: 'Assess acidosis, lactate, oxygenation' },
    { test: 'Lactate', urgency: 'STAT', reason: 'Marker of tissue hypoperfusion, guides resuscitation' },
    { test: 'Electrolytes (Na, K, Cl, HCO3)', urgency: 'STAT', reason: 'Arrhythmia risk, guide fluid choice' },
    { test: 'Calcium (ionized)', urgency: 'STAT', reason: 'Hypocalcemia impairs cardiac function' },
    { test: 'Magnesium', urgency: 'Urgent', reason: 'Hypomagnesemia causes arrhythmias' },
    { test: 'Complete blood count', urgency: 'Urgent', reason: 'Anemia, infection, platelet count' },
    { test: 'Blood type and crossmatch', urgency: 'STAT if hemorrhage', reason: 'Prepare for transfusion' },
    { test: 'Coagulation (PT, PTT, INR)', urgency: 'Urgent', reason: 'DIC screening, bleeding risk' },
    { test: 'Blood culture', urgency: 'Before antibiotics', reason: 'Identify organism, guide therapy' },
    { test: 'Urinalysis', urgency: 'Urgent', reason: 'UTI source, ketones in DKA' },
    { test: 'Chest X-ray', urgency: 'Urgent', reason: 'Pneumonia, cardiomegaly, pulmonary edema' },
    { test: 'ECG', urgency: 'STAT', reason: 'Arrhythmia, electrolyte effects, ischemia' }
  ],
  
  arrhythmiaWorkup: [
    { test: 'Potassium', urgency: 'STAT', reason: 'Hypo/hyperkalemia causes arrhythmias' },
    { test: 'Calcium (ionized)', urgency: 'STAT', reason: 'Hypocalcemia prolongs QT' },
    { test: 'Magnesium', urgency: 'STAT', reason: 'Hypomagnesemia causes torsades' },
    { test: '12-lead ECG', urgency: 'STAT', reason: 'Diagnose rhythm, measure intervals' },
    { test: 'Troponin', urgency: 'Urgent', reason: 'Myocardial injury' },
    { test: 'Thyroid function', urgency: 'Urgent', reason: 'Thyrotoxicosis causes SVT' },
    { test: 'Drug levels (if applicable)', urgency: 'Urgent', reason: 'Digoxin toxicity, etc.' }
  ]
};

// ============================================================================
// REFERRAL TRIGGERS
// ============================================================================

export const referralTriggers = {
  immediate: [
    'Refractory shock despite 60 mL/kg fluid + vasopressors',
    'Refractory arrhythmia despite 2 cardioversion attempts',
    'Need for mechanical ventilation without local capability',
    'Suspected surgical emergency (appendicitis, intussusception, etc.)',
    'Refractory status epilepticus (>60 minutes)',
    'Suspected raised ICP with herniation signs',
    'Need for ECMO consideration',
    'Suspected congenital heart disease with decompensation'
  ],
  urgent: [
    'Shock requiring >2 vasopressors',
    'DKA not responding to standard protocol',
    'Severe electrolyte disturbance not correcting',
    'Need for subspecialty input (cardiology, nephrology, etc.)',
    'Suspected metabolic disorder',
    'Need for advanced imaging (CT, MRI)'
  ],
  referralInfo: {
    required: [
      'Patient demographics (name, age, weight)',
      'Working diagnosis',
      'Vital signs trend',
      'Interventions given with times',
      'Current infusions and rates',
      'Latest lab results',
      'Reason for referral',
      'Contact number for callback'
    ],
    format: 'SBAR (Situation, Background, Assessment, Recommendation)'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function calculateFluidBolus(weightKg: number, bolusType: 'standard' | 'cardiogenic' = 'standard'): { volumeMl: number; rate: string } {
  const protocol = bolusType === 'cardiogenic' ? fluidBolusProtocol.cardiogenicBolus : fluidBolusProtocol.standardBolus;
  const volumeMl = weightKg * protocol.volume;
  return {
    volumeMl: Math.round(volumeMl),
    rate: protocol.rate
  };
}

export function calculateInotropeDilution(drug: string, weightKg: number): { dilution: string; rate: string } {
  const protocols: Record<string, { factor: number; unit: string }> = {
    epinephrine: { factor: 0.6, unit: 'mg' },
    norepinephrine: { factor: 0.6, unit: 'mg' },
    dopamine: { factor: 6, unit: 'mg' },
    dobutamine: { factor: 6, unit: 'mg' }
  };
  
  const protocol = protocols[drug.toLowerCase()];
  if (!protocol) return { dilution: 'Unknown drug', rate: 'N/A' };
  
  const amount = protocol.factor * weightKg;
  return {
    dilution: `Add ${amount.toFixed(1)} ${protocol.unit} to 100 mL D5W`,
    rate: drug.toLowerCase().includes('epinephrine') || drug.toLowerCase().includes('norepinephrine')
      ? '1 mL/hr = 0.1 mcg/kg/min'
      : '1 mL/hr = 1 mcg/kg/min'
  };
}

export function getShockTypeFromFindings(findings: AssessmentFinding[]): { likelyType: ShockType; confidence: number; reasoning: string[] } {
  const scores: Record<ShockType, number> = {
    hypovolemic: 0,
    cardiogenic: 0,
    septic: 0,
    anaphylactic: 0,
    obstructive: 0,
    undifferentiated: 0
  };
  
  const reasoning: string[] = [];
  
  findings.forEach(finding => {
    // Add scoring logic based on findings
    if (finding.parameter === 'JVD' && finding.value === true) {
      scores.cardiogenic += 2;
      scores.obstructive += 2;
      reasoning.push('JVD present - suggests elevated right heart pressure');
    }
    if (finding.parameter === 'hepatomegaly' && finding.value === true) {
      scores.cardiogenic += 2;
      reasoning.push('Hepatomegaly - suggests right heart failure');
    }
    if (finding.parameter === 'temperature' && finding.value === 'warm') {
      scores.septic += 2;
      scores.anaphylactic += 1;
      reasoning.push('Warm extremities - suggests distributive shock');
    }
    if (finding.parameter === 'pulses' && finding.value === 'bounding') {
      scores.septic += 2;
      scores.anaphylactic += 1;
      reasoning.push('Bounding pulses - suggests vasodilation');
    }
    // Add more scoring rules...
  });
  
  const maxScore = Math.max(...Object.values(scores));
  const likelyType = (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'undifferentiated') as ShockType;
  const confidence = maxScore > 0 ? Math.min(maxScore / 10 * 100, 100) : 0;
  
  return { likelyType, confidence, reasoning };
}

export function shouldEscalateToIO(ivAttempts: AccessAttempt[], elapsedSeconds: number): boolean {
  const failedAttempts = ivAttempts.filter(a => !a.success && a.type === 'IV').length;
  return elapsedSeconds >= 90 || failedAttempts >= 2;
}

export function isFluidOverloaded(reassessment: ShockReassessmentItem[]): boolean {
  const overloadParams = ['hepatomegaly', 'crackles', 'JVD', 'SpO2'];
  return reassessment.some(item => 
    overloadParams.includes(item.parameter.toLowerCase()) && item.overloadSign
  );
}

export function getNextEscalationStep(currentLine: TherapyLine, condition: string): TherapyStep | null {
  const lineOrder: TherapyLine[] = ['first', 'second', 'third', 'fourth', 'fifth'];
  const currentIndex = lineOrder.indexOf(currentLine);
  
  if (currentIndex === -1 || currentIndex >= lineOrder.length - 1) return null;
  
  const nextLine = lineOrder[currentIndex + 1];
  
  if (condition === 'asthma') {
    return asthmaEscalationProtocol.find(step => step.line === nextLine) || null;
  }
  
  return null;
}
