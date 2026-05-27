/**
 * EAC emergency numbers for bedside disclaimers (non-clinical copy).
 * Source: docs/legal/EAC_EXPANSION_LEGAL_CHECKLIST.md — verify annually with MOH/ITU.
 */

export type EacCountryCode =
  | "kenya"
  | "uganda"
  | "tanzania"
  | "rwanda"
  | "burundi"
  | "south_sudan"
  | "drc";

export type EmergencyNumberEntry = {
  country: EacCountryCode;
  label: string;
  /** Primary numbers to display (ambulance / universal emergency) */
  primary: string[];
  /** Optional secondary note (e.g. regional variation) */
  note?: string;
};

/** Ordered for disclaimer copy — Kenya first (baseline market). */
export const EAC_EMERGENCY_NUMBERS: EmergencyNumberEntry[] = [
  { country: "kenya", label: "Kenya", primary: ["999", "112"] },
  { country: "uganda", label: "Uganda", primary: ["999", "112"] },
  { country: "tanzania", label: "Tanzania", primary: ["114", "112"], note: "114 ambulance" },
  { country: "rwanda", label: "Rwanda", primary: ["912"] },
  { country: "burundi", label: "Burundi", primary: ["112"] },
  {
    country: "south_sudan",
    label: "South Sudan",
    primary: ["777", "112"],
    note: "777 common in Juba",
  },
  {
    country: "drc",
    label: "DRC",
    primary: ["112"],
    note: "regional variation — confirm locally",
  },
];

/** Compact inline disclaimer for ResusGPS / Safe-Truth gates. */
export function formatEacEmergencyInline(): string {
  const parts = EAC_EMERGENCY_NUMBERS.map((entry) => {
    const nums = entry.primary.join(" or ");
    return `${entry.label} ${nums}`;
  });
  return parts.join("; ");
}

/** Kenya-only short form (legacy one-liner). */
export function formatKenyaEmergencyShort(): string {
  return "999 or 112 in Kenya";
}
