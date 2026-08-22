#!/usr/bin/env node
/**
 * Migration 0109 — explicit end date for multi-day institutional competency sessions.
 * Existing schedules remain single-day when endDate is NULL.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0109] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 AS present FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (await columnExists(conn, "trainingSchedules", "endDate")) {
      console.log("[0109] trainingSchedules.endDate already exists.");
    } else {
      await conn.query(`ALTER TABLE trainingSchedules ADD COLUMN endDate TIMESTAMP NULL AFTER scheduledDate`);
      console.log("[0109] Added trainingSchedules.endDate.");
    }
    const [rows] = await conn.query(`SELECT COUNT(*) AS multiDayCount FROM trainingSchedules WHERE endDate IS NOT NULL AND endDate >= scheduledDate`);
    console.log(`[0109] Ready. Existing structured multi-day sessions: ${rows[0]?.multiDayCount ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0109] Fatal error:", error);
  process.exit(1);
});
