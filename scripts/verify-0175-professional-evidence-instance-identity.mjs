import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);

async function scalar(query, params = []) {
  const [rows] = await db.query(query, params);
  return Number(rows[0]?.count ?? 0);
}
async function hasColumn(table, column) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}
async function hasIndex(table, indexName) {
  const [rows] = await db.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, [indexName]);
  return rows.length > 0;
}

try {
  if (!(await hasColumn("professionalEvidenceLedger", "evidenceInstanceKey"))) throw new Error("[0175-verify] FAIL: evidenceInstanceKey column is missing");
  if (!(await hasIndex("professionalEvidenceLedger", "professional_evidence_ledger_user_instance_idx"))) throw new Error("[0175-verify] FAIL: evidence-instance index is missing");
  const incomplete = await scalar(`SELECT COUNT(*) AS count FROM professionalEvidenceLedger WHERE userId IS NULL OR sourceKey IS NULL OR sourceSystem IS NULL OR sourceRecordType IS NULL OR sourceRecordId IS NULL OR evidenceInstanceKey IS NULL OR evidenceInstanceKey = '' OR evidenceType IS NULL OR evidenceStrength IS NULL OR visibility IS NULL OR interpretation IS NULL OR interpretationVersion IS NULL OR sourceFactJson IS NULL`);
  if (incomplete > 0) throw new Error(`[0175-verify] FAIL: ${incomplete} rows lack complete canonical provenance`);
  const invalid = await scalar(`SELECT COUNT(*) AS count FROM professionalEvidenceLedger WHERE evidenceType NOT IN ('learning','assessment','credential','competence','cpd','pathway') OR evidenceStrength NOT IN ('self_reported','developing','recorded','verified_attendance','verified_external','assessed','credential','observed_competence') OR visibility NOT IN ('private','shareable') OR interpretationVersion <> '0173-v1' OR (verificationMethod IS NOT NULL AND verificationMethod NOT IN ('none','admin_review','cpd_attendance','platform_verification','approved_instructor','authorised_assessor','issuing_body'))`);
  if (invalid > 0) throw new Error(`[0175-verify] FAIL: ${invalid} rows contain unknown ontology values`);
  const duplicateSourceInstances = await scalar(`SELECT COUNT(*) AS count FROM (SELECT userId, evidenceType, evidenceInstanceKey, sourceKey FROM professionalEvidenceLedger GROUP BY userId, evidenceType, evidenceInstanceKey, sourceKey HAVING COUNT(*) > 1) duplicates`);
  if (duplicateSourceInstances > 0) throw new Error(`[0175-verify] FAIL: ${duplicateSourceInstances} duplicate source-instance rows`);
  console.log("[0175-verify] PASS: persisted instance identity, ontology values, provenance, and uniqueness are valid.");
  console.log("[0175-verify] PASS: verifier performed read-only checks only.");
} finally {
  await db.end();
}
