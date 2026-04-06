/**
 * Dose Rationale Engine for ResusGPS
 * 
 * Provides evidence-based explanations for every dose calculation.
 * References AHA 2020 PALS guidelines and pediatric resuscitation protocols.
 * 
 * Clinical rationale: Providers need to understand WHY a dose is recommended,
 * not just WHAT the dose is. This builds confidence and enables clinical judgment.
 */

export interface DoseRationale {
  drug: string;
  dose: number;
  unit: string;
  route: string;
  ageCategory: string;
  weight: number;
  calculation: string; // e.g., "0.01 mg/kg × 10 kg = 0.1 mg"
  guideline: string; // e.g., "AHA 2020 PALS"
  rationale: string; // Plain language explanation
  notes: string[]; // Additional clinical notes
  alternatives?: Array<{
    condition: string;
    dose: number;
    unit: string;
    rationale: string;
  }>;
}

/**
 * Generate dose rationale for epinephrine
 */
export function generateEpinephrineRationale(
  weight: number,
  ageCategory: string,
  route: string,
  isFirstDose: boolean
): DoseRationale {
  let dosePerKg: number;
  let concentration: string;
  let notes: string[] = [];

  if (ageCategory === 'neonate' && isFirstDose) {
    dosePerKg = 0.1; // 1:10,000 for neonates
    concentration = '1:10,000';
    notes.push('Use 1:10,000 concentration (not 1:1,000)');
    notes.push('Neonatal resuscitation protocol');
  } else {
    dosePerKg = 0.01; // Standard PALS dose
    concentration = '1:1,000';
    notes.push('Standard PALS dose');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Epinephrine',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Epinephrine increases coronary and cerebral perfusion pressure during cardiac arrest. First dose is ${dosePerKg} mg/kg IV/IO. Repeat every 3-5 minutes if no ROSC.`,
    notes,
    alternatives: [
      {
        condition: 'Refractory VF/pulseless VT after first dose',
        dose: dosePerKg * weight,
        unit: 'mg',
        rationale: 'Repeat epinephrine every 3-5 minutes if no ROSC',
      },
      {
        condition: 'Hypotension (not arrest)',
        dose: 0.1 * weight,
        unit: 'mcg/kg/min',
        rationale: 'Continuous infusion at 0.1-1 mcg/kg/min',
      },
    ],
  };
}

/**
 * Generate dose rationale for amiodarone
 */
export function generateAmiodaroneRationale(
  weight: number,
  ageCategory: string,
  isFirstDose: boolean
): DoseRationale {
  const dosePerKg = 5; // 5 mg/kg for arrest
  const dose = dosePerKg * weight;

  return {
    drug: 'Amiodarone',
    dose,
    unit: 'mg',
    route: 'IV/IO',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Amiodarone is an antiarrhythmic used for refractory VF/pulseless VT. Give ${dosePerKg} mg/kg IV/IO after first dose of epinephrine and failed defibrillation.`,
    notes: [
      'Use after first epinephrine dose + failed defibrillation',
      'Max single dose: 300 mg',
      'Second dose: 2.5 mg/kg (max 150 mg)',
      'Dilute in 5% dextrose or normal saline',
    ],
  };
}

/**
 * Generate dose rationale for glucose (dextrose)
 */
export function generateGlucoseRationale(
  weight: number,
  ageCategory: string,
  glucoseLevel: number
): DoseRationale {
  let concentration: string;
  let dosePerKg: number;
  let notes: string[] = [];

  if (ageCategory === 'neonate') {
    concentration = '10%';
    dosePerKg = 2; // 2-5 mL/kg of 10% dextrose
    notes.push('Use 10% dextrose (avoid hypertonic solutions)');
    notes.push('Neonatal hypoglycemia protocol');
  } else {
    concentration = '25%';
    dosePerKg = 0.5; // 0.5-1 g/kg
    notes.push('Use 25% dextrose for older children');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Dextrose',
    dose,
    unit: concentration === '10%' ? 'mL/kg' : 'g/kg',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} ${concentration === '10%' ? 'mL/kg' : 'g/kg'} × ${weight} kg = ${dose} ${concentration === '10%' ? 'mL' : 'g'}`,
    guideline: 'AHA 2020 PALS / Neonatal Resuscitation',
    rationale: `Hypoglycemia worsens outcomes in critically ill children. Treat if glucose <60 mg/dL. Use ${concentration} dextrose to avoid hypertonicity.`,
    notes,
    alternatives: [
      {
        condition: 'Severe hypoglycemia (<40 mg/dL)',
        dose: dosePerKg * 1.5,
        unit: concentration === '10%' ? 'mL/kg' : 'g/kg',
        rationale: 'May increase dose by 50% for severe hypoglycemia',
      },
    ],
  };
}

/**
 * Generate dose rationale for diazepam (seizures)
 */
export function generateDiazepamRationale(
  weight: number,
  ageCategory: string,
  route: string
): DoseRationale {
  let dosePerKg: number;
  let notes: string[] = [];

  if (route === 'IV' || route === 'IO') {
    dosePerKg = 0.1; // 0.1 mg/kg IV
    notes.push('IV/IO preferred for acute seizures');
  } else if (route === 'PR') {
    dosePerKg = 0.5; // 0.5 mg/kg PR
    notes.push('Rectal route useful when IV access unavailable');
    notes.push('Preferred in infants/toddlers');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Diazepam',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Benzodiazepine for seizure termination. First-line agent for status epilepticus. Repeat every 5-10 minutes if seizures persist.`,
    notes,
    alternatives: [
      {
        condition: 'Seizure recurrence',
        dose: dosePerKg * weight,
        unit: 'mg',
        rationale: 'Repeat dose every 5-10 minutes (max 3 doses)',
      },
      {
        condition: 'Ongoing seizures after 3 doses',
        dose: 0,
        unit: 'mg',
        rationale: 'Consider fosphenytoin or levetiracetam',
      },
    ],
  };
}

/**
 * Generate dose rationale for fluid bolus
 */
export function generateFluidBoluRationale(
  weight: number,
  ageCategory: string,
  fluidType: string
): DoseRationale {
  const dosePerKg = 20; // 20 mL/kg standard bolus
  const dose = dosePerKg * weight;

  return {
    drug: `${fluidType} Bolus`,
    dose,
    unit: 'mL',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mL/kg × ${weight} kg = ${dose} mL`,
    guideline: 'AHA 2020 PALS / Sepsis Protocol',
    rationale: `Rapid fluid resuscitation for shock. Give ${dosePerKg} mL/kg over 15-30 minutes. Reassess perfusion after each bolus. May repeat up to 60 mL/kg total.`,
    notes: [
      'Use isotonic crystalloid (Ringer\'s Lactate or Normal Saline)',
      'Reassess perfusion after each bolus',
      'Monitor for fluid overload (pulmonary edema)',
      'Consider vasopressors if hypotension persists after 60 mL/kg',
    ],
  };
}

/**
 * Get dose rationale by drug name
 */
export function getDoseRationale(
  drug: string,
  weight: number,
  ageCategory: string,
  route: string = 'IV',
  additionalParams?: Record<string, any>
): DoseRationale | null {
  switch (drug.toLowerCase()) {
    case 'epinephrine':
      return generateEpinephrineRationale(
        weight,
        ageCategory,
        route,
        additionalParams?.isFirstDose ?? true
      );
    case 'amiodarone':
      return generateAmiodaroneRationale(
        weight,
        ageCategory,
        additionalParams?.isFirstDose ?? true
      );
    case 'dextrose':
    case 'glucose':
      return generateGlucoseRationale(
        weight,
        ageCategory,
        additionalParams?.glucoseLevel ?? 0
      );
    case 'diazepam':
      return generateDiazepamRationale(weight, ageCategory, route);
    case 'fluid':
    case 'bolus':
      return generateFluidBoluRationale(
        weight,
        ageCategory,
        additionalParams?.fluidType ?? 'Crystalloid'
      );
    default:
      return null;
  }
}

/**
 * Format dose rationale for display
 */
export function formatDoseRationale(rationale: DoseRationale): string {
  return `${rationale.drug} ${rationale.dose} ${rationale.unit} ${rationale.route}
  
Calculation: ${rationale.calculation}
Guideline: ${rationale.guideline}

${rationale.rationale}

${rationale.notes.map((n) => `• ${n}`).join('\n')}`;
}
