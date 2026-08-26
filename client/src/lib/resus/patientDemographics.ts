/**
 * Safety boundaries for the patient context used by the canonical ResusGPS flow.
 *
 * These are input guards, not clinical dosing rules. A missing weight remains
 * unknown; it must never be replaced with a default patient weight.
 */

export const MIN_RESUS_WEIGHT_KG = 0.3;
export const MAX_RESUS_WEIGHT_KG = 300;

export interface ResusWeightValidation {
  valid: boolean;
  message?: string;
}

export function validateResusWeight(weight: number): ResusWeightValidation {
  if (!Number.isFinite(weight)) {
    return { valid: false, message: 'Enter a numeric patient weight.' };
  }
  if (weight < MIN_RESUS_WEIGHT_KG) {
    return {
      valid: false,
      message: `Weight must be at least ${MIN_RESUS_WEIGHT_KG} kg, or leave it blank until verified.`,
    };
  }
  if (weight > MAX_RESUS_WEIGHT_KG) {
    return {
      valid: false,
      message: `Weight must be ${MAX_RESUS_WEIGHT_KG} kg or less. Verify the unit and patient context.`,
    };
  }
  return { valid: true };
}

export function parseResusWeight(value: string | null | undefined): number | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return validateResusWeight(parsed).valid ? parsed : null;
}
