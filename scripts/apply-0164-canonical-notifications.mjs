#!/usr/bin/env node
/**
 * Migration 0164 — canonical durable notification metadata and lifecycle.
 * Safe to run repeatedly during rolling deploys.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0164] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function indexExists(conn, tableName, indexName) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName],
  );
  return rows.length > 0;
}

async function addColumn(conn, name, definition) {
  if (!(await columnExists(conn, "inAppNotifications", name))) {
    await conn.query(`ALTER TABLE inAppNotifications ADD COLUMN \`${name}\` ${definition}`);
    console.log(`[0164] Added inAppNotifications.${name}`);
  }
}

async function addPreferenceColumn(conn, name, definition) {
  if (!(await columnExists(conn, "userNotificationPreferences", name))) {
    await conn.query(`ALTER TABLE userNotificationPreferences ADD COLUMN \`${name}\` ${definition}`);
    console.log(`[0164] Added userNotificationPreferences.${name}`);
  }
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await addColumn(conn, "domain", "VARCHAR(32) NULL");
    await addColumn(conn, "severity", "VARCHAR(32) NULL");
    await addColumn(conn, "requiresAction", "BOOLEAN NOT NULL DEFAULT FALSE");
    await addColumn(conn, "dataJson", "TEXT NULL");
    await addColumn(conn, "dedupeKey", "VARCHAR(255) NULL");
    await addColumn(conn, "readAt", "TIMESTAMP NULL");
    await addColumn(conn, "dismissedAt", "TIMESTAMP NULL");
    await addColumn(conn, "expiresAt", "TIMESTAMP NULL");
    await addPreferenceColumn(conn, "roleNotifications", "BOOLEAN NOT NULL DEFAULT TRUE");
    await addPreferenceColumn(conn, "clinicalAlerts", "BOOLEAN NOT NULL DEFAULT TRUE");

    if (!(await indexExists(conn, "inAppNotifications", "inapp_user_unread_created_idx"))) {
      await conn.query(
        "CREATE INDEX inapp_user_unread_created_idx ON inAppNotifications (userId, read, dismissedAt, createdAt)",
      );
    }
    if (!(await indexExists(conn, "inAppNotifications", "inapp_user_dedupe_idx"))) {
      await conn.query(
        "CREATE INDEX inapp_user_dedupe_idx ON inAppNotifications (userId, dedupeKey)",
      );
    }

    await conn.query(
      "UPDATE inAppNotifications SET domain = CASE WHEN type LIKE 'iers_%' OR type LIKE '%care_signal%' THEN 'clinical' WHEN type LIKE 'institution%' OR type LIKE '%role%' THEN 'role' WHEN type LIKE '%payment%' OR type LIKE '%renewal%' THEN 'finance' WHEN type LIKE '%course%' OR type LIKE '%quiz%' OR type LIKE '%certificate%' THEN 'learning' ELSE 'system' END WHERE domain IS NULL",
    );
    await conn.query(
      "UPDATE inAppNotifications SET severity = CASE WHEN type LIKE 'iers_%' THEN 'urgent' WHEN type LIKE '%role%' OR type LIKE '%deadline%' OR type LIKE '%renewal%' THEN 'action_required' ELSE 'info' END WHERE severity IS NULL",
    );
    await conn.query(
      "UPDATE inAppNotifications SET requiresAction = TRUE WHERE requiresAction = FALSE AND (type LIKE '%role%' OR type LIKE '%deadline%' OR type LIKE '%renewal%' OR type LIKE 'iers_%')",
    );
    await conn.query(
      "UPDATE inAppNotifications SET readAt = createdAt WHERE read = TRUE AND readAt IS NULL",
    );
    console.log("[0164] Canonical notification migration applied successfully.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0164] Fatal error:", error);
  process.exit(1);
});
