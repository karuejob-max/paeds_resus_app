/**
 * Idempotent: migration 0065 — two things, both purely additive.
 *
 * 1. `careSignalEvents.admin_level_2` (locality) — per the CEO's "global
 *    from day 1" instruction (gap-analysis #11, 2026-07-16): country →
 *    admin_level_1 (county/state/province) → admin_level_2 (locality) for
 *    geographic pattern mapping. Mirrors the existing admin_level_1 column
 *    exactly.
 *
 * 2. Safe-Truth v1 schema (Event Models v1.0 §2, gap-analysis #11 Phase A):
 *    three new tables — `safeTruthSubmissions`, `safeTruthFacilityVisits`,
 *    `safeTruthDisclaimerAcks`. See drizzle/schema.ts's doc comments for
 *    the full rationale (in particular: why these are new tables, not a
 *    retrofit of `parentSafeTruthSubmissions`, whose NOT NULL `userId`
 *    column is structurally incompatible with §2.2's no-account model).
 *
 * NOTE ON COLUMN NAMES (lesson from migration 0064's bug): every raw SQL
 * identifier below was copied directly from the string literal inside each
 * column's Drizzle builder call in schema.ts — NOT inferred from the JS
 * property name. Cross-checked before running.
 *
 * Run: pnpm run db:apply-0065
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].c > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0065] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    // ── 1. careSignalEvents.admin_level_2 ──────────────────────────────────
    if (await columnExists(conn, "careSignalEvents", "admin_level_2")) {
      console.log("[0065]   ✓ careSignalEvents.admin_level_2 already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`admin_level_2\` VARCHAR(128) NULL AFTER \`admin_level_1\``
      );
      console.log("[0065]   + Added careSignalEvents.admin_level_2.");
    }

    // ── 2. safeTruthSubmissions ─────────────────────────────────────────────
    if (await tableExists(conn, "safeTruthSubmissions")) {
      console.log("[0065]   ✓ safeTruthSubmissions already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`safeTruthSubmissions\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`submission_uuid\` VARCHAR(36) NOT NULL,
          \`observation_timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`schema_version\` VARCHAR(16) NOT NULL DEFAULT '1.0',
          \`observer_class\` VARCHAR(16) NOT NULL DEFAULT 'CAREGIVER',
          \`country\` VARCHAR(2) NOT NULL,
          \`admin_level_1\` VARCHAR(128) NOT NULL,
          \`admin_level_2\` VARCHAR(128) NULL,
          \`facility_name_raw\` TEXT NOT NULL,
          \`facility_id_matched\` VARCHAR(36) NULL,
          \`facility_level\` VARCHAR(64) NULL,
          \`child_age_band\` VARCHAR(32) NOT NULL,
          \`condition_category\` VARCHAR(64) NOT NULL,
          \`outcome_category\` VARCHAR(64) NOT NULL,
          \`is_case_linkage_consented\` BOOLEAN NOT NULL DEFAULT FALSE,
          \`event_code_entered\` VARCHAR(36) NULL,
          \`symptom_onset_days_ago\` VARCHAR(32) NOT NULL,
          \`first_symptom_noticed\` TEXT NULL,
          \`danger_signs_present\` TEXT NULL,
          \`advice_received_before_facility\` TEXT NOT NULL,
          \`advice_content_raw\` TEXT NULL,
          \`reassured_despite_danger\` BOOLEAN NULL,
          \`decision_to_seek_care_trigger\` TEXT NULL,
          \`transport_used\` TEXT NOT NULL,
          \`transport_delay_occurred\` BOOLEAN NOT NULL,
          \`transport_delay_reason\` TEXT NULL,
          \`travel_time_to_first_facility\` VARCHAR(32) NOT NULL,
          \`cost_barrier_occurred\` BOOLEAN NOT NULL,
          \`cost_barrier_details\` TEXT NULL,
          \`facilities_visited_count\` VARCHAR(64) NOT NULL,
          \`follow_up_instructions_received\` BOOLEAN NULL,
          \`able_to_follow_instructions\` BOOLEAN NULL,
          \`unable_to_follow_reason\` TEXT NULL,
          \`overall_experience_rating\` VARCHAR(32) NULL,
          \`what_could_have_been_better\` TEXT NULL,
          \`raw_narrative\` TEXT NOT NULL,
          \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY \`safeTruthSubmissions_submission_uuid_unique\` (\`submission_uuid\`),
          KEY \`safeTruthSubmissions_country_admin1_idx\` (\`country\`, \`admin_level_1\`),
          KEY \`safeTruthSubmissions_event_code_idx\` (\`event_code_entered\`)
        )
      `);
      console.log("[0065]   + Created safeTruthSubmissions.");
    }

    // ── 3. safeTruthFacilityVisits ──────────────────────────────────────────
    if (await tableExists(conn, "safeTruthFacilityVisits")) {
      console.log("[0065]   ✓ safeTruthFacilityVisits already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`safeTruthFacilityVisits\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`submission_id\` INT NOT NULL,
          \`visit_sequence\` INT NOT NULL,
          \`visit_facility_name_raw\` TEXT NOT NULL,
          \`visit_facility_id_matched\` VARCHAR(36) NULL,
          \`visit_facility_is_final\` BOOLEAN NOT NULL DEFAULT FALSE,
          \`was_seen_promptly\` VARCHAR(32) NOT NULL,
          \`turned_away\` BOOLEAN NOT NULL DEFAULT FALSE,
          \`turned_away_reason\` TEXT NULL,
          \`information_received\` VARCHAR(64) NULL,
          \`family_involvement\` VARCHAR(64) NULL,
          \`visit_experience_raw\` TEXT NULL,
          \`danger_sign_advice_at_discharge\` BOOLEAN NULL,
          \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY \`safeTruthFacilityVisits_submission_id_idx\` (\`submission_id\`)
        )
      `);
      console.log("[0065]   + Created safeTruthFacilityVisits.");
    }

    // ── 4. safeTruthDisclaimerAcks ──────────────────────────────────────────
    if (await tableExists(conn, "safeTruthDisclaimerAcks")) {
      console.log("[0065]   ✓ safeTruthDisclaimerAcks already exists — skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`safeTruthDisclaimerAcks\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`device_session_id\` VARCHAR(36) NOT NULL,
          \`disclaimer_version\` VARCHAR(16) NOT NULL,
          \`accepted_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("[0065]   + Created safeTruthDisclaimerAcks.");
    }

    console.log("[0065] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0065] Fatal error:", err);
  process.exit(1);
});
