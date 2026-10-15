#!/usr/bin/env node
/**
 * Migration 0180 — canonical inbox task lifecycle and institution scope.
 * Safe to run repeatedly during rolling deploys.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0180] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function indexExists(conn, tableName, indexName) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return rows.length > 0;
}

async function addColumn(conn, name, definition) {
  if (!(await columnExists(conn, "inAppNotifications", name))) {
    await conn.query(
      `ALTER TABLE inAppNotifications ADD COLUMN \`${name}\` ${definition}`
    );
    console.log(`[0180] Added inAppNotifications.${name}`);
  }
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await addColumn(
      conn,
      "taskStatus",
      "ENUM('open','in_progress','waiting','completed') NOT NULL DEFAULT 'open'"
    );
    await addColumn(conn, "institutionId", "INT NULL");
    await addColumn(conn, "departmentId", "INT NULL");
    await addColumn(conn, "dueAt", "TIMESTAMP NULL");
    await addColumn(conn, "acknowledgedAt", "TIMESTAMP NULL");

    if (
      !(await indexExists(
        conn,
        "inAppNotifications",
        "inapp_user_task_scope_idx"
      ))
    ) {
      await conn.query(
        "CREATE INDEX inapp_user_task_scope_idx ON inAppNotifications (userId, taskStatus, institutionId, departmentId, createdAt)"
      );
    }

    await conn.query(
      "UPDATE inAppNotifications SET taskStatus = CASE WHEN `read` = TRUE OR dismissedAt IS NOT NULL THEN 'completed' WHEN requiresAction = TRUE THEN 'open' ELSE 'completed' END WHERE taskStatus = 'open'"
    );
    await conn.query(
      "UPDATE inAppNotifications SET acknowledgedAt = readAt WHERE acknowledgedAt IS NULL AND readAt IS NOT NULL"
    );
    await conn.query(
      "UPDATE inAppNotifications SET institutionId = CAST(JSON_UNQUOTE(JSON_EXTRACT(dataJson, '$.institutionId')) AS UNSIGNED) WHERE institutionId IS NULL AND dataJson IS NOT NULL AND JSON_EXTRACT(dataJson, '$.institutionId') IS NOT NULL"
    );
    await conn.query(
      "UPDATE inAppNotifications SET departmentId = CAST(JSON_UNQUOTE(JSON_EXTRACT(dataJson, '$.departmentId')) AS UNSIGNED) WHERE departmentId IS NULL AND dataJson IS NOT NULL AND JSON_EXTRACT(dataJson, '$.departmentId') IS NOT NULL"
    );
    console.log(
      "[0180] Canonical notification task/scope migration applied successfully."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0180] Fatal error:", error);
  process.exit(1);
});
