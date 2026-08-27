/**
 * Migration 0130 — governed CPR terminal outcomes.
 *
 * Run: pnpm run db:apply-0130
 *
 * This only widens the CPR outcome enum. It creates no clinical records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0130] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`
      ALTER TABLE cprSessions
      MODIFY COLUMN outcome
        ENUM('ROSC','pCOSCA','mortality','transferred','unknown','ongoing')
        DEFAULT 'ongoing'
    `);
    console.log("[0130] cprSessions terminal outcomes are ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0130] Fatal error:", error);
  process.exit(1);
});
