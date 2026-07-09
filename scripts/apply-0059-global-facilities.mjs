/**
 * Idempotent: Global Facilities Reference Table (migration 0059).
 *
 * Implements the facility reference table specified in
 * OBSERVATION_ARCHITECTURE_V1_1.md §5.1 "Global Geographic Hierarchy":
 *   facilities (facility_id UUID, internal_name, country_code, admin_level_1,
 *               admin_level_2, facility_level, facility_ownership)
 *
 * This is a NEW, ADDITIVE table. It does NOT touch, replace, or drop the
 * existing `careFacilities` or `kmhflFacilities` tables — those keep working
 * exactly as they do today. This migration only lays the foundation for the
 * unified global registry described in North Star v2.0 §7.3 "Global from
 * Day One". Repointing Care Signal's FacilityPicker at this table, and
 * backfilling it from careFacilities/kmhflFacilities/healthsites.io, are
 * later, separate migrations (Phase 2+) — deliberately not bundled here so
 * this step is small, reviewable, and safe to run without any app code
 * depending on it yet.
 *
 * Run: pnpm run db:apply-0059
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function createTableIfMissing(conn, name, ddl) {
  if (await tableExists(conn, name)) {
    console.log(`[0059]   ✓ ${name} already exists — skipping.`);
    return;
  }
  await conn.query(ddl);
  console.log(`[0059]   + Created ${name}.`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0059] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    console.log("[0059] Starting global facilities reference table migration...");

    await createTableIfMissing(conn, "facilities", `
      CREATE TABLE \`facilities\` (
        \`facility_id\`       VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`internal_name\`     VARCHAR(255)  NOT NULL,
        \`country_code\`      VARCHAR(2)    NOT NULL COMMENT 'ISO 3166-1 alpha-2',
        \`admin_level_1\`     VARCHAR(128)  NULL COMMENT 'County / state / province / region',
        \`admin_level_2\`     VARCHAR(128)  NULL COMMENT 'Sub-county / district, where available',
        \`facility_level\`    VARCHAR(64)   NULL COMMENT 'Country-specific level label as commonly used locally (e.g. "Level 4")',
        \`facility_level_who\` VARCHAR(16)  NULL COMMENT 'WHO Level 1-6 equivalent, for cross-country analysis per Observation Architecture v1.1 section 5.1',
        \`facility_ownership\` ENUM(
          'GOVERNMENT','FAITH_BASED','PRIVATE_FOR_PROFIT',
          'PRIVATE_NOT_FOR_PROFIT','MILITARY','OTHER'
        ) NULL,
        \`latitude\`          DECIMAL(10,7) NULL,
        \`longitude\`         DECIMAL(10,7) NULL,
        \`source\`            ENUM(
          'HEALTHSITES_IO','KMHFL','OTHER_NATIONAL_REGISTRY','MANUAL'
        ) NOT NULL DEFAULT 'MANUAL' COMMENT 'Where this row came from, for re-sync and dedupe',
        \`source_record_id\`  VARCHAR(128)  NULL COMMENT 'Original ID in the source system, e.g. healthsites.io node id or KMHFL code',
        \`legacy_care_facility_id\` INT     NULL COMMENT 'Bridges to existing careFacilities.id during Phase 4 migration — not yet used',
        \`legacy_kmhfl_facility_id\` INT    NULL COMMENT 'Bridges to existing kmhflFacilities.id during Phase 4 migration — not yet used',
        \`is_verified\`       BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'True once confirmed against an authoritative source',
        \`created_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`facility_id\`),
        KEY \`idx_facilities_country\` (\`country_code\`),
        KEY \`idx_facilities_admin1\` (\`country_code\`, \`admin_level_1\`),
        KEY \`idx_facilities_name\` (\`internal_name\`),
        KEY \`idx_facilities_source\` (\`source\`, \`source_record_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log("[0059] Global facilities reference table ready.");
    console.log("[0059] Next: Phase 2 will sync real facility data from healthsites.io into this table.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0059] Fatal error:", err);
  process.exit(1);
});
