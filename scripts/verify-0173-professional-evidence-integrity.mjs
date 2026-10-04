import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  for (const table of ["professionalEvidenceReconciliationRuns", "professionalEvidenceConflicts"]) {
    const [rows] = await db.query(`SHOW TABLES LIKE ?`, [table]);
    if (!rows.length) throw new Error(`Missing table ${table}`);
  }
  console.log("[0173-verify] PASS: reconciliation runs and explicit conflict records are present.");
  console.log("[0173-verify] PASS: verifier performed read-only checks only.");
} finally { await db.end(); }
