/*
 * Migration 0133 — CPR event idempotency keys.
 *
 * Run: pnpm run db:apply-0133
 *
 * This adds only an operational retry key. It does not create a CPR session,
 * activation, patient record, or test data.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0133] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const [columns] = await conn.query("SHOW COLUMNS FROM cprEvents LIKE 'idempotencyKey'");
    if (!Array.isArray(columns) || columns.length === 0) {
      await conn.query("ALTER TABLE cprEvents ADD COLUMN idempotencyKey VARCHAR(96) NULL AFTER metadata");
    }
    const [indexes] = await conn.query("SHOW INDEX FROM cprEvents WHERE Key_name = 'cprEvents_session_idempotency_unique'");
    if (!Array.isArray(indexes) || indexes.length === 0) {
      await conn.query("ALTER TABLE cprEvents ADD UNIQUE KEY cprEvents_session_idempotency_unique (cprSessionId, idempotencyKey)");
    }
    console.log("[0133] CPR event idempotency key is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0133] Fatal error:", error);
  process.exit(1);
});
