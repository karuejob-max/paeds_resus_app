/**
 * Verifies DATABASE_URL without printing secrets.
 *   pnpm run db:test-connection
 */
import "dotenv/config";
import mysql from "mysql2/promise";

function getConnectionConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const needsSsl =
    /ssl-mode=REQUIRED|ssl=true/i.test(databaseUrl) ||
    url.hostname.endsWith(".aivencloud.com");
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
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }
  let u;
  try {
    u = new URL(url);
  } catch {
    console.error("DATABASE_URL is not a valid URL.");
    process.exit(1);
  }
  console.log(
    `Connecting: user=${decodeURIComponent(u.username)} host=${u.hostname} port=${u.port || 3306} db=${(u.pathname || "").replace(/^\//, "") || "(none)"} passwordLen=${decodeURIComponent(u.password || "").length}`
  );
  try {
    const conn = await mysql.createConnection(getConnectionConfig(url));
    await conn.query("SELECT 1");
    await conn.end();
    console.log("OK — database accepts this DATABASE_URL.");
  } catch (e) {
    if (e.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(
        "\nAccess denied — wrong user/password, or password was rotated in Aiven and .env is stale.\nFix: Aiven console → your service → Connection info → copy the full URI (or reset password, then paste the new URI into .env).\n"
      );
    }
    console.error(e.message);
    process.exit(1);
  }
}

main();
