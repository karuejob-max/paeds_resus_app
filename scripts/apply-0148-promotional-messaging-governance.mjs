/**
 * Additive, idempotent production migration for governed promotional messaging.
 * This migration creates preference, suppression, campaign snapshot, and audit
 * tables only. It does not create campaigns, recipients, or send email.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0148] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0148] Preparing promotional messaging governance schema...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotional_message_preferences (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        consent_status ENUM('unknown','opted_in','opted_out') NOT NULL DEFAULT 'unknown',
        consent_source VARCHAR(128) NULL,
        consented_at TIMESTAMP NULL,
        opted_out_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY promotional_message_preferences_user_uq (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotional_message_suppressions (
        id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(320) NOT NULL,
        reason ENUM('unsubscribe','hard_bounce','manual') NOT NULL,
        note TEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by_user_id INT NULL,
        updated_by_user_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deactivated_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        UNIQUE KEY promotional_message_suppressions_email_uq (email),
        KEY promotional_message_suppressions_active_idx (is_active, email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotional_campaigns (
        id INT NOT NULL AUTO_INCREMENT,
        campaign_key VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body_text TEXT NOT NULL,
        audience_filter_json TEXT NOT NULL,
        consent_policy ENUM('opt_in','opt_out') NOT NULL DEFAULT 'opt_in',
        template_version VARCHAR(64) NOT NULL,
        status ENUM('draft','approved','sending','sent','failed','paused') NOT NULL DEFAULT 'draft',
        audience_count INT NOT NULL DEFAULT 0,
        sent_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        skipped_count INT NOT NULL DEFAULT 0,
        created_by_user_id INT NOT NULL,
        approved_by_user_id INT NULL,
        approved_at TIMESTAMP NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY promotional_campaigns_campaign_key_uq (campaign_key),
        KEY promotional_campaigns_status_idx (status, updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotional_campaign_recipients (
        id INT NOT NULL AUTO_INCREMENT,
        campaign_id INT NOT NULL,
        user_id INT NOT NULL,
        email VARCHAR(320) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        cadre VARCHAR(128) NULL,
        department VARCHAR(255) NULL,
        consent_status ENUM('unknown','opted_in','opted_out') NOT NULL DEFAULT 'unknown',
        status ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
        skip_reason VARCHAR(255) NULL,
        provider_message_id VARCHAR(255) NULL,
        provider_error TEXT NULL,
        attempted_at TIMESTAMP NULL,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY promotional_campaign_recipients_campaign_email_uq (campaign_id, email),
        KEY promotional_campaign_recipients_campaign_status_idx (campaign_id, status),
        KEY promotional_campaign_recipients_user_idx (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotional_campaign_audit_events (
        id INT NOT NULL AUTO_INCREMENT,
        campaign_id INT NULL,
        recipient_id INT NULL,
        action VARCHAR(96) NOT NULL,
        actor_user_id INT NULL,
        details TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY promotional_campaign_audit_campaign_created_idx (campaign_id, created_at),
        KEY promotional_campaign_audit_recipient_created_idx (recipient_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS promotional_preference_audit_events (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        previous_status ENUM('unknown','opted_in','opted_out') NULL,
        next_status ENUM('unknown','opted_in','opted_out') NOT NULL,
        source VARCHAR(128) NULL,
        actor_user_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY promotional_preference_audit_user_created_idx (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[0148] Promotional messaging governance schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0148] Fatal error:", error);
  process.exit(1);
});
