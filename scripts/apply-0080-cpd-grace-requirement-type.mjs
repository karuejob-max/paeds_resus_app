/**
 * Idempotent: fellowshipGraceUsage.requirementType column (migration 0080).
 *
 * North Star v2.1 addendum §3 / CEO decision 2026-07-29: CPD joins Pillar C
 * alongside Care Signal, mirroring Care Signal's existing grace model as a
 * template -- but with its OWN independent grace budget (up to 2 per
 * calendar year), not a shared pool. Without a discriminator column, a
 * future CPD grace row would be indistinguishable from a Care Signal grace
 * row and would silently count toward both.
 *
 * Adds:
 *   - fellowshipGraceUsage.requirementType (ENUM('care_signal','cpd'),
 *     NOT NULL, default 'care_signal' -- every row before this column
 *     existed was implicitly Care Signal grace, so the default correctly
 *     backfills existing data with no manual intervention needed)
 *
 *   pnpm run db:apply-0080
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

  console.log("[0080] Connecting to database...");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  if (!(await tableExists(conn, "fellowshipGraceUsage"))) {
    console.error("[0080] fellowshipGraceUsage table missing — run earlier migrations first.");
    process.exit(1);
  }

  if (await columnExists(conn, "fellowshipGraceUsage", "requirementType")) {
    console.log("[0080] column fellowshipGraceUsage.requirementType already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`fellowshipGraceUsage\`
       ADD COLUMN \`requirementType\` ENUM('care_signal','cpd') NOT NULL DEFAULT 'care_signal'`
    );
    console.log(
      "[0080] added column fellowshipGraceUsage.requirementType (all existing rows backfilled to 'care_signal')."
    );
  }

  console.log("[0080] CPD grace-tracking migration completed.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
