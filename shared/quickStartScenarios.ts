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
      'High-flow oxygen',
      'Establish IV access',
      'Prepare for fluid bolus',
    ],
    keyDrugs: [
      { name: 'Epinephrine IM', dose: '0.01 mg/kg (max 0.5 mg)', route: 'IM anterolateral thigh - REPEAT every 5-15 min' },
      { name: 'Epinephrine IV', dose: '0.001 mg/kg (1 mcg/kg)', route: 'IV if refractory (use 1:100,000)' },
      { name: 'Hydrocortisone', dose: '4 mg/kg (max 200 mg)', route: 'IV (prevents biphasic reaction)' },
      { name: 'Diphenhydramine', dose: '1 mg/kg (max 50 mg)', route: 'IV/IM (adjunct only)' },
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
      'High-flow oxygen',
      'Establish IV/IO access (2 if possible)',
      'Fluid bolus 10-20 mL/kg',
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
      'High-flow oxygen (target SpO2 > 94%)',
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
      'Initial fluid bolus 10-20 mL/kg NS',
      'Check glucose, ketones, blood gas',
      'Start insulin infusion (after initial fluids)',
      'Cardiac monitoring (for K+ changes)',
      'Neuro checks every hour',
    ],
    keyDrugs: [
      { name: 'NS Bolus', dose: '10-20 mL/kg', route: 'IV over 1-2 hours' },
      { name: 'Insulin infusion', dose: '0.05-0.1 units/kg/hr', route: 'IV (start after initial fluids)' },
      { name: 'Potassium', dose: '20-40 mEq/L in fluids', route: 'IV (if K+ < 5.5)' },
      { name: 'Sodium bicarbonate', dose: '1-2 mEq/kg', route: 'IV (only if pH < 6.9)' },
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
      'C-spine immobilization',
      'Airway with jaw thrust (not head tilt)',
      'Control external hemorrhage',
      'High-flow oxygen',
      'Establish IV access x2',
      'Warm fluids ready',
    ],
    keyDrugs: [
      { name: 'NS/LR Bolus', dose: '20 mL/kg', route: 'IV (warm fluids)' },
      { name: 'TXA', dose: '15-20 mg/kg (max 1g)', route: 'IV over 10 min (within 3 hrs)' },
      { name: 'Fentanyl', dose: '1-2 mcg/kg', route: 'IV (pain control)' },
      { name: 'Ketamine', dose: '1-2 mg/kg', route: 'IV (procedural sedation)' },
    ],
    assessmentFocus: [
      'ABCDE with C-spine protection',
      'Hemorrhage control',
      'GCS and pupils',
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
      { name: 'Epinephrine', dose: '0.01-0.03 mg/kg', route: 'IV/UVC (1:10,000)' },
      { name: 'NS Bolus', dose: '10 mL/kg', route: 'IV/UVC (for hypovolemia)' },
      { name: 'Dextrose 10%', dose: '2 mL/kg', route: 'IV (for hypoglycemia)' },
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

  // Parse dose string and calculate
  const doseMatch = drug.dose.match(/([\d.]+)\s*(mg|mcg|mL|g|units)\/kg/i);
  if (doseMatch) {
    const dosePerKg = parseFloat(doseMatch[1]);
    const unit = doseMatch[2];
    const calculated = dosePerKg * weightKg;
    
    // Check for max dose
    const maxMatch = drug.dose.match(/max\s*([\d.]+)\s*(mg|mcg|mL|g)/i);
    const maxDose = maxMatch ? parseFloat(maxMatch[1]) : Infinity;
    const finalDose = Math.min(calculated, maxDose);

    return {
      dose: drug.dose,
      calculated: `${finalDose.toFixed(1)} ${unit}`,
    };
  }

  return { dose: drug.dose, calculated: drug.dose };
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
