#!/usr/bin/env node
/**
 * Migration 0113 — link CPD and institutional staff rows to the canonical
 * IERS facility-department registry.
 *
 * Existing department text is preserved. Exact case-insensitive matches within
 * the same institution receive facilityDepartmentId; ambiguous or unmatched
 * historical rows remain text-only for review rather than being guessed.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0113] DATABASE_URL is required.");
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
    console.log(`[0113] ${table}.${column} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  console.log(`[0113] Added ${table}.${column}.`);
}

async function addIndex(conn, table, indexName, ddl) {
  if (await indexExists(conn, table, indexName)) {
    console.log(`[0113] ${indexName} already exists — skipping.`);
    return;
  }
  await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` ${ddl}`);
  console.log(`[0113] Added ${indexName}.`);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  for (const table of ["facility_departments", "institutionalStaffMembers", "cpdAttendees"]) {
    if (!(await tableExists(conn, table))) {
      throw new Error(`[0113] Required table ${table} is missing; refusing to create a partial department link migration.`);
    }
  }

  await addColumn(conn, "institutionalStaffMembers", "facilityDepartmentId", "INT NULL");
  await addColumn(conn, "cpdAttendees", "facilityDepartmentId", "INT NULL");
  await addIndex(conn, "institutionalStaffMembers", "institutionalStaffMembers_facility_department_idx", "(`institutionalAccountId`, `facilityDepartmentId`)");
  await addIndex(conn, "cpdAttendees", "cpdAttendees_facility_department_idx", "(`institutionalAccountId`, `facilityDepartmentId`)");

  const [staffResult] = await conn.query(`
    UPDATE institutionalStaffMembers s
    JOIN facility_departments d
      ON d.institution_id = s.institutionalAccountId
     AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(s.department))
    SET s.facilityDepartmentId = d.id
    WHERE s.facilityDepartmentId IS NULL
      AND s.institutionalAccountId IS NOT NULL
      AND s.department IS NOT NULL
      AND TRIM(s.department) <> ''
  `);
  const [attendeeResult] = await conn.query(`
    UPDATE cpdAttendees c
    JOIN facility_departments d
      ON d.institution_id = c.institutionalAccountId
     AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(c.department))
    SET c.facilityDepartmentId = d.id
    WHERE c.facilityDepartmentId IS NULL
      AND c.department IS NOT NULL
      AND TRIM(c.department) <> ''
  `);

  console.log(`[0113] Linked ${staffResult.affectedRows ?? 0} institutional staff row(s) and ${attendeeResult.affectedRows ?? 0} CPD attendee row(s) by exact institution-scoped department name.`);
  console.log("[0113] Canonical CPD/IERS department links are ready; unmatched legacy text remains preserved.");
} finally {
  await conn.end();
}
