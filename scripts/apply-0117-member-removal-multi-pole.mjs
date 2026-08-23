import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

/**
 * Migration 0117 — member removal audit and scalable multi-pole ordering.
 *
 * Removal is non-destructive: the institutional staff row and all historic
 * CPD/IERS evidence remain. Active access and future duty eligibility are
 * revoked by the application transaction.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0117] DATABASE_URL is required.");
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
    console.log(`[0117] ${table}.${column} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  console.log(`[0117] Added ${table}.${column}.`);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  for (const table of ["facility_poles", "institutionalStaffMembers", "institutionMemberships"]) {
    if (!(await tableExists(conn, table))) {
      throw new Error(`[0117] Required table ${table} is missing; refusing member-removal/multi-pole migration.`);
    }
  }

  await addColumn(conn, "facility_poles", "pole_order", "INT NULL");
  await addColumn(conn, "institutionalStaffMembers", "removedAt", "TIMESTAMP NULL");
  await addColumn(conn, "institutionalStaffMembers", "removedByUserId", "INT NULL");
  await addColumn(conn, "institutionalStaffMembers", "removalReason", "TEXT NULL");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS institution_membership_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institutional_account_id INT NOT NULL,
      membership_id INT NOT NULL,
      staff_member_id INT NULL,
      user_id INT NULL,
      event_type ENUM('removed','restored','suspended','reactivated') NOT NULL,
      previous_membership_status VARCHAR(32) NULL,
      current_membership_status VARCHAR(32) NOT NULL,
      actor_user_id INT NOT NULL,
      reason TEXT NOT NULL,
      occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY institution_membership_events_inst_membership_idx (institutional_account_id, membership_id),
      KEY institution_membership_events_occurred_idx (occurred_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0117] institution_membership_events is ready.");

  await conn.query(`
    UPDATE facility_poles p
    JOIN (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY institution_id ORDER BY created_at, id) AS next_order
      FROM facility_poles
    ) ordered ON ordered.id = p.id
    SET p.pole_order = ordered.next_order
    WHERE p.pole_order IS NULL
  `);
  console.log("[0117] Existing institution poles received stable display order where absent.");

  console.log("[0117] Member-removal and multi-pole schema is ready.");
} finally {
  await conn.end();
}
