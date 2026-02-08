/**
 * Clinical Calculations Library
 * 
 * Centralized calculation functions extracted from medical protocols
 * for reuse in ClinicalAssessmentGPS and other components.
 */

// ============================================================================
// FLUID CALCULATIONS (from DKA, Sepsis, Trauma protocols)
// ============================================================================

export interface FluidCalculation {
  deficit: number; // mL
  maintenance: number; // mL/24h
  total: number; // mL
  rate: number; // mL/hr
}

/**
 * Calculate fluid requirements based on dehydration percentage
 * @param weight - Patient weight in kg
 * @param dehydrationPercent - Estimated dehydration (0-15%)
 * @param hoursToReplace - Time period for replacement (default 48h for DKA)
 */
export function calculateFluidRequirements(
  weight: number,
  dehydrationPercent: number,
  hoursToReplace: number = 48
): FluidCalculation {
  // Fluid deficit
  const deficit = (dehydrationPercent / 100) * weight * 1000; // mL
  
  // Maintenance fluid (Holliday-Segar formula)
  const maintenance = weight <= 10 ? weight * 100 : 
                     weight <= 20 ? 1000 + (weight - 10) * 50 :
                     1500 + (weight - 20) * 20; // mL/24h
  
  const total = deficit + maintenance;
  const rate = total / hoursToReplace; // mL/hr
  
  return { deficit, maintenance, total, rate };
}

/**
 * Calculate initial fluid bolus for shock resuscitation
 * @param weight - Patient weight in kg
 * @param ageGroup - Patient age category
 */
export function calculateFluidBolus(
  weight: number,
  ageGroup: 'neonate' | 'infant' | 'child' | 'adolescent' | 'adult'
): { volume: number; duration: number } {
  // Neonates: 10 mL/kg over 1-2 hours (slower to prevent IVH)
  // Infants/children: 20 mL/kg over 1 hour
  // Adults: 500-1000 mL over 15-30 min
  
  if (ageGroup === 'neonate') {
    return { volume: weight * 10, duration: 2 };
  } else if (ageGroup === 'adult') {
    return { volume: 500, duration: 0.5 };
  } else {
    return { volume: weight * 20, duration: 1 };
  }
}

// ============================================================================
// MEDICATION DOSING (from DKA, Sepsis, Anaphylaxis protocols)
// ============================================================================

/**
 * Calculate insulin infusion rate for DKA
 * @param weight - Patient weight in kg
 * @param rateUnitsPerKg - Insulin rate (default 0.1 units/kg/hr per ISPAD 2022)
 */
export function calculateInsulinRate(weight: number, rateUnitsPerKg: number = 0.1): number {
  return weight * rateUnitsPerKg; // units/hr
}

/**
 * Calculate epinephrine dose for anaphylaxis
 * @param weight - Patient weight in kg
 * @param concentration - Epinephrine concentration (1:1000 or 1:10000)
 */
export function calculateEpinephrineDose(
  weight: number,
  concentration: '1:1000' | '1:10000' = '1:1000'
): { dose: number; volume: number; route: string } {
  // IM: 0.01 mg/kg (max 0.5 mg) of 1:1000 = 0.01 mL/kg
  // IV: 0.01 mg/kg (max 1 mg) of 1:10000 = 0.1 mL/kg
  
  if (concentration === '1:1000') {
    const dose = Math.min(weight * 0.01, 0.5); // mg
    const volume = dose; // mL (1:1000 = 1 mg/mL)
    return { dose, volume, route: 'IM' };
  } else {
    const dose = Math.min(weight * 0.01, 1); // mg
    const volume = dose * 10; // mL (1:10000 = 0.1 mg/mL)
    return { dose, volume, route: 'IV' };
  }
}

/**
 * Calculate dextrose dose for hypoglycemia
 * @param weight - Patient weight in kg
 * @param concentration - Dextrose concentration (10%, 25%, 50%)
 */
export function calculateDextroseDose(
  weight: number,
  concentration: 10 | 25 | 50 = 10
): { dose: number; volume: number } {
  // Standard: 2-5 mL/kg of 10% dextrose (0.2-0.5 g/kg)
  // If using 25% or 50%, adjust volume accordingly
  
  const doseGrams = weight * 0.25; // g (0.25 g/kg)
  const volume = (doseGrams / concentration) * 100; // mL
  
  return { dose: doseGrams, volume };
}

// ============================================================================
// AGE-SPECIFIC VITAL SIGN RANGES
// ============================================================================

export interface VitalSignRanges {
  heartRate: { min: number; max: number };
  respiratoryRate: { min: number; max: number };
  systolicBP: { min: number; max: number };
}

/**
 * Get age-appropriate vital sign ranges
 * @param ageYears - Patient age in years
 */
export function getVitalSignRanges(ageYears: number): VitalSignRanges {
  if (ageYears < 1) {
    // Infant (0-12 months)
    return {
      heartRate: { min: 100, max: 160 },
      respiratoryRate: { min: 30, max: 60 },
      systolicBP: { min: 70, max: 100 }
    };
  } else if (ageYears < 3) {
    // Toddler (1-3 years)
    return {
      heartRate: { min: 90, max: 150 },
      respiratoryRate: { min: 24, max: 40 },
      systolicBP: { min: 80, max: 110 }
    };
  } else if (ageYears < 6) {
    // Preschool (3-6 years)
    return {
      heartRate: { min: 80, max: 140 },
      respiratoryRate: { min: 22, max: 34 },
      systolicBP: { min: 90, max: 110 }
    };
  } else if (ageYears < 12) {
    // School age (6-12 years)
    return {
      heartRate: { min: 70, max: 120 },
      respiratoryRate: { min: 18, max: 30 },
      systolicBP: { min: 90, max: 120 }
    };
  } else {
    // Adolescent/Adult (12+ years)
    return {
      heartRate: { min: 60, max: 100 },
      respiratoryRate: { min: 12, max: 20 },
      systolicBP: { min: 100, max: 140 }
    };
  }
}

// ============================================================================
// SEVERITY CLASSIFICATION
// ============================================================================

export type SeverityLevel = 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';

/**
 * Classify DKA severity based on pH
 * @param pH - Arterial or venous pH
 */
export function classifyDKASeverity(pH: number): SeverityLevel {
  if (pH >= 7.3) return 'mild';
  if (pH >= 7.2) return 'moderate';
  if (pH >= 7.1) return 'severe';
  return 'critical';
}

/**
 * Classify shock severity based on clinical signs
 * @param capRefillSeconds - Capillary refill time
 * @param systolicBP - Systolic blood pressure
 * @param ageYears - Patient age
 */
export function classifyShockSeverity(
  capRefillSeconds: number,
  systolicBP: number,
  ageYears: number
): SeverityLevel {
  const ranges = getVitalSignRanges(ageYears);
  const hypotensive = systolicBP < ranges.systolicBP.min;
  
  if (capRefillSeconds <= 2 && !hypotensive) return 'normal';
  if (capRefillSeconds <= 3 && !hypotensive) return 'mild'; // Compensated
  if (capRefillSeconds > 3 && !hypotensive) return 'moderate'; // Compensated
  if (hypotensive) return 'severe'; // Decompensated
  return 'critical';
}

// ============================================================================
// BURN CALCULATIONS (Parkland Formula)
// ============================================================================

/**
 * Calculate fluid requirements for burns using Parkland formula
 * @param weight - Patient weight in kg
 * @param tbsaPercent - Total body surface area burned (%)
 */
export function calculateBurnFluidRequirements(
  weight: number,
  tbsaPercent: number
): { first8Hours: number; next16Hours: number; rate8h: number; rate16h: number } {
  // Parkland Formula: 4 mL/kg × %TBSA
  // Half in first 8 hours, half in next 16 hours
  
  const total24h = 4 * weight * tbsaPercent; // mL
  const first8Hours = total24h / 2; // mL
  const next16Hours = total24h / 2; // mL
  
  return {
    first8Hours,
    next16Hours,
    rate8h: first8Hours / 8, // mL/hr
    rate16h: next16Hours / 16 // mL/hr
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine age group from age in years
 */
export function getAgeGroup(ageYears: number): 'neonate' | 'infant' | 'child' | 'adolescent' | 'adult' {
  if (ageYears < 0.08) return 'neonate'; // <1 month
  if (ageYears < 1) return 'infant';
  if (ageYears < 10) return 'child';
  if (ageYears < 18) return 'adolescent';
  return 'adult';
}

/**
 * Format dose with units
 */
export function formatDose(value: number, unit: string, precision: number = 1): string {
  return `${value.toFixed(precision)} ${unit}`;
}
