/**
 * Idempotent: CNE certificate coordinator signature image (migration 0054).
 *
 * Adds:
 *   - institutionalAccounts.cneCoordinatorSignature column (TEXT)
 *     Stores a base64 PNG data URL of the CNE Coordinator's drawn signature,
 *     embedded above the certificate signature line when present.
 *
 *   pnpm run db:apply-0054
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  if (!(await tableExists(conn, "institutionalAccounts"))) {
    console.error("[0054] institutionalAccounts missing — run earlier migrations first.");
    process.exit(1);
  }

  if (await columnExists(conn, "institutionalAccounts", "cneCoordinatorSignature")) {
    console.log("[0054] column institutionalAccounts.cneCoordinatorSignature already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`institutionalAccounts\`
       ADD COLUMN \`cneCoordinatorSignature\` text NULL AFTER \`cneCoordinatorName\``
    );
    console.log("[0054] added column institutionalAccounts.cneCoordinatorSignature.");
  }

  console.log("[0054] CNE coordinator signature schema ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
