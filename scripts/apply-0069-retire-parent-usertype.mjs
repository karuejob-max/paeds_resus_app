/**
 * Idempotent: migration 0069 — retire `parent` from the account-type model.
 *
 * North Star v2.0 §6.1: "Products are permissions, not account types. Two
 * actor types exist. The current codebase userType ENUM (individual /
 * parent / institutional) must be migrated to align with this model."
 * §9.2 lists "Safe-Truth parent account type retired" and "userType ENUM
 * updated" as explicit success criteria. Safe-Truth itself sits outside
 * both account types (§6.1) — it never required an account to begin with,
 * and since 2026-07-16 (gap-analysis #11 Phase B) it's fully unauthenticated
 * at /safe-truth. This migration removes the now-redundant account path.
 *
 * ASSUMPTION (flagged per project convention — no way to inspect prod data
 * from this session): any existing users.userType = 'parent' rows are
 * backfilled to 'individual' rather than deleted or left as an orphaned
 * value. 'individual' is the safer default — it preserves login and existing
 * data ownership (Care Signal drafts, profile, etc.) without granting
 * institutional-only capabilities. These accounts lose parent-specific UI
 * (the old /parent-safe-truth flow, now a redirect to /safe-truth) but keep
 * everything else. If the actual row count in prod suggests a different
 * migration path is preferable, surface that after seeing this script's
 * output — it prints the affected row count before altering the enum.
 *
 * Same backfill logic applied to featureFlags.targetUserType = 'parent'
 * rows, reset to 'all' (the safest default — no flag should silently stop
 * targeting anyone once its intended audience value disappears).
 *
 * NOTE ON COLUMN NAMES: "userType" and "targetUserType" copied directly
 * from schema.ts's literal column-builder strings (lesson from migration
 * 0064's bug) — both are camelCase in the DB, confirmed by reading
 * schema.ts before writing this.
 *
 * Run: pnpm run db:apply-0069
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function getColumnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE as t FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0]?.t ?? null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0069] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    // --- users.userType ---
    const usersType = await getColumnType(conn, "users", "userType");
    if (usersType && !usersType.includes("'parent'")) {
      console.log("[0069]   ✓ users.userType already excludes 'parent' — skipping.");
    } else {
      const [affected] = await conn.query(
        `SELECT COUNT(*) as c FROM \`users\` WHERE \`userType\` = 'parent'`
      );
      console.log(`[0069]   Found ${affected[0].c} users.userType = 'parent' row(s) — backfilling to 'individual'.`);
      await conn.query(`UPDATE \`users\` SET \`userType\` = 'individual' WHERE \`userType\` = 'parent'`);
      await conn.query(
        `ALTER TABLE \`users\` MODIFY COLUMN \`userType\` ENUM('individual','institutional') DEFAULT 'individual'`
      );
      console.log("[0069]   + users.userType enum narrowed to (individual, institutional).");
    }

    // --- featureFlags.targetUserType ---
    const flagsType = await getColumnType(conn, "featureFlags", "targetUserType");
    if (flagsType && !flagsType.includes("'parent'")) {
      console.log("[0069]   ✓ featureFlags.targetUserType already excludes 'parent' — skipping.");
    } else {
      const [affected] = await conn.query(
        `SELECT COUNT(*) as c FROM \`featureFlags\` WHERE \`targetUserType\` = 'parent'`
      );
      console.log(`[0069]   Found ${affected[0].c} featureFlags.targetUserType = 'parent' row(s) — resetting to 'all'.`);
      await conn.query(`UPDATE \`featureFlags\` SET \`targetUserType\` = 'all' WHERE \`targetUserType\` = 'parent'`);
      await conn.query(
        `ALTER TABLE \`featureFlags\` MODIFY COLUMN \`targetUserType\` ENUM('all','admin','individual','institutional') DEFAULT 'all'`
      );
      console.log("[0069]   + featureFlags.targetUserType enum narrowed to (all, admin, individual, institutional).");
    }

    console.log("[0069] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0069] Fatal error:", err);
  process.exit(1);
});
