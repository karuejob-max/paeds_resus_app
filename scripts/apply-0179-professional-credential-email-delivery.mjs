import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  console.log("[0179] Preparing professional credential email delivery ledger...");
  await db.query(`
    CREATE TABLE IF NOT EXISTS professionalCredentialEmailDeliveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      credentialId INT NOT NULL,
      userId INT NOT NULL,
      recipientEmail VARCHAR(320) NOT NULL,
      emailType ENUM('review_decision','expiry_reminder') NOT NULL,
      decision VARCHAR(32) NULL,
      provider VARCHAR(32) NOT NULL DEFAULT 'ses',
      providerMessageId VARCHAR(255) NULL,
      deliveryStatus ENUM('queued','accepted','delivered','bounced','complained','rejected','delayed','failed','unknown') NOT NULL DEFAULT 'queued',
      providerEventType VARCHAR(64) NULL,
      providerEventAt TIMESTAMP NULL,
      errorMessage TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY professional_credential_email_message_idx (providerMessageId),
      KEY professional_credential_email_credential_idx (credentialId, createdAt),
      KEY professional_credential_email_user_idx (userId, createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0179] Professional credential email delivery ledger is ready.");
} finally {
  await db.end();
}
