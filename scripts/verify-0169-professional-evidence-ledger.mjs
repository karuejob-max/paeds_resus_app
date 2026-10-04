import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0169-verify] DATABASE_URL is required.");
  process.exit(1);
}
const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  const [tables] = await conn.query(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'professionalEvidenceLedger'`);
  if (Number(tables[0].count) !== 1) throw new Error("professionalEvidenceLedger table is missing");
  const [columns] = await conn.query(`SELECT column_name AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'professionalEvidenceLedger'`);
  const names = new Set(columns.map(row => row.name));
  for (const required of ["sourceKey", "evidenceType", "sourceSystem", "sourceRecordId", "status", "evidenceStrength", "visibility"]) {
    if (!names.has(required)) throw new Error(`missing column ${required}`);
  }
  console.log("[0169-verify] PASS: canonical evidence ledger table and provenance columns are present.");
  console.log("[0169-verify] PASS: verifier performed read-only checks only.");
} finally {
  await conn.end();
}
