/**
 * Idempotent: User cadre columns and cneAttendees cadre type upgrade (migration 0077).
 *
 * Adds:
 *   - users.cadre column (VARCHAR(128))
 *   - users.cadreOther column (VARCHAR(128))
 *   - Alters cneAttendees.cadre column type to VARCHAR(128)
 *
 *   pnpm run db:apply-0077
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function getColumnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT DATA_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0 ? rows[0].DATA_TYPE : null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("[0077] Connecting to database...");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  // 1. Add cadre and cadreOther columns to users table
  if (!(await tableExists(conn, "users"))) {
    console.error("[0077] users table missing — run earlier migrations first.");
    process.exit(1);
  }

  if (await columnExists(conn, "users", "cadre")) {
    console.log("[0077] column users.cadre already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`users\`
       ADD COLUMN \`cadre\` varchar(128) NULL DEFAULT NULL`
    );
    console.log("[0077] added column users.cadre.");
  }

  if (await columnExists(conn, "users", "cadreOther")) {
    console.log("[0077] column users.cadreOther already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`users\`
       ADD COLUMN \`cadreOther\` varchar(128) NULL DEFAULT NULL`
    );
    console.log("[0077] added column users.cadreOther.");
  }

  // 2. Modify cneAttendees.cadre type to varchar(128)
  if (!(await tableExists(conn, "cneAttendees"))) {
    console.error("[0077] cneAttendees table missing — run earlier migrations first.");
    process.exit(1);
  }

  const cadreType = await getColumnType(conn, "cneAttendees", "cadre");
  if (cadreType === "varchar") {
    console.log("[0077] column cneAttendees.cadre is already varchar — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`cneAttendees\`
       MODIFY COLUMN \`cadre\` varchar(128) NOT NULL`
    );
    console.log("[0077] altered column cneAttendees.cadre type to VARCHAR(128).");
  }

  console.log("[0077] User cadre database migration completed.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
