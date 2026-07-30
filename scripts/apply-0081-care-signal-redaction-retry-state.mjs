/**
 * Idempotent: migration 0081 -- careSignalEvents redaction retry-state
 * columns. Closes a real gap found in code review 2026-07-29: the
 * redaction job (migration 0076) had no way to distinguish "not yet
 * attempted" from "has failed repeatedly" -- a permanently-unredactable
 * narrative would retry every 10 minutes forever, silently.
 *
 * NOTE ON COLUMN NAMES: copied directly from drizzle/schema.ts's literal
 * strings inside the column-builder calls ("redaction_attempts",
 * "redaction_last_attempt_at", "redaction_last_error"), not inferred from
 * the JS property names -- per the migration-0064 lesson in AGENTS.md.
 *
 * Run: pnpm run db:apply-0081
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0081] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0081] Running Care Signal redaction retry-state migration...");

    if (await columnExists(conn, "careSignalEvents", "redaction_attempts")) {
      console.log("[0081]   \u2713 careSignalEvents.redaction_attempts already exists -- skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`redaction_attempts\` INT NOT NULL DEFAULT 0 AFTER \`redacted_narrative\``
      );
      console.log("[0081]   + Added careSignalEvents.redaction_attempts.");
    }

    if (await columnExists(conn, "careSignalEvents", "redaction_last_attempt_at")) {
      console.log("[0081]   \u2713 careSignalEvents.redaction_last_attempt_at already exists -- skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`redaction_last_attempt_at\` TIMESTAMP NULL AFTER \`redaction_attempts\``
      );
      console.log("[0081]   + Added careSignalEvents.redaction_last_attempt_at.");
    }

    if (await columnExists(conn, "careSignalEvents", "redaction_last_error")) {
      console.log("[0081]   \u2713 careSignalEvents.redaction_last_error already exists -- skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`redaction_last_error\` TEXT NULL AFTER \`redaction_last_attempt_at\``
      );
      console.log("[0081]   + Added careSignalEvents.redaction_last_error.");
    }

    console.log(
      "[0081] Done. Existing pending rows default to redaction_attempts=0, so they're immediately eligible for retry under the new backoff logic -- nothing gets stuck by this migration itself."
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0081] Fatal error:", err);
  process.exit(1);
});
