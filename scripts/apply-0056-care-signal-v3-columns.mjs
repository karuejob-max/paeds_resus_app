/**
 * Idempotent: Care Signal v3 columns on careSignalEvents (migration 0056).
 *
 * Adds to careSignalEvents:
 *   - country              VARCHAR(2)    ISO 3166-1 alpha-2 (global classifier)
 *   - admin_level_1        VARCHAR(128)  First administrative division
 *   - facility_ownership   VARCHAR(64)   Government/Faith-Based/Private/etc.
 *   - schema_version       VARCHAR(16)   Taxonomy version at submission
 *   - condition_category   VARCHAR(64)   Shared classifier
 *   - child_age_band       VARCHAR(32)   Shared classifier
 *   - outcome_category     VARCHAR(64)   Shared classifier
 *   - role_at_time_of_event VARCHAR(64)  Distinct from profile cadre
 *   - provider_cadre       VARCHAR(64)   Loaded from profile at submission
 *   - report_track         VARCHAR(16)   FAILURE or SUCCESS
 *   - failure_mode_codes   TEXT          JSON array of kb_failure_modes codes
 *   - raw_narrative        TEXT          Preserved permanently — immutable
 *   - temporal_intervals   TEXT          JSON timing data
 *   - event_id             VARCHAR(36)   Optional collaborative event link
 *
 * Run: pnpm run db:apply-0056
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0056] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    console.log("[0056] Starting Care Signal v3 column migration...");

    const columns = [
      {
        name: "country",
        ddl: "ADD COLUMN `country` VARCHAR(2) NULL DEFAULT NULL COMMENT 'ISO 3166-1 alpha-2 — global shared classifier'",
      },
      {
        name: "admin_level_1",
        ddl: "ADD COLUMN `admin_level_1` VARCHAR(128) NULL DEFAULT NULL COMMENT 'First administrative division (county/district/state)'",
      },
      {
        name: "facility_ownership",
        ddl: "ADD COLUMN `facility_ownership` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Government|Faith-Based|Private-for-profit|Private-not-for-profit|Military|Other'",
      },
      {
        name: "schema_version",
        ddl: "ADD COLUMN `schema_version` VARCHAR(16) NOT NULL DEFAULT '1.0' COMMENT 'Failure domain taxonomy version at submission'",
      },
      {
        name: "condition_category",
        ddl: "ADD COLUMN `condition_category` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Shared classifier: RESPIRATORY|CARDIOVASCULAR|NEUROLOGICAL|INFECTIOUS_BACTERIAL|INFECTIOUS_VIRAL|METABOLIC|TRAUMA|NEONATAL|POISONING|OTHER'",
      },
      {
        name: "child_age_band",
        ddl: "ADD COLUMN `child_age_band` VARCHAR(32) NULL DEFAULT NULL COMMENT 'Shared classifier: NEONATAL|INFANT|TODDLER|PRESCHOOL|SCHOOL|ADOLESCENT'",
      },
      {
        name: "outcome_category",
        ddl: "ADD COLUMN `outcome_category` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Shared classifier: SURVIVED_WELL|SURVIVED_MORBIDITY|DIED_IN_FACILITY|DIED_IN_TRANSIT|NEAR_MISS|TRANSFERRED_UNKNOWN|UNKNOWN'",
      },
      {
        name: "role_at_time_of_event",
        ddl: "ADD COLUMN `role_at_time_of_event` VARCHAR(64) NULL DEFAULT NULL COMMENT 'TEAM_LEADER|PRIMARY_CLINICIAN|SUPPORT_CLINICIAN|OBSERVING_TRAINEE|LOCUM — distinct from profile cadre'",
      },
      {
        name: "provider_cadre",
        ddl: "ADD COLUMN `provider_cadre` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Loaded from provider profile at submission — enables cadre-stratified pattern analysis'",
      },
      {
        name: "report_track",
        ddl: "ADD COLUMN `report_track` VARCHAR(16) NOT NULL DEFAULT 'FAILURE' COMMENT 'FAILURE or SUCCESS — bidirectional learning system track'",
      },
      {
        name: "failure_mode_codes",
        ddl: "ADD COLUMN `failure_mode_codes` TEXT NULL DEFAULT NULL COMMENT 'JSON array of kb_failure_modes.failure_mode_code values'",
      },
      {
        name: "raw_narrative",
        ddl: "ADD COLUMN `raw_narrative` TEXT NULL DEFAULT NULL COMMENT 'Provider narrative — preserved permanently, never overwritten after submission'",
      },
      {
        name: "temporal_intervals",
        ddl: "ADD COLUMN `temporal_intervals` TEXT NULL DEFAULT NULL COMMENT 'JSON: {timeToRecognitionMins, timeToFirstInterventionMins, timeToVascularAccessMins, timeToEscalationMins, hoursSinceEvent}'",
      },
      {
        name: "event_id",
        ddl: "ADD COLUMN `event_id` VARCHAR(36) NULL DEFAULT NULL COMMENT 'Optional UUID linking multiple observations to the same collaborative clinical event'",
      },
    ];

    for (const col of columns) {
      if (await columnExists(conn, "careSignalEvents", col.name)) {
        console.log(`[0056]   ✓ Column '${col.name}' already exists — skipping.`);
      } else {
        await conn.query(`ALTER TABLE \`careSignalEvents\` ${col.ddl}`);
        console.log(`[0056]   + Added column '${col.name}'.`);
      }
    }

    // Indexes for pattern triangulation queries
    const indexes = [
      {
        name: "idx_cs_geo",
        ddl: "ALTER TABLE `careSignalEvents` ADD INDEX `idx_cs_geo` (`country`, `admin_level_1`)",
      },
      {
        name: "idx_cs_schema_version",
        ddl: "ALTER TABLE `careSignalEvents` ADD INDEX `idx_cs_schema_version` (`schema_version`)",
      },
      {
        name: "idx_cs_condition",
        ddl: "ALTER TABLE `careSignalEvents` ADD INDEX `idx_cs_condition` (`condition_category`)",
      },
      {
        name: "idx_cs_report_track",
        ddl: "ALTER TABLE `careSignalEvents` ADD INDEX `idx_cs_report_track` (`report_track`)",
      },
    ];

    for (const idx of indexes) {
      if (await indexExists(conn, "careSignalEvents", idx.name)) {
        console.log(`[0056]   ✓ Index '${idx.name}' already exists — skipping.`);
      } else {
        await conn.query(idx.ddl);
        console.log(`[0056]   + Added index '${idx.name}'.`);
      }
    }

    console.log("[0056] Care Signal v3 column migration complete.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0056] Fatal error:", err);
  process.exit(1);
});
