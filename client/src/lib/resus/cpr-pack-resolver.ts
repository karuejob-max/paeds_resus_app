/**
 * Routes paediatric resuscitation to the appropriate life-support curriculum pack.
 * Used at CPR clock entry (ResusGPS and unified clock).
 */

export type LifeSupportPack = 'PALS' | 'ACLS' | 'NRP';

export type ResusSetting = 'hospital' | 'prehospital' | 'delivery_room';

/** Approximate puberty threshold (years) when ACLS adult pathways may apply. */
const PUBERTY_AGE_MONTHS = 144; // 12 years

/** NRP is a delivery-room/newborn context; age alone must not switch a hospital arrest into NRP. */

export type LifeSupportAgeBand = 'newborn_delivery_room' | 'infant_child' | 'adult';

const MAX_DELIVERY_ROOM_AGE_MONTHS = 1;

export interface LifeSupportPackResult {
  pack: LifeSupportPack;
  label: string;
  rationale: string;
  ageBand: LifeSupportAgeBand;
  /** Clinical content release label; this is not a claim of local governance approval. */
  contentVersion: '2025 AHA/AAP reference';
}

/**
 * Resolve PALS vs ACLS vs NRP from age and optional clinical context.
 */
export function resolveLifeSupportPack(
  ageMonths: number,
  puberty?: boolean,
  setting?: ResusSetting
): LifeSupportPackResult {
  if (!Number.isFinite(ageMonths) || ageMonths < 0) {
    throw new Error('A valid non-negative patient age is required to select a life-support pathway.');
  }

  if (setting === 'delivery_room') {
    if (ageMonths >= MAX_DELIVERY_ROOM_AGE_MONTHS) {
      throw new Error('Delivery-room NRP requires an explicitly confirmed newborn under 1 month; use the hospital paediatric pathway for older patients.');
    }
    return {
      pack: 'NRP',
      label: 'Neonatal Resuscitation (NRP)',
      rationale: 'Explicit delivery-room newborn context with age under 1 month',
      ageBand: 'newborn_delivery_room',
      contentVersion: '2025 AHA/AAP reference',
    };
  }

  if (puberty === true || ageMonths >= PUBERTY_AGE_MONTHS) {
    return {
      pack: 'ACLS',
      label: 'Adult ACLS',
      rationale: puberty === true
        ? 'Explicit post-pubertal/adult algorithm selection'
        : 'Age ≥12 years — adult algorithm selection per current product policy',
      ageBand: 'adult',
      contentVersion: '2025 AHA/AAP reference',
    };
  }

  return {
    pack: 'PALS',
    label: 'Paediatric Advanced Life Support (PALS)',
    rationale: 'Infant/child — PALS cardiac arrest algorithms',
    ageBand: 'infant_child',
    contentVersion: '2025 AHA/AAP reference',
  };
}
