import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0168-verify] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [tables] = await conn.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('professionalProgressReports','professionalProgressCorrectionCases')`);
    const tableNames = new Set(tables.map(row => row.TABLE_NAME ?? row.table_name));
    for (const table of ["professionalProgressReports", "professionalProgressCorrectionCases"]) {
      if (!tableNames.has(table)) throw new Error(`missing table ${table}`);
      console.log(`[0168-verify] PASS: table ${table}`);
    }
    const [columns] = await conn.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND ((table_name = 'professionalProgressReports' AND column_name IN ('reportScope','status','publicExpiresAt')) OR table_name = 'professionalProgressCorrectionCases')`);
    const keys = new Set(columns.map(row => `${row.TABLE_NAME ?? row.table_name}.${row.COLUMN_NAME ?? row.column_name}`));
    for (const key of ["professionalProgressReports.reportScope", "professionalProgressReports.status", "professionalProgressReports.publicExpiresAt", "professionalProgressCorrectionCases.category", "professionalProgressCorrectionCases.status"]) {
      if (!keys.has(key)) throw new Error(`missing column ${key}`);
      console.log(`[0168-verify] PASS: column ${key}`);
    }
    console.log("[0168-verify] PASS: read-only verification complete; no learner or report data was modified.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0168-verify] FAIL:", error.message);
  process.exit(1);
});
