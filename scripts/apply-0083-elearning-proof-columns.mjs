/**
 * Idempotent: migration 0083 -- per-course elearning.heart.org proof
 * columns on `enrollments`. Implements docs/IERP_NERP_PROGRAM_V2_SPEC.md
 * §3 (CEO respec, 2026-07-31): a learner uploads two distinct documents
 * per course (Video Prework Completion Certificate + Precourse
 * Self-Assessment Certificate, with a pass/fail result), not one combined
 * proof URL. `ahaCertificateUrl`/`ahaPrecourseCompleted` (added earlier,
 * never wired to anything) are left in place but superseded -- see the
 * schema.ts comment.
 *
 * NOTE ON COLUMN NAMES: copied directly from drizzle/schema.ts's literal
 * strings inside the column-builder calls, not inferred from the JS
 * property names -- per the migration-0064 lesson in AGENTS.md.
 *
 * Run: pnpm run db:apply-0083
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

async function addColumnIfMissing(conn, table, column, ddl, label) {
  if (await columnExists(conn, table, column)) {
    console.log(`[0083]   \u2713 ${table}.${column} already exists -- skipping.`);
  } else {
    await conn.query(ddl);
    console.log(`[0083]   + Added ${table}.${column}.${label ? ` (${label})` : ""}`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0083] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0083] Running per-course elearning.heart.org proof columns migration...");

    await addColumnIfMissing(
      conn,
      "enrollments",
      "videoPreworkCertificateUrl",
      "ALTER TABLE `enrollments` ADD COLUMN `videoPreworkCertificateUrl` TEXT NULL AFTER `fellowshipGrandfatheredByName`"
    );
    await addColumnIfMissing(
      conn,
      "enrollments",
      "precourseAssessmentCertificateUrl",
      "ALTER TABLE `enrollments` ADD COLUMN `precourseAssessmentCertificateUrl` TEXT NULL AFTER `videoPreworkCertificateUrl`"
    );
    await addColumnIfMissing(
      conn,
      "enrollments",
      "precourseAssessmentPassed",
      "ALTER TABLE `enrollments` ADD COLUMN `precourseAssessmentPassed` BOOLEAN NULL DEFAULT false AFTER `precourseAssessmentCertificateUrl`"
    );
    await addColumnIfMissing(
      conn,
      "enrollments",
      "elearningProofSubmittedAt",
      "ALTER TABLE `enrollments` ADD COLUMN `elearningProofSubmittedAt` TIMESTAMP NULL AFTER `precourseAssessmentPassed`"
    );
    await addColumnIfMissing(
      conn,
      "enrollments",
      "elearningProofVerifiedAt",
      "ALTER TABLE `enrollments` ADD COLUMN `elearningProofVerifiedAt` TIMESTAMP NULL AFTER `elearningProofSubmittedAt`"
    );

    console.log(
      "[0083] Done. All five columns are nullable/defaulted -- existing enrollment rows are unaffected, nothing gets locked out by this migration itself."
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0083] Fatal error:", err);
  process.exit(1);
});
