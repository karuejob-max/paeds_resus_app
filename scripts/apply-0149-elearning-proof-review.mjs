/*
 * Idempotent migration 0149 -- reviewer rejection state for AHA eLearning proof.
 *
 * Run: pnpm run db:apply-0149
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

async function addColumnIfMissing(conn, column, ddl) {
  if (await columnExists(conn, "enrollments", column)) {
    console.log(`[0149]   ✓ enrollments.${column} already exists -- skipping.`);
    return;
  }
  await conn.query(ddl);
  console.log(`[0149]   + Added enrollments.${column}`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0149] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0149] Adding AHA eLearning proof rejection fields...");
    await addColumnIfMissing(
      conn,
      "elearningProofRejectedAt",
      "ALTER TABLE `enrollments` ADD COLUMN `elearningProofRejectedAt` TIMESTAMP NULL AFTER `elearningProofVerifiedAt`"
    );
    await addColumnIfMissing(
      conn,
      "elearningProofRejectionReason",
      "ALTER TABLE `enrollments` ADD COLUMN `elearningProofRejectionReason` TEXT NULL AFTER `elearningProofRejectedAt`"
    );
    console.log("[0149] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0149] Fatal error:", error);
  process.exit(1);
});
