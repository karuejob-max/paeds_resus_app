/**
 * Weight Estimation Utility
 * 
 * Provides multiple methods for estimating pediatric weight when actual weight is unknown.
 * Critical for drug dosing in emergency situations.
 * 
 * Methods:
 * 1. Broselow tape (length-based, most accurate for ages 0-12)
 * 2. Age-based formulas (APLS, Luscombe-Owens)
 * 3. Mid-arm circumference (MUAC) for malnutrition settings
 * 
 * Evidence base:
 * - Broselow tape: 70-80% accuracy within 10% of actual weight
 * - Age-based: 50-60% accuracy, varies by population
 * - MUAC: Useful in LMICs with high malnutrition rates
 */

export interface WeightEstimate {
  weight: number; // in kg
  method: 'actual' | 'broselow' | 'age-apls' | 'age-luscombe' | 'muac' | 'parent-estimate';
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface BroselowZone {
  color: string;
  lengthMin: number; // cm
  lengthMax: number; // cm
  weight: number; // kg
  ettSize: number; // mm
  ettDepth: number; // cm
  defibDose: number; // J (at 2 J/kg)
  epiDose: number; // mg (at 0.01 mg/kg)
  fluidBolus: number; // mL (at 20 mL/kg)
}

/**
 * Broselow Tape Zones
 * Based on 2017 Broselow-Luten System
 */
export const BROSELOW_ZONES: BroselowZone[] = [
  {
    color: 'Grey',
    lengthMin: 46,
    lengthMax: 54,
    weight: 3,
    ettSize: 3.0,
    ettDepth: 9,
    defibDose: 6,
    epiDose: 0.03,
    fluidBolus: 60,
  },
  {
    color: 'Pink',
    lengthMin: 55,
    lengthMax: 60,
    weight: 4,
    ettSize: 3.5,
    ettDepth: 10,
    defibDose: 8,
    epiDose: 0.04,
    fluidBolus: 80,
  },
  {
    color: 'Red',
    lengthMin: 61,
    lengthMax: 67,
    weight: 5,
    ettSize: 3.5,
    ettDepth: 10.5,
    defibDose: 10,
    epiDose: 0.05,
    fluidBolus: 100,
  },
  {
    color: 'Purple',
    lengthMin: 68,
    lengthMax: 76,
    weight: 7,
    ettSize: 4.0,
    ettDepth: 12,
    defibDose: 14,
    epiDose: 0.07,
    fluidBolus: 140,
  },
  {
    color: 'Yellow',
    lengthMin: 77,
    lengthMax: 85,
    weight: 9,
    ettSize: 4.5,
    ettDepth: 13.5,
    defibDose: 18,
    epiDose: 0.09,
    fluidBolus: 180,
  },
  {
    color: 'White',
    lengthMin: 86,
    lengthMax: 95,
    weight: 11,
    ettSize: 5.0,
    ettDepth: 15,
    defibDose: 22,
    epiDose: 0.11,
    fluidBolus: 220,
  },
  {
    color: 'Blue',
    lengthMin: 96,
    lengthMax: 107,
    weight: 14,
    ettSize: 5.5,
    ettDepth: 16.5,
    defibDose: 28,
    epiDose: 0.14,
    fluidBolus: 280,
  },
  {
    color: 'Orange',
    lengthMin: 108,
    lengthMax: 120,
    weight: 18,
    ettSize: 6.0,
    ettDepth: 18,
    defibDose: 36,
    epiDose: 0.18,
    fluidBolus: 360,
  },
  {
    color: 'Green',
    lengthMin: 121,
    lengthMax: 145,
    weight: 24,
    ettSize: 6.5,
    ettDepth: 19.5,
    defibDose: 48,
    epiDose: 0.24,
    fluidBolus: 480,
  },
];

/**
 * Get Broselow zone by length
 */
export function getBroselowZone(lengthCm: number): BroselowZone | null {
  for (const zone of BROSELOW_ZONES) {
    if (lengthCm >= zone.lengthMin && lengthCm <= zone.lengthMax) {
      return zone;
    }
  }
  return null;
}

/**
 * Estimate weight using Broselow tape (length-based)
 * Most accurate for children 0-12 years
 */
export function estimateWeightByLength(lengthCm: number): WeightEstimate | null {
  const zone = getBroselowZone(lengthCm);
  if (!zone) {
    return null;
  }

  return {
    weight: zone.weight,
    method: 'broselow',
    confidence: 'high',
    source: `Broselow ${zone.color} zone (${lengthCm} cm)`,
  };
}

/**
 * Estimate weight using APLS age-based formula
 * Formula: Weight (kg) = (age + 4) × 2
 * Valid for ages 1-10 years
 */
export function estimateWeightByAgeAPLS(ageYears: number, ageMonths: number = 0): WeightEstimate | null {
  const totalAgeYears = ageYears + ageMonths / 12;

  // For infants <1 year
  if (totalAgeYears < 1) {
    // Birth weight ~3.5 kg, gain ~0.7 kg/month for first 6 months
    // Then ~0.5 kg/month for 6-12 months
    let weight: number;
    if (ageMonths <= 6) {
      weight = 3.5 + ageMonths * 0.7;
    } else {
      weight = 3.5 + 6 * 0.7 + (ageMonths - 6) * 0.5;
    }

    return {
      weight: Math.round(weight * 10) / 10,
      method: 'age-apls',
      confidence: 'medium',
      source: `APLS infant formula (${ageMonths} months)`,
    };
  }

  // For children 1-10 years
  if (totalAgeYears >= 1 && totalAgeYears <= 10) {
    const weight = (totalAgeYears + 4) * 2;
    return {
      weight: Math.round(weight * 10) / 10,
      method: 'age-apls',
      confidence: 'medium',
      source: `APLS formula: (age + 4) × 2`,
    };
  }

  // For children >10 years
  if (totalAgeYears > 10 && totalAgeYears <= 14) {
    const weight = totalAgeYears * 3;
    return {
      weight: Math.round(weight * 10) / 10,
      method: 'age-apls',
      confidence: 'low',
      source: `APLS formula: age × 3 (adolescent)`,
    };
  }

  return null;
}

/**
 * Estimate weight using Luscombe-Owens formula
 * More accurate for UK/European populations
 * Formula: Weight (kg) = 3 × age + 7
 * Valid for ages 1-10 years
 */
export function estimateWeightByAgeLuscombe(ageYears: number, ageMonths: number = 0): WeightEstimate | null {
  const totalAgeYears = ageYears + ageMonths / 12;

  // For infants <1 year (same as APLS)
  if (totalAgeYears < 1) {
    let weight: number;
    if (ageMonths <= 6) {
      weight = 3.5 + ageMonths * 0.7;
    } else {
      weight = 3.5 + 6 * 0.7 + (ageMonths - 6) * 0.5;
    }

    return {
      weight: Math.round(weight * 10) / 10,
      method: 'age-luscombe',
      confidence: 'medium',
      source: `Luscombe-Owens infant formula (${ageMonths} months)`,
    };
  }

  // For children 1-10 years
  if (totalAgeYears >= 1 && totalAgeYears <= 10) {
    const weight = 3 * totalAgeYears + 7;
    return {
      weight: Math.round(weight * 10) / 10,
      method: 'age-luscombe',
      confidence: 'medium',
      source: `Luscombe-Owens formula: 3 × age + 7`,
    };
  }

  // For adolescents >10 years
  if (totalAgeYears > 10 && totalAgeYears <= 14) {
    const weight = totalAgeYears * 3;
    return {
      weight: Math.round(weight * 10) / 10,
      method: 'age-luscombe',
      confidence: 'low',
      source: `Luscombe-Owens adolescent estimate`,
    };
  }

  return null;
}

/**
 * Estimate weight using MUAC (Mid-Upper Arm Circumference)
 * Useful in LMIC settings with high malnutrition rates
 * Formula: Weight (kg) = (MUAC^2 × length) / 100
 * MUAC in cm, length in cm
 */
export function estimateWeightByMUAC(muacCm: number, lengthCm: number): WeightEstimate {
  const weight = (muacCm * muacCm * lengthCm) / 1000;

  // MUAC <11.5 cm indicates severe malnutrition
  const confidence = muacCm < 11.5 ? 'low' : 'medium';

  return {
    weight: Math.round(weight * 10) / 10,
    method: 'muac',
    confidence,
    source: `MUAC-based formula (${muacCm} cm MUAC, ${lengthCm} cm length)`,
  };
}

/**
 * Get best weight estimate from available data
 * Priority: Actual > Broselow > Age-based > MUAC > Parent estimate
 */
export function getBestWeightEstimate(data: {
  actualWeight?: number;
  lengthCm?: number;
  ageYears?: number;
  ageMonths?: number;
  muacCm?: number;
  parentEstimate?: number;
}): WeightEstimate {
  // 1. Actual weight (highest confidence)
  if (data.actualWeight) {
    return {
      weight: data.actualWeight,
      method: 'actual',
      confidence: 'high',
      source: 'Measured weight',
    };
  }

  // 2. Broselow tape (length-based, high confidence)
  if (data.lengthCm) {
    const broselow = estimateWeightByLength(data.lengthCm);
    if (broselow) {
      return broselow;
    }
  }

  // 3. Age-based formulas (medium confidence)
  if (data.ageYears !== undefined) {
    const apls = estimateWeightByAgeAPLS(data.ageYears, data.ageMonths);
    if (apls) {
      return apls;
    }
  }

  // 4. MUAC (medium/low confidence, useful in malnutrition)
  if (data.muacCm && data.lengthCm) {
    return estimateWeightByMUAC(data.muacCm, data.lengthCm);
  }

  // 5. Parent estimate (low confidence, better than nothing)
  if (data.parentEstimate) {
    return {
      weight: data.parentEstimate,
      method: 'parent-estimate',
      confidence: 'low',
      source: 'Parent/caregiver estimate',
    };
  }

  // Fallback: Use age if available
  if (data.ageYears !== undefined) {
    const apls = estimateWeightByAgeAPLS(data.ageYears, data.ageMonths);
    if (apls) {
      return apls;
    }
  }

  // Last resort: Default to 10 kg (approximate 2-year-old)
  return {
    weight: 10,
    method: 'age-apls',
    confidence: 'low',
    source: 'Default estimate (no data available)',
  };
}

/**
 * Get all possible weight estimates for comparison
 */
export function getAllWeightEstimates(data: {
  lengthCm?: number;
  ageYears?: number;
  ageMonths?: number;
  muacCm?: number;
}): WeightEstimate[] {
  const estimates: WeightEstimate[] = [];

  if (data.lengthCm) {
    const broselow = estimateWeightByLength(data.lengthCm);
    if (broselow) estimates.push(broselow);
  }

  if (data.ageYears !== undefined) {
    const apls = estimateWeightByAgeAPLS(data.ageYears, data.ageMonths);
    if (apls) estimates.push(apls);

    const luscombe = estimateWeightByAgeLuscombe(data.ageYears, data.ageMonths);
    if (luscombe) estimates.push(luscombe);
  }

  if (data.muacCm && data.lengthCm) {
    estimates.push(estimateWeightByMUAC(data.muacCm, data.lengthCm));
  }

  return estimates;
}

/**
 * Validate weight is reasonable for age
 * Returns warning if weight seems too high or too low
 */
export function validateWeightForAge(
  weight: number,
  ageYears: number,
  ageMonths: number = 0
): { valid: boolean; warning?: string } {
  const totalAgeYears = ageYears + ageMonths / 12;

  // Expected weight range (5th to 95th percentile)
  let minWeight: number;
  let maxWeight: number;

  if (totalAgeYears < 1) {
    // Infants: 3-12 kg
    minWeight = 3;
    maxWeight = 12;
  } else if (totalAgeYears <= 2) {
    // Toddlers: 8-16 kg
    minWeight = 8;
    maxWeight = 16;
  } else if (totalAgeYears <= 5) {
    // Preschool: 12-25 kg
    minWeight = 12;
    maxWeight = 25;
  } else if (totalAgeYears <= 10) {
    // School-age: 15-50 kg
    minWeight = 15;
    maxWeight = 50;
  } else {
    // Adolescent: 30-80 kg
    minWeight = 30;
    maxWeight = 80;
  }

  if (weight < minWeight) {
    return {
      valid: false,
      warning: `Weight (${weight} kg) is unusually low for age ${ageYears}y${ageMonths}m. Consider malnutrition or measurement error.`,
    };
  }

  if (weight > maxWeight) {
    return {
      valid: false,
      warning: `Weight (${weight} kg) is unusually high for age ${ageYears}y${ageMonths}m. Verify measurement or consider obesity.`,
    };
  }

  return { valid: true };
}
