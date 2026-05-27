/**
 * Idempotent: institutionalActionLogs (migration 0043).
 *
 *   pnpm run db:apply-0043
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) || url.hostname.endsWith(".aivencloud.com");
  const database = url.pathname.replace(/^\//, "") || undefined;
  const config = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: database || undefined,
  };
  if (needsSsl) {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

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
    conn = await mysql.createConnection(getConnectionConfig(databaseUrl));
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
