/**
 * Idempotent: legal consent columns + DSAR tables (migration 0044).
 *
 *   pnpm run db:apply-0044
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

async function columnExists(conn, dbName, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
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

  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await mysql.createConnection(getConnectionConfig(databaseUrl));

  const userColumns = [
    "termsAcceptedAt",
    "termsVersion",
    "privacyAcceptedAt",
    "privacyVersion",
    "careSignalConsentAt",
    "careSignalConsentVersion",
    "institutionalB2bAcceptedAt",
    "institutionalB2bVersion",
    "resusGpsAckAt",
    "resusGpsAckVersion",
    "safeTruthGuardianAckAt",
    "safeTruthGuardianAckVersion",
  ];

  for (const col of userColumns) {
    if (await columnExists(conn, dbName, "users", col)) {
      console.log(`[skip] users.${col} exists`);
      continue;
    }
    const type =
      col.endsWith("At")
        ? "timestamp NULL"
        : "varchar(16) NULL";
    await conn.query(`ALTER TABLE \`users\` ADD COLUMN \`${col}\` ${type}`);
    console.log(`[ok] added users.${col}`);
  }

  const sqlPath = path.join(__dirname, "../drizzle/0044_legal_consent.sql");
  const raw = fs.readFileSync(sqlPath, "utf8");
  const createBlocks = raw
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("CREATE TABLE"));

  for (const block of createBlocks) {
    const match = block.match(/CREATE TABLE `(\w+)`/);
    const table = match?.[1];
    if (!table) continue;
    if (await tableExists(conn, dbName, table)) {
      console.log(`[skip] ${table} exists`);
      continue;
    }
    await conn.query(block.replace(/;$/, ""));
    console.log(`[ok] created ${table}`);
  }

  await conn.end();
  console.log("Migration 0044 apply complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
