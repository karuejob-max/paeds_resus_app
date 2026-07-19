/**
 * Idempotent: migration 0069 — retire "parent" as a users.userType value.
 *
 * CEO decision, 2026-07-19: the "parent" account type existed so one person
 * (e.g. a nurse who is also a mother) could hold a provider account and still
 * submit Safe-Truth as a parent under the same login. That's no longer needed
 * — Safe-Truth v1 (migration 0065, live since 2026-07-16) requires no account
 * at all, so there's nothing left for a "parent" account to do that a no-login
 * submission or an "individual" account doesn't already cover.
 *
 * This migration:
 *   1. Backfills any existing users.userType = 'parent' rows to 'individual'
 *      (safe default — anyone who registered wanting a personal account is
 *      functionally an individual actor now that parent-specific behavior
 *      is gone; nothing about their data changes, only the label).
 *   2. Narrows the userType ENUM to ('individual', 'institutional'), removing
 *      'parent' as a selectable value going forward.
 *
 * Does NOT touch parentSafeTruthSubmissions or parentSafeTruthEvents — that
 * historical data stays exactly as-is and remains queryable by admins
 * (Observation Architecture v1.1 §9.3: permanent, anonymised only on account
 * deletion, never deleted outright). Only the *account type* is retired; the
 * old submissions table and its data are untouched by this script.
 *
 * Companion code changes (same PR): drizzle/schema.ts, server/routers.ts,
 * server/db.ts, server/routers/admin-stats.ts, server/routers/parent-safetruth.ts
 * (submitTimeline disabled, read/admin procedures unchanged),
 * client/src/App.tsx (/parent-safe-truth now redirects to /safe-truth).
 *
 * Run: pnpm run db:apply-0069
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function enumHasValue(conn, table, column, value) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  const type = rows[0]?.COLUMN_TYPE ?? "";
  return String(type).includes(`'${value}'`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0069] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const hasParent = await enumHasValue(conn, "users", "userType", "parent");
    if (!hasParent) {
      console.log("[0069]   ✓ users.userType no longer includes 'parent' — skipping.");
      console.log("[0069] Done.");
      return;
    }

    const [backfillResult] = await conn.query(
      `UPDATE \`users\` SET \`userType\` = 'individual' WHERE \`userType\` = 'parent'`
    );
    console.log(
      `[0069]   + Backfilled ${backfillResult.affectedRows} user(s) from 'parent' to 'individual'.`
    );

    await conn.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`userType\` ENUM('individual', 'institutional') DEFAULT 'individual'`
    );
    console.log("[0069]   + Narrowed users.userType ENUM to ('individual', 'institutional').");

    console.log("[0069] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0069] Fatal error:", err);
  process.exit(1);
});
