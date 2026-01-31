/**
 * Safety Guardrails Utility
 * 
 * Implements hard blocks and warnings for contraindications and dangerous combinations.
 * Critical for preventing medical errors in emergency situations.
 * 
 * Principles:
 * - Hard blocks prevent administration (absolute contraindications)
 * - Warnings require explicit override (relative contraindications)
 * - All blocks/warnings must cite evidence
 */

export interface SafetyCheck {
  allowed: boolean;
  severity: 'hard-block' | 'warning' | 'caution' | 'safe';
  message: string;
  rationale: string;
  override?: {
    allowed: boolean;
    requiresJustification: boolean;
    confirmationText: string;
  };
}

export interface PatientState {
  age: number; // years
  weight: number; // kg
  allergies?: string[];
  currentMedications?: string[];
  conditions?: string[];
  vitalSigns?: {
    heartRate?: number;
    systolicBP?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    temperature?: number;
  };
}

/**
 * Check if drug is safe to administer given patient state
 */
export function checkDrugSafety(drugId: string, patientState: PatientState): SafetyCheck {
  // Collect all safety checks
  const checks = [
    checkAllergies(drugId, patientState.allergies),
    checkContraindications(drugId, patientState),
    checkDoseLimits(drugId, patientState.weight),
    checkDrugInteractions(drugId, patientState.currentMedications),
    checkAgeAppropriateness(drugId, patientState.age),
  ];

  // Return first hard block
  const hardBlock = checks.find((check) => check.severity === 'hard-block');
  if (hardBlock) return hardBlock;

  // Return first warning
  const warning = checks.find((check) => check.severity === 'warning');
  if (warning) return warning;

  // Return first caution
  const caution = checks.find((check) => check.severity === 'caution');
  if (caution) return caution;

  // All safe
  return {
    allowed: true,
    severity: 'safe',
    message: 'No contraindications detected',
    rationale: 'Drug is safe to administer based on current patient state',
  };
}

/**
 * Check for drug allergies
 */
function checkAllergies(drugId: string, allergies?: string[]): SafetyCheck {
  if (!allergies || allergies.length === 0) {
    return {
      allowed: true,
      severity: 'safe',
      message: 'No known allergies',
      rationale: 'Patient has no documented allergies',
    };
  }

  const drugAllergyMap: Record<string, string[]> = {
    'PR-DC-EPI-CA-v1.0': ['epinephrine', 'adrenaline', 'sulfites'],
    'PR-DC-EPI-ANA-v1.0': ['epinephrine', 'adrenaline', 'sulfites'],
    'PR-DC-AMIO-CA-v1.0': ['amiodarone', 'iodine'],
    'PR-DC-ADEN-SVT-v1.0': ['adenosine'],
    'PR-DC-ATRO-BRADY-v1.0': ['atropine'],
    'PR-DC-SALB-BRONCH-v1.0': ['salbutamol', 'albuterol'],
    'PR-DC-HYDRO-ANA-v1.0': ['hydrocortisone', 'corticosteroids'],
    'PR-DC-DIAZ-SEIZ-v1.0': ['diazepam', 'benzodiazepines'],
  };

  const drugAllergies = drugAllergyMap[drugId] || [];
  const matchedAllergy = allergies.find((allergy) =>
    drugAllergies.some((drugAllergy) => allergy.toLowerCase().includes(drugAllergy.toLowerCase()))
  );

  if (matchedAllergy) {
    // Exception: Epinephrine in anaphylaxis has NO absolute contraindications
    if (drugId === 'PR-DC-EPI-ANA-v1.0') {
      return {
        allowed: true,
        severity: 'warning',
        message: `Patient has documented allergy to ${matchedAllergy}`,
        rationale: 'Epinephrine is life-saving in anaphylaxis. Benefits outweigh risks even with known allergy.',
        override: {
          allowed: true,
          requiresJustification: false,
          confirmationText: 'I understand this is a life-saving intervention',
        },
      };
    }

    return {
      allowed: false,
      severity: 'hard-block',
      message: `ALLERGY ALERT: Patient allergic to ${matchedAllergy}`,
      rationale: 'Documented allergy is an absolute contraindication. Seek alternative therapy.',
    };
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'No allergies to this medication',
    rationale: 'Patient allergies do not include this drug or its components',
  };
}

/**
 * Check drug-specific contraindications
 */
function checkContraindications(drugId: string, patientState: PatientState): SafetyCheck {
  const conditions = patientState.conditions || [];

  // Adenosine contraindications
  if (drugId === 'PR-DC-ADEN-SVT-v1.0') {
    if (conditions.includes('2nd-degree AV block') || conditions.includes('3rd-degree AV block')) {
      return {
        allowed: false,
        severity: 'hard-block',
        message: 'CONTRAINDICATION: Patient has AV block',
        rationale: 'Adenosine causes transient AV block and can worsen existing conduction abnormalities',
      };
    }

    if (conditions.includes('sick sinus syndrome')) {
      return {
        allowed: false,
        severity: 'hard-block',
        message: 'CONTRAINDICATION: Patient has sick sinus syndrome',
        rationale: 'Adenosine can cause prolonged asystole in sick sinus syndrome',
      };
    }
  }

  // Atropine in hypothermia
  if (drugId === 'PR-DC-ATRO-BRADY-v1.0') {
    if (patientState.vitalSigns?.temperature && patientState.vitalSigns.temperature < 35) {
      return {
        allowed: true,
        severity: 'warning',
        message: 'CAUTION: Patient is hypothermic',
        rationale: 'Atropine is less effective in hypothermic bradycardia. Rewarm patient first.',
        override: {
          allowed: true,
          requiresJustification: true,
          confirmationText: 'I understand atropine may be ineffective in hypothermia',
        },
      };
    }
  }

  // Fluid bolus in heart failure
  if (drugId === 'PR-DC-NS-BOLUS-v1.0') {
    if (conditions.includes('heart failure') || conditions.includes('pulmonary edema')) {
      return {
        allowed: false,
        severity: 'hard-block',
        message: 'CONTRAINDICATION: Signs of fluid overload',
        rationale: 'Fluid bolus can worsen heart failure and pulmonary edema. Consider inotropes instead.',
      };
    }
  }

  // Diazepam in respiratory depression
  if (drugId === 'PR-DC-DIAZ-SEIZ-v1.0') {
    if (patientState.vitalSigns?.respiratoryRate && patientState.vitalSigns.respiratoryRate < 10) {
      return {
        allowed: true,
        severity: 'warning',
        message: 'CAUTION: Patient has respiratory depression',
        rationale: 'Diazepam can worsen respiratory depression. Have bag-valve-mask ready.',
        override: {
          allowed: true,
          requiresJustification: true,
          confirmationText: 'I am prepared to support ventilation if needed',
        },
      };
    }
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'No contraindications detected',
    rationale: 'Patient conditions do not contraindicate this drug',
  };
}

/**
 * Check dose limits
 */
function checkDoseLimits(drugId: string, weight: number): SafetyCheck {
  // Weight-based max doses
  const maxDoses: Record<string, { maxMg: number; maxWeight: number }> = {
    'PR-DC-EPI-CA-v1.0': { maxMg: 1, maxWeight: 100 }, // 1 mg max
    'PR-DC-EPI-ANA-v1.0': { maxMg: 0.5, maxWeight: 50 }, // 0.5 mg max
    'PR-DC-AMIO-CA-v1.0': { maxMg: 300, maxWeight: 60 }, // 300 mg max
    'PR-DC-ADEN-SVT-v1.0': { maxMg: 12, maxWeight: 60 }, // 12 mg max (2nd dose)
    'PR-DC-ATRO-BRADY-v1.0': { maxMg: 0.5, maxWeight: 25 }, // 0.5 mg max
    'PR-DC-NS-BOLUS-v1.0': { maxMg: 1000, maxWeight: 50 }, // 1000 mL max
    'PR-DC-D10-HYPO-v1.0': { maxMg: 100, maxWeight: 50 }, // 100 mL max
    'PR-DC-HYDRO-ANA-v1.0': { maxMg: 100, maxWeight: 25 }, // 100 mg max
    'PR-DC-DIAZ-SEIZ-v1.0': { maxMg: 10, maxWeight: 33 }, // 10 mg max (IV)
  };

  const limits = maxDoses[drugId];
  if (!limits) {
    return {
      allowed: true,
      severity: 'safe',
      message: 'No dose limits defined',
      rationale: 'Drug has no specific dose limits',
    };
  }

  if (weight > limits.maxWeight) {
    return {
      allowed: true,
      severity: 'caution',
      message: `Weight (${weight} kg) exceeds typical pediatric range`,
      rationale: `Use adult max dose of ${limits.maxMg} ${drugId.includes('BOLUS') ? 'mL' : 'mg'}`,
    };
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'Dose within safe limits',
    rationale: 'Weight-based dose is appropriate for patient',
  };
}

/**
 * Check drug interactions
 */
function checkDrugInteractions(drugId: string, currentMedications?: string[]): SafetyCheck {
  if (!currentMedications || currentMedications.length === 0) {
    return {
      allowed: true,
      severity: 'safe',
      message: 'No current medications',
      rationale: 'No drug interactions possible',
    };
  }

  // Critical interactions
  const interactions: Record<string, { drugs: string[]; severity: 'hard-block' | 'warning'; message: string }> = {
    'PR-DC-AMIO-CA-v1.0': {
      drugs: ['procainamide', 'sotalol', 'quinidine'],
      severity: 'warning',
      message: 'Amiodarone + other antiarrhythmics increases risk of torsades de pointes',
    },
    'PR-DC-ADEN-SVT-v1.0': {
      drugs: ['theophylline', 'caffeine'],
      severity: 'warning',
      message: 'Methylxanthines antagonize adenosine. May need higher dose.',
    },
    'PR-DC-ATRO-BRADY-v1.0': {
      drugs: ['anticholinergics'],
      severity: 'warning',
      message: 'Multiple anticholinergics increase risk of tachycardia and delirium',
    },
  };

  const interaction = interactions[drugId];
  if (interaction) {
    const matchedDrug = currentMedications.find((med) =>
      interaction.drugs.some((interactingDrug) => med.toLowerCase().includes(interactingDrug.toLowerCase()))
    );

    if (matchedDrug) {
      return {
        allowed: interaction.severity !== 'hard-block',
        severity: interaction.severity,
        message: `INTERACTION: ${matchedDrug} detected`,
        rationale: interaction.message,
        override:
          interaction.severity === 'warning'
            ? {
                allowed: true,
                requiresJustification: true,
                confirmationText: 'I understand the interaction risk and will monitor closely',
              }
            : undefined,
      };
    }
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'No drug interactions detected',
    rationale: 'Current medications do not interact with this drug',
  };
}

/**
 * Check age appropriateness
 */
function checkAgeAppropriateness(drugId: string, age: number): SafetyCheck {
  // Neonatal restrictions (age < 1 month)
  if (age < 0.083) {
    // < 1 month (0.083 years)
    const neonatalCautions = [
      'PR-DC-AMIO-CA-v1.0',
      'PR-DC-ADEN-SVT-v1.0',
      'PR-DC-DIAZ-SEIZ-v1.0',
    ];

    if (neonatalCautions.includes(drugId)) {
      return {
        allowed: true,
        severity: 'warning',
        message: 'CAUTION: Neonate (<1 month old)',
        rationale: 'Limited safety data in neonates. Use with caution and consider specialist consultation.',
        override: {
          allowed: true,
          requiresJustification: true,
          confirmationText: 'I understand this drug has limited neonatal safety data',
        },
      };
    }
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'Age-appropriate medication',
    rationale: 'Drug is safe for this age group',
  };
}

/**
 * Check if multiple fluid boluses are safe
 */
export function checkFluidBolusCount(bolusCount: number, patientState: PatientState): SafetyCheck {
  if (bolusCount >= 3) {
    return {
      allowed: false,
      severity: 'hard-block',
      message: 'STOP: 3 fluid boluses given without improvement',
      rationale:
        'Persistent shock after 60 mL/kg suggests cardiogenic shock or fluid overload. Consider inotropes and escalate care.',
    };
  }

  if (bolusCount === 2) {
    return {
      allowed: true,
      severity: 'warning',
      message: 'CAUTION: 2 fluid boluses given',
      rationale: 'Reassess for signs of fluid overload (crackles, hepatomegaly, JVD). Consider inotropes if no improvement.',
      override: {
        allowed: true,
        requiresJustification: true,
        confirmationText: 'I have reassessed for fluid overload and shock is still present',
      },
    };
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'Fluid bolus appropriate',
    rationale: 'First fluid bolus is standard treatment for shock',
  };
}

/**
 * Check if epinephrine dose interval is safe
 */
export function checkEpinephrineInterval(lastDoseTime: number): SafetyCheck {
  const now = Date.now();
  const timeSinceLastDose = (now - lastDoseTime) / 1000 / 60; // minutes

  if (timeSinceLastDose < 3) {
    return {
      allowed: false,
      severity: 'hard-block',
      message: `STOP: Only ${Math.round(timeSinceLastDose)} minutes since last epinephrine dose`,
      rationale: 'Epinephrine should be given every 3-5 minutes. Wait at least 3 minutes.',
    };
  }

  if (timeSinceLastDose > 5) {
    return {
      allowed: true,
      severity: 'caution',
      message: `${Math.round(timeSinceLastDose)} minutes since last epinephrine dose`,
      rationale: 'Consider giving epinephrine now if still in cardiac arrest',
    };
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'Appropriate timing for epinephrine',
    rationale: 'Dose interval is within 3-5 minute guideline',
  };
}

/**
 * Check if defibrillation energy is safe
 */
export function checkDefibrillationEnergy(energyJoules: number, weight: number): SafetyCheck {
  const recommendedEnergy = weight * 2; // 2 J/kg for first shock
  const maxEnergy = weight * 4; // 4 J/kg for subsequent shocks
  const absoluteMax = 200; // Adult max

  if (energyJoules > absoluteMax) {
    return {
      allowed: false,
      severity: 'hard-block',
      message: `STOP: Energy (${energyJoules} J) exceeds maximum (${absoluteMax} J)`,
      rationale: 'Reduce energy to prevent myocardial damage',
    };
  }

  if (energyJoules > maxEnergy) {
    return {
      allowed: false,
      severity: 'hard-block',
      message: `STOP: Energy (${energyJoules} J) exceeds ${maxEnergy} J for ${weight} kg child`,
      rationale: 'Maximum safe energy is 4 J/kg. Reduce energy.',
    };
  }

  if (energyJoules < recommendedEnergy * 0.5) {
    return {
      allowed: true,
      severity: 'warning',
      message: `Energy (${energyJoules} J) is low for ${weight} kg child`,
      rationale: `Recommended energy is ${recommendedEnergy} J (2 J/kg). Consider increasing.`,
      override: {
        allowed: true,
        requiresJustification: true,
        confirmationText: 'I understand this energy may be suboptimal',
      },
    };
  }

  return {
    allowed: true,
    severity: 'safe',
    message: 'Defibrillation energy appropriate',
    rationale: `Energy is within safe range for ${weight} kg child`,
  };
}
