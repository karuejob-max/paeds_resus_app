/**
 * Migration 0090 -- Code Signal Notice consent tracking, mirroring the
 * existing Care Signal pattern (`users.careSignalConsentAt` / `Version`,
 * migration 0044). Adds two nullable columns to `users`. Idempotent.
 *
 * Run: pnpm run db:apply-0090
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
    console.error("[0090] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0090] Running Code Signal consent-column migration...");

    if (await columnExists(conn, "users", "codeSignalConsentAt")) {
      console.log("[0090]   \u2713 users.codeSignalConsentAt already exists -- skipping.");
    } else {
      await conn.query(`ALTER TABLE \`users\` ADD COLUMN \`codeSignalConsentAt\` TIMESTAMP NULL;`);
      console.log("[0090]   + users.codeSignalConsentAt added.");
    }

    if (await columnExists(conn, "users", "codeSignalConsentVersion")) {
      console.log("[0090]   \u2713 users.codeSignalConsentVersion already exists -- skipping.");
    } else {
      await conn.query(`ALTER TABLE \`users\` ADD COLUMN \`codeSignalConsentVersion\` VARCHAR(16) NULL;`);
      console.log("[0090]   + users.codeSignalConsentVersion added.");
    }

    console.log("[0090] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0090] Fatal error:", err);
  process.exit(1);
});
