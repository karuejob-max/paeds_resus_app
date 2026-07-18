/**
 * Idempotent: migration 0067 — Safe-Truth v1 Phase C, part 1
 * (gap-analysis queue item #11): event-code linkage resolution column.
 *
 * Adds `safeTruthSubmissions.event_code_resolved_care_signal_event_id` —
 * set by the Phase C matching job when a caregiver's entered event code
 * is confirmed to match a real `careSignalEvents.eventId`. See
 * drizzle/schema.ts's doc comment on this column for the full rationale.
 *
 * NOTE ON COLUMN NAMES (lesson from migration 0064's bug, and reconfirmed
 * for 0065): every raw SQL identifier below was copied directly from the
 * string literal inside schema.ts's column builder call.
 *
 * Run: pnpm run db:apply-0067
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0067] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (await columnExists(conn, "safeTruthSubmissions", "event_code_resolved_care_signal_event_id")) {
      console.log("[0067]   ✓ safeTruthSubmissions.event_code_resolved_care_signal_event_id already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`safeTruthSubmissions\` ADD COLUMN \`event_code_resolved_care_signal_event_id\` INT NULL AFTER \`event_code_entered\``
      );
      console.log("[0067]   + Added safeTruthSubmissions.event_code_resolved_care_signal_event_id.");
    }

    console.log("[0067] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0067] Fatal error:", err);
  process.exit(1);
});
