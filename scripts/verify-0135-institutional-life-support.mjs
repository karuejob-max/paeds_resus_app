/**
 * Read-only verification for migration 0135 and the Institutional Life Support catalog.
 *
 * Run: pnpm run db:verify-0135
 * This script never writes, issues certificates, or sends payment requests.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0135 verify] DATABASE_URL is required.");
  process.exit(1);
}

async function hasTable(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return rows.length > 0;
}

async function getColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0] ?? null;
}

async function enumIncludes(conn, tableName, columnName, expected) {
  const column = await getColumn(conn, tableName, columnName);
  return (
    Boolean(column) &&
    expected.every(value => column.COLUMN_TYPE.includes(`'${value}'`))
  );
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const checks = [];
    for (const [table, column] of [
      ["institutionalAccounts", "organizationCategory"],
      ["institutionalAccounts", "facilityOwnership"],
      ["institutionalAccounts", "facilityCareLevel"],
      ["institutionalAccounts", "facilityLocalLevel"],
      ["payments", "institutionalTrainingOrderId"],
      ["payments", "ilsCredentialRequestId"],
    ]) {
      checks.push([
        `${table}.${column}`,
        Boolean(await getColumn(conn, table, column)),
      ]);
    }
    for (const table of [
      "institutionalTrainingOrders",
      "institutionalTrainingOrderProviders",
      "ilsCredentialRequests",
    ]) {
      checks.push([`${table} table`, await hasTable(conn, table)]);
    }
    checks.push([
      "courses.programType paeds_resus_ils",
      await enumIncludes(conn, "courses", "programType", ["paeds_resus_ils"]),
    ]);
    checks.push([
      "enrollments.programType paeds_resus_ils",
      await enumIncludes(conn, "enrollments", "programType", [
        "paeds_resus_ils",
      ]),
    ]);
    checks.push([
      "certificates.programType paeds_resus_ils",
      await enumIncludes(conn, "certificates", "programType", [
        "paeds_resus_ils",
      ]),
    ]);

    const [courseRows] = await conn.query(
      "SELECT id FROM courses WHERE programType = 'paeds_resus_ils' ORDER BY id DESC LIMIT 1"
    );
    const courseId = courseRows[0]?.id ?? null;
    checks.push(["ILS course catalog row", Boolean(courseId)]);

    let moduleCount = 0;
    if (courseId) {
      const [moduleRows] = await conn.query(
        "SELECT COUNT(*) AS count FROM modules WHERE courseId = ?",
        [courseId]
      );
      moduleCount = Number(moduleRows[0]?.count ?? 0);
    }
    checks.push(["ILS catalog has at least six modules", moduleCount >= 6]);

    for (const [label, passed] of checks) {
      console.log(`[0135 verify] ${passed ? "PASS" : "FAIL"} — ${label}`);
    }
    if (checks.some(([, passed]) => !passed)) {
      process.exitCode = 1;
    } else {
      console.log(
        `[0135 verify] All schema and catalog checks passed; ${moduleCount} modules found; no write was performed.`
      );
    }
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0135 verify] Fatal error:", error);
  process.exit(1);
});
