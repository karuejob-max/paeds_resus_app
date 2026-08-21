/**
 * Verify the production IERS schema and essential operational columns.
 *
 * Run after applying migrations 0094–0099:
 *   pnpm run db:verify-iers
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function exists(conn, dbName, table, column = null) {
  const [rows] = await conn.query(
    column
      ? `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`
      : `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    column ? [dbName, table, column] : [dbName, table],
  );
  return Array.isArray(rows) && rows.length > 0;
}

const REQUIRED_TABLES = [
  "institution_memberships",
  "iers_activation_events",
  "iers_activation_responders",
  "iers_activation_timeline",
  "iers_evidence_records",
  "iers_action_items",
  "iers_drills",
  "iers_drill_participants",
  "iers_implementation_milestones",
];

const REQUIRED_COLUMNS = [
  ["institution_memberships", "responsibility_role"],
  ["institution_memberships", "membership_status"],
  ["iers_activation_events", "status"],
  ["iers_activation_events", "triggered_at"],
  ["iers_activation_responders", "notification_status"],
  ["iers_activation_timeline", "event_type"],
  ["iers_evidence_records", "criterion_code"],
  ["iers_evidence_records", "reviewed_by_user_id"],
  ["iers_action_items", "owner_user_id"],
  ["iers_action_items", "closure_evidence_id"],
  ["iers_drills", "debrief_note"],
  ["iers_implementation_milestones", "evidence_id"],
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await createMysqlConnection(databaseUrl, mysql);
  let missing = 0;
  try {
    for (const table of REQUIRED_TABLES) {
      const ok = await exists(conn, dbName, table);
      console.log(`${ok ? "[ok]" : "[MISSING]"} table ${table}`);
      if (!ok) missing += 1;
    }
    for (const [table, column] of REQUIRED_COLUMNS) {
      const ok = await exists(conn, dbName, table, column);
      console.log(`${ok ? "[ok]" : "[MISSING]"} ${table}.${column}`);
      if (!ok) missing += 1;
    }
  } finally {
    await conn.end();
  }
  if (missing) {
    console.error(`\nIERS verification FAILED — ${missing} missing object(s). Apply migrations 0094–0099 in order.`);
    process.exit(1);
  }
  console.log("\nIERS verification PASSED — activation, evidence, action, drill, and implementation objects are present.");
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
