/**
 * Emergency weight context for ResusGPS.
 *
 * This is an emergency approximation layer, not a growth-chart diagnosis.
 * Prefer a current measured weight; if that is unavailable, a caregiver- or
 * record-reported last-known weight is more useful than an age-only estimate.
 * Every estimate is low-confidence and must remain visibly labelled.
 */

import { validateResusWeight } from './patientDemographics';

export type PatientWeightSource = 'measured' | 'last_known' | 'age_estimate';
export type WeightConfidence = 'high' | 'moderate' | 'low';

export interface ResolvedPatientWeight {
  weightKg: number;
  source: PatientWeightSource;
  confidence: WeightConfidence;
  label: string;
  method: string;
  requiresVerification: boolean;
}

export interface WeightResolutionInput {
  age: string | null | undefined;
  measuredWeightKg?: number | null;
  lastKnownWeightKg?: number | null;
  gestationalAgeWeeks?: number | null;
}

/** Convert common clinical age strings to months without silently treating days as years. */
export function parseAgeToMonths(age: string | null | undefined): number | null {
  const value = age?.trim().toLowerCase() ?? '';
  if (!value) return null;
  // A phrase such as “32 weeks gestation” describes gestational age, not
  // postnatal age. Keep it in the newborn band and use the gestation separately.
  if (/(?:preterm|gestation|gestational)/.test(value) && /\d+\s*(?:weeks?|wks?|wk|w)\b/.test(value)) {
    return 0;
  }

  const read = (pattern: RegExp): number | null => {
    const match = value.match(pattern);
    return match ? Number(match[1]) : null;
  };

  const years = read(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|y)\b/);
  const months = read(/(\d+(?:\.\d+)?)\s*(?:months?|mos?|mo)\b/);
  const weeks = read(/(\d+(?:\.\d+)?)\s*(?:weeks?|wks?|wk|w)\b/);
  const days = read(/(\d+(?:\.\d+)?)\s*(?:days?|d)\b/);

  if (years !== null || months !== null || weeks !== null || days !== null) {
    return Math.max(0, (years ?? 0) * 12 + (months ?? 0) + (weeks ?? 0) / 4.345 + (days ?? 0) / 30.4375);
  }

  const number = Number(value.match(/\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? Math.max(0, number * 12) : null;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function validWeight(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return validateResusWeight(value).valid ? roundToTenth(value) : null;
}

/**
 * Age-only emergency estimate. These are intentionally labelled heuristics:
 * they are not a substitute for a length-based chart, birth weight, or local
 * neonatal growth reference.
 */
export function estimateEmergencyWeight(
  age: string | null | undefined,
  gestationalAgeWeeks?: number | null,
): ResolvedPatientWeight | null {
  const months = parseAgeToMonths(age);
  if (months == null) return null;
  const years = months / 12;
  let weightKg: number;
  let method: string;
  let label: string;

  const gestationFromPhrase = age?.match(/(?:preterm|gestation|gestational)[^\d]*(\d+(?:\.\d+)?)\s*(?:weeks?|wks?|wk|w)\b/i)?.[1]
    ?? age?.match(/(\d+(?:\.\d+)?)\s*(?:weeks?|wks?|wk|w)\s*(?:preterm|gestation|gestational)\b/i)?.[1];
  const effectiveGestationalWeeks = gestationalAgeWeeks ?? (gestationFromPhrase ? Number(gestationFromPhrase) : null);

  if (effectiveGestationalWeeks != null && Number.isFinite(effectiveGestationalWeeks) && effectiveGestationalWeeks < 37 && months < 1) {
    // Provisional preterm fallback only when no birth/last-known weight exists.
    // These broad median bands are deliberately low-confidence; birth weight
    // or a current measurement should replace them as soon as practical.
    const band = effectiveGestationalWeeks < 28
      ? { weight: 1.0, text: '<28 weeks' }
      : effectiveGestationalWeeks < 32
        ? { weight: 1.4, text: '28–31 weeks' }
        : effectiveGestationalWeeks < 35
          ? { weight: 1.9, text: '32–34 weeks' }
          : { weight: 2.4, text: '35–36 weeks' };
    weightKg = band.weight;
    method = `Preterm emergency approximation: ${band.text} gestational-age band`;
    label = 'Estimated from preterm gestational age';
  } else if (months < 1) {
    weightKg = 3.5;
    method = 'Term newborn emergency approximation: 3.5 kg at birth';
    label = 'Estimated term newborn weight';
  } else if (months < 12) {
    // Common emergency infant estimate: (months + 9) / 2.
    weightKg = (months + 9) / 2;
    method = 'Infant emergency formula: (age in months + 9) ÷ 2';
    label = 'Estimated infant weight';
  } else if (years < 5) {
    // Common 1–5-year emergency formula: 2 × age + 8.
    weightKg = 2 * years + 8;
    method = 'Young-child emergency formula: 2 × age in years + 8';
    label = 'Estimated child <5 years weight';
  } else if (years < 13) {
    // Common 5–12-year emergency formula: 3 × age + 7.
    weightKg = 3 * years + 7;
    method = 'School-age emergency formula: 3 × age in years + 7';
    label = 'Estimated school-age weight';
  } else if (years < 18) {
    // Avoid the old unbounded adult slope; keep an adolescent estimate bounded.
    weightKg = Math.min(65, 4 * years - 5);
    method = 'Adolescent emergency approximation: 4 × age in years − 5, capped at 65 kg';
    label = 'Estimated adolescent weight';
  } else {
    // Age cannot predict adult body size. A fixed emergency default avoids the
    // previous age-driven overestimation and remains explicitly low-confidence.
    weightKg = 70;
    method = 'Adult emergency default: 70 kg; age alone cannot estimate adult body size';
    label = 'Estimated adult emergency weight';
  }

  const safeWeight = validWeight(weightKg);
  if (safeWeight == null) return null;

  return {
    weightKg: safeWeight,
    source: 'age_estimate',
    confidence: 'low',
    label,
    method,
    requiresVerification: true,
  };
}

/** Resolve the safest available weight source in the required priority order. */
export function resolvePatientWeight(input: WeightResolutionInput): ResolvedPatientWeight | null {
  const measured = validWeight(input.measuredWeightKg);
  if (measured != null) {
    return {
      weightKg: measured,
      source: 'measured',
      confidence: 'high',
      label: 'Measured/current weight',
      method: 'Entered measured weight',
      requiresVerification: false,
    };
  }

  const lastKnown = validWeight(input.lastKnownWeightKg);
  if (lastKnown != null) {
    return {
      weightKg: lastKnown,
      source: 'last_known',
      confidence: 'moderate',
      label: 'Last known/caregiver-reported weight',
      method: 'Entered last known weight; confirm when practical',
      requiresVerification: true,
    };
  }

  return estimateEmergencyWeight(input.age, input.gestationalAgeWeeks);
}
