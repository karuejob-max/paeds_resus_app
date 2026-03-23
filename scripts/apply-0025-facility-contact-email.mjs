/**
 * Idempotent: adds clinicalReferrals.facilityContactEmail if missing (REF-1 / drizzle 0025).
 * Usage: node scripts/apply-0025-facility-contact-email.mjs
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
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clinicalReferrals'`,
      [dbName]
    );
    if (!(tbl[0]?.c > 0)) {
      console.warn(
        "Skip: table `clinicalReferrals` does not exist yet. Apply earlier Drizzle migrations (e.g. `pnpm run db:push` or your hosted SQL), then run `pnpm run db:apply-0025` again."
      );
      return;
    }
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clinicalReferrals' AND COLUMN_NAME = 'facilityContactEmail'`,
      [dbName]
    );
    const count = rows[0]?.c ?? 0;
    if (count > 0) {
      console.log("OK: facilityContactEmail already exists — nothing to do.");
      return;
    }
    await conn.query(
      "ALTER TABLE `clinicalReferrals` ADD COLUMN `facilityContactEmail` varchar(320)"
    );
    console.log("OK: added clinicalReferrals.facilityContactEmail");
  } catch (e) {
    console.error("Migration failed:", e.message || e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
