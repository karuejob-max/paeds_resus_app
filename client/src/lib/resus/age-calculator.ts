/**
 * Age Calculator Utility for ResusGPS
 * 
 * Converts structured age (years/months/weeks) to weight and applies age-based
 * drug restrictions. Critical for neonatal dosing accuracy.
 * 
 * Clinical rationale:
 * - Neonates require precise age for dosing (e.g., epinephrine 0.1 mL/kg for <1yr vs 0.01 for older)
 * - Some drugs are age-restricted (e.g., no ibuprofen <6 months)
 * - Weight varies significantly by age, especially in neonates
 */

export interface StructuredAge {
  years: number;
  months: number;
  weeks: number; // For neonates <4 weeks
}

export interface AgeInfo {
  ageInMonths: number;
  ageInWeeks: number;
  estimatedWeightKg: number;
  category: 'neonate' | 'infant' | 'toddler' | 'preschool' | 'school' | 'adolescent';
  description: string;
}

/**
 * Convert structured age to total months
 */
export function ageToMonths(age: StructuredAge): number {
  return age.years * 12 + age.months + age.weeks / 4.3; // Approximate weeks to months
}

/**
 * Convert structured age to total weeks
 */
export function ageToWeeks(age: StructuredAge): number {
  return age.years * 52 + age.months * 4.3 + age.weeks; // Approximate
}

/**
 * Estimate weight from age using WHO growth charts
 * Based on median weights for age
 */
export function estimateWeightFromAge(age: StructuredAge): number {
  const months = ageToMonths(age);
  
  // WHO growth chart approximations (kg)
  if (months < 1) {
    // Birth to 1 month: ~3.5 kg
    return 3.5;
  } else if (months < 3) {
    // 1-3 months: ~5.5 kg
    return 5.5;
  } else if (months < 6) {
    // 3-6 months: ~7 kg
    return 7;
  } else if (months < 12) {
    // 6-12 months: ~9 kg
    return 9;
  } else if (months < 24) {
    // 1-2 years: ~12 kg
    return 12 + (months - 12) * 0.15; // Gradual increase
  } else if (months < 36) {
    // 2-3 years: ~14 kg
    return 14 + (months - 24) * 0.1;
  } else if (months < 60) {
    // 3-5 years: ~16-18 kg
    return 16 + (months - 36) * 0.1;
  } else if (months < 120) {
    // 5-10 years: ~18-32 kg
    return 18 + (months - 60) * 0.23;
  } else if (months < 156) {
    // 10-13 years: ~32-50 kg
    return 32 + (months - 120) * 0.5;
  } else {
    // 13+ years: ~50-70 kg (adolescent)
    return 50 + (months - 156) * 0.3;
  }
}

/**
 * Get age category and description
 */
export function getAgeCategory(age: StructuredAge): AgeInfo {
  const months = ageToMonths(age);
  const weeks = ageToWeeks(age);
  const weight = estimateWeightFromAge(age);
  
  let category: AgeInfo['category'];
  let description: string;
  
  if (weeks < 4) {
    category = 'neonate';
    description = `Neonate (${weeks.toFixed(1)} weeks)`;
  } else if (months < 12) {
    category = 'infant';
    description = `Infant (${months.toFixed(1)} months)`;
  } else if (months < 36) {
    category = 'toddler';
    description = `Toddler (${(months / 12).toFixed(1)} years)`;
  } else if (months < 60) {
    category = 'preschool';
    description = `Preschool (${(months / 12).toFixed(1)} years)`;
  } else if (months < 120) {
    category = 'school';
    description = `School age (${(months / 12).toFixed(1)} years)`;
  } else {
    category = 'adolescent';
    description = `Adolescent (${(months / 12).toFixed(1)} years)`;
  }
  
  return {
    ageInMonths: months,
    ageInWeeks: weeks,
    estimatedWeightKg: weight,
    category,
    description,
  };
}

/**
 * Check if drug is appropriate for age
 * Returns { allowed: boolean, reason?: string }
 */
export function isDrugAppropriateForAge(
  drug: string,
  age: StructuredAge
): { allowed: boolean; reason?: string } {
  const ageInfo = getAgeCategory(age);
  const months = ageInfo.ageInMonths;
  
  // Age-based drug restrictions
  const restrictions: Record<string, { minMonths?: number; reason: string }> = {
    // NSAIDs
    'Ibuprofen': { minMonths: 6, reason: 'Not recommended <6 months' },
    'Naproxen': { minMonths: 12, reason: 'Not recommended <12 months' },
    
    // Antibiotics
    'Fluoroquinolones': { minMonths: 18, reason: 'Avoid <18 months (cartilage concerns)' },
    'Tetracyclines': { minMonths: 84, reason: 'Avoid <7 years (tooth staining)' },
    
    // Antihistamines
    'Diphenhydramine': { minMonths: 24, reason: 'Avoid <2 years' },
    
    // Decongestants
    'Pseudoephedrine': { minMonths: 12, reason: 'Avoid <12 months' },
    
    // ACE inhibitors
    'Enalapril': { minMonths: 1, reason: 'Use with caution in neonates' },
  };
  
  const restriction = restrictions[drug];
  
  if (restriction && restriction.minMonths && months < restriction.minMonths) {
    return {
      allowed: false,
      reason: restriction.reason,
    };
  }
  
  return { allowed: true };
}

/**
 * Get age-specific dosing notes
 */
export function getAgeDossingNotes(drug: string, age: StructuredAge): string[] {
  const ageInfo = getAgeCategory(age);
  const notes: string[] = [];
  
  // Neonatal-specific notes
  if (ageInfo.category === 'neonate') {
    if (drug === 'Epinephrine') {
      notes.push('Use 1:10,000 concentration for IV (neonates)');
      notes.push('Dose: 0.1 mL/kg IV');
    }
    if (drug === 'Glucose') {
      notes.push('Use 10% dextrose (avoid hypertonic solutions)');
    }
  }
  
  // Infant-specific notes
  if (ageInfo.category === 'infant') {
    if (drug === 'Diazepam') {
      notes.push('Rectal route preferred in infants');
    }
  }
  
  // General notes
  if (ageInfo.estimatedWeightKg < 10) {
    notes.push('Small child - verify weight-based calculations');
  }
  
  return notes;
}

/**
 * Format age for display (e.g., "3 months", "2 years 5 months")
 */
export function formatAge(age: StructuredAge): string {
  const parts: string[] = [];
  
  if (age.years > 0) {
    parts.push(`${age.years} year${age.years > 1 ? 's' : ''}`);
  }
  
  if (age.months > 0) {
    parts.push(`${age.months} month${age.months > 1 ? 's' : ''}`);
  }
  
  if (age.weeks > 0 && age.years === 0 && age.months === 0) {
    parts.push(`${age.weeks} week${age.weeks > 1 ? 's' : ''}`);
  }
  
  return parts.join(' ') || '0 months';
}

/**
 * Parse age string to structured age (e.g., "2y 3m 1w" -> { years: 2, months: 3, weeks: 1 })
 */
export function parseAgeString(ageString: string): StructuredAge | null {
  const match = ageString.match(/(\d+)\s*y[a-z]?\s*(\d+)\s*m[a-z]?\s*(\d+)\s*w[a-z]?/i);
  
  if (match) {
    return {
      years: parseInt(match[1], 10),
      months: parseInt(match[2], 10),
      weeks: parseInt(match[3], 10),
    };
  }
  
  return null;
}

/**
 * Common age presets for quick selection
 */
export const AGE_PRESETS = [
  { label: 'Newborn', age: { years: 0, months: 0, weeks: 1 } },
  { label: '1 month', age: { years: 0, months: 1, weeks: 0 } },
  { label: '3 months', age: { years: 0, months: 3, weeks: 0 } },
  { label: '6 months', age: { years: 0, months: 6, weeks: 0 } },
  { label: '1 year', age: { years: 1, months: 0, weeks: 0 } },
  { label: '2 years', age: { years: 2, months: 0, weeks: 0 } },
  { label: '5 years', age: { years: 5, months: 0, weeks: 0 } },
  { label: '10 years', age: { years: 10, months: 0, weeks: 0 } },
  { label: '15 years', age: { years: 15, months: 0, weeks: 0 } },
];
