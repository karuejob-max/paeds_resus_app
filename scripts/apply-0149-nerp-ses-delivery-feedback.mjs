/**
 * Additive, idempotent schema migration for NERP SES delivery feedback.
 * This migration only creates storage for future SES events; it does not send
 * email, change campaign recipients, or alter existing delivery records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0149] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0149] Preparing NERP SES delivery feedback schema...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS nerp_promotion_delivery_events (
        id INT NOT NULL AUTO_INCREMENT,
        provider_event_id VARCHAR(255) NOT NULL,
        provider_message_id VARCHAR(255) NOT NULL,
        event_type ENUM('send','delivery','bounce','complaint','reject','delivery_delay','subscription','rendering_failure','unknown') NOT NULL DEFAULT 'unknown',
        recipient_email VARCHAR(320) NULL,
        event_at TIMESTAMP NULL,
        event_json TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY nerp_delivery_events_provider_event_uq (provider_event_id),
        KEY nerp_delivery_events_message_idx (provider_message_id),
        KEY nerp_delivery_events_recipient_idx (recipient_email, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [columns] = await conn.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'nerp_promotion_recipients'
        AND COLUMN_NAME IN ('delivery_status', 'delivery_event_at', 'delivery_event_type')
    `);
    const existing = new Set(columns.map(row => row.COLUMN_NAME));
    if (!existing.has("delivery_status")) {
      await conn.query(`ALTER TABLE nerp_promotion_recipients ADD COLUMN delivery_status ENUM('unknown','delivered','bounced','complained','rejected','delayed','suppressed') NOT NULL DEFAULT 'unknown' AFTER status`);
    }
    if (!existing.has("delivery_event_at")) {
      await conn.query(`ALTER TABLE nerp_promotion_recipients ADD COLUMN delivery_event_at TIMESTAMP NULL AFTER delivery_status`);
    }
    if (!existing.has("delivery_event_type")) {
      await conn.query(`ALTER TABLE nerp_promotion_recipients ADD COLUMN delivery_event_type VARCHAR(64) NULL AFTER delivery_event_at`);
    }
    console.log("[0149] NERP SES delivery feedback schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0149] Fatal error:", error);
  process.exit(1);
});
