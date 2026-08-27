/**
 * Read-only verification for migration 0129.
 *
 * Run: pnpm run db:verify-cpr-event-link
 * This checks table and column presence only; it does not create or modify records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[CPR-LINK] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [tableRows] = await conn.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cprEventLinks' LIMIT 1",
    );
    if (!Array.isArray(tableRows) || tableRows.length === 0) {
      throw new Error("cprEventLinks table is missing");
    }

    const [columnRows] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cprEventLinks'",
    );
    const columns = new Set(Array.isArray(columnRows) ? columnRows.map((row) => row.COLUMN_NAME) : []);
    const required = [
      "activationEventId",
      "cprSessionId",
      "institutionalAccountId",
      "linkedByUserId",
      "linkStatus",
      "terminalOutcome",
      "debriefSubmittedAt",
    ];
    for (const column of required) {
      if (!columns.has(column)) throw new Error(`cprEventLinks.${column} is missing`);
      console.log(`[ok] cprEventLinks.${column}`);
    }
    console.log("CPR event-link schema verification PASSED — no records read or written.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[CPR-LINK] Verification failed:", error.message ?? error);
  process.exit(1);
});
