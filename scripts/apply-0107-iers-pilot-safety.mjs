#!/usr/bin/env node
/**
 * Migration 0107 — explicit IERS pilot-drill safety attestation.
 * Existing drills remain un-attested until an authorised operator reviews them.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0107] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 AS present
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1`,
    [tableName, columnName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (await columnExists(conn, tableName, columnName)) {
    console.log(`[0107] ${tableName}.${columnName} already exists.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  console.log(`[0107] Added ${tableName}.${columnName}.`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0107] Adding explicit IERS pilot-drill safety fields...");
    await addColumnIfMissing(conn, "iers_drills", "is_simulation", "BOOLEAN NOT NULL DEFAULT FALSE");
    await addColumnIfMissing(conn, "iers_drills", "simulation_label", "VARCHAR(64) NULL");
    await addColumnIfMissing(conn, "iers_drills", "simulation_acknowledged_at", "TIMESTAMP NULL");
    await addColumnIfMissing(conn, "iers_drills", "no_patient_identifiers_acknowledged", "BOOLEAN NOT NULL DEFAULT FALSE");
    await addColumnIfMissing(conn, "iers_drills", "no_patient_identifiers_acknowledged_at", "TIMESTAMP NULL");
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS attestedCount
         FROM iers_drills
        WHERE is_simulation = TRUE
          AND simulation_label = 'NOT A REAL EMERGENCY'
          AND no_patient_identifiers_acknowledged = TRUE`,
    );
    console.log(`[0107] Ready. Existing safety-attested drills: ${rows[0]?.attestedCount ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0107] Fatal error:", error);
  process.exit(1);
});
