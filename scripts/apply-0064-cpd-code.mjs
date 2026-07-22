/**
 * Idempotent: CPD secret code column and reveal audit logs table (migration 0064).
 *
 * Adds:
 *   - cneEvents.cpdCode column (VARCHAR(128))
 *   - cpdCodeRevealLogs table
 *
 *   pnpm run db:apply-0064
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("[0064] Connecting to database...");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  // 1. Add cpdCode column to cneEvents table
  if (!(await tableExists(conn, "cneEvents"))) {
    console.error("[0064] cneEvents missing — run earlier migrations first.");
    process.exit(1);
  }

  if (await columnExists(conn, "cneEvents", "cpdCode")) {
    console.log("[0064] column cneEvents.cpdCode already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`cneEvents\`
       ADD COLUMN \`cpdCode\` varchar(128) NULL DEFAULT NULL`
    );
    console.log("[0064] added column cneEvents.cpdCode.");
  }

  // 2. Create cpdCodeRevealLogs table
  if (await tableExists(conn, "cpdCodeRevealLogs")) {
    console.log("[0064] table cpdCodeRevealLogs already exists — skip.");
  } else {
    await conn.query(
      `CREATE TABLE \`cpdCodeRevealLogs\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`userId\` int(11) NOT NULL,
        \`cneAttendeeId\` int(11) NOT NULL,
        \`cneEventId\` int(11) NOT NULL,
        \`revealedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`ipAddress\` varchar(45) NULL DEFAULT NULL,
        \`userAgent\` varchar(512) NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    );
    console.log("[0064] created table cpdCodeRevealLogs.");
  }

  console.log("[0064] CPD secret code database migration completed.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
