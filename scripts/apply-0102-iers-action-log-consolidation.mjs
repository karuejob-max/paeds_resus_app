#!/usr/bin/env node
/**
 * Migration 0102 — consolidate legacy institutional QI action logs into the
 * canonical IERS action queue while retaining the legacy source record.
 *
 * Run: pnpm run db:apply-0102
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0102] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0102] Adding legacy action provenance to canonical IERS actions...");
    try {
      await conn.query("ALTER TABLE `iers_action_items` ADD COLUMN `legacy_action_log_id` INT NULL UNIQUE");
    } catch (error) {
      if (!/duplicate column|already exists|ER_DUP_FIELDNAME/i.test(error?.message ?? "")) throw error;
      console.log("[0102] legacy_action_log_id already exists; continuing.");
    }

    await conn.query(`
      UPDATE iers_action_items i
      INNER JOIN institutionalActionLogs l
        ON i.institution_id = l.institutionalAccountId
       AND i.source_type = 'manual'
       AND i.source_id = l.id
       AND i.legacy_action_log_id IS NULL
      SET i.legacy_action_log_id = l.id
      WHERE i.title = LEFT(l.gapIdentified, 255);
    `);

    await conn.query(`
      INSERT INTO iers_action_items
        (institution_id, source_type, source_id, legacy_action_log_id, title, gap_description, owner_user_id, priority, status, closure_note, created_by_user_id, created_at, updated_at)
      SELECT
        l.institutionalAccountId,
        CASE WHEN l.careSignalEventId IS NOT NULL THEN 'care_signal'
             WHEN l.codeSignalEventId IS NOT NULL THEN 'code_signal'
             ELSE 'manual' END,
        COALESCE(l.careSignalEventId, l.codeSignalEventId, l.id),
        l.id,
        LEFT(l.gapIdentified, 255),
        CONCAT(l.gapIdentified, '\\n\\nSystem change: ', l.systemChange, CASE WHEN l.notes IS NULL OR l.notes = '' THEN '' ELSE CONCAT('\\n\\nNotes: ', l.notes) END),
        NULL,
        'medium',
        CASE WHEN l.status = 'completed' THEN 'awaiting_verification' ELSE l.status END,
        CASE WHEN l.status = 'completed' THEN l.systemChange ELSE NULL END,
        COALESCE(l.createdByUserId, (SELECT MIN(id) FROM users)),
        l.createdAt,
        l.updatedAt
      FROM institutionalActionLogs l
      WHERE COALESCE(l.createdByUserId, (SELECT MIN(id) FROM users)) IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM iers_action_items existing
          WHERE existing.legacy_action_log_id = l.id
             OR (
               existing.institution_id = l.institutionalAccountId
               AND existing.title = LEFT(l.gapIdentified, 255)
               AND existing.source_id = COALESCE(l.careSignalEventId, l.codeSignalEventId, l.id)
             )
        );
    `);

    const [rows] = await conn.query("SELECT COUNT(*) AS linkedActionCount FROM iers_action_items WHERE legacy_action_log_id IS NOT NULL");
    console.log(`[0102] Ready. Canonical actions linked to legacy QI logs: ${rows[0]?.linkedActionCount ?? 0}`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0102] Fatal error:", error);
  process.exit(1);
});
