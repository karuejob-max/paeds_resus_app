import {
  parseAgeToMonths,
  resolvePatientWeight,
  type PatientWeightSource,
  type ResolvedPatientWeight,
} from './patient-weight';
import {
  resolveLifeSupportPack,
  type LifeSupportPackResult,
  type ResusSetting,
} from './cpr-pack-resolver';

export type ResusContextStatus = 'ready' | 'needs_confirmation' | 'unsupported';

export interface ResusContextInput {
  age: string | null | undefined;
  measuredWeightKg?: number | null;
  lastKnownWeightKg?: number | null;
  gestationalAgeWeeks?: number | null;
  setting?: ResusSetting | null;
  trauma?: boolean;
  adultContentEnabled?: boolean;
}

export interface ResusContextResult {
  status: ResusContextStatus;
  reason?: string;
  ageMonths: number | null;
  ageInterpretation: 'postnatal' | 'gestational' | 'unknown';
  gestationalAgeWeeks: number | null;
  setting: ResusSetting | null;
  trauma: boolean;
  weight: ResolvedPatientWeight | null;
  pack: LifeSupportPackResult | null;
  requiresWeightVerification: boolean;
}

function parseGestationalWeeks(age: string | null | undefined, explicit?: number | null): number | null {
  if (explicit != null && Number.isFinite(explicit) && explicit >= 20 && explicit <= 45) return explicit;
  const match = age?.match(/(?:preterm|gestation|gestational)?[^\d]*(\d+(?:\.\d+)?)\s*(?:weeks?|wks?|wk|w)\b/i);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value >= 20 && value <= 45 ? value : null;
}

export function resolveResusContext(input: ResusContextInput): ResusContextResult {
  const ageText = input.age?.trim() ?? '';
  const ageInterpretation: ResusContextResult['ageInterpretation'] =
    /(?:preterm|gestation|gestational)/i.test(ageText) && /\d+\s*(?:weeks?|wks?|wk|w)\b/i.test(ageText)
      ? 'gestational'
      : ageText ? 'postnatal' : 'unknown';
  const ageMonths = ageInterpretation === 'gestational' ? 0 : parseAgeToMonths(ageText);
  const gestationalAgeWeeks = parseGestationalWeeks(ageText, input.gestationalAgeWeeks);
  const weight = resolvePatientWeight({
    age: ageText,
    measuredWeightKg: input.measuredWeightKg,
    lastKnownWeightKg: input.lastKnownWeightKg,
    gestationalAgeWeeks,
  });
  const setting = input.setting ?? null;
  const base: ResusContextResult = {
    status: 'needs_confirmation',
    ageMonths,
    ageInterpretation,
    gestationalAgeWeeks,
    setting,
    trauma: Boolean(input.trauma),
    weight,
    pack: null,
    requiresWeightVerification: weight?.requiresVerification ?? true,
  };

  if (ageMonths == null || !Number.isFinite(ageMonths) || ageMonths < 0) {
    return { ...base, reason: 'Enter a valid patient age before age-specific guidance can be selected.' };
  }
  if (!setting) {
    return { ...base, reason: 'Confirm whether this is hospital/prehospital care or an explicit delivery-room newborn context.' };
  }
  if (ageInterpretation === 'gestational' && setting !== 'delivery_room') {
    return { ...base, reason: 'Gestational age requires explicit delivery-room newborn context or a confirmed postnatal age.' };
  }
  if (!weight) {
    return { ...base, reason: 'Enter measured/current weight, last-known/caregiver-reported weight, or use the labelled emergency estimate.' };
  }
  if (ageMonths >= 144 && !input.adultContentEnabled) {
    return { ...base, reason: 'Adult ACLS content is not enabled for this deployment; obtain governed adult-content confirmation.' };
  }

  try {
    const pack = resolveLifeSupportPack(ageMonths, undefined, setting, input.adultContentEnabled === true);
    return { ...base, status: 'ready', pack };
  } catch (error) {
    return { ...base, status: 'unsupported', reason: error instanceof Error ? error.message : 'This context is not supported.' };
  }
}

export function weightSourceLabel(source: PatientWeightSource | null | undefined): string {
  switch (source) {
    case 'measured': return 'Measured/current weight';
    case 'last_known': return 'Last known/caregiver-reported weight';
    case 'age_estimate': return 'Emergency estimate — verify when practical';
    default: return 'Weight source not confirmed';
  }
}
