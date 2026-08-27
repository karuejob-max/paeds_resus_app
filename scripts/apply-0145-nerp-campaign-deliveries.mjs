/**
 * Migration 0145 — recipient-level NERP campaign delivery audit.
 * Reservation: migration-reserved-0145
 *
 * Additive and idempotent. Stores delivery status and SES message IDs while
 * preventing the same recipient from being sent twice for one campaign key.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0145] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0145] Preparing NERP campaign delivery audit...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_campaign_deliveries\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`campaign_key\` VARCHAR(128) NOT NULL,
        \`institutional_account_id\` INT NOT NULL,
        \`staff_id\` INT NULL,
        \`user_id\` INT NULL,
        \`recipient_name\` VARCHAR(255) NOT NULL,
        \`recipient_email\` VARCHAR(320) NOT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`status\` ENUM('sending','sent','failed','suppressed') NOT NULL,
        \`message_id\` VARCHAR(255) NULL,
        \`error_message\` VARCHAR(1000) NULL,
        \`sent_by_user_id\` INT NOT NULL,
        \`sent_at\` DATETIME NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`nerp_campaign_deliveries_campaign_recipient_uq\` (\`campaign_key\`, \`recipient_email\`),
        KEY \`nerp_campaign_deliveries_campaign_status_idx\` (\`campaign_key\`, \`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[0145] NERP campaign delivery audit is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0145] Fatal error:", error);
  process.exit(1);
});
