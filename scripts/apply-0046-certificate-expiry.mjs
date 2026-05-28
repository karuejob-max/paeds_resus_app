/**
 * Idempotent: backfill certificates.expiryDate for AHA + micro-course (migration 0046).
 *
 *   pnpm run db:apply-0046
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  const [tbl] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'certificates'`,
    [dbName]
  );
  if (!(tbl[0]?.c > 0)) {
    console.warn("[0046] Skip: table `certificates` does not exist.");
    await conn.end();
    return;
  }

  const sqlPath = path.join(__dirname, "../drizzle/0046_certificate_expiry_backfill.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  let totalAffected = 0;
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [result] = await conn.query(stmt);
    const affected = result?.affectedRows ?? 0;
    totalAffected += affected;
    console.log(`[0046] Statement applied (${affected} row(s) affected).`);
  }

  console.log(`[0046] Certificate expiry backfill complete (${totalAffected} total row updates).`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
