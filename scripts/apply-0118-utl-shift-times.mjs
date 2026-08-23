import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

/**
 * Migration 0118 — exact UTL shift hours and reusable institution templates.
 *
 * Shift dates remain facility-local roster dates. The explicit clock times are
 * stored as MySQL TIME values, and endDayOffset=1 represents an overnight
 * interval that ends on the following calendar day.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0118] DATABASE_URL is required.");
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
    console.log(`[0118] ${table}.${column} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  console.log(`[0118] Added ${table}.${column}.`);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  if (!(await tableExists(conn, "shift_utl_rosters"))) {
    throw new Error("[0118] Required table shift_utl_rosters is missing; refusing exact-shift migration.");
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institution_shift_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institution_id INT NOT NULL,
      template_name VARCHAR(128) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      end_day_offset INT NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by_user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY institution_shift_templates_institution_name_unique (institution_id, template_name),
      KEY institution_shift_templates_institution_order_idx (institution_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0118] institution_shift_templates is ready.");

  await addColumn(conn, "shift_utl_rosters", "shift_start_time", "TIME NOT NULL DEFAULT '07:30:00'");
  await addColumn(conn, "shift_utl_rosters", "shift_end_time", "TIME NOT NULL DEFAULT '17:30:00'");
  await addColumn(conn, "shift_utl_rosters", "shift_end_day_offset", "INT NOT NULL DEFAULT 0");
  await addColumn(conn, "shift_utl_rosters", "shift_template_id", "INT NULL");

  // Give legacy rows safe, explicit defaults consistent with their old labels.
  // This changes no assignments or acceptance state; it only replaces an
  // implicit label with a visible interval that administrators can edit.
  await conn.query(`
    UPDATE shift_utl_rosters
    SET
      shift_start_time = CASE shift_type
        WHEN 'morning' THEN '07:30:00'
        WHEN 'evening' THEN '17:30:00'
        WHEN 'night' THEN '21:30:00'
        ELSE shift_start_time
      END,
      shift_end_time = CASE shift_type
        WHEN 'morning' THEN '17:30:00'
        WHEN 'evening' THEN '21:30:00'
        WHEN 'night' THEN '05:30:00'
        ELSE shift_end_time
      END,
      shift_end_day_offset = CASE WHEN shift_type = 'night' THEN 1 ELSE 0 END
  `);
  console.log("[0118] Legacy shift rows received explicit safe intervals by shift type.");
  console.log("[0118] Exact UTL shift-time schema is ready.");
} finally {
  await conn.end();
}
