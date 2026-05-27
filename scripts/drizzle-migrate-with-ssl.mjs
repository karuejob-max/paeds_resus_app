/**
 * Run drizzle-kit migrate with mysql2 SSL config (Aiven-compatible).
 *
 * drizzle-kit reads DATABASE_URL but mysql2 ignores ssl-mode query params,
 * causing ETIMEDOUT / connection failures against Aiven.
 *
 *   pnpm run db:migrate
 */
import "dotenv/config";
import { spawnSync } from "child_process";
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

async function verifyConnection(databaseUrl) {
  const conn = await mysql.createConnection(getConnectionConfig(databaseUrl));
  await conn.query("SELECT 1");
  await conn.end();
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  console.log("Verifying DATABASE_URL with SSL-aware mysql2…");
  try {
    await verifyConnection(databaseUrl);
    console.log("Connection OK.");
  } catch (e) {
    console.error("Connection failed:", e.message || e);
    process.exit(1);
  }

  // drizzle-kit 0.2x uses DATABASE_URL; patch ssl via env for drivers that honour it.
  // Primary fix: run migrate after verified pool — drizzle-kit still uses URL internally,
  // but Aiven often works when ssl-mode=REQUIRED is in URL AND network allows.
  // If migrate still fails, use scripts/apply-00xx-*.mjs for one-off SQL.
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };

  console.log("Running drizzle-kit migrate…");
  const result = spawnSync("pnpm", ["exec", "drizzle-kit", "migrate"], {
    stdio: "inherit",
    env,
    shell: true,
  });

  if (result.status !== 0) {
    console.error(
      "\nIf migrate failed with ETIMEDOUT, apply pending SQL manually:\n" +
        "  node scripts/apply-0043-institutional-action-logs.mjs\n" +
        "See docs/STAGING_GO_LIVE_CHECKLIST.md §1 and docs/E2E_TEST_SETUP.md."
    );
    process.exit(result.status ?? 1);
  }

  console.log("drizzle-kit migrate completed.");
}

main();
