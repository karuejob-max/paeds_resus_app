/**
 * Idempotent: CNE (Continuing Nursing Education) attendance automation service (migration 0052).
 *
 * Adds:
 *   - institutionalAccounts.cneCoordinatorName column (certificate signature name)
 *   - cneEvents table (per-institution CNE events; one open at a time)
 *   - cneAttendees table (public registrations per event)
 *
 *   pnpm run db:apply-0052
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

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  // 1) institutionalAccounts.cneCoordinatorName ----------------------------------
  if (!(await tableExists(conn, "institutionalAccounts"))) {
    console.error("[0052] institutionalAccounts missing — run earlier migrations first.");
    process.exit(1);
  }
  if (await columnExists(conn, "institutionalAccounts", "cneCoordinatorName")) {
    console.log("[0052] column institutionalAccounts.cneCoordinatorName already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`institutionalAccounts\`
       ADD COLUMN \`cneCoordinatorName\` varchar(255) NULL AFTER \`companyName\``
    );
    console.log("[0052] added column institutionalAccounts.cneCoordinatorName.");
  }

  // 2) cneEvents ------------------------------------------------------------------
  if (await tableExists(conn, "cneEvents")) {
    console.log("[0052] table cneEvents already exists — skip create.");
  } else {
    await conn.query(
      `CREATE TABLE \`cneEvents\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`institutionalAccountId\` int NOT NULL,
        \`name\` varchar(256) NOT NULL,
        \`eventDate\` varchar(64) NOT NULL,
        \`isOpen\` boolean NOT NULL DEFAULT false,
        \`openedAt\` timestamp NULL,
        \`closedAt\` timestamp NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      )`
    );
    console.log("[0052] created table cneEvents.");
  }

  // 3) cneAttendees ---------------------------------------------------------------
  if (await tableExists(conn, "cneAttendees")) {
    console.log("[0052] table cneAttendees already exists — skip create.");
  } else {
    await conn.query(
      `CREATE TABLE \`cneAttendees\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`cneEventId\` int NOT NULL,
        \`institutionalAccountId\` int NOT NULL,
        \`fullName\` varchar(256) NOT NULL,
        \`email\` varchar(320) NOT NULL,
        \`phone\` varchar(32) NOT NULL,
        \`cadre\` enum('BSN','KRCHN','KRN','Other') NOT NULL,
        \`cadreOther\` varchar(128) NULL,
        \`higherDiploma\` varchar(256) NULL,
        \`department\` varchar(256) NOT NULL,
        \`submittedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      )`
    );
    console.log("[0052] created table cneAttendees.");
  }

  // 4) indexes --------------------------------------------------------------------
  const indexes = [
    ["cneEvents", "cneEvents_institution_isOpen", "(`institutionalAccountId`, `isOpen`)"],
    ["cneAttendees", "cneAttendees_event", "(`cneEventId`)"],
    ["cneAttendees", "cneAttendees_email_event", "(`email`, `cneEventId`)"],
  ];
  for (const [table, indexName, cols] of indexes) {
    if (await indexExists(conn, table, indexName)) {
      console.log(`[0052] index ${indexName} already exists — skip.`);
    } else {
      await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` ${cols}`);
      console.log(`[0052] created index ${indexName}.`);
    }
  }

  console.log("[0052] CNE service schema ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
