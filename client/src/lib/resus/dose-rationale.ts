/**
 * Dose Rationale Engine for ResusGPS
 *
 * Provides evidence-based explanations for every dose calculation.
 * References AHA 2020 PALS guidelines and WHO ETAT (Emergency Triage, Assessment
 * and Treatment) protocols for low-resource settings.
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

// ─── Epinephrine ─────────────────────────────────────────────

export function generateEpinephrineRationale(
  weight: number,
  ageCategory: string,
  route: string,
  isFirstDose: boolean
): DoseRationale {
  const dosePerKg = ageCategory === 'neonate' && isFirstDose ? 0.1 : 0.01;
  const concentration = ageCategory === 'neonate' && isFirstDose ? '1:10,000' : '1:1,000';
  const notes: string[] = [];

  if (ageCategory === 'neonate' && isFirstDose) {
    notes.push('Use 1:10,000 concentration (not 1:1,000)');
    notes.push('Neonatal resuscitation protocol');
  } else {
    notes.push('Standard PALS dose: 0.01 mg/kg (0.1 mL/kg of 1:10,000)');
    notes.push('Repeat every 3–5 minutes if no ROSC');
    notes.push('Max single dose: 1 mg');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Epinephrine',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose.toFixed(2)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Epinephrine increases coronary and cerebral perfusion pressure during cardiac arrest by stimulating alpha-adrenergic receptors. It is the first-line vasopressor for all pulseless rhythms. Dose is ${dosePerKg} mg/kg IV/IO. Repeat every 3–5 minutes if no ROSC.`,
    notes,
    alternatives: [
      {
        condition: 'Refractory VF/pulseless VT — repeat dose',
        dose: dose,
        unit: 'mg',
        rationale: 'Repeat every 3–5 minutes if no ROSC',
      },
      {
        condition: 'Hypotension (not arrest) — continuous infusion',
        dose: 0.1 * weight,
        unit: 'mcg/kg/min',
        rationale: 'Continuous infusion at 0.1–1 mcg/kg/min for vasopressor support',
      },
    ],
  };
}

// ─── Amiodarone ───────────────────────────────────────────────

export function generateAmiodaroneRationale(
  weight: number,
  ageCategory: string,
  isFirstDose: boolean
): DoseRationale {
  const dosePerKg = isFirstDose ? 5 : 2.5;
  const maxDose = isFirstDose ? 300 : 150;
  const dose = Math.min(dosePerKg * weight, maxDose);

  return {
    drug: 'Amiodarone',
    dose,
    unit: 'mg',
    route: 'IV/IO',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${(dosePerKg * weight).toFixed(0)} mg (max ${maxDose} mg) → ${dose.toFixed(0)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Amiodarone is a class III antiarrhythmic used for refractory VF/pulseless VT. Give ${dosePerKg} mg/kg IV/IO after the first dose of epinephrine and failed defibrillation. It prolongs the action potential and refractory period.`,
    notes: [
      `${isFirstDose ? 'First' : 'Second'} dose: ${dosePerKg} mg/kg (max ${maxDose} mg)`,
      'Dilute in 5% dextrose or normal saline',
      'Give as rapid IV push during arrest',
      'Monitor for hypotension and bradycardia after ROSC',
    ],
  };
}

// ─── Adenosine ────────────────────────────────────────────────

export function generateAdenosineRationale(
  weight: number,
  ageCategory: string,
  isFirstDose: boolean
): DoseRationale {
  const dosePerKg = isFirstDose ? 0.1 : 0.2;
  const maxDose = isFirstDose ? 6 : 12;
  const dose = Math.min(dosePerKg * weight, maxDose);

  return {
    drug: 'Adenosine',
    dose,
    unit: 'mg',
    route: 'IV (rapid push)',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${(dosePerKg * weight).toFixed(2)} mg (max ${maxDose} mg) → ${dose.toFixed(1)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Adenosine is the first-line drug for SVT (supraventricular tachycardia) with a pulse. It transiently blocks AV node conduction, terminating re-entrant circuits. Must be given as a RAPID IV push followed immediately by a 5–10 mL NS flush.`,
    notes: [
      'RAPID IV push — half-life is <10 seconds',
      'Use the most proximal IV site available',
      'Follow immediately with 5–10 mL NS flush',
      `${isFirstDose ? 'First dose: 0.1 mg/kg (max 6 mg)' : 'Second dose: 0.2 mg/kg (max 12 mg)'}`,
      'Monitor ECG continuously — transient asystole is expected',
      'Not effective for atrial flutter or VT',
    ],
  };
}

// ─── Atropine ─────────────────────────────────────────────────

export function generateAtropineRationale(
  weight: number,
  ageCategory: string,
  indication: string = 'bradycardia'
): DoseRationale {
  let dosePerKg = 0.02;
  const minDose = 0.1; // Avoid paradoxical bradycardia
  const maxDose = indication === 'intubation' ? 0.5 : 1.0;
  const dose = Math.min(Math.max(dosePerKg * weight, minDose), maxDose);

  const notes: string[] = [
    `Minimum dose: ${minDose} mg (avoid paradoxical bradycardia with smaller doses)`,
    `Maximum dose: ${maxDose} mg`,
    'Repeat every 3–5 minutes if needed (max 3 doses)',
  ];

  if (indication === 'intubation') {
    notes.push('Pre-intubation: prevents vagal bradycardia during laryngoscopy');
    notes.push('Give 1–2 minutes before intubation attempt');
  }

  return {
    drug: 'Atropine',
    dose,
    unit: 'mg',
    route: 'IV/IO',
    ageCategory,
    weight,
    calculation: `0.02 mg/kg × ${weight} kg = ${(dosePerKg * weight).toFixed(2)} mg → ${dose.toFixed(2)} mg (min ${minDose} mg, max ${maxDose} mg)`,
    guideline: 'AHA 2020 PALS',
    rationale: `Atropine is an anticholinergic that blocks vagal tone, increasing heart rate. Used for symptomatic bradycardia (HR <60 with poor perfusion) and pre-intubation to prevent vagal bradycardia. Minimum dose of 0.1 mg prevents paradoxical bradycardia.`,
    notes,
  };
}

// ─── Midazolam ────────────────────────────────────────────────

export function generateMidazolamRationale(
  weight: number,
  ageCategory: string,
  route: string
): DoseRationale {
  let dosePerKg: number;
  const notes: string[] = [];

  if (route === 'IN' || route === 'intranasal') {
    dosePerKg = 0.2;
    notes.push('Intranasal: use concentrated formulation (5 mg/mL)');
    notes.push('Split dose between nostrils for volumes >0.5 mL per nostril');
    notes.push('Onset 5–10 minutes');
  } else if (route === 'IM') {
    dosePerKg = 0.2;
    notes.push('IM onset 10–15 minutes');
  } else {
    dosePerKg = 0.1;
    notes.push('IV/IO: give slowly over 2–3 minutes');
    notes.push('Onset 2–5 minutes');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Midazolam',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose.toFixed(2)} mg`,
    guideline: 'AHA 2020 PALS / WHO ETAT',
    rationale: `Midazolam is a short-acting benzodiazepine used for acute seizure termination, procedural sedation, and pre-intubation. Intranasal and IM routes are preferred when IV access is unavailable. Monitor for respiratory depression.`,
    notes,
    alternatives: [
      {
        condition: 'Seizure recurrence',
        dose: dose,
        unit: 'mg',
        rationale: 'Repeat dose after 5–10 minutes if seizures persist',
      },
    ],
  };
}

// ─── Lorazepam ────────────────────────────────────────────────

export function generateLorazepamRationale(
  weight: number,
  ageCategory: string,
  route: string
): DoseRationale {
  const dosePerKg = 0.05;
  const maxDose = 4;
  const dose = Math.min(dosePerKg * weight, maxDose);

  return {
    drug: 'Lorazepam',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${(dosePerKg * weight).toFixed(2)} mg (max ${maxDose} mg) → ${dose.toFixed(2)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Lorazepam is a benzodiazepine for status epilepticus. Longer duration of action than diazepam. Give IV/IO slowly. Repeat every 5–10 minutes if seizures persist (max 2 doses).`,
    notes: [
      `Max single dose: ${maxDose} mg`,
      'Give IV slowly over 2 minutes',
      'Monitor for respiratory depression and hypotension',
      'Refrigerate — stable at room temperature for 2 weeks',
    ],
  };
}

// ─── Morphine ─────────────────────────────────────────────────

export function generateMorphineRationale(
  weight: number,
  ageCategory: string,
  route: string
): DoseRationale {
  const dosePerKg = 0.1;
  const dose = dosePerKg * weight;

  return {
    drug: 'Morphine',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose.toFixed(2)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Morphine is an opioid analgesic for moderate-to-severe pain. Titrate to effect. Monitor for respiratory depression, especially in neonates and infants. Have naloxone available.`,
    notes: [
      'Give IV slowly over 5 minutes',
      'Titrate to pain response',
      'Monitor respiratory rate and SpO2',
      'Have naloxone (0.01 mg/kg IV) available for reversal',
      'Avoid in neonates < 1 month — use with extreme caution',
    ],
  };
}

// ─── Ketamine ─────────────────────────────────────────────────

export function generateKetamineRationale(
  weight: number,
  ageCategory: string,
  indication: string = 'procedural_sedation'
): DoseRationale {
  let dosePerKg: number;
  let route: string;
  const notes: string[] = [];

  if (indication === 'intubation' || indication === 'rsi') {
    dosePerKg = 1.5;
    route = 'IV';
    notes.push('RSI dose: 1.5–2 mg/kg IV');
    notes.push('Maintains airway reflexes better than other induction agents');
    notes.push('Increases secretions — consider atropine pre-treatment');
    notes.push('Bronchodilator effect — preferred in asthma');
  } else {
    dosePerKg = 1.0;
    route = 'IV/IM';
    notes.push('Procedural sedation: 1–2 mg/kg IV or 4–5 mg/kg IM');
    notes.push('Dissociative anesthetic — maintains airway reflexes');
    notes.push('Excellent analgesic and amnestic properties');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Ketamine',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose.toFixed(0)} mg`,
    guideline: 'AHA 2020 PALS / WHO ETAT',
    rationale: `Ketamine is a dissociative anesthetic that provides analgesia, sedation, and amnesia while maintaining airway reflexes and hemodynamic stability. Preferred for procedural sedation and RSI in hemodynamically unstable patients. Bronchodilator effect makes it ideal for severe asthma.`,
    notes,
  };
}

// ─── Salbutamol (Albuterol) ───────────────────────────────────

export function generateSalbutamolRationale(
  weight: number,
  ageCategory: string,
  route: string
): DoseRationale {
  let dose: number;
  let unit: string;
  let calculation: string;
  const notes: string[] = [];

  if (route === 'nebulized' || route === 'NEB') {
    dose = weight < 20 ? 2.5 : 5.0;
    unit = 'mg';
    calculation = `${weight < 20 ? '2.5 mg' : '5 mg'} (weight-based: <20 kg → 2.5 mg, ≥20 kg → 5 mg)`;
    notes.push('Nebulize in 3 mL normal saline over 5–10 minutes');
    notes.push('Can repeat every 20 minutes for 3 doses in severe asthma');
    notes.push('Continuous nebulization may be used in life-threatening asthma');
  } else if (route === 'MDI' || route === 'inhaler') {
    dose = 4;
    unit = 'puffs';
    calculation = '4–8 puffs via spacer (100 mcg/puff)';
    notes.push('Use spacer device for optimal delivery');
    notes.push('4–8 puffs = equivalent to one nebulization');
  } else {
    dose = 0.015 * weight;
    unit = 'mg';
    calculation = `0.015 mg/kg × ${weight} kg = ${(0.015 * weight).toFixed(2)} mg IV`;
    notes.push('IV route for life-threatening bronchospasm when nebulized route fails');
    notes.push('Give slowly over 10 minutes');
    notes.push('Monitor for tachycardia and hypokalemia');
  }

  return {
    drug: 'Salbutamol',
    dose,
    unit,
    route,
    ageCategory,
    weight,
    calculation,
    guideline: 'AHA 2020 PALS / GINA Asthma Guidelines',
    rationale: `Salbutamol (albuterol) is a short-acting beta-2 agonist that relaxes bronchial smooth muscle. First-line treatment for acute bronchospasm in asthma and anaphylaxis. Nebulized route preferred; IV for life-threatening bronchospasm.`,
    notes,
  };
}

// ─── Magnesium Sulfate ────────────────────────────────────────

export function generateMagnesiumRationale(
  weight: number,
  ageCategory: string,
  indication: string = 'asthma'
): DoseRationale {
  const dosePerKg = 25; // 25–50 mg/kg
  const maxDose = 2000; // 2 g max
  const dose = Math.min(dosePerKg * weight, maxDose);

  const notes: string[] = [
    `Max dose: ${maxDose} mg (2 g)`,
    'Dilute in 50–100 mL NS or 5% dextrose',
    'Infuse over 20 minutes (faster in arrest)',
    'Monitor for hypotension and respiratory depression',
    'Have calcium gluconate available as antidote',
  ];

  if (indication === 'torsades') {
    notes.push('For Torsades de Pointes: give as rapid IV push during arrest');
  }

  return {
    drug: 'Magnesium Sulfate',
    dose,
    unit: 'mg',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${(dosePerKg * weight).toFixed(0)} mg (max ${maxDose} mg) → ${dose.toFixed(0)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Magnesium sulfate is used for severe refractory asthma (bronchodilator), Torsades de Pointes (antiarrhythmic), and hypomagnesemia. It blocks calcium channels in smooth and cardiac muscle. Dose is 25–50 mg/kg IV over 20 minutes.`,
    notes,
  };
}

// ─── Sodium Bicarbonate ───────────────────────────────────────

export function generateSodiumBicarbonateRationale(
  weight: number,
  ageCategory: string
): DoseRationale {
  const dosePerKg = 1; // 1 mEq/kg
  const dose = dosePerKg * weight;

  return {
    drug: 'Sodium Bicarbonate',
    dose,
    unit: 'mEq',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mEq/kg × ${weight} kg = ${dose.toFixed(0)} mEq`,
    guideline: 'AHA 2020 PALS',
    rationale: `Sodium bicarbonate buffers metabolic acidosis. Use only after adequate ventilation is established. Routine use in cardiac arrest is NOT recommended — only for specific indications: severe metabolic acidosis (pH <7.1), hyperkalemia, tricyclic antidepressant overdose, or prolonged arrest.`,
    notes: [
      'NOT recommended for routine use in cardiac arrest',
      'Ensure adequate ventilation before giving (CO2 must be exhaled)',
      'Use 4.2% (0.5 mEq/mL) in neonates to avoid hypertonicity',
      'Use 8.4% (1 mEq/mL) in children',
      'Flush line with NS before and after — incompatible with calcium',
      'Indications: severe metabolic acidosis, hyperkalemia, TCA overdose',
    ],
  };
}

// ─── Calcium Gluconate ────────────────────────────────────────

export function generateCalciumGluconateRationale(
  weight: number,
  ageCategory: string,
  indication: string = 'hypocalcemia'
): DoseRationale {
  const dosePerKg = 100; // 100 mg/kg = 1 mL/kg of 10% solution
  const maxDose = 3000; // 3 g max
  const dose = Math.min(dosePerKg * weight, maxDose);
  const volumeMl = dose / 100; // 10% calcium gluconate = 100 mg/mL

  return {
    drug: 'Calcium Gluconate',
    dose,
    unit: 'mg',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${(dosePerKg * weight).toFixed(0)} mg → ${volumeMl.toFixed(1)} mL of 10% solution (max ${maxDose} mg)`,
    guideline: 'AHA 2020 PALS',
    rationale: `Calcium gluconate is used for hypocalcemia, hyperkalemia (membrane stabilization), hypermagnesemia, and calcium channel blocker overdose. It stabilizes cardiac membranes and improves myocardial contractility.`,
    notes: [
      `Dose: ${dosePerKg} mg/kg = ${volumeMl.toFixed(1)} mL of 10% solution`,
      'Give slowly IV over 5–10 minutes (risk of bradycardia if rapid)',
      'Monitor ECG during infusion',
      'Flush line with NS — incompatible with sodium bicarbonate',
      'Antidote for magnesium toxicity',
      indication === 'hyperkalemia' ? 'For hyperkalemia: stabilizes cardiac membrane (does not lower K+)' : '',
    ].filter(Boolean),
  };
}

// ─── Glucose / Dextrose ───────────────────────────────────────

export function generateGlucoseRationale(
  weight: number,
  ageCategory: string,
  glucoseLevel: number
): DoseRationale {
  let concentration: string;
  let dosePerKg: number;
  const notes: string[] = [];

  if (ageCategory === 'neonate') {
    concentration = '10%';
    dosePerKg = 2; // 2–5 mL/kg of 10% dextrose
    notes.push('Use 10% dextrose (avoid hypertonic solutions in neonates)');
    notes.push('Neonatal hypoglycemia protocol');
    notes.push('Target glucose: 2.6–6.0 mmol/L (47–108 mg/dL)');
  } else {
    concentration = '25%';
    dosePerKg = 0.5; // 0.5–1 g/kg
    notes.push('Use 25% dextrose for older children (10% acceptable)');
    notes.push('Target glucose: >3.3 mmol/L (60 mg/dL)');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Dextrose',
    dose,
    unit: concentration === '10%' ? 'mL/kg' : 'g/kg',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} ${concentration === '10%' ? 'mL/kg' : 'g/kg'} × ${weight} kg = ${dose.toFixed(1)} ${concentration === '10%' ? 'mL' : 'g'}`,
    guideline: 'AHA 2020 PALS / WHO ETAT',
    rationale: `Hypoglycemia worsens outcomes in critically ill children. Treat if glucose <3.3 mmol/L (60 mg/dL) or symptomatic. Use ${concentration} dextrose. Recheck glucose 15–30 minutes after treatment.`,
    notes,
    alternatives: [
      {
        condition: 'Severe hypoglycemia (<2.2 mmol/L)',
        dose: dosePerKg * 1.5,
        unit: concentration === '10%' ? 'mL/kg' : 'g/kg',
        rationale: 'May increase dose by 50% for severe hypoglycemia',
      },
    ],
  };
}

// ─── Diazepam ─────────────────────────────────────────────────

export function generateDiazepamRationale(
  weight: number,
  ageCategory: string,
  route: string
): DoseRationale {
  let dosePerKg = 0.1;
  const notes: string[] = [];

  if (route === 'IV' || route === 'IO') {
    dosePerKg = 0.1;
    notes.push('IV/IO preferred for acute seizures');
    notes.push('Give slowly over 2–3 minutes');
  } else if (route === 'PR') {
    dosePerKg = 0.5;
    notes.push('Rectal route useful when IV access unavailable');
    notes.push('Preferred in infants and toddlers');
  } else {
    notes.push('Defaulted to IV dosing');
  }

  const dose = dosePerKg * weight;

  return {
    drug: 'Diazepam',
    dose,
    unit: 'mg',
    route,
    ageCategory,
    weight,
    calculation: `${dosePerKg} mg/kg × ${weight} kg = ${dose.toFixed(2)} mg`,
    guideline: 'AHA 2020 PALS',
    rationale: `Benzodiazepine for seizure termination. First-line agent for status epilepticus. Repeat every 5–10 minutes if seizures persist (max 3 doses). If seizures continue after 3 doses, escalate to fosphenytoin or levetiracetam.`,
    notes,
    alternatives: [
      {
        condition: 'Seizure recurrence',
        dose,
        unit: 'mg',
        rationale: 'Repeat dose every 5–10 minutes (max 3 doses)',
      },
      {
        condition: 'Ongoing seizures after 3 doses',
        dose: 0,
        unit: 'mg',
        rationale: 'Consider fosphenytoin 20 mg PE/kg or levetiracetam 40–60 mg/kg',
      },
    ],
  };
}

// ─── Fluid Bolus ──────────────────────────────────────────────

export function generateFluidBoluRationale(
  weight: number,
  ageCategory: string,
  fluidType: string
): DoseRationale {
  const dosePerKg = 20;
  const dose = dosePerKg * weight;

  return {
    drug: `${fluidType} Bolus`,
    dose,
    unit: 'mL',
    route: 'IV',
    ageCategory,
    weight,
    calculation: `${dosePerKg} mL/kg × ${weight} kg = ${dose.toFixed(0)} mL`,
    guideline: 'AHA 2020 PALS / Sepsis Protocol',
    rationale: `Rapid fluid resuscitation for shock. Give ${dosePerKg} mL/kg over 15–30 minutes. Reassess perfusion after each bolus. May repeat up to 60 mL/kg total. Stop if signs of fluid overload appear.`,
    notes: [
      "Use isotonic crystalloid (Ringer's Lactate preferred, or Normal Saline)",
      'Reassess perfusion after each bolus (HR, CRT, mental status)',
      'Monitor for fluid overload (crackles, hepatomegaly, increased WOB)',
      'Consider vasopressors if hypotension persists after 60 mL/kg',
      'In septic shock: target MAP ≥ 5th percentile for age',
    ],
  };
}

// ─── Main Lookup ──────────────────────────────────────────────

/**
 * Get dose rationale by drug name (case-insensitive)
 */
export function getDoseRationale(
  drug: string,
  weight: number,
  ageCategory: string,
  route: string = 'IV',
  additionalParams?: Record<string, unknown>
): DoseRationale | null {
  const d = drug.toLowerCase().trim();

  switch (true) {
    // Epinephrine / Adrenaline
    case d.includes('epinephrine') || d.includes('adrenaline') || d.includes('epi'):
      return generateEpinephrineRationale(
        weight, ageCategory, route, additionalParams?.isFirstDose as boolean ?? true
      );

    // Amiodarone
    case d.includes('amiodarone'):
      return generateAmiodaroneRationale(
        weight, ageCategory, additionalParams?.isFirstDose as boolean ?? true
      );

    // Adenosine
    case d.includes('adenosine'):
      return generateAdenosineRationale(
        weight, ageCategory, additionalParams?.isFirstDose as boolean ?? true
      );

    // Atropine
    case d.includes('atropine'):
      return generateAtropineRationale(
        weight, ageCategory, additionalParams?.indication as string ?? 'bradycardia'
      );

    // Midazolam
    case d.includes('midazolam') || d.includes('versed'):
      return generateMidazolamRationale(weight, ageCategory, route);

    // Lorazepam / Ativan
    case d.includes('lorazepam') || d.includes('ativan'):
      return generateLorazepamRationale(weight, ageCategory, route);

    // Diazepam / Valium
    case d.includes('diazepam') || d.includes('valium'):
      return generateDiazepamRationale(weight, ageCategory, route);

    // Morphine
    case d.includes('morphine'):
      return generateMorphineRationale(weight, ageCategory, route);

    // Ketamine
    case d.includes('ketamine'):
      return generateKetamineRationale(
        weight, ageCategory, additionalParams?.indication as string ?? 'procedural_sedation'
      );

    // Salbutamol / Albuterol
    case d.includes('salbutamol') || d.includes('albuterol') || d.includes('ventolin'):
      return generateSalbutamolRationale(weight, ageCategory, route);

    // Magnesium sulfate
    case d.includes('magnesium') || d.includes('mgso4'):
      return generateMagnesiumRationale(
        weight, ageCategory, additionalParams?.indication as string ?? 'asthma'
      );

    // Sodium bicarbonate
    case d.includes('bicarbonate') || d.includes('nahco3') || d.includes('bicarb'):
      return generateSodiumBicarbonateRationale(weight, ageCategory);

    // Calcium gluconate / chloride
    case d.includes('calcium'):
      return generateCalciumGluconateRationale(
        weight, ageCategory, additionalParams?.indication as string ?? 'hypocalcemia'
      );

    // Dextrose / Glucose
    case d.includes('dextrose') || d.includes('glucose') || d.includes('d10') || d.includes('d25'):
      return generateGlucoseRationale(
        weight, ageCategory, additionalParams?.glucoseLevel as number ?? 0
      );

    // Fluid bolus
    case d.includes('fluid') || d.includes('bolus') || d.includes('saline') || d.includes('ringer'):
      return generateFluidBoluRationale(
        weight, ageCategory, additionalParams?.fluidType as string ?? 'Crystalloid'
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
