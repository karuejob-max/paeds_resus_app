#!/usr/bin/env node
/**
 * Migration 0115 — CPD department reconciliation and explicit IERS pole eligibility.
 *
 * Adds a fail-closed requires_pole flag to the institution department registry,
 * plus current review state and append-only audit history for non-destructive
 * reconciliation of historical CPD department labels.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0115] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1",
    [table],
  );
  return rows.length > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [table, column],
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1",
    [table, indexName],
  );
  return rows.length > 0;
}

async function addColumn(conn, table, column, ddl) {
  if (await columnExists(conn, table, column)) {
    console.log(`[0115] ${table}.${column} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  console.log(`[0115] Added ${table}.${column}.`);
}

async function addIndex(conn, table, indexName, ddl) {
  if (await indexExists(conn, table, indexName)) {
    console.log(`[0115] ${indexName} already exists — skipping.`);
    return;
  }
  await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` ${ddl}`);
  console.log(`[0115] Added ${indexName}.`);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  for (const table of ["facility_departments", "cpdAttendees"]) {
    if (!(await tableExists(conn, table))) {
      throw new Error(`[0115] Required table ${table} is missing; refusing reconciliation migration.`);
    }
  }

  await addColumn(conn, "facility_departments", "requires_pole", "BOOLEAN NOT NULL DEFAULT FALSE");
  await addIndex(
    conn,
    "facility_departments",
    "facility_depts_iers_pole_req_idx",
    "(`institution_id`, `is_active`, `requires_pole`, `pole_id`)",
  );

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institution_department_reconciliations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutional_account_id INT NOT NULL,
      normalized_label VARCHAR(256) NOT NULL,
      raw_label VARCHAR(256) NOT NULL,
      status ENUM('open','mapped','deferred','dismissed') NOT NULL DEFAULT 'open',
      suggested_catalog_label VARCHAR(256) NULL,
      suggestion_confidence ENUM('none','exact','alias','ambiguous') NOT NULL DEFAULT 'none',
      reviewed_facility_department_id INT NULL,
      reviewed_by_user_id INT NULL,
      reviewed_at TIMESTAMP NULL,
      review_reason TEXT NULL,
      backfilled_count INT NOT NULL DEFAULT 0,
      backfilled_by_user_id INT NULL,
      backfilled_at TIMESTAMP NULL,
      first_used_at TIMESTAMP NOT NULL,
      last_used_at TIMESTAMP NOT NULL,
      attendance_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY inst_dept_recon_institution_label_uq (institutional_account_id, normalized_label),
      KEY inst_dept_recon_inst_status_idx (institutional_account_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0115] institution_department_reconciliations is ready.");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institution_department_audit_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutional_account_id INT NOT NULL,
      reconciliation_id INT NULL,
      department_id INT NULL,
      event_type VARCHAR(64) NOT NULL,
      previous_status VARCHAR(32) NULL,
      current_status VARCHAR(32) NULL,
      previous_department_id INT NULL,
      current_department_id INT NULL,
      previous_requires_pole BOOLEAN NULL,
      current_requires_pole BOOLEAN NULL,
      backfilled_count INT NOT NULL DEFAULT 0,
      actor_user_id INT NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY inst_dept_audit_inst_created_idx (institutional_account_id, created_at),
      KEY inst_dept_audit_recon_created_idx (reconciliation_id, created_at),
      KEY inst_dept_audit_dept_created_idx (department_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0115] institution_department_audit_events is ready.");

  console.log("[0115] Department reconciliation and explicit IERS pole eligibility schema is ready.");
} finally {
  await conn.end();
}
