/**
 * Idempotent: Fellowship grandfathering columns on enrollments (migration 0079).
 *
 * North Star v2.1 addendum §6 / CEO decision 2026-07-29: a lead_instructor
 * can mark a course as fully meeting its Fellowship requirement for a
 * learner who completed physical, in-person training before the online
 * Phase 2 simulation model existed.
 *
 * Adds:
 *   - enrollments.fellowshipGrandfathered (BOOLEAN, default false)
 *   - enrollments.fellowshipGrandfatheredAt (TIMESTAMP, nullable)
 *   - enrollments.fellowshipGrandfatheredByUserId (INT, nullable)
 *   - enrollments.fellowshipGrandfatheredByName (VARCHAR(255), nullable)
 *
 *   pnpm run db:apply-0079
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

  console.log("[0079] Connecting to database...");
  const conn = await createMysqlConnection(databaseUrl, mysql);

  if (!(await tableExists(conn, "enrollments"))) {
    console.error("[0079] enrollments table missing — run earlier migrations first.");
    process.exit(1);
  }

  if (await columnExists(conn, "enrollments", "fellowshipGrandfathered")) {
    console.log("[0079] column enrollments.fellowshipGrandfathered already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`enrollments\`
       ADD COLUMN \`fellowshipGrandfathered\` boolean NOT NULL DEFAULT false`
    );
    console.log("[0079] added column enrollments.fellowshipGrandfathered.");
  }

  if (await columnExists(conn, "enrollments", "fellowshipGrandfatheredAt")) {
    console.log("[0079] column enrollments.fellowshipGrandfatheredAt already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`enrollments\`
       ADD COLUMN \`fellowshipGrandfatheredAt\` timestamp NULL DEFAULT NULL`
    );
    console.log("[0079] added column enrollments.fellowshipGrandfatheredAt.");
  }

  if (await columnExists(conn, "enrollments", "fellowshipGrandfatheredByUserId")) {
    console.log("[0079] column enrollments.fellowshipGrandfatheredByUserId already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`enrollments\`
       ADD COLUMN \`fellowshipGrandfatheredByUserId\` int NULL DEFAULT NULL`
    );
    console.log("[0079] added column enrollments.fellowshipGrandfatheredByUserId.");
  }

  if (await columnExists(conn, "enrollments", "fellowshipGrandfatheredByName")) {
    console.log("[0079] column enrollments.fellowshipGrandfatheredByName already exists — skip.");
  } else {
    await conn.query(
      `ALTER TABLE \`enrollments\`
       ADD COLUMN \`fellowshipGrandfatheredByName\` varchar(255) NULL DEFAULT NULL`
    );
    console.log("[0079] added column enrollments.fellowshipGrandfatheredByName.");
  }

  console.log("[0079] Fellowship grandfathering migration completed.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
