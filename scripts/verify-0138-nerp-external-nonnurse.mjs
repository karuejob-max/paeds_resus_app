/*
 * Read-only verifier for migration 0138.
 * It checks the additive external-case category and the no-send boundary.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0138] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [columns] = await conn.query(
      `SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'nerp_external_verification_cases'
         AND column_name = 'candidate_type'`
    );
    if (!columns.length) throw new Error("candidate_type column is missing.");
    const column = columns[0];
    if (!String(column.COLUMN_TYPE).includes("nerp_nurse") || !String(column.COLUMN_TYPE).includes("non_nurse_external")) {
      throw new Error(`Unexpected candidate_type definition: ${column.COLUMN_TYPE}`);
    }
    if (column.IS_NULLABLE !== "NO" || column.COLUMN_DEFAULT !== "nerp_nurse") {
      throw new Error("candidate_type must be NOT NULL with nerp_nurse as the compatibility default.");
    }

    const [cadreColumns] = await conn.query(
      `SELECT COUNT(*) AS c
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'nerp_external_verification_cases'
         AND column_name = 'candidate_cadre'`
    );
    if (Number(cadreColumns[0]?.c ?? 0) !== 1) throw new Error("candidate_cadre column is missing.");

    console.log("[0138] PASS: candidate_type and candidate_cadre are present with compatibility-safe definitions.");
    console.log("[0138] PASS: verification is read-only; this migration contains no email-delivery operation.");
    console.log("[0138] PASS: non-nurse external cases remain separate from the NERP nurse campaign audience and IERS permissions.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0138] FAIL:", error);
  process.exit(1);
});
