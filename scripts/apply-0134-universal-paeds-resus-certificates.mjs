/*
 * Migration 0134 — universal Paeds Resus completion certificates.
 * Reservation: migration-reserved-0134
 *
 * Run: pnpm run db:apply-0134
 *
 * Additive and idempotent. It extends the existing certificate ledger rather
 * than creating a second download/verification system. It does not issue
 * certificates, create learner records, change IERS permissions, or send email.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0134] DATABASE_URL is required.");
  process.exit(1);
}

const certificateProgramTypes = [
  "bls",
  "acls",
  "pals",
  "fellowship",
  "instructor",
  "fellowship_diploma",
  "heartsaver",
  "nrp",
  "bls_cognitive",
  "acls_cognitive",
  "pals_cognitive",
  "heartsaver_cognitive",
  "nrp_cognitive",
  "paeds_resus_phase2",
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
];

const credentialTypes = [
  "regulatory_license",
  "paeds_resus_phase2",
  "paeds_resus_bls_cognitive",
  "paeds_resus_bls_simulation",
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
  "external_aha_bls",
  "external_aha_acls",
  "external_aha_pals",
  "external_aha_nrp",
  "external_aha_other",
];

function enumSql(values) {
  return values.map((value) => `'${value}'`).join(", ");
}

async function hasColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function hasIndex(conn, tableName, indexName) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (await hasColumn(conn, tableName, columnName)) return;
  await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  console.log(`[0134] Added ${tableName}.${columnName}`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0134] Preparing universal Paeds Resus certificate schema...");

    await conn.query(
      `ALTER TABLE \`certificates\` MODIFY COLUMN \`programType\` ENUM(${enumSql(certificateProgramTypes)}) NOT NULL`
    );
    await addColumnIfMissing(
      conn,
      "certificates",
      "recipientName",
      "VARCHAR(255) NULL AFTER \`userId\`"
    );
    await addColumnIfMissing(
      conn,
      "certificates",
      "readinessPathway",
      "ENUM('ierp', 'nerp', 'open_enrolment') NULL AFTER \`programType\`"
    );
    await addColumnIfMissing(
      conn,
      "certificates",
      "sourceKey",
      "VARCHAR(255) NULL AFTER \`readinessPathway\`"
    );
    if (!(await hasIndex(conn, "certificates", "certificates_source_key_uq"))) {
      await conn.query(
        "ALTER TABLE `certificates` ADD UNIQUE KEY `certificates_source_key_uq` (`sourceKey`)"
      );
      console.log("[0134] Added certificates_source_key_uq");
    }

    await conn.query(
      `ALTER TABLE \`professionalCredentials\` MODIFY COLUMN \`credentialType\` ENUM(${enumSql(credentialTypes)}) NOT NULL`
    );

    console.log("[0134] Universal Paeds Resus certificate schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0134] Fatal error:", error);
  process.exit(1);
});
