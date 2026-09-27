#!/usr/bin/env node
/**
 * Migration 0165 — search hardening and canonical KMHFL references.
 *
 * Additive and idempotent. Existing onboarding snapshots remain valid; newly
 * selected registry facilities can now be retained by immutable row ID and
 * source identity without treating display text as verification.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName],
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (!(await columnExists(conn, "kmhflFacilities", "sourceFacilityId"))) {
      await conn.query("ALTER TABLE kmhflFacilities ADD COLUMN sourceFacilityId VARCHAR(128) NULL AFTER code");
      console.log("[0165] Added kmhflFacilities.sourceFacilityId");
    }
    if (!(await columnExists(conn, "kmhflFacilities", "sourceSystem"))) {
      await conn.query("ALTER TABLE kmhflFacilities ADD COLUMN sourceSystem VARCHAR(64) NOT NULL DEFAULT 'KMHFL' AFTER sourceFacilityId");
      console.log("[0165] Added kmhflFacilities.sourceSystem");
    }
    if (!(await columnExists(conn, "institutionalAccounts", "kmhflFacilityId"))) {
      await conn.query("ALTER TABLE institutionalAccounts ADD COLUMN kmhflFacilityId INT NULL AFTER registrationNumber");
      console.log("[0165] Added institutionalAccounts.kmhflFacilityId");
    }
    if (!(await indexExists(conn, "kmhflFacilities", "idx_kmhfl_source_identity"))) {
      await conn.query("CREATE INDEX idx_kmhfl_source_identity ON kmhflFacilities (sourceSystem, sourceFacilityId)");
      console.log("[0165] Added KMHFL source identity index");
    }
    if (!(await indexExists(conn, "institutionalAccounts", "idx_institutional_kmhfl_facility"))) {
      await conn.query("CREATE INDEX idx_institutional_kmhfl_facility ON institutionalAccounts (kmhflFacilityId)");
      console.log("[0165] Added institutional KMHFL reference index");
    }
    await conn.query(
      "UPDATE kmhflFacilities SET sourceFacilityId = code WHERE sourceFacilityId IS NULL AND code IS NOT NULL",
    );
    console.log("[0165] Search hardening migration applied successfully.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0165] Fatal error:", error);
  process.exit(1);
});
