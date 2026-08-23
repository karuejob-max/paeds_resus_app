#!/usr/bin/env node
/**
 * Migration 0116 — department governance V2.
 *
 * Adds durable resolution state for literal CPD `Other` attendance rows and
 * persists department order plus a Monday anchor for deterministic weekly ERTL
 * department rotation within each pole.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0116] DATABASE_URL is required.");
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

async function addColumn(conn, table, column, ddl) {
  if (await columnExists(conn, table, column)) {
    console.log(`[0116] ${table}.${column} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  console.log(`[0116] Added ${table}.${column}.`);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  for (const table of ["facility_poles", "facility_departments", "cpdAttendees"]) {
    if (!(await tableExists(conn, table))) {
      throw new Error(`[0116] Required table ${table} is missing; refusing department governance migration.`);
    }
  }

  await addColumn(conn, "facility_poles", "rotation_anchor_date", "DATE NULL");
  await addColumn(conn, "facility_departments", "pole_sequence", "INT NULL");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institution_cpd_department_resolutions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutional_account_id INT NOT NULL,
      cpd_attendee_id INT NOT NULL,
      recorded_department VARCHAR(256) NOT NULL,
      facility_department_id INT NULL,
      status ENUM('resolved','deferred','dismissed','open') NOT NULL DEFAULT 'open',
      resolved_by_user_id INT NULL,
      resolved_at TIMESTAMP NULL,
      decision_reason TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY inst_cpd_dept_resolution_attendee_uq (institutional_account_id, cpd_attendee_id),
      KEY inst_cpd_dept_resolution_inst_status_idx (institutional_account_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0116] institution_cpd_department_resolutions is ready.");

  await conn.query(`
    UPDATE facility_departments fd
    JOIN (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY institution_id, pole_id ORDER BY created_at, id) AS next_sequence
      FROM facility_departments
      WHERE pole_id IS NOT NULL
    ) ordered ON ordered.id = fd.id
    SET fd.pole_sequence = ordered.next_sequence
    WHERE fd.pole_id IS NOT NULL AND fd.pole_sequence IS NULL
  `);
  console.log("[0116] Existing pole department sequence values backfilled where absent.");

  await conn.query(`
    UPDATE facility_poles p
    JOIN (
      SELECT pole_id, MIN(created_at) AS first_department_added_at
      FROM facility_departments
      WHERE pole_id IS NOT NULL
      GROUP BY pole_id
    ) first_department ON first_department.pole_id = p.id
    SET p.rotation_anchor_date = DATE_SUB(
      DATE(first_department.first_department_added_at),
      INTERVAL WEEKDAY(first_department.first_department_added_at) DAY
    )
    WHERE p.rotation_anchor_date IS NULL
  `);
  console.log("[0116] Existing pole rotation anchors backfilled where departments already exist.");

  console.log("[0116] Department governance V2 schema is ready.");
} finally {
  await conn.end();
}
