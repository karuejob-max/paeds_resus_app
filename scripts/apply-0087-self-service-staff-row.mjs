/**
 * Idempotent: migration 0087 -- makes
 * institutionalStaffMembers.institutionalAccountId nullable
 * (docs/IERP_NERP_PROGRAM_V2_SPEC.md §2, CEO 2026-07-31 respec).
 *
 * Root cause this unblocks: syncProviderProfileFacility only ever created
 * this row when the learner's facility mapped to a recognized
 * institutional account. A learner whose facility isn't listed on the
 * platform -- an explicitly supported case for self-service enrollment --
 * could never get this row created, which meant declareMyDesignation
 * (the very first self-service step) hard-failed, and every phase/payment
 * gate built across INST-25 had nothing to read. Same pattern as the
 * trainingSchedules.institutionalAccountId nullable change from migration
 * 0084.
 *
 * Run: pnpm run db:apply-0087
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function getColumnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE, IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows[0] ?? null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0087] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0087] Running institutionalStaffMembers.institutionalAccountId nullable migration...");

    const col = await getColumnType(conn, "institutionalStaffMembers", "institutionalAccountId");
    if (!col) {
      console.error("[0087] institutionalStaffMembers.institutionalAccountId not found -- aborting, schema drift suspected.");
      process.exit(1);
    }
    if (col.IS_NULLABLE === "YES") {
      console.log("[0087]   \u2713 institutionalStaffMembers.institutionalAccountId already nullable -- skipping.");
    } else {
      await conn.query("ALTER TABLE `institutionalStaffMembers` MODIFY COLUMN `institutionalAccountId` INT NULL");
      console.log("[0087]   + institutionalStaffMembers.institutionalAccountId is now nullable.");
    }

    console.log(
      "[0087] Done. Existing rows are unaffected -- this only allows new self-service rows to have institutionalAccountId = NULL going forward."
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0087] Fatal error:", err);
  process.exit(1);
});
