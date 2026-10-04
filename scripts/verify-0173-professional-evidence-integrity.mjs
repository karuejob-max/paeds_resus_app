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
async function indexes(table) {
  const [rows] = await db.query(`SHOW INDEX FROM \`${table}\``);
  return rows;
}
async function scalar(query, params = []) {
  const [rows] = await db.query(query, params);
  return Number(rows[0]?.count ?? 0);
}
function requireAll(actual, expected, label) {
  const names = actual instanceof Set ? actual : new Set(actual.map(row => row.Key_name));
  for (const name of expected) if (!names.has(name)) throw new Error(`[0173-verify] FAIL: ${label} missing ${name}`);
}
function requireUniqueColumn(rows, column, label) {
  if (!rows.some(row => row.Non_unique === 0 && row.Column_name === column)) throw new Error(`[0173-verify] FAIL: ${label} has no unique index on ${column}`);
}
function requireIndexColumns(rows, expected, label) {
  const groups = new Map();
  for (const row of rows) {
    const bucket = groups.get(row.Key_name) ?? [];
    bucket.push(row);
    groups.set(row.Key_name, bucket);
  }
  const found = [...groups.values()].some(bucket => bucket.sort((a, b) => a.Seq_in_index - b.Seq_in_index).slice(0, expected.length).map(row => row.Column_name).join(",") === expected.join(","));
  if (!found) throw new Error(`[0173-verify] FAIL: ${label} lacks index on (${expected.join(", ")})`);
}

try {
  const reconciliationColumns = await columns("professionalEvidenceReconciliationRuns");
  const conflictColumns = await columns("professionalEvidenceConflicts");
  const ledgerColumns = await columns("professionalEvidenceLedger");
  requireAll(reconciliationColumns, ["id", "runKey", "triggeredByUserId", "status", "summaryJson", "startedAt", "completedAt"], "reconciliation table");
  requireAll(conflictColumns, ["id", "conflictKey", "userId", "evidenceType", "subject", "state", "reason", "sourceRowsJson", "resolvedByUserId", "resolvedAt", "resolutionNote"], "conflict table");
  requireAll(ledgerColumns, ["userId", "sourceKey", "sourceSystem", "sourceRecordType", "sourceRecordId", "sourceFactJson", "interpretation", "interpretationVersion"], "ledger table");
  const reconciliationIndexes = await indexes("professionalEvidenceReconciliationRuns");
  const conflictIndexes = await indexes("professionalEvidenceConflicts");
  const ledgerIndexes = await indexes("professionalEvidenceLedger");
  requireUniqueColumn(reconciliationIndexes, "runKey", "reconciliation table");
  requireUniqueColumn(conflictIndexes, "conflictKey", "conflict table");
  requireUniqueColumn(ledgerIndexes, "sourceKey", "ledger table");
  requireIndexColumns(reconciliationIndexes, ["status", "completedAt"], "reconciliation table");
  requireIndexColumns(conflictIndexes, ["userId", "state"], "conflict table");
  requireIndexColumns(conflictIndexes, ["evidenceType", "state"], "conflict table");
  requireIndexColumns(ledgerIndexes, ["userId", "status"], "ledger table");
  requireIndexColumns(ledgerIndexes, ["userId", "evidenceType"], "ledger table");
  console.log("[0173-verify] PASS: required tables, columns, unique keys, and indexes are present.");

  const provenanceGaps = await scalar("SELECT COUNT(*) AS count FROM professionalEvidenceLedger WHERE sourceSystem IS NULL OR sourceRecordType IS NULL OR sourceRecordId IS NULL OR sourceFactJson IS NULL OR interpretationVersion IS NULL");
  if (provenanceGaps > 0) throw new Error(`[0173-verify] FAIL: ${provenanceGaps} ledger rows lack required provenance`);
  const duplicateSourceKeys = await scalar("SELECT COUNT(*) AS count FROM (SELECT sourceKey FROM professionalEvidenceLedger GROUP BY sourceKey HAVING COUNT(*) > 1) duplicate_keys");
  if (duplicateSourceKeys > 0) throw new Error(`[0173-verify] FAIL: ${duplicateSourceKeys} duplicate canonical source identities`);
  console.log("[0173-verify] PASS: existing ledger rows have provenance and one canonical source key.");

  const adapters = [
    ["enrollments", "aha_learning", "enrollments", "programType IN ('bls','acls','pals','nrp')"],
    ["certificates", "certificates", "certificates", "1=1"],
    ["microCourseEnrollments", "fellowship", "microCourseEnrollments", "1=1"],
    ["externalTrainingCompletions", "external_completion", "externalTrainingCompletions.phase2", "1=1"],
    ["ierpProgramEnrollments", "ierp", "ierpProgramEnrollments", "1=1"],
    ["nerp_offer_enrollments", "nerp", "nerp_offer_enrollments", "1=1"],
    ["cpdAttendees", "cpd_portal", "cpdAttendees", "userId IS NOT NULL"],
  ];
  for (const [table, system, type, predicate] of adapters) {
    const sourceCount = await scalar(`SELECT COUNT(*) AS count FROM \`${table}\` WHERE ${predicate}`);
    const ledgerCount = await scalar("SELECT COUNT(*) AS count FROM professionalEvidenceLedger WHERE sourceSystem = ? AND sourceRecordType = ?", [system, type]);
    if (ledgerCount < sourceCount) throw new Error(`[0173-verify] FAIL: adapter ${table} source=${sourceCount} ledger=${ledgerCount}`);
    console.log(`[0173-verify] PASS: ${table} source=${sourceCount} ledger=${ledgerCount}`);
  }
  const conflictCount = await scalar("SELECT COUNT(*) AS count FROM professionalEvidenceConflicts");
  const runCount = await scalar("SELECT COUNT(*) AS count FROM professionalEvidenceReconciliationRuns");
  console.log(`[0173-verify] PASS: conflict persistence is available (${conflictCount} rows); reconciliation history is available (${runCount} runs).`);
  console.log("[0173-verify] PASS: verifier performed read-only checks only.");
} finally {
  await db.end();
}
