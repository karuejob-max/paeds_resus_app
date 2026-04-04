/**
 * Idempotent: creates certificateDownloadFeedback (pre-download certificate feedback).
 *
 *   pnpm run db:apply-0030
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

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "../drizzle/0030_certificate_download_feedback.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  let conn;
  try {
    conn = await mysql.createConnection(getConnectionConfig(databaseUrl));
    await conn.query(sql);
    console.log("Applied 0030 certificateDownloadFeedback (idempotent CREATE TABLE IF NOT EXISTS).");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
