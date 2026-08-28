/**
 * Quick-Start Emergency Scenarios
 * 
 * Preset emergency scenarios that skip directly to relevant assessment
 * questions for known presentations. Reduces clicks and time-to-intervention.
 */

export type ScenarioCategory = 
  | 'cardiac_arrest'
  | 'anaphylaxis'
  | 'status_epilepticus'
  | 'septic_shock'
  | 'respiratory_failure'
  | 'dka'
  | 'trauma'
  | 'neonatal';

export interface QuickStartScenario {
  id: ScenarioCategory;
  name: string;
  shortName: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  description: string;
  immediateActions: string[];
  keyDrugs: {
    name: string;
    dose: string;
    route: string;
  }[];
  assessmentFocus: string[];
  route: string; // Navigation route
  criticalTimeWindow?: string;
}

export const QUICK_START_SCENARIOS: QuickStartScenario[] = [
  {
    id: 'cardiac_arrest',
    name: 'Cardiac Arrest',
    shortName: 'Arrest',
    icon: 'Heart',
    color: 'red',
    description: 'Pulseless, unresponsive child - immediate CPR required',
    immediateActions: [
      'Start high-quality CPR (100-120/min, 1/3 chest depth)',
      'Call for help and crash cart',
      'Attach defibrillator/monitor',
      'Establish IV/IO access',
      'Identify rhythm (shockable vs non-shockable)',
    ],
    keyDrugs: [
      { name: 'Epinephrine', dose: '0.01 mg/kg (0.1 mL/kg of 1:10,000)', route: 'IV/IO every 3-5 min' },
      { name: 'Amiodarone', dose: '5 mg/kg', route: 'IV/IO (for refractory VF/pVT)' },
      { name: 'Lidocaine', dose: '1 mg/kg', route: 'IV/IO (alternative to amiodarone)' },
    ],
    assessmentFocus: [
      'Rhythm check every 2 minutes',
      'Pulse check during rhythm analysis',
      'Reversible causes (Hs and Ts)',
      'End-tidal CO2 monitoring',
    ],
    route: '/clinical-assessment?scenario=cardiac_arrest',
    criticalTimeWindow: 'Epinephrine every 3-5 minutes',
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    shortName: 'Anaphy',
    icon: 'AlertTriangle',
    color: 'orange',
    description: 'Severe allergic reaction with airway/breathing/circulation compromise',
    immediateActions: [
      'Remove allergen if possible',
      'Give IM epinephrine IMMEDIATELY',
      'Position flat (or recovery if vomiting)',
      'Age-appropriate oxygen support titrated to the selected target',
      'Establish IV/IO access when indicated',
      'If shock: give isotonic fluid aliquots with reassessment after each bolus',
    ],
    keyDrugs: [
      { name: 'Epinephrine IM', dose: '0.01 mg/kg (max 0.5 mg)', route: 'IM anterolateral thigh - REPEAT every 5-15 min' },
      { name: 'Epinephrine infusion', dose: 'Expert-led infusion only; use the locally approved dilution and monitored protocol', route: 'IV infusion for refractory shock — never an IV bolus' },
      { name: 'Corticosteroid', dose: 'Not routine for preventing biphasic anaphylaxis', route: 'Only for a separate documented local indication' },
      { name: 'Antihistamine', dose: 'Optional adjunct for persistent skin symptoms after epinephrine', route: 'Use local protocol; never delay definitive care' },
    ],
    assessmentFocus: [
      'Airway patency (stridor, voice changes)',
      'Breathing (wheeze, work of breathing)',
      'Circulation (BP, perfusion)',
      'Skin (urticaria, angioedema)',
    ],
    route: '/clinical-assessment?scenario=anaphylaxis',
    criticalTimeWindow: 'Epinephrine within 5 minutes of onset',
  },
  {
    id: 'status_epilepticus',
    name: 'Status Epilepticus',
    shortName: 'Seizure',
    icon: 'Zap',
    color: 'purple',
    description: 'Prolonged seizure (>5 min) or recurrent seizures without recovery',
    immediateActions: [
      'Protect airway - recovery position',
      'High-flow oxygen',
      'Check blood glucose',
      'Establish IV/IO access',
      'Give first-line benzodiazepine',
      'Note seizure start time',
    ],
    keyDrugs: [
      { name: 'Midazolam IM/IN', dose: '0.2 mg/kg (max 10 mg)', route: 'IM or intranasal if no IV' },
      { name: 'Lorazepam IV', dose: '0.1 mg/kg (max 4 mg)', route: 'IV over 2 min' },
      { name: 'Diazepam IV/PR', dose: '0.3 mg/kg IV or 0.5 mg/kg PR', route: 'IV over 2 min or PR' },
      { name: 'Phenytoin/Fosphenytoin', dose: '20 mg/kg PE', route: 'IV over 20 min (if benzo fails)' },
      { name: 'Levetiracetam', dose: '40-60 mg/kg (max 3g)', route: 'IV over 15 min (alternative)' },
    ],
    assessmentFocus: [
      'Seizure type and duration',
      'Airway patency',
      'Blood glucose',
      'Signs of increased ICP',
      'Possible causes (infection, trauma, toxin)',
    ],
    route: '/clinical-assessment?scenario=status_epilepticus',
    criticalTimeWindow: 'Benzodiazepine within 5 minutes of seizure onset',
  },
  {
    id: 'septic_shock',
    name: 'Septic Shock',
    shortName: 'Sepsis',
    icon: 'Thermometer',
    color: 'yellow',
    description: 'Suspected infection with signs of shock (cold/warm shock)',
    immediateActions: [
      'Age-appropriate oxygen support titrated to the selected target',
      'Establish IV/IO access when indicated',
      'If shock: give isotonic fluid aliquots with reassessment after each bolus',
      'Draw blood cultures',
      'Give broad-spectrum antibiotics',
      'Check lactate and glucose',
    ],
    keyDrugs: [
      { name: 'NS/LR Bolus', dose: '10-20 mL/kg', route: 'IV push (reassess after each)' },
      { name: 'Ceftriaxone', dose: '50-100 mg/kg (max 2g)', route: 'IV (empiric)' },
      { name: 'Vancomycin', dose: '15 mg/kg', route: 'IV (if MRSA suspected)' },
      { name: 'Epinephrine infusion', dose: '0.05-0.3 mcg/kg/min', route: 'IV (cold shock)' },
      { name: 'Norepinephrine infusion', dose: '0.05-0.3 mcg/kg/min', route: 'IV (warm shock)' },
    ],
    assessmentFocus: [
      'Perfusion (cap refill, pulses, skin)',
      'Mental status',
      'Urine output',
      'Signs of fluid overload',
      'Source of infection',
    ],
    route: '/clinical-assessment?scenario=septic_shock',
    criticalTimeWindow: 'Antibiotics within 1 hour of recognition',
  },
  {
    id: 'respiratory_failure',
    name: 'Respiratory Failure',
    shortName: 'Resp',
    icon: 'Wind',
    color: 'blue',
    description: 'Severe respiratory distress with impending failure',
    immediateActions: [
      'Position of comfort / airway positioning',
      'Age-appropriate oxygen support titrated to the selected target',
      'Assess for obstruction',
      'Prepare for assisted ventilation',
      'Nebulized bronchodilator if wheezing',
    ],
    keyDrugs: [
      { name: 'Salbutamol nebulized', dose: '2.5-5 mg', route: 'Nebulized (continuous if severe)' },
      { name: 'Ipratropium', dose: '250-500 mcg', route: 'Nebulized with salbutamol' },
      { name: 'Methylprednisolone', dose: '2 mg/kg (max 60 mg)', route: 'IV' },
      { name: 'Magnesium sulfate', dose: '25-50 mg/kg (max 2g)', route: 'IV over 20 min (severe asthma)' },
      { name: 'Epinephrine', dose: '0.01 mg/kg (max 0.5 mg)', route: 'IM (anaphylaxis/croup)' },
    ],
    assessmentFocus: [
      'Work of breathing',
      'Breath sounds (wheeze, stridor, crackles)',
      'SpO2 and respiratory rate',
      'Mental status (fatigue = ominous)',
      'Ability to speak',
    ],
    route: '/clinical-assessment?scenario=respiratory_failure',
    criticalTimeWindow: 'Prepare for intubation if deteriorating',
  },
  {
    id: 'dka',
    name: 'DKA',
    shortName: 'DKA',
    icon: 'Droplets',
    color: 'cyan',
    description: 'Diabetic ketoacidosis - hyperglycemia, acidosis, ketosis',
    immediateActions: [
      'Establish IV access',
      'Use a selected DKA protocol; do not use an ungoverned generic bolus schedule',
      'Check glucose, ketones, blood gas',
      'Start insulin infusion (after initial fluids)',
      'Cardiac monitoring (for K+ changes)',
      'Neuro checks every hour',
    ],
    keyDrugs: [
      { name: 'Isotonic fluid', dose: 'Use a selected DKA protocol; avoid ungoverned bolus scheduling', route: 'IV/IO with reassessment' },
      { name: 'Insulin infusion', dose: '0.05-0.1 units/kg/hr', route: 'IV (start after initial fluids)' },
      { name: 'Potassium', dose: '20-40 mEq/L in fluids', route: 'IV (if K+ < 5.5)' },
      { name: 'Sodium bicarbonate', dose: 'Not routine; specialist protocol only', route: 'IV only under a governed indication' },
    ],
    assessmentFocus: [
      'Glucose (target decrease 50-100 mg/dL/hr)',
      'Potassium (monitor closely)',
      'pH and bicarbonate',
      'Neurological status (cerebral edema)',
      'Fluid balance',
    ],
    route: '/clinical-assessment?scenario=dka',
    criticalTimeWindow: 'Avoid rapid glucose correction (cerebral edema risk)',
  },
  {
    id: 'trauma',
    name: 'Major Trauma',
    shortName: 'Trauma',
    icon: 'Activity',
    color: 'orange',
    description: 'Significant mechanism of injury requiring trauma assessment',
    immediateActions: [
      'Protect the cervical spine when indicated by mechanism and examination',
      'Airway with jaw thrust when cervical-spine injury is suspected',
      'Control external hemorrhage',
      'Age-appropriate oxygen support titrated to the selected target',
      'Establish IV access x2',
      'Warm fluids ready',
    ],
    keyDrugs: [
      { name: 'Crystalloid/blood aliquot', dose: 'Age-, injury-, perfusion-, and setting-specific protocol with reassessment after each aliquot', route: 'IV/IO with warming and monitoring when available' },
      { name: 'TXA', dose: 'Use only when age-, weight-, timing-, injury-, and contraindication criteria are met under the local haemorrhage protocol', route: 'Route and infusion schedule per protocol' },
      { name: 'Analgesia', dose: 'Use a weight- and age-appropriate local analgesia protocol', route: 'Route and monitoring per trained clinician' },
      { name: 'Ketamine', dose: 'Use a governed procedural-sedation protocol only', route: 'Requires airway readiness and monitoring' },
    ],
    assessmentFocus: [
      'ABCDE with C-spine protection',
      'Hemorrhage control',
      'Age-appropriate neurological assessment and pupils',
      'Secondary survey',
      'Imaging (CT, X-ray)',
    ],
    route: '/trauma',
    criticalTimeWindow: 'TXA within 3 hours of injury',
  },
  {
    id: 'neonatal',
    name: 'Neonatal Resus',
    shortName: 'Neonate',
    icon: 'Baby',
    color: 'pink',
    description: 'Newborn requiring resuscitation at delivery',
    immediateActions: [
      'Warm, dry, stimulate',
      'Position airway (neutral)',
      'Clear airway if needed',
      'Assess breathing and heart rate',
      'PPV if HR < 100 or apneic',
    ],
    keyDrugs: [
      { name: 'Epinephrine', dose: 'Use the current neonatal resuscitation dose and concentration table', route: 'UVC/IO per NRP; no improvised concentration' },
      { name: 'Isotonic fluid', dose: 'Only for suspected blood loss/hypovolaemia under the neonatal protocol', route: 'UVC/IO with reassessment' },
      { name: 'Dextrose', dose: 'Check glucose and use the neonatal hypoglycaemia protocol', route: 'IV/IO per local neonatal protocol' },
    ],
    assessmentFocus: [
      'Heart rate (most important)',
      'Breathing effort',
      'Tone and color',
      'Apgar scores',
    ],
    route: '/nrp',
    criticalTimeWindow: 'Golden minute - establish ventilation',
  },
];

/**
 * Get scenario by ID
 */
export function getScenarioById(id: ScenarioCategory): QuickStartScenario | undefined {
  return QUICK_START_SCENARIOS.find((s) => s.id === id);
}

/**
 * Get drug dose for scenario
 */
export function getScenarioDrugDose(
  scenarioId: ScenarioCategory,
  drugName: string,
  weightKg: number
): { dose: string; calculated: string } | null {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return null;

  const drug = scenario.keyDrugs.find((d) => 
    d.name.toLowerCase().includes(drugName.toLowerCase())
  );
  if (!drug) return null;

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return { dose: drug.dose, calculated: 'Enter a valid dosing weight and use the governed protocol.' };
  }

  // Quick Start is a reference launcher, not an independent dose engine.
  // Refuse ambiguous ranges, infusions, concentrations, fixed-dose bands, and
  // protocol-only wording rather than calculating from the first number in text.
  const doseText = drug.dose.toLowerCase();
  const hasRange = /\d+(?:\.\d+)?\s*[-–]\s*\d+/.test(doseText);
  const isInfusionOrConcentration = /infusion|units?\/kg\/hr|mcg\/kg\/min|mEq\/L|concentration|protocol|not routine|expert-led|selected/.test(doseText);
  const doseMatch = drug.dose.match(/^\s*([\d.]+)\s*(mg|mcg|mL|g|units)\/kg\s*(?:\(\s*max\s*([\d.]+)\s*(mg|mcg|mL|g|units)\s*\))?\s*$/i);

  if (!doseMatch || hasRange || isInfusionOrConcentration) {
    return {
      dose: drug.dose,
      calculated: 'Use the selected age/context clinical protocol; no automatic Quick Start calculation.',
    };
  }

  const dosePerKg = Number(doseMatch[1]);
  const unit = doseMatch[2];
  const maxDose = doseMatch[3] ? Number(doseMatch[3]) : Infinity;
  const finalDose = Math.min(dosePerKg * weightKg, maxDose);

  return {
    dose: drug.dose,
    calculated: `${finalDose.toFixed(1)} ${unit}`,
  };
}

/**
 * Get all scenarios for a category
 */
export function getScenariosByUrgency(): {
  critical: QuickStartScenario[];
  urgent: QuickStartScenario[];
  specialized: QuickStartScenario[];
} {
  return {
    critical: QUICK_START_SCENARIOS.filter((s) => 
      ['cardiac_arrest', 'anaphylaxis', 'respiratory_failure'].includes(s.id)
    ),
    urgent: QUICK_START_SCENARIOS.filter((s) => 
      ['status_epilepticus', 'septic_shock', 'dka'].includes(s.id)
    ),
    specialized: QUICK_START_SCENARIOS.filter((s) => 
      ['trauma', 'neonatal'].includes(s.id)
    ),
  };
}
