/**
 * Migration 0089 -- CEO decision 2026-08-06: Code Signal, the adult/
 * whole-hospital counterpart to Care Signal's paediatric incident reporting.
 * See docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md and
 * drizzle/schema.ts's codeSignalEvents comment for the full rationale.
 *
 * Creates a single new table, `codeSignalEvents`. No existing table is
 * altered -- deliberately structurally separate from `careSignalEvents`
 * (see schema comment). Idempotent: safe to re-run.
 *
 * Run: pnpm run db:apply-0089
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0089] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0089] Running Code Signal table migration...");

    if (await tableExists(conn, "codeSignalEvents")) {
      console.log("[0089]   \u2713 codeSignalEvents already exists -- skipping.");
    } else {
      await conn.query(`
        CREATE TABLE \`codeSignalEvents\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`userId\` INT NULL,
          \`facilityId\` INT NULL,
          \`eventDate\` TIMESTAMP NOT NULL,
          \`patient_category\` ENUM('ADULT_PATIENT','MOTHER_OF_PATIENT','STAFF_MEMBER','OTHER') NOT NULL,
          \`condition_category\` VARCHAR(64) NOT NULL,
          \`outcome_category\` VARCHAR(64) NOT NULL,
          \`role_at_time_of_event\` VARCHAR(64) NOT NULL,
          \`country\` VARCHAR(2) NULL,
          \`admin_level_1\` VARCHAR(128) NULL,
          \`admin_level_2\` VARCHAR(128) NULL,
          \`facility_ownership\` VARCHAR(64) NULL,
          \`schema_version\` VARCHAR(16) NOT NULL DEFAULT '1.0',
          \`report_track\` ENUM('FAILURE','SUCCESS') NOT NULL DEFAULT 'FAILURE',
          \`failure_domains\` TEXT NULL,
          \`failure_mode_codes\` TEXT NULL,
          \`success_domains\` TEXT NULL,
          \`success_factor_codes\` TEXT NULL,
          \`raw_narrative\` TEXT NOT NULL,
          \`redacted_narrative\` TEXT NULL,
          \`status\` VARCHAR(32) NOT NULL DEFAULT 'submitted',
          \`event_id\` VARCHAR(36) NULL,
          \`submissionMode\` ENUM('named','anonymous') NOT NULL DEFAULT 'named',
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_code_signal_facility\` (\`facilityId\`),
          INDEX \`idx_code_signal_user\` (\`userId\`),
          INDEX \`idx_code_signal_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("[0089]   + codeSignalEvents created.");
    }

    console.log("[0089] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0089] Fatal error:", err);
  process.exit(1);
});
