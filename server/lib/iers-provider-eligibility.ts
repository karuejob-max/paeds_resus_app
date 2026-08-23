const STAFF_RN_CADRE_VALUES = new Set([
  "rn",
  "registered nurse",
  "staff rn",
  "staff, rn",
  "msn",
  "hnd",
  "bsn",
  "bsm",
  "other undergraduate",
  "krchn",
  "krnm",
  "krn",
  "krm",
  "other diploma rn",
  "kechn",
  "other certificate rn",
  "other rn",
]);

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

/**
 * A UTL/ERCo candidate is an RN when the authoritative staff row says nurse,
 * the account provider type says nurse, or the shared Staff/RN profile taxonomy
 * resolves to one of the non-student RN leaf values. `cadreOther` is included
 * for older "Other Staff" registrations that recorded RN in the free-text field.
 */
export function isRegisteredRnProfile(input: {
  staffRole?: string | null;
  providerType?: string | null;
  cadre?: string | null;
  cadreOther?: string | null;
}) {
  const cadre = normalize(input.cadre);
  const cadreOther = normalize(input.cadreOther);
  if (cadre.endsWith(" student") || cadreOther.endsWith(" student")) return false;

  if (normalize(input.staffRole) === "nurse" || normalize(input.providerType) === "nurse") {
    return true;
  }

  return STAFF_RN_CADRE_VALUES.has(cadre)
    || STAFF_RN_CADRE_VALUES.has(cadreOther)
    || /\bregistered nurse\b/.test(cadre)
    || /\bregistered nurse\b/.test(cadreOther);
}

export function displayStaffRole(input: {
  staffRole?: string | null;
  providerType?: string | null;
  cadre?: string | null;
  cadreOther?: string | null;
}) {
  return isRegisteredRnProfile(input) ? "nurse" : input.staffRole ?? "other";
}

export const registeredStaffRnCadreValues = [...STAFF_RN_CADRE_VALUES];
