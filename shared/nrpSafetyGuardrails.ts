/**
 * NRP Safety Guardrails
 * 
 * Neonatal-specific safety checks and dose limits.
 * Prevents dangerous errors during neonatal resuscitation.
 */

export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'blocked';

export interface SafetyCheck {
  level: SafetyLevel;
  message: string;
  recommendation?: string;
}

export interface NeonatalWeightLimits {
  minWeight: number;
  maxWeight: number;
  typicalRange: { min: number; max: number };
}

/**
 * Neonatal weight limits by gestational age
 */
export const NEONATAL_WEIGHT_LIMITS: Record<string, NeonatalWeightLimits> = {
  'extremely_preterm': { // <28 weeks
    minWeight: 0.3,
    maxWeight: 1.2,
    typicalRange: { min: 0.5, max: 1.0 },
  },
  'very_preterm': { // 28-32 weeks
    minWeight: 0.8,
    maxWeight: 2.0,
    typicalRange: { min: 1.0, max: 1.7 },
  },
  'moderate_preterm': { // 32-37 weeks
    minWeight: 1.5,
    maxWeight: 3.5,
    typicalRange: { min: 1.8, max: 2.8 },
  },
  'term': { // ≥37 weeks
    minWeight: 2.0,
    maxWeight: 5.5,
    typicalRange: { min: 2.5, max: 4.5 },
  },
};

/**
 * Validate neonatal weight against gestational age
 */
export function validateNeonatalWeight(
  weightKg: number,
  gestationalWeeks: number
): SafetyCheck {
  // Absolute limits
  if (weightKg < 0.3) {
    return {
      level: 'blocked',
      message: 'Weight below viable limit (< 300g)',
      recommendation: 'Verify weight measurement. Consider palliative care discussion if accurate.',
    };
  }

  if (weightKg > 6) {
    return {
      level: 'blocked',
      message: 'Weight exceeds neonatal range (> 6 kg)',
      recommendation: 'Use pediatric protocols instead of NRP for infants > 6 kg.',
    };
  }

  // Get expected range for gestational age
  let category: string;
  if (gestationalWeeks < 28) {
    category = 'extremely_preterm';
  } else if (gestationalWeeks < 32) {
    category = 'very_preterm';
  } else if (gestationalWeeks < 37) {
    category = 'moderate_preterm';
  } else {
    category = 'term';
  }

  const limits = NEONATAL_WEIGHT_LIMITS[category];

  // Check if weight is outside expected range
  if (weightKg < limits.minWeight) {
    return {
      level: 'warning',
      message: `Weight (${weightKg} kg) is below expected minimum for ${gestationalWeeks} weeks gestation`,
      recommendation: 'Verify weight. Consider IUGR. Adjust drug doses carefully.',
    };
  }

  if (weightKg > limits.maxWeight) {
    return {
      level: 'warning',
      message: `Weight (${weightKg} kg) exceeds expected maximum for ${gestationalWeeks} weeks gestation`,
      recommendation: 'Verify gestational age. Consider macrosomia. Check for diabetic mother.',
    };
  }

  // Check if outside typical range but within limits
  if (weightKg < limits.typicalRange.min || weightKg > limits.typicalRange.max) {
    return {
      level: 'caution',
      message: `Weight (${weightKg} kg) is outside typical range for ${gestationalWeeks} weeks`,
      recommendation: 'Weight is acceptable but verify measurement.',
    };
  }

  return {
    level: 'safe',
    message: 'Weight is within expected range for gestational age',
  };
}

/**
 * Drug-specific safety checks for neonates
 */
export interface NRPDrugSafetyRule {
  drugId: string;
  maxDosePerKg: number;
  maxTotalDose: number;
  minInterval: number; // seconds
  maxDosesPerResuscitation: number;
  contraindications: string[];
  warnings: string[];
}

export const NRP_DRUG_SAFETY_RULES: NRPDrugSafetyRule[] = [
  {
    drugId: 'NRP-EPI-IV-v1.0',
    maxDosePerKg: 0.03, // mg/kg
    maxTotalDose: 0.1, // mg
    minInterval: 180, // 3 minutes
    maxDosesPerResuscitation: 5,
    contraindications: [],
    warnings: [
      'Ensure 1:10,000 concentration (NOT 1:1000)',
      'Verify UVC/IV placement before administration',
    ],
  },
  {
    drugId: 'NRP-EPI-ETT-v1.0',
    maxDosePerKg: 0.1, // mg/kg (higher for ETT)
    maxTotalDose: 0.3, // mg
    minInterval: 180, // 3 minutes
    maxDosesPerResuscitation: 3,
    contraindications: [],
    warnings: [
      'ETT route is less effective than IV/UVC',
      'Establish IV/UVC access as soon as possible',
      'Higher dose required for ETT route',
    ],
  },
  {
    drugId: 'NRP-NS-VOLUME-v1.0',
    maxDosePerKg: 10, // mL/kg per bolus
    maxTotalDose: 60, // mL total (multiple boluses)
    minInterval: 300, // 5 minutes between boluses
    maxDosesPerResuscitation: 3,
    contraindications: [],
    warnings: [
      'Avoid rapid bolus in preterm infants - risk of IVH',
      'Monitor for signs of fluid overload',
      'Consider blood products if significant hemorrhage',
    ],
  },
  {
    drugId: 'NRP-D10-HYPO-v1.0',
    maxDosePerKg: 5, // mL/kg
    maxTotalDose: 20, // mL
    minInterval: 900, // 15 minutes
    maxDosesPerResuscitation: 3,
    contraindications: [],
    warnings: [
      'Do NOT use D25 or D50 in neonates',
      'Check glucose before repeat dosing',
      'Risk of rebound hypoglycemia',
    ],
  },
  {
    drugId: 'NRP-BICARB-v1.0',
    maxDosePerKg: 2, // mEq/kg
    maxTotalDose: 10, // mEq
    minInterval: 600, // 10 minutes
    maxDosesPerResuscitation: 2,
    contraindications: [
      'Inadequate ventilation',
      'Respiratory acidosis without metabolic component',
    ],
    warnings: [
      'NOT recommended as routine part of neonatal resuscitation',
      'Ensure adequate ventilation before administration',
      'Use 4.2% solution (NOT 8.4%)',
      'Administer slowly over at least 2 minutes',
    ],
  },
  {
    drugId: 'NRP-NALOX-v1.0',
    maxDosePerKg: 0.1, // mg/kg
    maxTotalDose: 0.4, // mg
    minInterval: 120, // 2 minutes
    maxDosesPerResuscitation: 3,
    contraindications: [
      'Mother is opioid-dependent (risk of neonatal seizures)',
    ],
    warnings: [
      'NOT recommended as routine part of neonatal resuscitation',
      'PPV is the primary intervention for respiratory depression',
      'Short duration of action - may need repeat doses',
    ],
  },
];

/**
 * Check drug safety for a specific dose
 */
export function checkNRPDrugSafety(
  drugId: string,
  weightKg: number,
  proposedDose: number,
  previousDoses: { time: Date; dose: number }[] = []
): SafetyCheck {
  const rule = NRP_DRUG_SAFETY_RULES.find((r) => r.drugId === drugId);
  
  if (!rule) {
    return {
      level: 'caution',
      message: 'No safety rules defined for this drug',
      recommendation: 'Verify dose manually against NRP guidelines',
    };
  }

  // Check max dose per kg
  const maxDose = rule.maxDosePerKg * weightKg;
  if (proposedDose > maxDose) {
    return {
      level: 'blocked',
      message: `Dose exceeds maximum (${proposedDose.toFixed(3)} > ${maxDose.toFixed(3)})`,
      recommendation: `Maximum dose is ${rule.maxDosePerKg} per kg = ${maxDose.toFixed(3)} for ${weightKg} kg`,
    };
  }

  // Check max total dose
  if (proposedDose > rule.maxTotalDose) {
    return {
      level: 'blocked',
      message: `Dose exceeds absolute maximum (${proposedDose.toFixed(3)} > ${rule.maxTotalDose})`,
      recommendation: `Absolute maximum dose is ${rule.maxTotalDose}`,
    };
  }

  // Check number of previous doses
  if (previousDoses.length >= rule.maxDosesPerResuscitation) {
    return {
      level: 'warning',
      message: `Maximum doses per resuscitation reached (${rule.maxDosesPerResuscitation})`,
      recommendation: 'Consider other causes of poor response. Consult senior clinician.',
    };
  }

  // Check interval since last dose
  if (previousDoses.length > 0) {
    const lastDose = previousDoses[previousDoses.length - 1];
    const secondsSinceLastDose = (Date.now() - lastDose.time.getTime()) / 1000;
    
    if (secondsSinceLastDose < rule.minInterval) {
      const remainingSeconds = Math.ceil(rule.minInterval - secondsSinceLastDose);
      return {
        level: 'warning',
        message: `Too soon since last dose (${Math.floor(secondsSinceLastDose)}s < ${rule.minInterval}s minimum)`,
        recommendation: `Wait ${remainingSeconds} more seconds before next dose`,
      };
    }
  }

  // Check for warnings
  if (rule.warnings.length > 0) {
    return {
      level: 'caution',
      message: 'Dose is within safe limits',
      recommendation: rule.warnings.join('. '),
    };
  }

  return {
    level: 'safe',
    message: 'Dose is within safe limits',
  };
}

/**
 * Check for drug contraindications
 */
export function checkNRPContraindications(
  drugId: string,
  patientConditions: string[]
): SafetyCheck {
  const rule = NRP_DRUG_SAFETY_RULES.find((r) => r.drugId === drugId);
  
  if (!rule || rule.contraindications.length === 0) {
    return { level: 'safe', message: 'No contraindications identified' };
  }

  const matchedContraindications = rule.contraindications.filter((contra) =>
    patientConditions.some((condition) =>
      condition.toLowerCase().includes(contra.toLowerCase()) ||
      contra.toLowerCase().includes(condition.toLowerCase())
    )
  );

  if (matchedContraindications.length > 0) {
    return {
      level: 'blocked',
      message: `Contraindicated: ${matchedContraindications.join(', ')}`,
      recommendation: 'Do NOT administer this medication. Consider alternatives.',
    };
  }

  return { level: 'safe', message: 'No contraindications identified' };
}

/**
 * ETT size validation
 */
export function validateETTSize(
  weightKg: number,
  proposedSize: number
): SafetyCheck {
  let expectedSize: number;
  
  if (weightKg < 1) {
    expectedSize = 2.5;
  } else if (weightKg < 2) {
    expectedSize = 3.0;
  } else if (weightKg < 3) {
    expectedSize = 3.5;
  } else {
    expectedSize = 3.5; // Can use 4.0 for larger term infants
  }

  if (proposedSize < expectedSize - 0.5) {
    return {
      level: 'warning',
      message: `ETT size ${proposedSize} may be too small for ${weightKg} kg infant`,
      recommendation: `Expected size: ${expectedSize} mm`,
    };
  }

  if (proposedSize > expectedSize + 0.5) {
    return {
      level: 'warning',
      message: `ETT size ${proposedSize} may be too large for ${weightKg} kg infant`,
      recommendation: `Expected size: ${expectedSize} mm`,
    };
  }

  return {
    level: 'safe',
    message: `ETT size ${proposedSize} is appropriate for ${weightKg} kg infant`,
  };
}

/**
 * Validate ETT depth
 */
export function validateETTDepth(
  weightKg: number,
  proposedDepth: number
): SafetyCheck {
  // Rule: 6 + weight in kg = depth at lip in cm
  const expectedDepth = 6 + weightKg;
  const tolerance = 0.5; // cm

  if (proposedDepth < expectedDepth - tolerance) {
    return {
      level: 'warning',
      message: `ETT depth ${proposedDepth} cm may be too shallow`,
      recommendation: `Expected depth: ${expectedDepth.toFixed(1)} cm at lip (6 + weight)`,
    };
  }

  if (proposedDepth > expectedDepth + tolerance) {
    return {
      level: 'warning',
      message: `ETT depth ${proposedDepth} cm may be too deep - risk of right mainstem intubation`,
      recommendation: `Expected depth: ${expectedDepth.toFixed(1)} cm at lip (6 + weight)`,
    };
  }

  return {
    level: 'safe',
    message: `ETT depth ${proposedDepth} cm is appropriate`,
  };
}

/**
 * Validate heart rate for intervention decisions
 */
export function validateHeartRateIntervention(
  heartRate: number,
  currentIntervention: 'none' | 'ppv' | 'compressions' | 'epinephrine'
): SafetyCheck {
  if (heartRate >= 100) {
    if (currentIntervention === 'compressions' || currentIntervention === 'epinephrine') {
      return {
        level: 'caution',
        message: 'Heart rate has improved to ≥100/min',
        recommendation: 'Consider stopping compressions. Continue PPV if needed.',
      };
    }
    return {
      level: 'safe',
      message: 'Heart rate is adequate (≥100/min)',
    };
  }

  if (heartRate >= 60 && heartRate < 100) {
    if (currentIntervention === 'none') {
      return {
        level: 'warning',
        message: 'Heart rate 60-99/min - needs intervention',
        recommendation: 'Start PPV immediately if not already providing effective ventilation.',
      };
    }
    if (currentIntervention === 'compressions') {
      return {
        level: 'caution',
        message: 'Heart rate has improved to 60-99/min',
        recommendation: 'Consider stopping compressions. Continue PPV.',
      };
    }
    return {
      level: 'caution',
      message: 'Heart rate 60-99/min - continue current intervention',
      recommendation: 'Ensure effective ventilation. Check MR SOPA steps.',
    };
  }

  // HR < 60
  if (currentIntervention === 'none' || currentIntervention === 'ppv') {
    return {
      level: 'blocked',
      message: 'Heart rate <60/min despite PPV',
      recommendation: 'START CHEST COMPRESSIONS immediately. Increase FiO2 to 100%.',
    };
  }

  if (currentIntervention === 'compressions') {
    return {
      level: 'warning',
      message: 'Heart rate remains <60/min despite compressions',
      recommendation: 'Give EPINEPHRINE if not given in last 3-5 minutes. Ensure effective compressions and ventilation.',
    };
  }

  return {
    level: 'warning',
    message: 'Heart rate critically low (<60/min)',
    recommendation: 'Continue CPR. Consider reversible causes (hypovolemia, pneumothorax).',
  };
}

/**
 * Preterm-specific safety checks
 */
export function checkPretermSafety(
  gestationalWeeks: number,
  intervention: string
): SafetyCheck {
  const pretermWarnings: { condition: (ga: number) => boolean; intervention: string; message: string; recommendation: string }[] = [
    {
      condition: (ga) => ga < 28,
      intervention: 'oxygen',
      message: 'Extremely preterm infant - avoid hyperoxia',
      recommendation: 'Start with 21-30% FiO2. Titrate to target SpO2 based on time after birth.',
    },
    {
      condition: (ga) => ga < 32,
      intervention: 'fluid_bolus',
      message: 'Very preterm infant - risk of IVH with rapid fluid administration',
      recommendation: 'Give fluid boluses slowly over 10-20 minutes. Avoid rapid pushes.',
    },
    {
      condition: (ga) => ga < 28,
      intervention: 'chlorhexidine',
      message: 'Extremely preterm infant - chlorhexidine absorption risk',
      recommendation: 'Use povidone-iodine instead of chlorhexidine for skin prep.',
    },
    {
      condition: (ga) => ga < 32,
      intervention: 'temperature',
      message: 'Preterm infant - high risk of hypothermia',
      recommendation: 'Use plastic wrap/bag. Maintain temperature 36.5-37.5°C.',
    },
    {
      condition: (ga) => ga < 34,
      intervention: 'surfactant',
      message: 'Preterm infant may benefit from surfactant',
      recommendation: 'Consider early surfactant if signs of RDS.',
    },
  ];

  const applicableWarnings = pretermWarnings.filter(
    (w) => w.condition(gestationalWeeks) && w.intervention === intervention
  );

  if (applicableWarnings.length > 0) {
    const warning = applicableWarnings[0];
    return {
      level: 'caution',
      message: warning.message,
      recommendation: warning.recommendation,
    };
  }

  return { level: 'safe', message: 'No preterm-specific concerns for this intervention' };
}
