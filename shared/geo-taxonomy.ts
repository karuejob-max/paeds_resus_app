/**
 * Country → geographic taxonomy config. Single source of truth for the
 * country/admin_level_1/admin_level_2 hierarchy used by BOTH Care Signal
 * and Safe-Truth, per the CEO's "global from day 1" instruction
 * (gap-analysis queue item #11, 2026-07-16) and Event Models v1.0 §2.3's
 * own note that admin-level labels vary by country ("County" in Kenya,
 * "District" in Uganda, "State" in India).
 *
 * Previously this ISO2 mapping was duplicated inline in
 * client/src/lib/care-signal-v3.ts — consolidated here so Care Signal and
 * Safe-Truth can never drift apart on country codes or labels, and so
 * adding a new country is one edit in one file, not several.
 *
 * DELIBERATELY MINIMAL FOR NOW: only Kenya has a populated admin_level_1
 * options list (the 47 counties, from kenya-counties.ts) — this is a
 * single-country pilot today. The other COMMON_FACILITY_COUNTRIES entries
 * have correct ISO2 codes and labels but no options list yet; the UI falls
 * back to free text for admin_level_1 in those countries until real
 * expansion happens. This is intentional: the shape is global-ready, the
 * data entry is honestly Kenya-only until there's a reason to populate more.
 */
import { KENYA_COUNTIES } from "./kenya-counties";

export type CountryGeoConfig = {
  isoCode: string;
  /** Plain-language label for admin_level_1 in this country's own usage. */
  adminLevel1Label: string;
  /** Plain-language label for admin_level_2 (locality) in this country's own usage. */
  adminLevel2Label: string;
  /** Populated only where the platform has real operational presence (Kenya today). */
  adminLevel1Options: readonly string[] | null;
};

export const COUNTRY_GEO_CONFIG: Record<string, CountryGeoConfig> = {
  Kenya: {
    isoCode: "KE",
    adminLevel1Label: "County",
    adminLevel2Label: "Sub-county / area",
    adminLevel1Options: KENYA_COUNTIES,
  },
  Uganda: {
    isoCode: "UG",
    adminLevel1Label: "District",
    adminLevel2Label: "Sub-county / area",
    adminLevel1Options: null,
  },
  Tanzania: {
    isoCode: "TZ",
    adminLevel1Label: "Region",
    adminLevel2Label: "District / area",
    adminLevel1Options: null,
  },
  Rwanda: {
    isoCode: "RW",
    adminLevel1Label: "Province",
    adminLevel2Label: "District / area",
    adminLevel1Options: null,
  },
  "South Sudan": {
    isoCode: "SS",
    adminLevel1Label: "State",
    adminLevel2Label: "County / area",
    adminLevel1Options: null,
  },
  Ethiopia: {
    isoCode: "ET",
    adminLevel1Label: "Region",
    adminLevel2Label: "Zone / area",
    adminLevel1Options: null,
  },
};

const FALLBACK_GEO_CONFIG: CountryGeoConfig = {
  isoCode: "OT",
  adminLevel1Label: "State / province / region",
  adminLevel2Label: "District / locality",
  adminLevel1Options: null,
};

export function getCountryGeoConfig(countryName: string): CountryGeoConfig {
  return COUNTRY_GEO_CONFIG[countryName] ?? FALLBACK_GEO_CONFIG;
}

export function countryNameToIso2(countryName: string): string {
  const config = COUNTRY_GEO_CONFIG[countryName];
  if (config) return config.isoCode;
  // Already an ISO2-looking code (e.g. passed through from a facility record)?
  if (/^[A-Za-z]{2}$/.test(countryName)) return countryName.toUpperCase();
  return FALLBACK_GEO_CONFIG.isoCode;
}
