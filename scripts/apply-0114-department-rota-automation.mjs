#!/usr/bin/env node
/**
 * Migration 0114 — canonical department setup and monthly UTL rota automation.
 *
 * Adds department confirmation metadata, one monthly UTL source row per
 * institution/department/month, and a provenance link from dated shifts back to
 * that source row. Existing shifts remain untouched and therefore preserve their
 * current provider acceptance/readiness evidence.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0114] DATABASE_URL is required.");
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
    console.log(`[0114] ${table}.${column} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  console.log(`[0114] Added ${table}.${column}.`);
}

async function addIndex(conn, table, indexName, ddl) {
  if (await indexExists(conn, table, indexName)) {
    console.log(`[0114] ${indexName} already exists — skipping.`);
    return;
  }
  await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` ${ddl}`);
  console.log(`[0114] Added ${indexName}.`);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  for (const table of ["facility_departments", "shift_utl_rosters", "institutionalStaffMembers", "institutionMemberships"]) {
    if (!(await tableExists(conn, table))) {
      throw new Error(`[0114] Required table ${table} is missing; refusing partial department-rota migration.`);
    }
  }

  await addColumn(conn, "facility_departments", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE");
  await addColumn(conn, "facility_departments", "confirmed_at", "TIMESTAMP NULL");
  await addColumn(conn, "facility_departments", "confirmed_by_user_id", "INT NULL");
  await addColumn(conn, "shift_utl_rosters", "monthly_utl_rotation_id", "INT NULL");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS monthly_utl_rotations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institution_id INT NOT NULL,
      pole_id INT NOT NULL,
      department_id INT NOT NULL,
      month_start DATE NOT NULL,
      provider_user_id INT NULL,
      assignment_status ENUM('unassigned','pending_acceptance','active','declined','ended') NOT NULL DEFAULT 'unassigned',
      accepted_at TIMESTAMP NULL,
      declined_at TIMESTAMP NULL,
      decline_reason VARCHAR(500) NULL,
      assigned_by_user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY monthly_utl_rotation_unique (institution_id, department_id, month_start),
      KEY monthly_utl_rotation_department_month_idx (department_id, month_start),
      KEY monthly_utl_rotation_provider_idx (institution_id, provider_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0114] monthly_utl_rotations is ready.");

  await addIndex(conn, "facility_departments", "facility_departments_institution_active_idx", "(`institution_id`, `is_active`)");
  await addIndex(conn, "shift_utl_rosters", "shift_utl_rosters_monthly_rotation_idx", "(`monthly_utl_rotation_id`)");

  await conn.query(`
    UPDATE facility_departments
    SET is_active = TRUE
    WHERE is_active IS NULL
  `);

  console.log("[0114] Canonical department setup and monthly UTL rota automation schema is ready.");
} finally {
  await conn.end();
}
