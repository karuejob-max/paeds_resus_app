/**
 * Idempotent: migration 0068 — providerProfiles.facilityAdminLevel2.
 *
 * Closes a gap flagged while building gap-analysis #11's "global from day
 * 1" geo work (2026-07-16): fresh Care Signal facility searches already
 * carried locality (admin_level_2) through correctly, but the CACHED
 * profile row used to prefill the form on return visits had no column to
 * store it. See drizzle/schema.ts's doc comment on this column, and
 * server/services/facility-registry.service.ts's syncProviderProfileFacility,
 * which now sets it on every named submission — existing providers'
 * profiles self-heal the next time they submit, no backfill job needed.
 *
 * NOTE ON COLUMN NAMES: copied directly from schema.ts's literal string
 * inside the column builder call, not inferred from the JS property name
 * (lesson from migration 0064's bug). providerProfiles uses camelCase DB
 * column names throughout (e.g. "facilityRegion", not "facility_region"),
 * confirmed by reading the surrounding columns before writing this.
 *
 * Run: pnpm run db:apply-0068
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
    console.error("[0068] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (await columnExists(conn, "providerProfiles", "facilityAdminLevel2")) {
      console.log("[0068]   ✓ providerProfiles.facilityAdminLevel2 already exists — skipping.");
    } else {
      await conn.query(
        `ALTER TABLE \`providerProfiles\` ADD COLUMN \`facilityAdminLevel2\` VARCHAR(128) NULL AFTER \`facilityRegion\``
      );
      console.log("[0068]   + Added providerProfiles.facilityAdminLevel2.");
    }

    console.log("[0068] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0068] Fatal error:", err);
  process.exit(1);
});
