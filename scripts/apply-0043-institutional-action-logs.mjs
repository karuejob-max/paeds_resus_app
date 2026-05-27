/**
 * Idempotent: institutionalActionLogs (migration 0043).
 *
 *   pnpm run db:apply-0043
 *
 * Uses scripts/db-connection-config.mjs (IPv4 + SSL) for Aiven from Windows dev machines.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function tableExists(conn, dbName, table) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, table]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "../drizzle/0043_institutional_action_logs.sql");
  const statements = fs
    .readFileSync(sqlPath, "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  let conn;
  try {
    conn = await createMysqlConnection(databaseUrl, mysql);
    const dbName = conn.config.database;

    if (await tableExists(conn, dbName, "institutionalActionLogs")) {
      console.log("0043: institutionalActionLogs already exists — skipping.");
      process.exit(0);
    }

    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log("Applied 0043 institutionalActionLogs.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
