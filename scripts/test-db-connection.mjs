/**
 * Verifies DATABASE_URL without printing secrets.
 *   pnpm run db:test-connection
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.DB_TEST_MAX_RETRIES || "3", 10));
const RETRY_BASE_MS = Math.max(1000, parseInt(process.env.DB_TEST_RETRY_BASE_MS || "3000", 10));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`Retry ${attempt}/${MAX_ATTEMPTS}...`);
      }
      const conn = await createMysqlConnection(url, mysql);
      await conn.query("SELECT 1");
      await conn.end();
      console.log("OK — database accepts this DATABASE_URL.");
      return;
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_ATTEMPTS) {
        const delay = RETRY_BASE_MS * attempt;
        console.warn(`Attempt ${attempt} failed (${e.message}); retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  const e = lastErr;
  if (e?.code === "ER_ACCESS_DENIED_ERROR") {
    console.error(
      "\nAccess denied — wrong user/password, or password was rotated in Aiven and .env is stale.\nFix: Aiven console → your service → Connection info → copy the full URI (or reset password, then paste the new URI into .env).\n"
    );
  }
  console.error(e?.message ?? String(e));
  process.exit(1);
}

main();
