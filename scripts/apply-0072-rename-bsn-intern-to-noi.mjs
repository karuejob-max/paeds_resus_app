/**
 * Idempotent: migration 0072 — rename designation enum value
 * `bsn_intern` -> `noi` (Nursing Officer Intern) on `institutionalStaffMembers`.
 *
 * CEO decision, 2026-07-19: prefers "NOI" over "BSN" for BSN-holding nursing
 * interns specifically to avoid confusion with `permanent_nurse` staff who
 * are themselves BSN-holding Registered Nurses ("BSN RNs") — same academic
 * credential, different role. No diploma-level nursing interns exist in the
 * program currently (may be added later); Clinical Officer Interns keep
 * their existing bsc/diploma split (`coi_bsc`, `coi_diploma`), unaffected by
 * this rename.
 *
 * Same backfill-then-narrow pattern as migration 0069
 * (apply-0069-retire-parent-usertype.mjs): any existing
 * `designation = 'bsn_intern'` rows are updated to `'noi'` before the enum
 * itself is altered, so no row is left holding a value the column no longer
 * accepts.
 *
 * NOTE ON COLUMN NAME: "designation" copied directly from schema.ts's
 * literal column-builder string (lesson from migration 0064's bug).
 *
 * Run: pnpm run db:apply-0072
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
    console.error("[0072] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    const columnType = await getColumnType(conn, "institutionalStaffMembers", "designation");
    if (columnType && !columnType.includes("'bsn_intern'")) {
      console.log("[0072]   ✓ institutionalStaffMembers.designation already excludes 'bsn_intern' — skipping.");
    } else {
      const [affected] = await conn.query(
        `SELECT COUNT(*) as c FROM \`institutionalStaffMembers\` WHERE \`designation\` = 'bsn_intern'`
      );
      console.log(`[0072]   Found ${affected[0].c} institutionalStaffMembers.designation = 'bsn_intern' row(s) — renaming to 'noi'.`);
      await conn.query(`UPDATE \`institutionalStaffMembers\` SET \`designation\` = 'noi' WHERE \`designation\` = 'bsn_intern'`);
      await conn.query(
        `ALTER TABLE \`institutionalStaffMembers\` MODIFY COLUMN \`designation\` ENUM('noi','coi_bsc','coi_diploma','moi','permanent_nurse','permanent_doctor','other') DEFAULT 'other'`
      );
      console.log("[0072]   + institutionalStaffMembers.designation enum renamed (bsn_intern -> noi).");
    }

    console.log("[0072] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0072] Fatal error:", err);
  process.exit(1);
});
