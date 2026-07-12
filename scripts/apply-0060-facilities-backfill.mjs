/**
 * Idempotent: Facility Phase 4a — backfill the unified `facilities` table
 * (migration 0059) from the existing `careFacilities` registry.
 *
 * Why this exists / why it's scoped the way it is:
 * Facility Phase 4 was originally scoped as "repoint FacilityPicker's search
 * at the unified table." On inspection that's unsafe to do directly right
 * now, for two reasons:
 *
 *   1. `facilities.facility_id` is a UUID (varchar(36)); `careFacilities.id`
 *      and every downstream FK (providerProfiles.facilityId,
 *      careSignalEvents.facilityId, institutionalActionLogs.facilityId, etc.
 *      — 7+ tables) is an autoincrement int. Repointing the *search* alone
 *      would return UUIDs into code that expects ints, breaking facility
 *      selection, provider profiles, and Care Signal submission across the
 *      whole app. Unifying the ID type is a real migration project of its
 *      own — not something to fold into a "repoint the picker" PR.
 *   2. Phase 2 (healthsites.io sync) and Phase 3 (KMHFL sync) — the reason
 *      the unified table has richer geographic/ownership data than
 *      careFacilities — are both still blocked (API key pending / MoH access
 *      pending per docs/WORK_STATUS.md). The `facilities` table is close to
 *      empty right now. Pointing search at it today would make facility
 *      lookup return almost nothing.
 *
 * So this step (4a) does the safe, additive part: backfill `facilities` from
 * `careFacilities`, bridged via `legacy_care_facility_id` (a column reserved
 * for exactly this in migration 0059). It does NOT change any ID type and
 * does NOT touch FacilityPicker's search source — see
 * server/services/facility-registry.service.ts, which now LEFT JOINs this
 * bridge to enrich existing int-keyed search/getById results with
 * country_code / admin_level_1 / facility_level / facility_ownership where
 * available, without changing what `id` means anywhere in the app.
 *
 * Re-running is safe: any careFacilities row already bridged (has a
 * `facilities` row with matching legacy_care_facility_id) is skipped.
 *
 * Run: pnpm run db:backfill-0060
 */
import "dotenv/config";
import crypto from "crypto";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

/** Matches shared/kenya-counties.ts COMMON_FACILITY_COUNTRIES. "Other" has no
 *  single ISO code, so it's intentionally left unmapped (facility_ownership /
 *  country_code stay best-effort — flagged for manual review, not guessed). */
const COUNTRY_NAME_TO_ISO2 = {
  Kenya: "KE",
  Uganda: "UG",
  Tanzania: "TZ",
  Rwanda: "RW",
  "South Sudan": "SS",
  Ethiopia: "ET",
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0060] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  let created = 0;
  let skippedNoIso = 0;
  let alreadyBridged = 0;

  try {
    const [careFacilityRows] = await conn.query(
      `SELECT id, name, county, country, facilityType
       FROM careFacilities
       WHERE mergedIntoId IS NULL`
    );
    console.log(`[0060] ${careFacilityRows.length} unmerged careFacilities rows found.`);

    for (const cf of careFacilityRows) {
      const [existing] = await conn.query(
        `SELECT facility_id FROM facilities WHERE legacy_care_facility_id = ? LIMIT 1`,
        [cf.id]
      );
      if (existing.length > 0) {
        alreadyBridged++;
        continue;
      }

      const iso2 = COUNTRY_NAME_TO_ISO2[cf.country?.trim()];
      if (!iso2) {
        // country_code is NOT NULL on `facilities` — rather than guess, skip
        // and report, so these can be reviewed manually (likely "Other").
        skippedNoIso++;
        continue;
      }

      await conn.query(
        `INSERT INTO facilities
           (facility_id, internal_name, country_code, admin_level_1, facility_level,
            source, legacy_care_facility_id, is_verified)
         VALUES (?, ?, ?, ?, ?, 'MANUAL', ?, 0)`,
        [crypto.randomUUID(), cf.name, iso2, cf.county ?? null, cf.facilityType ?? null, cf.id]
      );
      created++;
    }

    console.log(`[0060] Created ${created} bridged facilities rows.`);
    console.log(`[0060] Already bridged (skipped): ${alreadyBridged}.`);
    if (skippedNoIso > 0) {
      console.log(
        `[0060] Skipped ${skippedNoIso} rows with unmapped country names (e.g. "Other") — ` +
        `these need a manual country_code before they can bridge. Not guessed on purpose.`
      );
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0060] Fatal error:", err);
  process.exit(1);
});
