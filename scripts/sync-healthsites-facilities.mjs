/**
 * Phase 2 of the global facility registry (see docs/WORK_STATUS.md, migration 0059).
 *
 * Syncs real-world facility data from healthsites.io — a free, global, OSM-based
 * health facility database — into the `facilities` table created by migration 0059.
 * Idempotent: re-running for the same country updates existing rows (matched on
 * source + source_record_id) rather than duplicating them.
 *
 * ── Before running a full country import ────────────────────────────────────
 * 1. Get a healthsites.io API key: sign in at https://healthsites.io/map with an
 *    OSM account (free to create), then generate a token from your profile page.
 *    Set it as HEALTHSITES_API_KEY in your .env file.
 * 2. Run in --inspect mode FIRST for one page, for the country you care about:
 *      pnpm run db:sync-healthsites -- --country=Kenya --inspect
 *    This prints the raw response instead of writing to the DB. The exact OSM
 *    tag names present vary a lot per facility (crowd-sourced data), and the
 *    field mapping below is a best-effort guess based on healthsites.io's
 *    documented data model (github.com/healthsites/healthsites/wiki/Healthsite-attributes)
 *    — it has NOT been verified against a live response, since that requires an
 *    API key this script doesn't have. Compare --inspect output against the
 *    mapCountryToIso2 / mapping logic below and adjust before a real import.
 * 3. Once the mapping looks right, run for real:
 *      pnpm run db:sync-healthsites -- --country=Kenya
 *
 * ── Notes ────────────────────────────────────────────────────────────────────
 * - The `country` query param format is unconfirmed by healthsites.io's docs
 *   (full name vs ISO code). This script defaults to full country name, since
 *   that matches how most OSM-boundary-based GIS tools filter by country —
 *   verify this in --inspect mode; if it returns zero results, try the ISO
 *   code instead (see COUNTRY_NAME env override).
 * - This does NOT touch careFacilities, kmhflFacilities, or repoint
 *   FacilityPicker. It only populates the new global `facilities` table.
 *   Repointing the app at this table is Phase 4 (see WORK_STATUS.md).
 *
 * Run: pnpm run db:sync-healthsites -- --country=Kenya [--inspect] [--pages=5]
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const HEALTHSITES_BASE = "https://healthsites.io/api/v3/facilities/";

// Best-effort mapping from healthsites.io's `operator:type` / `operator` OSM tags
// to our facility_ownership enum. Real-world tagging is inconsistent — anything
// unmatched falls through to OTHER rather than a guess.
const OWNERSHIP_MAP = {
  government: "GOVERNMENT",
  public: "GOVERNMENT",
  ministry_of_health: "GOVERNMENT",
  faith_based: "FAITH_BASED",
  religious: "FAITH_BASED",
  mission: "FAITH_BASED",
  church: "FAITH_BASED",
  private: "PRIVATE_FOR_PROFIT",
  private_for_profit: "PRIVATE_FOR_PROFIT",
  private_not_for_profit: "PRIVATE_NOT_FOR_PROFIT",
  ngo: "PRIVATE_NOT_FOR_PROFIT",
  charity: "PRIVATE_NOT_FOR_PROFIT",
  military: "MILITARY",
};

function mapOwnership(rawTag) {
  if (!rawTag) return null;
  const key = String(rawTag).trim().toLowerCase().replace(/\s+/g, "_");
  return OWNERSHIP_MAP[key] ?? "OTHER";
}

// ISO 3166-1 alpha-2 for the small set of countries this platform currently
// targets (matches COMMON_FACILITY_COUNTRIES in shared/kenya-counties.ts).
// Extend as the platform expands to new countries.
const COUNTRY_TO_ISO2 = {
  Kenya: "KE",
  Uganda: "UG",
  Tanzania: "TZ",
  Rwanda: "RW",
  "South Sudan": "SS",
  Ethiopia: "ET",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const hit = args.find((a) => a.startsWith(`--${flag}=`));
    return hit ? hit.split("=").slice(1).join("=") : null;
  };
  return {
    country: get("country") || "Kenya",
    inspect: args.includes("--inspect"),
    maxPages: parseInt(get("pages") || "50", 10),
  };
}

async function fetchPage(country, page, apiKey) {
  const url = new URL(HEALTHSITES_BASE);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("page", String(page));
  url.searchParams.set("country", country);
  url.searchParams.set("flat-properties", "true");
  url.searchParams.set("output", "json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`healthsites.io returned HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Extracts our facility fields from one healthsites.io feature. Best-effort — see header comment. */
function mapFeature(feature, countryName) {
  const props = feature.properties ?? feature; // flat-properties=true should flatten into top-level-ish keys
  const geom = feature.geometry ?? feature.centroid ?? null;
  const [lon, lat] = geom?.coordinates ?? [null, null];

  const name = props.name || props["name:en"] || null;
  if (!name) return null; // skip unnamed facilities — not useful for provider-facing search

  return {
    internalName: name,
    countryCode: COUNTRY_TO_ISO2[countryName] ?? countryName.slice(0, 2).toUpperCase(),
    adminLevel1: props["addr:state"] || props["addr:county"] || props["addr:region"] || null,
    adminLevel2: props["addr:city"] || props["addr:district"] || null,
    facilityLevel: props.amenity || props.healthcare || null,
    facilityLevelWho: null, // requires manual/authoritative crosswalk — not derivable from OSM tags alone
    facilityOwnership: mapOwnership(props["operator:type"] || props.operator),
    latitude: lat,
    longitude: lon,
    source: "HEALTHSITES_IO",
    sourceRecordId: `${feature.osm_type || props.osm_type || "way"}/${feature.osm_id || props.osm_id || feature.id}`,
  };
}

async function upsertFacility(conn, f) {
  const [existing] = await conn.query(
    `SELECT facility_id FROM facilities WHERE source = ? AND source_record_id = ? LIMIT 1`,
    [f.source, f.sourceRecordId]
  );

  if (existing.length > 0) {
    await conn.query(
      `UPDATE facilities SET
         internal_name = ?, country_code = ?, admin_level_1 = ?, admin_level_2 = ?,
         facility_level = ?, facility_ownership = ?, latitude = ?, longitude = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE facility_id = ?`,
      [f.internalName, f.countryCode, f.adminLevel1, f.adminLevel2,
       f.facilityLevel, f.facilityOwnership, f.latitude, f.longitude,
       existing[0].facility_id]
    );
    return "updated";
  }

  await conn.query(
    `INSERT INTO facilities
       (facility_id, internal_name, country_code, admin_level_1, admin_level_2,
        facility_level, facility_ownership, latitude, longitude, source, source_record_id)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f.internalName, f.countryCode, f.adminLevel1, f.adminLevel2,
     f.facilityLevel, f.facilityOwnership, f.latitude, f.longitude,
     f.source, f.sourceRecordId]
  );
  return "created";
}

async function ensureSourceIndex(conn) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facilities' AND INDEX_NAME = 'idx_facilities_source_record'
     LIMIT 1`
  );
  if (rows.length > 0) return;
  await conn.query(
    `ALTER TABLE \`facilities\` ADD UNIQUE INDEX \`idx_facilities_source_record\` (\`source\`, \`source_record_id\`)`
  );
  console.log("[sync-healthsites] Added unique index on (source, source_record_id) for safe dedupe.");
}

async function main() {
  const { country, inspect, maxPages } = parseArgs();
  const apiKey = process.env.HEALTHSITES_API_KEY;

  if (!apiKey) {
    console.error("[sync-healthsites] HEALTHSITES_API_KEY is required. See header comment for how to get one.");
    process.exit(1);
  }

  console.log(`[sync-healthsites] Starting sync for country="${country}" (inspect mode: ${inspect})`);

  let conn = null;
  if (!inspect) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[sync-healthsites] DATABASE_URL is required (unless using --inspect).");
      process.exit(1);
    }
    conn = await createMysqlConnection(databaseUrl, mysql);
    await ensureSourceIndex(conn);
  }

  let page = 1;
  let totalCreated = 0, totalUpdated = 0, totalSkipped = 0;

  try {
    while (page <= maxPages) {
      console.log(`[sync-healthsites] Fetching page ${page}...`);
      const data = await fetchPage(country, page, apiKey);
      const features = data.features ?? data.results ?? (Array.isArray(data) ? data : []);

      if (inspect) {
        console.log(`[sync-healthsites] --inspect: raw response for page ${page} (first feature only):`);
        console.log(JSON.stringify(features[0] ?? data, null, 2));
        console.log(`[sync-healthsites] --inspect: ${features.length} features on this page. Stopping after page 1 in inspect mode.`);
        break;
      }

      if (features.length === 0) {
        console.log(`[sync-healthsites] No more features. Done at page ${page}.`);
        break;
      }

      for (const feature of features) {
        const mapped = mapFeature(feature, country);
        if (!mapped) { totalSkipped++; continue; }
        const result = await upsertFacility(conn, mapped);
        if (result === "created") totalCreated++; else totalUpdated++;
      }

      console.log(`[sync-healthsites]   Page ${page}: ${features.length} features processed.`);
      page++;
    }

    if (!inspect) {
      console.log(`[sync-healthsites] Sync complete for "${country}". Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped (unnamed): ${totalSkipped}.`);
    }
  } finally {
    if (conn) await conn.end();
  }
}

main().catch((err) => {
  console.error("[sync-healthsites] Fatal error:", err);
  process.exit(1);
});
