/**
 * Migration 0122 — IERS activation case link, responder receipt, resources, and arrivals.
 *
 * Run: pnpm run db:apply-0122
 *
 * This migration does not create staffing, activation, readiness, drill, or patient
 * records. It only extends the operational data model used when a real activation
 * is explicitly created by an authorized provider or institution operator.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0122] DATABASE_URL is required.");
  process.exit(1);
}

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT 1 AS present
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1`,
    [tableName, columnName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (await columnExists(conn, tableName, columnName)) {
    console.log(`[0122] ${tableName}.${columnName} already exists — skipping.`);
    return;
  }
  await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  console.log(`[0122] Added ${tableName}.${columnName}.`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0122] Preparing activation case-link schema...");

    const activationColumns = [
      ["teamId", "INT NULL"],
      ["teamVersion", "INT NULL"],
      ["poleId", "INT NULL"],
      ["bedNumber", "VARCHAR(64) NULL"],
      ["caseQrNonce", "VARCHAR(128) NULL"],
      ["caseQrGeneratedByUserId", "INT NULL"],
      ["caseQrGeneratedAt", "TIMESTAMP NULL"],
    ];
    for (const [columnName, definition] of activationColumns) {
      await addColumnIfMissing(conn, "iersActivationEvents", columnName, definition);
    }

    await addColumnIfMissing(conn, "iersActivationResponders", "receivedAt", "TIMESTAMP NULL");
    await addColumnIfMissing(conn, "iersActivationResponders", "caseJoinedAt", "TIMESTAMP NULL");
    await addColumnIfMissing(
      conn,
      "iersActivationResponders",
      "caseJoinMethod",
      "ENUM('activation_assignment','qr_scan') NULL DEFAULT 'activation_assignment'",
    );
    await conn.query(`
      ALTER TABLE iersActivationResponders
      MODIFY COLUMN notificationStatus
        ENUM('pending','sent','delivered','failed','received','acknowledged','declined','timed_out')
        NOT NULL DEFAULT 'pending'
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_activation_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activation_event_id INT NOT NULL,
        institution_id INT NOT NULL,
        label VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        source_type ENUM('readiness_gap','manual') NOT NULL DEFAULT 'manual',
        source_readiness_item_id INT NULL,
        status ENUM('needed','claimed','in_transit','arrived','unavailable','replaced') NOT NULL DEFAULT 'needed',
        claimed_by_user_id INT NULL,
        claimed_at TIMESTAMP NULL,
        arrived_at TIMESTAMP NULL,
        arrival_recorded_by_user_id INT NULL,
        note VARCHAR(1000) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY iers_activation_resources_activation_status_idx (activation_event_id, status),
        KEY iers_activation_resources_institution_idx (institution_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_activation_arrivals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activation_event_id INT NOT NULL,
        institution_id INT NOT NULL,
        team_id INT NULL,
        role_snapshot_id INT NULL,
        provider_user_id INT NOT NULL,
        role_key VARCHAR(64) NULL,
        arrival_type ENUM('self','witnessed','qr_scan') NOT NULL,
        recorded_by_user_id INT NOT NULL,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        note VARCHAR(1000) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY iers_activation_arrivals_activation_time_idx (activation_event_id, occurred_at),
        KEY iers_activation_arrivals_provider_idx (provider_user_id, occurred_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[0122] Activation case-link schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0122] Fatal error:", error);
  process.exit(1);
});
