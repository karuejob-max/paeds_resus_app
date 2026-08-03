/**
 * Idempotent: adds providerProfiles.department if missing.
 * Usage: node scripts/apply-0052-provider-profile-department.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  let conn;
  try {
    const config = await getConnectionConfig(databaseUrl);
    conn = await mysql.createConnection(config);
    const dbName = conn.config.database;
    const [tbl] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'providerProfiles'`,
      [dbName]
    );
    if (!(tbl[0]?.c > 0)) {
      console.warn(
        "Skip: table `providerProfiles` does not exist yet."
      );
      return;
    }
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'providerProfiles' AND COLUMN_NAME = 'department'`,
      [dbName]
    );
    const count = rows[0]?.c ?? 0;
    if (count > 0) {
      console.log("OK: department column already exists in providerProfiles — nothing to do.");
      return;
    }
    await conn.query(
      "ALTER TABLE `providerProfiles` ADD COLUMN `department` varchar(255)"
    );
    console.log("OK: added providerProfiles.department column");
  } catch (e) {
    console.error("Migration failed:", e.message || e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
