/**
 * One-off: compare `users` columns to app schema expectations.
 *   pnpm exec node scripts/check-users-columns.mjs
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

const EXPECTED = [
  "id",
  "openId",
  "name",
  "email",
  "phone",
  "loginMethod",
  "passwordHash",
  "role",
  "institutionalRole",
  "providerType",
  "userType",
  "createdAt",
  "updatedAt",
  "lastSignedIn",
  "instructorApprovedAt",
  "instructorNumber",
  "instructorCertifiedAt",
];

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const conn = await mysql.createConnection(getConnectionConfig(url));
  const [rows] = await conn.query("SHOW COLUMNS FROM users");
  await conn.end();
  const have = new Set(rows.map((r) => r.Field));
  const missing = EXPECTED.filter((c) => !have.has(c));
  if (missing.length === 0) {
    console.log("OK — users table has all expected columns.");
    process.exit(0);
  }
  console.error("Missing columns on users:", missing.join(", "));
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
