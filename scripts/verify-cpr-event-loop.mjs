/**
 * Read-only CPR event-loop readiness verifier.
 *
 * Run: pnpm run db:verify-cpr-event-loop
 *
 * This checks schema objects only. It does not read, create, update, or delete
 * activation, CPR, Care Signal, patient, or test records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[CPR event loop] DATABASE_URL is required.");
  process.exit(1);
}

const requiredTables = ["cprEventLinks", "cprCareSignalLinks"];
const requiredColumns = [
  ["cprEventLinks", "activationEventId"],
  ["cprEventLinks", "cprSessionId"],
  ["cprEventLinks", "linkStatus"],
  ["cprEventLinks", "terminalOutcome"],
  ["cprCareSignalLinks", "cprSessionId"],
  ["cprCareSignalLinks", "careSignalEventId"],
  ["cprCareSignalLinks", "linkedByUserId"],
];

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?, ?)`,
      requiredTables,
    );
    const tableSet = new Set(tables.map((row) => row.TABLE_NAME));
    for (const table of requiredTables) {
      if (!tableSet.has(table)) throw new Error(`Missing table ${table}`);
      console.log(`[ok] table ${table}`);
    }

    for (const [table, column] of requiredColumns) {
      const [columns] = await conn.query(
        `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
        [table, column],
      );
      if (!columns.length) throw new Error(`Missing column ${table}.${column}`);
      console.log(`[ok] column ${table}.${column}`);
    }

    const [outcomeRows] = await conn.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cprSessions' AND COLUMN_NAME = 'outcome' LIMIT 1`,
    );
    const outcomeType = outcomeRows[0]?.COLUMN_TYPE ?? "";
    for (const value of ["transferred", "unknown"]) {
      if (!outcomeType.includes(`'${value}'`)) throw new Error(`cprSessions.outcome does not include ${value}`);
    }
    console.log("[ok] cprSessions terminal outcomes include transferred and unknown");
    console.log("CPR event-loop schema verification PASSED — no clinical records inspected.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[CPR event loop] verification failed:", error.message ?? error);
  process.exit(1);
});
