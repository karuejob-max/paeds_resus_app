import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0160] DATABASE_URL is required.");
  process.exit(1);
}

const additions = [
  "paeds_resus_acls_phase2",
  "paeds_resus_pals_phase2",
  "paeds_resus_nrp_phase2",
  "paeds_resus_instructor_phase2",
  "paeds_resus_bls_phase3",
  "paeds_resus_acls_phase3",
  "paeds_resus_pals_phase3",
  "paeds_resus_nrp_phase3",
  "paeds_resus_heartsaver_phase3",
  "paeds_resus_instructor_phase3",
];

const connection = await createMysqlConnection(databaseUrl, mysql);
try {
  const [rows] = await connection.query("SHOW COLUMNS FROM certificates LIKE 'programType'");
  if (!rows.length) throw new Error("certificates.programType was not found");
  const current = String(rows[0].Type);
  const existing = new Set([...current.matchAll(/'([^']+)'/g)].map((match) => match[1]));
  const missing = additions.filter((value) => !existing.has(value));
  if (!missing.length) {
    console.log("[0160] Certificate phase enum already contains all new values.");
  } else {
    const values = [...existing, ...missing].map((value) => `'${value.replaceAll("'", "''")}'`).join(",");
    await connection.query(`ALTER TABLE certificates MODIFY COLUMN programType ENUM(${values}) NOT NULL`);
    console.log(`[0160] Added ${missing.length} certificate phase enum values.`);
  }
  console.log("[0160] Life Support phase certificate migration applied successfully.");
} finally {
  await connection.end();
}

export {};
/* c8 ignore next */
