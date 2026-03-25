/**
 * Idempotent: adds certificates.renewalReminderSentAt if missing (HI-CERT-1 / drizzle 0026).
 * Fixes Render/Aiven: "Unknown column 'renewalReminderSentAt' in 'field list'".
 *
 * Usage (local with prod DATABASE_URL, or Render one-off shell / background worker):
 *   pnpm run db:apply-0026
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
    const [tbl] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'certificates'`,
      [dbName]
    );
    if (!(tbl[0]?.c > 0)) {
      console.warn(
        "Skip: table `certificates` does not exist. Apply earlier Drizzle migrations first, then run `pnpm run db:apply-0026` again."
      );
      return;
    }
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'certificates' AND COLUMN_NAME = 'renewalReminderSentAt'`,
      [dbName]
    );
    const count = rows[0]?.c ?? 0;
    if (count > 0) {
      console.log("OK: renewalReminderSentAt already exists — nothing to do.");
      return;
    }
    await conn.query(
      "ALTER TABLE `certificates` ADD COLUMN `renewalReminderSentAt` timestamp NULL"
    );
    console.log("OK: added certificates.renewalReminderSentAt");
  } catch (e) {
    console.error("Migration failed:", e.message || e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
