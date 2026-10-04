import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  const [reportColumns] = await db.query(`SHOW COLUMNS FROM professionalProgressReports WHERE Field IN ('invalidatedAt','invalidationReason')`);
  const [competenceTables] = await db.query(`SHOW TABLES LIKE 'professionalCompetenceEvidence'`);
  if (reportColumns.length !== 2) throw new Error("Report invalidation columns are missing");
  if (competenceTables.length !== 1) throw new Error("Observed competence evidence table is missing");
  console.log("[0170-verify] PASS: report invalidation metadata and observed competence evidence are present.");
  console.log("[0170-verify] PASS: verifier performed read-only checks only.");
} finally {
  await db.end();
}
