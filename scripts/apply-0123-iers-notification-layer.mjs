/**
 * Migration 0123 — IERS browser notification subscriptions and push delivery evidence.
 *
 * Run: pnpm run db:apply-0123
 *
 * This migration stores only browser delivery credentials and operational
 * delivery status. It does not create activation, staffing, patient, or report
 * records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0123] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0123] Preparing IERS notification schema...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endpoint_hash VARCHAR(64) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(512) NOT NULL,
        auth VARCHAR(256) NOT NULL,
        user_agent VARCHAR(512) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY iers_push_subscriptions_endpoint_hash_unique (endpoint_hash),
        KEY iers_push_subscriptions_user_active_idx (user_id, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_push_delivery_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        delivery_key VARCHAR(191) NOT NULL,
        activation_event_id INT NOT NULL,
        user_id INT NOT NULL,
        subscription_id INT NOT NULL,
        status ENUM('pending','sent','failed','expired') NOT NULL DEFAULT 'pending',
        error_message VARCHAR(500) NULL,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY iers_push_delivery_log_key_unique (delivery_key),
        KEY iers_push_delivery_log_activation_idx (activation_event_id, status),
        KEY iers_push_delivery_log_subscription_idx (subscription_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[0123] IERS notification schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0123] Fatal error:", error);
  process.exit(1);
});
