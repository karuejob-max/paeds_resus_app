/**
 * Idempotent verification for migration 0044 (legal consent + DSAR tables).
 *
 *   pnpm run db:verify-0044
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

const USER_COLUMNS = [
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

const TABLES = ["legalDocumentVersions", "legalDataRequests", "userConsentEvents"];

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await mysql.createConnection(getConnectionConfig(databaseUrl));

  let missing = 0;

  for (const col of USER_COLUMNS) {
    if (await columnExists(conn, dbName, "users", col)) {
      console.log(`[ok] users.${col}`);
    } else {
      console.log(`[MISSING] users.${col}`);
      missing += 1;
    }
  }

  for (const table of TABLES) {
    if (await tableExists(conn, dbName, table)) {
      console.log(`[ok] table ${table}`);
    } else {
      console.log(`[MISSING] table ${table}`);
      missing += 1;
    }
  }

  await conn.end();

  if (missing > 0) {
    console.error(`\n0044 verification FAILED — ${missing} missing object(s). Run: pnpm run db:apply-0044`);
    process.exit(1);
  }

  console.log("\n0044 verification PASSED — all legal consent columns and DSAR tables present.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
