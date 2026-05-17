/**
 * Idempotent: careFacilities registry + providerProfiles.facilityId (migration 0041).
 *
 *   pnpm run db:apply-0041
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

async function columnExists(conn, dbName, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function outreachExists(conn) {
  const [rows] = await conn.query(
    `SELECT id FROM careFacilities WHERE systemSlug = 'outreach-mobile' LIMIT 1`
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "../drizzle/0041_care_facilities_registry.sql");
  const fullSql = fs.readFileSync(sqlPath, "utf8");

  let conn;
  try {
    conn = await mysql.createConnection(getConnectionConfig(databaseUrl));
    const dbName = conn.config.database;

    if (!(await tableExists(conn, dbName, "careFacilities"))) {
      const createPart = fullSql.split("ALTER TABLE")[0].trim();
      const statements = createPart
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      console.log("Created careFacilities table and indexes.");
    } else {
      console.log("careFacilities table already exists.");
    }

    if (!(await columnExists(conn, dbName, "providerProfiles", "facilityId"))) {
      await conn.query("ALTER TABLE `providerProfiles` ADD `facilityId` int");
      await conn.query(
        "CREATE INDEX `idx_provider_profiles_facility` ON `providerProfiles` (`facilityId`)"
      );
      console.log("Added providerProfiles.facilityId + index.");
    } else {
      console.log("providerProfiles.facilityId already exists.");
    }

    if (!(await outreachExists(conn))) {
      await conn.query(
        `INSERT INTO careFacilities (name, county, country, isSystem, systemSlug) VALUES ('Outreach / mobile / multiple sites', NULL, 'Kenya', true, 'outreach-mobile')`
      );
      console.log("Seeded outreach-mobile system facility.");
    } else {
      console.log("outreach-mobile system facility already seeded.");
    }

    console.log("Applied 0041 care facilities registry.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
