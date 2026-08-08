/**
 * Migration 0091 -- Code Signal admin review queue columns (WORK_STATUS
 * 2026-08-07 "In progress" queue item #1). Adds four nullable columns to
 * `codeSignalEvents` so submitted reports can actually be reviewed and
 * marked closed, matching Care Signal's review workflow but with plain
 * typed columns instead of a JSON gapDetails blob (no legacy column here
 * to reuse). Idempotent.
 *
 * Run: pnpm run db:apply-0091
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

async function addColumnIfMissing(conn, table, column, ddl) {
  if (await columnExists(conn, table, column)) {
    console.log(`[0091]   \u2713 ${table}.${column} already exists -- skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl};`);
  console.log(`[0091]   + ${table}.${column} added.`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0091] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0091] Running Code Signal review-queue migration...");

    await addColumnIfMissing(conn, "codeSignalEvents", "review_outcome", "`review_outcome` VARCHAR(32) NULL");
    await addColumnIfMissing(conn, "codeSignalEvents", "reviewer_notes", "`reviewer_notes` TEXT NULL");
    await addColumnIfMissing(conn, "codeSignalEvents", "reviewed_at", "`reviewed_at` TIMESTAMP NULL");
    await addColumnIfMissing(conn, "codeSignalEvents", "reviewed_by", "`reviewed_by` INT NULL");

    console.log("[0091] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0091] Fatal error:", err);
  process.exit(1);
});
