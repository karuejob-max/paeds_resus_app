/**
 * Weight Estimation
 * 
 * When actual weight is unknown, estimate from age.
 * Uses APLS formulas (standard in pediatric emergency medicine).
 */

export function estimateWeightFromAge(ageString: string | null): number | null {
  if (!ageString) return null;

  const parsed = parseAge(ageString);
  if (!parsed) return null;

  const { months } = parsed;

  // APLS weight estimation formulas
  if (months < 1) return 3.5;                          // Neonate
  if (months < 12) return (0.5 * months) + 4;          // Infant: (0.5 × age in months) + 4
  if (months < 60) return (2 * (months / 12)) + 8;     // 1-4 years: (2 × age in years) + 8
  if (months < 168) return (3 * (months / 12)) + 7;    // 5-13 years: (3 × age in years) + 7
  return 70; // Adolescent default
}

export function parseAge(ageString: string): { months: number; display: string } | null {
  const str = ageString.trim().toLowerCase();
  
  // Try "X months" or "Xm"
  const monthMatch = str.match(/^(\d+)\s*(months?|m|mo)$/);
  if (monthMatch) {
    const m = parseInt(monthMatch[1]);
    return { months: m, display: `${m} month${m !== 1 ? 's' : ''}` };
  }

  // Try "X years" or "Xy" or "X yr"
  const yearMatch = str.match(/^(\d+)\s*(years?|y|yr|yrs?)$/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1]);
    return { months: y * 12, display: `${y} year${y !== 1 ? 's' : ''}` };
  }

  // Try "X days" or "Xd"
  const dayMatch = str.match(/^(\d+)\s*(days?|d)$/);
  if (dayMatch) {
    const d = parseInt(dayMatch[1]);
    return { months: d / 30, display: `${d} day${d !== 1 ? 's' : ''}` };
  }

  // Try "X weeks" or "Xw"
  const weekMatch = str.match(/^(\d+)\s*(weeks?|w|wk|wks?)$/);
  if (weekMatch) {
    const w = parseInt(weekMatch[1]);
    return { months: (w * 7) / 30, display: `${w} week${w !== 1 ? 's' : ''}` };
  }

  // Try bare number - assume years if >= 1, months if < 1
  const bareNum = str.match(/^(\d+\.?\d*)$/);
  if (bareNum) {
    const n = parseFloat(bareNum[1]);
    if (n >= 1) return { months: n * 12, display: `${n} year${n !== 1 ? 's' : ''}` };
    return { months: n * 12, display: `${Math.round(n * 12)} months` };
  }

  return null;
}

// Broselow color bands for quick reference
export const BROSELOW_BANDS = [
  { color: 'gray',   label: 'Gray',   weightRange: '3-5 kg',   ageRange: 'Newborn' },
  { color: 'pink',   label: 'Pink',   weightRange: '6-7 kg',   ageRange: '3-6 months' },
  { color: 'red',    label: 'Red',    weightRange: '8-9 kg',   ageRange: '6-12 months' },
  { color: 'purple', label: 'Purple', weightRange: '10-11 kg', ageRange: '1-2 years' },
  { color: 'yellow', label: 'Yellow', weightRange: '12-14 kg', ageRange: '2-3 years' },
  { color: 'white',  label: 'White',  weightRange: '15-18 kg', ageRange: '4-5 years' },
  { color: 'blue',   label: 'Blue',   weightRange: '19-23 kg', ageRange: '6-8 years' },
  { color: 'orange', label: 'Orange', weightRange: '24-29 kg', ageRange: '9-10 years' },
  { color: 'green',  label: 'Green',  weightRange: '30-36 kg', ageRange: '11-12 years' },
] as const;
