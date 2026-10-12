/**
 * Idempotent: Rename CNE database tables/columns to CPD and add professional council points fields (migration 0078).
 *
 * Operations:
 *   1. Rename cneEvents table to cpdEvents
 *   2. Rename cneAttendees table to cpdAttendees
 *   3. Add approvingCouncil and cpdPoints columns to cpdEvents
 *   4. Rename columns/foreign keys in cpdAttendees and cpdCodeRevealLogs
 *   5. Rename coordinator columns in institutionalAccounts
 *
 * Run command:
 *   pnpm run db:apply-0078
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

async function renameOrPreserveTable(conn, legacyTable, canonicalTable) {
  const legacyExists = await tableExists(conn, legacyTable);
  const canonicalExists = await tableExists(conn, canonicalTable);
  if (!legacyExists) {
    console.log(`[0078] Table ${legacyTable} does not exist — skip.`);
    return;
  }
  if (canonicalExists) {
    console.log(`[0078] Tables ${legacyTable} and ${canonicalTable} both exist — preserving both and using ${canonicalTable} as canonical.`);
    return;
  }
  await conn.query(`RENAME TABLE \`${legacyTable}\` TO \`${canonicalTable}\``);
  console.log(`[0078] Table ${legacyTable} renamed to ${canonicalTable}.`);
}

async function renameOrCopyColumn(conn, table, legacyColumn, canonicalColumn) {
  const legacyExists = await columnExists(conn, table, legacyColumn);
  const canonicalExists = await columnExists(conn, table, canonicalColumn);
  if (!legacyExists || canonicalExists) {
    if (legacyExists && canonicalExists) {
      await conn.query(`UPDATE \`${table}\` SET \`${canonicalColumn}\` = COALESCE(\`${canonicalColumn}\`, \`${legacyColumn}\`) WHERE \`${legacyColumn}\` IS NOT NULL`);
      console.log(`[0078] Columns ${table}.${legacyColumn} and ${canonicalColumn} both exist — copied missing canonical values and preserved legacy data.`);
    }
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` RENAME COLUMN \`${legacyColumn}\` TO \`${canonicalColumn}\``);
  console.log(`[0078] Column ${table}.${legacyColumn} renamed to ${canonicalColumn}.`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("[0078] Connecting to database...");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  // 1. Rename cneEvents to cpdEvents, or preserve both if a prior partial/manual
  // migration already created the canonical table.
  await renameOrPreserveTable(conn, "cneEvents", "cpdEvents");

  // 2. Rename cneAttendees to cpdAttendees using the same safe rule.
  await renameOrPreserveTable(conn, "cneAttendees", "cpdAttendees");

  // Verify cpdEvents table exists before performing modifications
  if (!(await tableExists(conn, "cpdEvents"))) {
    console.error("[0078] Critical Error: cpdEvents table not found.");
    process.exit(1);
  }

  // 3. Add approvingCouncil and cpdPoints columns to cpdEvents
  if (await columnExists(conn, "cpdEvents", "approvingCouncil")) {
    console.log("[0078] Column cpdEvents.approvingCouncil already exists — skip.");
  } else {
    await conn.query("ALTER TABLE `cpdEvents` ADD COLUMN `approvingCouncil` varchar(128) NULL DEFAULT NULL");
    console.log("[0078] Added column cpdEvents.approvingCouncil.");
  }

  if (await columnExists(conn, "cpdEvents", "cpdPoints")) {
    console.log("[0078] Column cpdEvents.cpdPoints already exists — skip.");
  } else {
    await conn.query("ALTER TABLE `cpdEvents` ADD COLUMN `cpdPoints` decimal(4, 1) NULL DEFAULT NULL");
    console.log("[0078] Added column cpdEvents.cpdPoints.");
  }

  // Verify cpdAttendees table exists
  if (!(await tableExists(conn, "cpdAttendees"))) {
    console.error("[0078] Critical Error: cpdAttendees table not found.");
    process.exit(1);
  }

  // 4. Rename cneEventId column in cpdAttendees
  await renameOrCopyColumn(conn, "cpdAttendees", "cneEventId", "cpdEventId");

  // 5. Rename columns in cpdCodeRevealLogs
  if (await tableExists(conn, "cpdCodeRevealLogs")) {
    await renameOrCopyColumn(conn, "cpdCodeRevealLogs", "cneAttendeeId", "cpdAttendeeId");
    await renameOrCopyColumn(conn, "cpdCodeRevealLogs", "cneEventId", "cpdEventId");
  }

  // 6. Rename coordinator columns in institutionalAccounts
  if (await tableExists(conn, "institutionalAccounts")) {
    await renameOrCopyColumn(conn, "institutionalAccounts", "cneCoordinatorName", "cpdCoordinatorName");
    await renameOrCopyColumn(conn, "institutionalAccounts", "cneCoordinatorSignature", "cpdCoordinatorSignature");
  }

  console.log("[0078] CPD database rename and points migration completed successfully.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
