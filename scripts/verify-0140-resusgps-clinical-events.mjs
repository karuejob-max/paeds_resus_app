/*
 * Read-only verification for migration 0140.
 * Run: pnpm run db:verify-0140
 * This script never inserts, updates, or deletes clinical data.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0140] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName],
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function indexExists(conn, tableName, indexName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
    [tableName, indexName],
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  let failed = false;
  try {
    const [tables] = await conn.query(
      "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'resus_gps_clinical_events'",
    );
    if (Number(tables?.[0]?.c ?? 0) === 0) {
      console.error("[missing] table resus_gps_clinical_events");
      process.exitCode = 1;
      return;
    }
    console.log("[ok] table resus_gps_clinical_events");

    const requiredColumns = [
      "local_event_id",
      "session_id",
      "user_id",
      "activation_event_id",
      "event_type",
      "letter",
      "detail",
      "event_data",
      "event_timestamp",
      "created_at",
    ];
    for (const column of requiredColumns) {
      const ok = await columnExists(conn, "resus_gps_clinical_events", column);
      console.log(`${ok ? "[ok]" : "[missing]"} column resus_gps_clinical_events.${column}`);
      failed ||= !ok;
    }

    const requiredIndexes = [
      "PRIMARY",
      "resus_gps_clinical_events_session_time_idx",
      "resus_gps_clinical_events_activation_time_idx",
      "resus_gps_clinical_events_user_time_idx",
    ];
    for (const index of requiredIndexes) {
      const ok = await indexExists(conn, "resus_gps_clinical_events", index);
      console.log(`${ok ? "[ok]" : "[missing]"} index ${index}`);
      failed ||= !ok;
    }

    if (failed) {
      console.error("[0140] Verification FAILED.");
      process.exitCode = 1;
    } else {
      console.log("[0140] Verification PASSED — non-arrest event timeline is present.");
    }
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0140] Fatal error:", error);
  process.exit(1);
});
