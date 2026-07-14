/**
 * Idempotent: migration 0063 — add careSignalEvents.success_factor_codes.
 *
 * Discovered while building gap #9 (pattern-detection): the SUCCESS-track
 * Care Signal form has captured success_factor_codes client-side since
 * Care Signal v3 shipped (CareSignalFormV3.tsx's toggleSuccFactor, and
 * care-signal-v3.ts's buildCareSignalV3SubmitPayload both build and send
 * `success_factor_codes`), but the server's `logEvent` procedure never
 * accepted or stored it — no column existed, and the zod input schema
 * didn't even list the field, so tRPC silently dropped it on every SUCCESS
 * submission since v3 shipped. A pattern-detection engine cannot detect
 * success patterns from data that was never saved, so this is a real
 * prerequisite fix, not scope creep.
 *
 * Purely additive: new nullable TEXT column, mirrors failure_mode_codes
 * exactly. No backfill possible for past SUCCESS submissions — that data
 * was never captured server-side and cannot be recovered.
 *
 * Run: pnpm run db:apply-0063
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
    console.error("[0063] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (await columnExists(conn, "careSignalEvents", "success_factor_codes")) {
      console.log("[0063]   ✓ careSignalEvents.success_factor_codes already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`careSignalEvents\` ADD COLUMN \`success_factor_codes\` TEXT NULL AFTER \`failure_mode_codes\``
      );
      console.log("[0063]   + Added careSignalEvents.success_factor_codes.");
    }
    console.log("[0063] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0063] Fatal error:", err);
  process.exit(1);
});
