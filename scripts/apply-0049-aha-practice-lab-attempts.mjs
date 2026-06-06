/**
 * Idempotent: create ahaPracticeLabAttempts table (migration 0049).
 *
 *   pnpm run db:apply-0049
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

  const conn = await createMysqlConnection(databaseUrl, mysql);
  const sqlPath = path.join(__dirname, "../drizzle/0049_aha_practice_lab_attempts.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await conn.query(stmt);
    console.log("[0049] Applied statement.");
  }

  console.log("[0049] ahaPracticeLabAttempts ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
