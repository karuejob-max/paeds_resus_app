import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
async function columns(table) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
  return new Set(rows.map(row => row.Field));
}
try {
  const goals = await columns("professionalProgressGoals");
  const ledger = await columns("professionalEvidenceLedger");
  for (const name of ["actualValue", "progressValue", "computedStatus"]) if (!goals.has(name)) throw new Error(`Missing goal column ${name}`);
  for (const name of ["sourceFactJson", "interpretation", "interpretationVersion"]) if (!ledger.has(name)) throw new Error(`Missing ledger column ${name}`);
  for (const table of ["professionalAssessorAuthorities", "professionalPathwayCourseAttributions"]) {
    const [rows] = await db.query(`SHOW TABLES LIKE ?`, [table]);
    if (!rows.length) throw new Error(`Missing table ${table}`);
  }
  console.log("[0171-verify] PASS: goal feedback, source-fact provenance, assessor authority, and pathway attribution schema is present.");
  console.log("[0171-verify] PASS: verifier performed read-only checks only.");
} finally {
  await db.end();
}
