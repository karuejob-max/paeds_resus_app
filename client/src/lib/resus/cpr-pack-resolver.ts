/**
 * Routes paediatric resuscitation to the appropriate life-support curriculum pack.
 * Used at CPR clock entry (ResusGPS and unified clock).
 */

export type LifeSupportPack = 'PALS' | 'ACLS' | 'NRP';

export type ResusSetting = 'hospital' | 'prehospital' | 'delivery_room';

/** Approximate puberty threshold (years) when ACLS adult pathways may apply. */
const PUBERTY_AGE_MONTHS = 144; // 12 years

/** NRP is a delivery-room/newborn context; age alone must not switch a hospital arrest into NRP. */

export interface LifeSupportPackResult {
  pack: LifeSupportPack;
  label: string;
  rationale: string;
}

/**
 * Resolve PALS vs ACLS vs NRP from age and optional clinical context.
 */
export function resolveLifeSupportPack(
  ageMonths: number,
  puberty?: boolean,
  setting?: ResusSetting
): LifeSupportPackResult {
  if (setting === 'delivery_room') {
    return {
      pack: 'NRP',
      label: 'Neonatal Resuscitation (NRP)',
      rationale: 'Delivery-room/newborn resuscitation context',
    };
  }

  if (puberty === true || ageMonths >= PUBERTY_AGE_MONTHS) {
    return {
      pack: 'ACLS',
      label: 'Adult ACLS',
      rationale: 'Post-pubertal or age ≥12 years — adult cardiac arrest algorithms',
    };
  }

  return {
    pack: 'PALS',
    label: 'Paediatric Advanced Life Support (PALS)',
    rationale: 'Infant/child — PALS cardiac arrest algorithms',
  };
}
