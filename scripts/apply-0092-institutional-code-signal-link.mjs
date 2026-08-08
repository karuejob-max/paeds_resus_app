/**
 * Migration 0092 -- adds `codeSignalEventId` to `institutionalActionLogs`,
 * mirroring the existing `careSignalEventId` column (migration 0044-era),
 * so institutional admins can link a documented system-change action to a
 * Code Signal event the same way they already can for Care Signal. No new
 * table, no create-from-event UI change needed (Care Signal's own action
 * log create form is manual free-text, not event-linked, so this achieves
 * parity with what already exists rather than adding new capability).
 * Idempotent.
 *
 * Run: pnpm run db:apply-0092
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0092] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0092] Running institutionalActionLogs.codeSignalEventId migration...");

    if (await columnExists(conn, "institutionalActionLogs", "codeSignalEventId")) {
      console.log("[0092]   \u2713 institutionalActionLogs.codeSignalEventId already exists -- skipping.");
    } else {
      await conn.query(`ALTER TABLE \`institutionalActionLogs\` ADD COLUMN \`codeSignalEventId\` INT NULL;`);
      console.log("[0092]   + institutionalActionLogs.codeSignalEventId added.");
    }

    console.log("[0092] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0092] Fatal error:", err);
  process.exit(1);
});
