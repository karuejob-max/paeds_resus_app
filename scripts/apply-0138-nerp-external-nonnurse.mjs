/*
 * Migration 0138 — NERP external verification category expansion.
 * Reservation: migration-reserved-0138
 *
 * Additive and idempotent. Existing external cases default to nerp_nurse.
 * Non-nurse cases are reviewed in the same admin surface but are not added to
 * the NERP nurse campaign audience or granted IERS access.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0138] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName]
  );
  return Number(rows?.[0]?.c ?? 0) > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0138] Preparing non-nurse external verification support...");
    if (!(await tableExists(conn, "nerp_external_verification_cases"))) {
      throw new Error("nerp_external_verification_cases is missing; apply migration 0136 first.");
    }

    if (!(await columnExists(conn, "nerp_external_verification_cases", "candidate_type"))) {
      await conn.query(`
        ALTER TABLE \`nerp_external_verification_cases\`
        ADD COLUMN \`candidate_type\` ENUM('nerp_nurse','non_nurse_external') NOT NULL DEFAULT 'nerp_nurse'
        AFTER \`user_id\`
      `);
    }

    if (!(await columnExists(conn, "nerp_external_verification_cases", "candidate_cadre"))) {
      await conn.query(`
        ALTER TABLE \`nerp_external_verification_cases\`
        ADD COLUMN \`candidate_cadre\` VARCHAR(128) NULL
        AFTER \`candidate_type\`
      `);
    }

    console.log("[0138] Non-nurse external verification support is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0138] Fatal error:", error);
  process.exit(1);
});
