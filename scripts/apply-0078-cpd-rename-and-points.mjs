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

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("[0078] Connecting to database...");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  // 1. Rename cneEvents to cpdEvents
  if (await tableExists(conn, "cneEvents")) {
    console.log("[0078] Renaming table cneEvents to cpdEvents...");
    await conn.query("RENAME TABLE `cneEvents` TO `cpdEvents`");
    console.log("[0078] Table cneEvents renamed successfully.");
  } else {
    console.log("[0078] Table cneEvents does not exist (already renamed or never created) — skip.");
  }

  // 2. Rename cneAttendees to cpdAttendees
  if (await tableExists(conn, "cneAttendees")) {
    console.log("[0078] Renaming table cneAttendees to cpdAttendees...");
    await conn.query("RENAME TABLE `cneAttendees` TO `cpdAttendees`");
    console.log("[0078] Table cneAttendees renamed successfully.");
  } else {
    console.log("[0078] Table cneAttendees does not exist (already renamed or never created) — skip.");
  }

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
  if (await columnExists(conn, "cpdAttendees", "cneEventId")) {
    console.log("[0078] Renaming column cpdAttendees.cneEventId to cpdEventId...");
    await conn.query("ALTER TABLE `cpdAttendees` RENAME COLUMN `cneEventId` TO `cpdEventId`");
    console.log("[0078] Column cpdAttendees.cneEventId renamed successfully.");
  } else {
    console.log("[0078] Column cpdAttendees.cneEventId does not exist — skip.");
  }

  // 5. Rename columns in cpdCodeRevealLogs
  if (await tableExists(conn, "cpdCodeRevealLogs")) {
    if (await columnExists(conn, "cpdCodeRevealLogs", "cneAttendeeId")) {
      console.log("[0078] Renaming column cpdCodeRevealLogs.cneAttendeeId to cpdAttendeeId...");
      await conn.query("ALTER TABLE `cpdCodeRevealLogs` RENAME COLUMN `cneAttendeeId` TO `cpdAttendeeId`");
      console.log("[0078] Column cpdCodeRevealLogs.cneAttendeeId renamed successfully.");
    }
    if (await columnExists(conn, "cpdCodeRevealLogs", "cneEventId")) {
      console.log("[0078] Renaming column cpdCodeRevealLogs.cneEventId to cpdEventId...");
      await conn.query("ALTER TABLE `cpdCodeRevealLogs` RENAME COLUMN `cneEventId` TO `cpdEventId`");
      console.log("[0078] Column cpdCodeRevealLogs.cneEventId renamed successfully.");
    }
  }

  // 6. Rename coordinator columns in institutionalAccounts
  if (await tableExists(conn, "institutionalAccounts")) {
    if (await columnExists(conn, "institutionalAccounts", "cneCoordinatorName")) {
      console.log("[0078] Renaming column institutionalAccounts.cneCoordinatorName to cpdCoordinatorName...");
      await conn.query("ALTER TABLE `institutionalAccounts` RENAME COLUMN `cneCoordinatorName` TO `cpdCoordinatorName`");
      console.log("[0078] Column institutionalAccounts.cneCoordinatorName renamed successfully.");
    }
    if (await columnExists(conn, "institutionalAccounts", "cneCoordinatorSignature")) {
      console.log("[0078] Renaming column institutionalAccounts.cneCoordinatorSignature to cpdCoordinatorSignature...");
      await conn.query("ALTER TABLE `institutionalAccounts` RENAME COLUMN `cneCoordinatorSignature` TO `cpdCoordinatorSignature`");
      console.log("[0078] Column institutionalAccounts.cneCoordinatorSignature renamed successfully.");
    }
  }

  console.log("[0078] CPD database rename and points migration completed successfully.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
