/**
 * Migration 0146 — governed NERP nurse promotion campaign delivery.
 * Reservation: migration-reserved-0146
 *
 * Additive and idempotent. It does not send email or create campaign records.
 * The sender remains disabled until an admin approves a recipient snapshot and
 * confirms the exact send phrase.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0146] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0146] Preparing governed NERP campaign schema...");

    await conn.query(`
      ALTER TABLE \`nerp_campaign_suppressions\`
      MODIFY COLUMN \`reason_code\`
      ENUM('admin_nurse','external_completion','manual','not_registered','identity_correction','unsubscribe','hard_bounce')
      NOT NULL
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_promotion_campaigns\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`institutional_account_id\` INT NOT NULL,
        \`campaign_key\` VARCHAR(96) NOT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`body_text\` TEXT NOT NULL,
        \`template_version\` VARCHAR(64) NOT NULL,
        \`status\` ENUM('draft','approved','sending','sent','failed') NOT NULL DEFAULT 'draft',
        \`audience_count\` INT NOT NULL DEFAULT 0,
        \`sent_count\` INT NOT NULL DEFAULT 0,
        \`failed_count\` INT NOT NULL DEFAULT 0,
        \`approved_by_user_id\` INT NULL,
        \`approved_at\` TIMESTAMP NULL,
        \`started_at\` TIMESTAMP NULL,
        \`completed_at\` TIMESTAMP NULL,
        \`created_by_user_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`nerp_promotion_campaigns_campaign_key_uq\` (\`campaign_key\`),
        KEY \`nerp_promotion_campaigns_institution_status_idx\` (\`institutional_account_id\`, \`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_promotion_recipients\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`campaign_id\` INT NOT NULL,
        \`staff_id\` INT NOT NULL,
        \`user_id\` INT NULL,
        \`email\` VARCHAR(320) NOT NULL,
        \`display_name\` VARCHAR(255) NOT NULL,
        \`department\` VARCHAR(255) NULL,
        \`status\` ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
        \`skip_reason\` VARCHAR(255) NULL,
        \`provider_message_id\` VARCHAR(255) NULL,
        \`provider_error\` TEXT NULL,
        \`attempted_at\` TIMESTAMP NULL,
        \`sent_at\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`nerp_promotion_recipients_campaign_email_uq\` (\`campaign_id\`, \`email\`),
        KEY \`nerp_promotion_recipients_campaign_status_idx\` (\`campaign_id\`, \`status\`),
        KEY \`nerp_promotion_recipients_email_idx\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_promotion_audit_events\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`campaign_id\` INT NULL,
        \`recipient_id\` INT NULL,
        \`action\` VARCHAR(96) NOT NULL,
        \`actor_user_id\` INT NULL,
        \`details\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`nerp_promotion_audit_campaign_created_idx\` (\`campaign_id\`, \`created_at\`),
        KEY \`nerp_promotion_audit_recipient_created_idx\` (\`recipient_id\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[0146] Governed NERP campaign schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0146] Fatal error:", error);
  process.exit(1);
});
