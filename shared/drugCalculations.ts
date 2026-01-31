/**
 * Drug Calculation Utility
 * 
 * Based on PR-DC V1.0 Drug Compendium
 * Provides weight-based drug dosing for pediatric emergencies
 * 
 * Critical principle: No calculation by provider
 * System displays exact volume to draw up and administer
 */

export interface DrugDose {
  drugId: string;
  drugName: string;
  indication: string;
  dose: number; // mg or mcg
  volume: number; // mL
  concentration: string;
  route: string;
  maxDose?: string;
  reconstitution?: string[];
  monitoring?: string[];
  contraindications?: string[];
  reassessmentTimer?: string;
}

export interface WeightBasedDose {
  weight: number;
  dose: number;
  volume: number;
  unit: string;
}

/**
 * Epinephrine - Cardiac Arrest (IV/IO)
 * Formula: 0.01 mg/kg every 3-5 minutes
 * Concentration: 0.1 mg/mL (1:10,000)
 * Max dose: 1 mg
 */
export function calculateEpinephrineCardiacArrest(weightKg: number): DrugDose {
  const dosePerKg = 0.01; // mg/kg
  const concentration = 0.1; // mg/mL (1:10,000)
  const maxDose = 1; // mg

  let dose = weightKg * dosePerKg;
  if (dose > maxDose) dose = maxDose;

  const volume = dose / concentration;

  return {
    drugId: 'PR-DC-EPI-CA-v1.0',
    drugName: 'Epinephrine (Adrenaline)',
    indication: 'Cardiac Arrest',
    dose: dose,
    volume: Math.round(volume * 10) / 10,
    concentration: '0.1 mg/mL (1:10,000)',
    route: 'IV/IO',
    maxDose: '1 mg',
    reconstitution: [
      'Draw 1 mL of 1:1000 epinephrine (1 mg)',
      'Add to 9 mL normal saline',
      'Final concentration: 0.1 mg/mL (1:10,000)',
      'Label syringe: "EPINEPHRINE 0.1 mg/mL — IV/IO ONLY"',
    ],
    monitoring: [
      'Continuous cardiac rhythm monitoring',
      'Pulse check every 2 minutes',
      'ETCO2 if available (target >10 mmHg during CPR)',
    ],
    contraindications: ['No absolute contraindications in cardiac arrest'],
    reassessmentTimer: 'Every 3-5 minutes',
  };
}

/**
 * Epinephrine - Anaphylaxis (IM)
 * Formula: 0.01 mg/kg (max 0.5 mg)
 * Concentration: 1 mg/mL (1:1000)
 */
export function calculateEpinephrineAnaphylaxis(weightKg: number): DrugDose {
  const dosePerKg = 0.01; // mg/kg
  const concentration = 1; // mg/mL (1:1000)
  const maxDose = 0.5; // mg

  let dose = weightKg * dosePerKg;
  if (dose > maxDose) dose = maxDose;

  const volume = dose / concentration;

  return {
    drugId: 'PR-DC-EPI-ANA-v1.0',
    drugName: 'Epinephrine (Adrenaline)',
    indication: 'Anaphylaxis',
    dose: dose,
    volume: Math.round(volume * 100) / 100,
    concentration: '1 mg/mL (1:1000)',
    route: 'IM (anterolateral thigh)',
    maxDose: '0.5 mg',
    monitoring: [
      'Heart rate and blood pressure every 5 minutes',
      'Respiratory rate and oxygen saturation',
      'Skin color and perfusion',
    ],
    contraindications: ['No absolute contraindications in anaphylaxis'],
    reassessmentTimer: 'Every 5 minutes',
  };
}

/**
 * Amiodarone - Cardiac Arrest (VF/pVT)
 * Formula: 5 mg/kg IV/IO bolus (max 300 mg)
 * Concentration: 50 mg/mL
 */
export function calculateAmiodaroneCardiacArrest(weightKg: number): DrugDose {
  const dosePerKg = 5; // mg/kg
  const concentration = 50; // mg/mL
  const maxDose = 300; // mg

  let dose = weightKg * dosePerKg;
  if (dose > maxDose) dose = maxDose;

  const volume = dose / concentration;

  return {
    drugId: 'PR-DC-AMIO-CA-v1.0',
    drugName: 'Amiodarone',
    indication: 'Cardiac Arrest (VF/pVT)',
    dose: dose,
    volume: Math.round(volume * 10) / 10,
    concentration: '50 mg/mL',
    route: 'IV/IO rapid bolus',
    maxDose: '300 mg',
    monitoring: [
      'Continuous cardiac rhythm monitoring',
      'Blood pressure if ROSC achieved',
      'Watch for hypotension',
    ],
    contraindications: ['Known hypersensitivity to amiodarone or iodine'],
    reassessmentTimer: 'After 2nd defibrillation',
  };
}

/**
 * Adenosine - SVT
 * First dose: 0.1 mg/kg (max 6 mg)
 * Second dose: 0.2 mg/kg (max 12 mg)
 * Concentration: 3 mg/mL
 */
export function calculateAdenosine(weightKg: number, isFirstDose: boolean = true): DrugDose {
  const dosePerKg = isFirstDose ? 0.1 : 0.2; // mg/kg
  const concentration = 3; // mg/mL
  const maxDose = isFirstDose ? 6 : 12; // mg

  let dose = weightKg * dosePerKg;
  if (dose > maxDose) dose = maxDose;

  const volume = dose / concentration;

  return {
    drugId: 'PR-DC-ADEN-SVT-v1.0',
    drugName: 'Adenosine',
    indication: 'Supraventricular Tachycardia (SVT)',
    dose: dose,
    volume: Math.round(volume * 10) / 10,
    concentration: '3 mg/mL',
    route: 'IV rapid push followed by 5-10 mL NS flush',
    maxDose: isFirstDose ? '6 mg' : '12 mg',
    monitoring: [
      'Continuous cardiac rhythm monitoring',
      'Have defibrillator ready',
      'Monitor for transient asystole (normal)',
    ],
    contraindications: [
      'Second- or third-degree AV block',
      'Sick sinus syndrome',
      'Known hypersensitivity',
    ],
    reassessmentTimer: '1-2 minutes after administration',
  };
}

/**
 * Atropine - Bradycardia
 * Formula: 0.02 mg/kg (min 0.1 mg, max single dose 0.5 mg)
 * Concentration: 0.1 mg/mL or 1 mg/mL
 */
export function calculateAtropine(weightKg: number): DrugDose {
  const dosePerKg = 0.02; // mg/kg
  const concentration = 0.1; // mg/mL (using 0.1 for easier measurement)
  const minDose = 0.1; // mg
  const maxDose = 0.5; // mg

  let dose = weightKg * dosePerKg;
  if (dose < minDose) dose = minDose;
  if (dose > maxDose) dose = maxDose;

  const volume = dose / concentration;

  return {
    drugId: 'PR-DC-ATRO-BRADY-v1.0',
    drugName: 'Atropine',
    indication: 'Bradycardia with poor perfusion',
    dose: dose,
    volume: Math.round(volume * 10) / 10,
    concentration: '0.1 mg/mL',
    route: 'IV/IO rapid push',
    maxDose: '0.5 mg (single dose)',
    monitoring: [
      'Continuous cardiac rhythm monitoring',
      'Heart rate response',
      'Perfusion assessment',
    ],
    contraindications: ['Hypothermic bradycardia (relative)'],
    reassessmentTimer: '3-5 minutes',
  };
}

/**
 * Normal Saline - Fluid Bolus
 * Formula: 20 mL/kg (max 1000 mL)
 * For shock resuscitation
 */
export function calculateFluidBolus(weightKg: number): DrugDose {
  const volumePerKg = 20; // mL/kg
  const maxVolume = 1000; // mL

  let volume = weightKg * volumePerKg;
  if (volume > maxVolume) volume = maxVolume;

  return {
    drugId: 'PR-DC-NS-BOLUS-v1.0',
    drugName: 'Normal Saline (0.9% NaCl)',
    indication: 'Shock resuscitation',
    dose: volume,
    volume: Math.round(volume),
    concentration: 'Isotonic crystalloid',
    route: 'IV/IO rapid infusion',
    maxDose: '1000 mL per bolus',
    monitoring: [
      'Heart rate and blood pressure',
      'Perfusion (capillary refill, skin temperature)',
      'Respiratory rate and work of breathing',
      'Lung sounds (watch for fluid overload)',
    ],
    contraindications: ['Signs of heart failure or fluid overload'],
    reassessmentTimer: 'After each bolus (5-10 minutes)',
  };
}

/**
 * Dextrose 10% - Hypoglycemia
 * Formula: 2 mL/kg (provides 0.2 g/kg dextrose)
 * Max: 100 mL
 */
export function calculateDextrose10(weightKg: number): DrugDose {
  const volumePerKg = 2; // mL/kg
  const maxVolume = 100; // mL

  let volume = weightKg * volumePerKg;
  if (volume > maxVolume) volume = maxVolume;

  return {
    drugId: 'PR-DC-D10-HYPO-v1.0',
    drugName: 'Dextrose 10%',
    indication: 'Hypoglycemia',
    dose: volume * 0.1, // grams of dextrose
    volume: Math.round(volume),
    concentration: '10% (0.1 g/mL)',
    route: 'IV/IO slow push over 2-3 minutes',
    maxDose: '100 mL',
    reconstitution: [
      'If only D50% available: Dilute 1:5 with sterile water',
      'If only D5% available: Give 4 mL/kg',
    ],
    monitoring: [
      'Blood glucose before and 15 minutes after',
      'Continuous monitoring if altered consciousness',
      'Watch IV site for extravasation',
    ],
    contraindications: ['None in emergency hypoglycemia'],
    reassessmentTimer: '15 minutes (recheck glucose)',
  };
}

/**
 * Salbutamol (Albuterol) - Bronchospasm
 * Nebulized dose based on age/weight
 */
export function calculateSalbutamol(weightKg: number): DrugDose {
  let dose: number;
  let volume: number;

  if (weightKg < 20) {
    dose = 2.5; // mg
    volume = 2.5; // mL of 1 mg/mL solution
  } else {
    dose = 5; // mg
    volume = 5; // mL of 1 mg/mL solution
  }

  return {
    drugId: 'PR-DC-SALB-BRONCH-v1.0',
    drugName: 'Salbutamol (Albuterol)',
    indication: 'Bronchospasm (asthma, bronchiolitis)',
    dose: dose,
    volume: volume,
    concentration: '1 mg/mL (0.5% solution)',
    route: 'Nebulized with oxygen',
    maxDose: '5 mg per dose',
    monitoring: [
      'Respiratory rate and work of breathing',
      'Oxygen saturation',
      'Heart rate (watch for tachycardia)',
      'Lung sounds',
    ],
    contraindications: ['None in emergency bronchospasm'],
    reassessmentTimer: 'Every 20 minutes for first hour',
  };
}

/**
 * Hydrocortisone - Anaphylaxis/Status Asthmaticus
 * Formula: 4 mg/kg IV/IO (max 100 mg)
 */
export function calculateHydrocortisone(weightKg: number): DrugDose {
  const dosePerKg = 4; // mg/kg
  const maxDose = 100; // mg

  let dose = weightKg * dosePerKg;
  if (dose > maxDose) dose = maxDose;

  // Hydrocortisone typically comes as 100 mg powder for reconstitution
  const volume = dose / 50; // Assuming reconstituted to 50 mg/mL

  return {
    drugId: 'PR-DC-HYDRO-ANA-v1.0',
    drugName: 'Hydrocortisone',
    indication: 'Anaphylaxis / Status Asthmaticus',
    dose: dose,
    volume: Math.round(volume * 10) / 10,
    concentration: '50 mg/mL (after reconstitution)',
    route: 'IV/IO slow push',
    maxDose: '100 mg',
    reconstitution: [
      'Add 2 mL sterile water to 100 mg vial',
      'Final concentration: 50 mg/mL',
    ],
    monitoring: [
      'Blood pressure',
      'Blood glucose (steroids can raise glucose)',
    ],
    contraindications: ['None in emergency situations'],
    reassessmentTimer: '30-60 minutes',
  };
}

/**
 * Diazepam - Seizures
 * Formula: 0.2-0.3 mg/kg IV/IO (max 10 mg)
 * Rectal: 0.5 mg/kg (max 20 mg)
 */
export function calculateDiazepam(weightKg: number, route: 'IV' | 'rectal' = 'IV'): DrugDose {
  const dosePerKg = route === 'IV' ? 0.3 : 0.5; // mg/kg
  const concentration = 5; // mg/mL
  const maxDose = route === 'IV' ? 10 : 20; // mg

  let dose = weightKg * dosePerKg;
  if (dose > maxDose) dose = maxDose;

  const volume = dose / concentration;

  return {
    drugId: 'PR-DC-DIAZ-SEIZ-v1.0',
    drugName: 'Diazepam',
    indication: 'Seizures',
    dose: dose,
    volume: Math.round(volume * 10) / 10,
    concentration: '5 mg/mL',
    route: route === 'IV' ? 'IV/IO slow push (over 2-3 min)' : 'Rectal',
    maxDose: route === 'IV' ? '10 mg' : '20 mg',
    monitoring: [
      'Respiratory rate and effort',
      'Oxygen saturation',
      'Seizure activity',
      'Level of consciousness',
    ],
    contraindications: [
      'Respiratory depression (relative)',
      'Known hypersensitivity',
    ],
    reassessmentTimer: '5 minutes',
  };
}

/**
 * Get drug dose by drug ID and weight
 */
export function getDrugDose(drugId: string, weightKg: number, options?: { isFirstDose?: boolean; route?: 'IV' | 'rectal' }): DrugDose | null {
  switch (drugId) {
    case 'PR-DC-EPI-CA-v1.0':
      return calculateEpinephrineCardiacArrest(weightKg);
    case 'PR-DC-EPI-ANA-v1.0':
      return calculateEpinephrineAnaphylaxis(weightKg);
    case 'PR-DC-AMIO-CA-v1.0':
      return calculateAmiodaroneCardiacArrest(weightKg);
    case 'PR-DC-ADEN-SVT-v1.0':
      return calculateAdenosine(weightKg, options?.isFirstDose);
    case 'PR-DC-ATRO-BRADY-v1.0':
      return calculateAtropine(weightKg);
    case 'PR-DC-NS-BOLUS-v1.0':
      return calculateFluidBolus(weightKg);
    case 'PR-DC-D10-HYPO-v1.0':
      return calculateDextrose10(weightKg);
    case 'PR-DC-SALB-BRONCH-v1.0':
      return calculateSalbutamol(weightKg);
    case 'PR-DC-HYDRO-ANA-v1.0':
      return calculateHydrocortisone(weightKg);
    case 'PR-DC-DIAZ-SEIZ-v1.0':
      return calculateDiazepam(weightKg, options?.route);
    default:
      return null;
  }
}

/**
 * Get all available drugs
 */
export function getAllDrugs(): Array<{ id: string; name: string; indications: string[] }> {
  return [
    {
      id: 'PR-DC-EPI-CA-v1.0',
      name: 'Epinephrine (Cardiac Arrest)',
      indications: ['Cardiac Arrest', 'Asystole', 'PEA', 'VF/pVT'],
    },
    {
      id: 'PR-DC-EPI-ANA-v1.0',
      name: 'Epinephrine (Anaphylaxis)',
      indications: ['Anaphylaxis', 'Severe allergic reaction'],
    },
    {
      id: 'PR-DC-AMIO-CA-v1.0',
      name: 'Amiodarone',
      indications: ['VF/pVT', 'Refractory cardiac arrest'],
    },
    {
      id: 'PR-DC-ADEN-SVT-v1.0',
      name: 'Adenosine',
      indications: ['SVT', 'Supraventricular tachycardia'],
    },
    {
      id: 'PR-DC-ATRO-BRADY-v1.0',
      name: 'Atropine',
      indications: ['Bradycardia with poor perfusion'],
    },
    {
      id: 'PR-DC-NS-BOLUS-v1.0',
      name: 'Normal Saline Bolus',
      indications: ['Shock', 'Hypovolemia', 'Dehydration'],
    },
    {
      id: 'PR-DC-D10-HYPO-v1.0',
      name: 'Dextrose 10%',
      indications: ['Hypoglycemia', 'Altered consciousness'],
    },
    {
      id: 'PR-DC-SALB-BRONCH-v1.0',
      name: 'Salbutamol (Albuterol)',
      indications: ['Bronchospasm', 'Asthma', 'Bronchiolitis'],
    },
    {
      id: 'PR-DC-HYDRO-ANA-v1.0',
      name: 'Hydrocortisone',
      indications: ['Anaphylaxis', 'Status Asthmaticus', 'Adrenal crisis'],
    },
    {
      id: 'PR-DC-DIAZ-SEIZ-v1.0',
      name: 'Diazepam',
      indications: ['Seizures', 'Status epilepticus'],
    },
  ];
}
