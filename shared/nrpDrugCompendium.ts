/**
 * NRP Drug Compendium
 * 
 * Neonatal-specific drug dosing based on NRP 8th Edition and AHA 2025 Guidelines.
 * All doses are weight-based for newborns (typically 0.5-5 kg).
 * 
 * CRITICAL: Neonatal dosing differs significantly from pediatric dosing.
 * This module should ONLY be used for newborns (0-28 days of life).
 */

export interface NRPDrug {
  id: string;
  name: string;
  genericName: string;
  indication: string;
  concentration: string;
  dosePerKg: number;
  doseUnit: string;
  volumePerKg: number;
  volumeUnit: string;
  route: 'IV' | 'UVC' | 'ETT' | 'IO' | 'IM';
  maxDose?: number;
  minDose?: number;
  frequency: string;
  administrationTime: string;
  flush: string;
  monitoring: string[];
  warnings: string[];
  reconstitution?: string;
  lmicAvailability: 'high' | 'medium' | 'low';
}

export interface NRPDrugCalculation {
  drug: NRPDrug;
  weightKg: number;
  calculatedDose: number;
  calculatedVolume: number;
  displayDose: string;
  displayVolume: string;
  administrationInstructions: string[];
}

/**
 * NRP Drug Database
 * Based on NRP 8th Edition and AHA 2025 Neonatal Resuscitation Guidelines
 */
export const NRP_DRUGS: NRPDrug[] = [
  // EPINEPHRINE - IV/UVC Route
  {
    id: 'NRP-EPI-IV-v1.0',
    name: 'Epinephrine (IV/UVC)',
    genericName: 'Epinephrine',
    indication: 'Heart rate <60/min despite 30 seconds of effective PPV with chest compressions',
    concentration: '1:10,000 (0.1 mg/mL)',
    dosePerKg: 0.02, // 0.01-0.03 mg/kg, using middle of range
    doseUnit: 'mg',
    volumePerKg: 0.2, // 0.1-0.3 mL/kg
    volumeUnit: 'mL',
    route: 'UVC',
    maxDose: 0.03,
    minDose: 0.01,
    frequency: 'Every 3-5 minutes',
    administrationTime: 'Rapid push',
    flush: '0.5-1 mL normal saline',
    monitoring: [
      'Heart rate response within 60 seconds',
      'Continuous cardiac monitoring',
      'Pulse oximetry',
    ],
    warnings: [
      'Ensure UVC is properly positioned before administration',
      'Do not use 1:1000 concentration - must be 1:10,000',
      'Higher doses may cause hypertension and tachycardia',
    ],
    lmicAvailability: 'high',
  },

  // EPINEPHRINE - ETT Route (higher dose)
  {
    id: 'NRP-EPI-ETT-v1.0',
    name: 'Epinephrine (ETT)',
    genericName: 'Epinephrine',
    indication: 'Heart rate <60/min when IV/UVC access not available',
    concentration: '1:10,000 (0.1 mg/mL)',
    dosePerKg: 0.075, // 0.05-0.1 mg/kg, using middle of range
    doseUnit: 'mg',
    volumePerKg: 0.75, // 0.5-1.0 mL/kg
    volumeUnit: 'mL',
    route: 'ETT',
    maxDose: 0.1,
    minDose: 0.05,
    frequency: 'Every 3-5 minutes',
    administrationTime: 'Rapid instillation followed by PPV',
    flush: 'Follow with several positive pressure breaths',
    monitoring: [
      'Heart rate response within 60 seconds',
      'Continuous cardiac monitoring',
      'Pulse oximetry',
    ],
    warnings: [
      'ETT route is less effective than IV/UVC',
      'Establish IV/UVC access as soon as possible',
      'Higher dose required for ETT route',
      'Absorption is unpredictable',
    ],
    lmicAvailability: 'high',
  },

  // NORMAL SALINE - Volume Expansion
  {
    id: 'NRP-NS-VOLUME-v1.0',
    name: 'Normal Saline (Volume Expansion)',
    genericName: 'Sodium Chloride 0.9%',
    indication: 'Suspected hypovolemia, blood loss, or poor response to resuscitation',
    concentration: '0.9%',
    dosePerKg: 10,
    doseUnit: 'mL',
    volumePerKg: 10,
    volumeUnit: 'mL',
    route: 'UVC',
    maxDose: 10,
    minDose: 10,
    frequency: 'May repeat if needed',
    administrationTime: 'Over 5-10 minutes',
    flush: 'N/A',
    monitoring: [
      'Heart rate response',
      'Perfusion (capillary refill, color)',
      'Blood pressure if available',
      'Signs of fluid overload',
    ],
    warnings: [
      'Avoid rapid bolus in preterm infants - risk of IVH',
      'Consider blood products if significant hemorrhage',
      'Monitor for signs of fluid overload',
    ],
    lmicAvailability: 'high',
  },

  // DEXTROSE 10% - Hypoglycemia
  {
    id: 'NRP-D10-HYPO-v1.0',
    name: 'Dextrose 10%',
    genericName: 'Dextrose',
    indication: 'Documented hypoglycemia (<40 mg/dL) in newborn',
    concentration: '10%',
    dosePerKg: 2, // 2 mL/kg of D10 = 200 mg/kg glucose
    doseUnit: 'mL',
    volumePerKg: 2,
    volumeUnit: 'mL',
    route: 'UVC',
    maxDose: 5,
    minDose: 2,
    frequency: 'As needed based on glucose monitoring',
    administrationTime: 'Over 5-10 minutes',
    flush: '0.5-1 mL normal saline',
    monitoring: [
      'Blood glucose 15-30 minutes after administration',
      'Repeat glucose monitoring every 30-60 minutes',
      'Signs of hypoglycemia (jitteriness, seizures)',
    ],
    warnings: [
      'Do not use D25 or D50 in neonates - risk of hyperglycemia and IVH',
      'Ensure proper line placement before infusion',
      'Rebound hypoglycemia may occur',
    ],
    lmicAvailability: 'high',
  },

  // NALOXONE - Opioid Reversal (NOT routine in NRP)
  {
    id: 'NRP-NALOX-v1.0',
    name: 'Naloxone',
    genericName: 'Naloxone Hydrochloride',
    indication: 'Respiratory depression due to maternal opioid administration (NOT routine)',
    concentration: '0.4 mg/mL or 1 mg/mL',
    dosePerKg: 0.1,
    doseUnit: 'mg',
    volumePerKg: 0.25, // Using 0.4 mg/mL concentration
    volumeUnit: 'mL',
    route: 'IV',
    maxDose: 0.1,
    minDose: 0.1,
    frequency: 'May repeat every 2-3 minutes',
    administrationTime: 'Rapid push',
    flush: '0.5 mL normal saline',
    monitoring: [
      'Respiratory effort',
      'Heart rate',
      'Duration of action (may need repeat doses)',
    ],
    warnings: [
      'NOT recommended as routine part of neonatal resuscitation',
      'PPV is the primary intervention for respiratory depression',
      'Contraindicated if mother is opioid-dependent (risk of seizures)',
      'Short duration of action - may need repeat doses',
    ],
    lmicAvailability: 'medium',
  },

  // SURFACTANT - Preterm Respiratory Distress
  {
    id: 'NRP-SURF-v1.0',
    name: 'Surfactant',
    genericName: 'Beractant/Poractant/Calfactant',
    indication: 'Respiratory distress syndrome in preterm infants',
    concentration: 'Varies by product',
    dosePerKg: 100, // 100-200 mg/kg depending on product
    doseUnit: 'mg phospholipids',
    volumePerKg: 4, // Approximately 4 mL/kg for most products
    volumeUnit: 'mL',
    route: 'ETT',
    maxDose: 200,
    minDose: 100,
    frequency: 'May repeat every 6-12 hours (max 4 doses)',
    administrationTime: 'Divided into 2-4 aliquots, given with position changes',
    flush: 'N/A - do not flush',
    monitoring: [
      'SpO2 and FiO2 requirements',
      'Chest rise and breath sounds',
      'Blood pressure',
      'ETT patency',
    ],
    warnings: [
      'Requires intubation for administration',
      'Transient bradycardia and desaturation may occur',
      'Reduce ventilator settings rapidly after administration',
      'Specialized product - may not be available in all settings',
    ],
    reconstitution: 'Warm to room temperature before use. Do not shake.',
    lmicAvailability: 'low',
  },

  // SODIUM BICARBONATE - Metabolic Acidosis (NOT routine)
  {
    id: 'NRP-BICARB-v1.0',
    name: 'Sodium Bicarbonate',
    genericName: 'Sodium Bicarbonate',
    indication: 'Documented metabolic acidosis with prolonged resuscitation (NOT routine)',
    concentration: '4.2% (0.5 mEq/mL)',
    dosePerKg: 2,
    doseUnit: 'mEq',
    volumePerKg: 4, // 2 mEq/kg = 4 mL/kg of 4.2% solution
    volumeUnit: 'mL',
    route: 'UVC',
    maxDose: 2,
    minDose: 1,
    frequency: 'May repeat based on blood gas',
    administrationTime: 'Over at least 2 minutes (slow push)',
    flush: '0.5-1 mL normal saline',
    monitoring: [
      'Blood gas after administration',
      'Heart rate response',
      'Serum sodium',
    ],
    warnings: [
      'NOT recommended as routine part of neonatal resuscitation',
      'Ensure adequate ventilation before administration',
      'Use 4.2% solution (NOT 8.4%) to reduce osmolarity',
      'Rapid administration may cause IVH in preterm infants',
      'May worsen intracellular acidosis if ventilation inadequate',
    ],
    lmicAvailability: 'medium',
  },

  // VITAMIN K - Hemorrhagic Disease Prevention
  {
    id: 'NRP-VITK-v1.0',
    name: 'Vitamin K1',
    genericName: 'Phytonadione',
    indication: 'Prevention of hemorrhagic disease of the newborn',
    concentration: '1 mg/0.5 mL or 10 mg/mL',
    dosePerKg: 1, // Fixed dose, not weight-based
    doseUnit: 'mg',
    volumePerKg: 0.5,
    volumeUnit: 'mL',
    route: 'IM',
    maxDose: 1,
    minDose: 0.5, // 0.5 mg for preterm <1500g
    frequency: 'Single dose at birth',
    administrationTime: 'Within first hour of life',
    flush: 'N/A',
    monitoring: [
      'Injection site for bleeding or hematoma',
    ],
    warnings: [
      'Give in anterolateral thigh',
      'Reduced dose (0.5 mg) for preterm <1500g',
      'Essential for all newborns',
    ],
    lmicAvailability: 'high',
  },

  // ERYTHROMYCIN - Eye Prophylaxis
  {
    id: 'NRP-ERYTHRO-v1.0',
    name: 'Erythromycin Ophthalmic',
    genericName: 'Erythromycin',
    indication: 'Prevention of ophthalmia neonatorum',
    concentration: '0.5% ointment',
    dosePerKg: 0, // Not weight-based
    doseUnit: 'ribbon',
    volumePerKg: 0,
    volumeUnit: 'cm',
    route: 'IM', // Actually topical, but using IM as placeholder
    frequency: 'Single application at birth',
    administrationTime: 'Within first hour of life',
    flush: 'N/A',
    monitoring: [
      'Eye discharge or swelling',
    ],
    warnings: [
      'Apply 1-2 cm ribbon to each eye',
      'Do not rinse eyes after application',
      'May cause transient chemical conjunctivitis',
    ],
    lmicAvailability: 'high',
  },
];

/**
 * Calculate drug dose for a specific weight
 */
export function calculateNRPDrugDose(drugId: string, weightKg: number): NRPDrugCalculation | null {
  const drug = NRP_DRUGS.find((d) => d.id === drugId);
  if (!drug) return null;

  // Validate weight for neonates (0.3-6 kg typical range)
  if (weightKg < 0.3 || weightKg > 6) {
    console.warn(`Weight ${weightKg} kg is outside typical neonatal range (0.3-6 kg)`);
  }

  let calculatedDose = drug.dosePerKg * weightKg;
  let calculatedVolume = drug.volumePerKg * weightKg;

  // Apply max dose limits
  if (drug.maxDose && calculatedDose > drug.maxDose) {
    calculatedDose = drug.maxDose;
    // Recalculate volume based on capped dose
    calculatedVolume = (calculatedDose / drug.dosePerKg) * drug.volumePerKg;
  }

  // Apply min dose limits
  if (drug.minDose && calculatedDose < drug.minDose) {
    calculatedDose = drug.minDose;
    calculatedVolume = (calculatedDose / drug.dosePerKg) * drug.volumePerKg;
  }

  // Format display strings
  const displayDose = `${calculatedDose.toFixed(3)} ${drug.doseUnit}`;
  const displayVolume = `${calculatedVolume.toFixed(2)} ${drug.volumeUnit}`;

  // Generate administration instructions
  const administrationInstructions = [
    `Draw up ${displayVolume} of ${drug.name} (${drug.concentration})`,
    `Administer via ${drug.route}: ${drug.administrationTime}`,
  ];

  if (drug.flush && drug.flush !== 'N/A') {
    administrationInstructions.push(`Flush with ${drug.flush}`);
  }

  return {
    drug,
    weightKg,
    calculatedDose,
    calculatedVolume,
    displayDose,
    displayVolume,
    administrationInstructions,
  };
}

/**
 * Get all drugs for a specific indication
 */
export function getNRPDrugsByIndication(indication: string): NRPDrug[] {
  const indicationLower = indication.toLowerCase();
  return NRP_DRUGS.filter((drug) => drug.indication.toLowerCase().includes(indicationLower));
}

/**
 * Get drugs available in LMIC settings
 */
export function getLMICAvailableDrugs(): NRPDrug[] {
  return NRP_DRUGS.filter((drug) => drug.lmicAvailability === 'high');
}

/**
 * Estimate neonatal weight from gestational age
 * Based on Fenton growth charts (50th percentile)
 */
export function estimateNeonatalWeight(gestationalWeeks: number): number {
  // Approximate 50th percentile weights
  const weightByGA: Record<number, number> = {
    24: 0.6,
    25: 0.7,
    26: 0.8,
    27: 0.9,
    28: 1.0,
    29: 1.15,
    30: 1.3,
    31: 1.5,
    32: 1.7,
    33: 1.9,
    34: 2.1,
    35: 2.4,
    36: 2.6,
    37: 2.9,
    38: 3.1,
    39: 3.3,
    40: 3.5,
    41: 3.6,
    42: 3.7,
  };

  if (gestationalWeeks < 24) return 0.5;
  if (gestationalWeeks > 42) return 3.8;

  return weightByGA[Math.round(gestationalWeeks)] || 3.0;
}

/**
 * Get ETT size recommendation for neonate
 */
export function getETTSize(weightKg: number, gestationalWeeks?: number): { size: number; depth: number } {
  // ETT size based on weight
  let size: number;
  if (weightKg < 1) {
    size = 2.5;
  } else if (weightKg < 2) {
    size = 3.0;
  } else if (weightKg < 3) {
    size = 3.5;
  } else {
    size = 3.5; // Can use 4.0 for larger term infants
  }

  // Depth of insertion (cm at lip)
  // Rule: 6 + weight in kg
  const depth = 6 + weightKg;

  return { size, depth: Math.round(depth * 10) / 10 };
}

/**
 * Get target SpO2 by minutes after birth
 */
export function getTargetSpO2(minutesAfterBirth: number): { min: number; max: number } {
  if (minutesAfterBirth <= 1) return { min: 60, max: 65 };
  if (minutesAfterBirth <= 2) return { min: 65, max: 70 };
  if (minutesAfterBirth <= 3) return { min: 70, max: 75 };
  if (minutesAfterBirth <= 4) return { min: 75, max: 80 };
  if (minutesAfterBirth <= 5) return { min: 80, max: 85 };
  return { min: 85, max: 95 };
}
