/**
 * Migration 0096 — provider-owned shift readiness sign-off evidence.
 *
 * Run: pnpm run db:apply-0096
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0096] DATABASE_URL is required.");
  process.exit(1);
}

async function addColumnIfMissing(conn, table, column, definition) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (rows.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[0096] Added ${table}.${column}`);
  }
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await addColumnIfMissing(conn, "shift_utl_rosters", "readiness_signed_off_by_user_id", "INT NULL");
    await addColumnIfMissing(conn, "shift_utl_rosters", "readiness_note", "TEXT NULL");
    console.log("[0096] Shift readiness sign-off columns are ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0096] Fatal error:", error);
  process.exit(1);
});
