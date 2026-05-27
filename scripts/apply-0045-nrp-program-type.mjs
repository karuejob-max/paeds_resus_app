/**
 * Idempotent: add NRP program type to enrollments, certificates, courses (migration 0045).
 *
 *   pnpm run db:apply-0045
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function enumHasValue(conn, dbName, table, column, value) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  const type = rows[0]?.COLUMN_TYPE ?? "";
  return String(type).includes(`'${value}'`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await createMysqlConnection(databaseUrl, mysql);
  const sqlPath = path.join(__dirname, "../drizzle/0045_nrp_program_type.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const hasNrp = await enumHasValue(conn, dbName, "enrollments", "programType", "nrp");
  if (hasNrp) {
    console.log("[0045] NRP already present in enrollments.programType — skipping.");
  } else {
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await conn.query(stmt);
    }
    console.log("[0045] Applied NRP program type migration.");
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
