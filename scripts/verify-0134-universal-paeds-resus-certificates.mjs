/*
 * Read-only verification for migration 0134.
 * Run: pnpm run db:verify-0134
 * This script never writes, issues certificates, or sends email.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0134 verify] DATABASE_URL is required.");
  process.exit(1);
}

const expectedCertificateTypes = [
  "paeds_resus_phase2",
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
];
const expectedCredentialTypes = [
  "paeds_resus_phase2",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
];

async function getColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0] ?? null;
}

async function hasUniqueSourceKey(conn) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_in_index
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'sourceKey'
     GROUP BY INDEX_NAME, NON_UNIQUE`
  );
  return rows.some(
    (row) => Number(row.NON_UNIQUE) === 0 && row.columns_in_index === "sourceKey"
  );
}

function enumIncludes(columnType, values) {
  return values.every((value) => columnType.includes(`'${value}'`));
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const recipientName = await getColumn(conn, "certificates", "recipientName");
    const readinessPathway = await getColumn(conn, "certificates", "readinessPathway");
    const sourceKey = await getColumn(conn, "certificates", "sourceKey");
    const programType = await getColumn(conn, "certificates", "programType");
    const credentialType = await getColumn(conn, "professionalCredentials", "credentialType");
    const uniqueSourceKey = await hasUniqueSourceKey(conn);

    const checks = [
      ["certificates.recipientName", Boolean(recipientName)],
      ["certificates.readinessPathway", Boolean(readinessPathway)],
      ["certificates.sourceKey", Boolean(sourceKey)],
      ["certificates.sourceKey unique", uniqueSourceKey],
      ["certificates.programType values", Boolean(programType) && enumIncludes(programType.COLUMN_TYPE, expectedCertificateTypes)],
      ["professionalCredentials.credentialType values", Boolean(credentialType) && enumIncludes(credentialType.COLUMN_TYPE, expectedCredentialTypes)],
    ];

    for (const [label, passed] of checks) {
      console.log(`[0134 verify] ${passed ? "PASS" : "FAIL"} — ${label}`);
    }
    if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
    else console.log("[0134 verify] All universal certificate schema checks passed; no write was performed.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0134 verify] Fatal error:", error);
  process.exit(1);
});
