/**
 * Idempotent: adds users.instructorApprovedAt if missing (B2B instructor assignment).
 *
 *   pnpm run db:apply-0027
 */
import "dotenv/config";
import mysql from "mysql2/promise";

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

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection(getConnectionConfig(databaseUrl));
    const dbName = conn.config.database;
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'instructorApprovedAt'`,
      [dbName]
    );
    if (Array.isArray(cols) && cols.length > 0) {
      console.log("users.instructorApprovedAt already exists — nothing to do.");
      process.exit(0);
    }
    await conn.query(
      "ALTER TABLE `users` ADD COLUMN `instructorApprovedAt` timestamp NULL DEFAULT NULL"
    );
    console.log("Added users.instructorApprovedAt.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
