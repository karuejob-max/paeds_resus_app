/*
 * Migration 0140 — non-arrest ResusGPS clinical event timeline.
 * Reservation: migration-reserved-0140
 *
 * Additive and idempotent. This table is deliberately separate from product
 * analytics and fellowship credit. It stores only authenticated case events,
 * with a client-provided idempotency key and an optional soft link to an
 * existing IERS activation. No patient identifiers are written here.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0140] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0140] Preparing non-arrest ResusGPS clinical event timeline...");
    if (!(await tableExists(conn, "resus_gps_clinical_events"))) {
      await conn.query(`
        CREATE TABLE \`resus_gps_clinical_events\` (
          \`local_event_id\` VARCHAR(96) NOT NULL,
          \`session_id\` VARCHAR(64) NOT NULL,
          \`user_id\` INT NOT NULL,
          \`activation_event_id\` INT NULL,
          \`event_type\` VARCHAR(64) NOT NULL,
          \`letter\` VARCHAR(1) NULL,
          \`detail\` TEXT NOT NULL,
          \`event_data\` TEXT NULL,
          \`event_timestamp\` BIGINT NOT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`local_event_id\`),
          KEY \`resus_gps_clinical_events_session_time_idx\` (\`session_id\`, \`event_timestamp\`),
          KEY \`resus_gps_clinical_events_activation_time_idx\` (\`activation_event_id\`, \`event_timestamp\`),
          KEY \`resus_gps_clinical_events_user_time_idx\` (\`user_id\`, \`event_timestamp\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    console.log("[0140] Non-arrest ResusGPS clinical event timeline is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0140] Fatal error:", error);
  process.exit(1);
});
