import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("[0112] DATABASE_URL is required");
  process.exit(1);
}

async function hasColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (await hasColumn(conn, tableName, columnName)) {
    console.log(`[0112] ${tableName}.${columnName} already exists.`);
    return;
  }
  await conn.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  console.log(`[0112] Added ${tableName}.${columnName}.`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0112] Adding explicit roster assignment acceptance fields...");
    for (const [column, definition] of [
      ["ertl_user_id", "INT NULL"],
      ["assignment_status", "ENUM('unassigned', 'pending_acceptance', 'active', 'declined', 'ended') DEFAULT 'unassigned' NOT NULL"],
      ["accepted_at", "TIMESTAMP NULL"],
      ["declined_at", "TIMESTAMP NULL"],
      ["decline_reason", "VARCHAR(500) NULL"],
    ]) {
      await addColumnIfMissing(conn, "ertl_weekly_rotations", column, definition);
    }
    for (const [column, definition] of [
      ["assignment_status", "ENUM('unassigned', 'pending_acceptance', 'active', 'declined', 'ended') DEFAULT 'unassigned' NOT NULL"],
      ["accepted_at", "TIMESTAMP NULL"],
      ["declined_at", "TIMESTAMP NULL"],
      ["decline_reason", "VARCHAR(500) NULL"],
    ]) {
      await addColumnIfMissing(conn, "shift_utl_rosters", column, definition);
    }
    await conn.query("ALTER TABLE ertl_weekly_rotations MODIFY COLUMN assignment_status ENUM('unassigned', 'pending_acceptance', 'active', 'declined', 'ended') DEFAULT 'unassigned' NOT NULL");
    await conn.query("ALTER TABLE shift_utl_rosters MODIFY COLUMN assignment_status ENUM('unassigned', 'pending_acceptance', 'active', 'declined', 'ended') DEFAULT 'unassigned' NOT NULL");
    await conn.query("UPDATE ertl_weekly_rotations SET assignment_status = CASE WHEN ertl_user_id IS NULL THEN 'unassigned' ELSE 'pending_acceptance' END WHERE accepted_at IS NULL AND (assignment_status = 'active' OR assignment_status = 'unassigned')");
    await conn.query("UPDATE shift_utl_rosters SET assignment_status = CASE WHEN utl_user_id IS NULL THEN 'unassigned' ELSE 'pending_acceptance' END WHERE accepted_at IS NULL AND (assignment_status = 'active' OR assignment_status = 'unassigned')");
    console.log("[0112] Roster assignment acceptance fields ready; legacy assigned rows require explicit provider acceptance.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0112] Fatal error:", error);
  process.exit(1);
});
