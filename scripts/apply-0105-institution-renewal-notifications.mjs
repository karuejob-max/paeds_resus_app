#!/usr/bin/env node
/**
 * Migration 0105 — institutional payment linkage and renewal notifications.
 * External payment callbacks may safely call the idempotent confirmation path
 * after this schema is deployed; no payment secret is stored in these tables.
 *
 * Run: pnpm run db:apply-0105
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0105] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0105] Creating institutional renewal and payment-linkage tables...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionSubscriptionPayments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        productId INT NOT NULL,
        subscriptionId INT NULL,
        paymentMethod ENUM('mpesa', 'bank_transfer', 'card') NOT NULL,
        amountCents INT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'KES',
        paymentReference VARCHAR(255) NOT NULL,
        idempotencyKey VARCHAR(255) NOT NULL,
        status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'completed',
        receivedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        metadata JSON NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY inst_sub_pay_idem_uq (idempotencyKey),
        UNIQUE KEY inst_sub_pay_ref_uq (paymentReference),
        KEY inst_sub_pay_prod_idx (institutionalAccountId, productId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionRenewalNotificationPreferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        productKey VARCHAR(64) NOT NULL,
        inAppEnabled BOOLEAN NOT NULL DEFAULT TRUE,
        emailEnabled BOOLEAN NOT NULL DEFAULT FALSE,
        smsEnabled BOOLEAN NOT NULL DEFAULT FALSE,
        reminderDays VARCHAR(64) NOT NULL DEFAULT '30,14,7,0',
        updatedByUserId INT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY inst_renew_pref_inst_prod_uq (institutionalAccountId, productKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionRenewalNotifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        productId INT NOT NULL,
        subscriptionId INT NULL,
        recipientUserId INT NOT NULL,
        notificationType ENUM('renewal_30d', 'renewal_14d', 'renewal_7d', 'renewal_due', 'past_due', 'grace_started', 'expired') NOT NULL,
        channel ENUM('in_app', 'email', 'sms') NOT NULL DEFAULT 'in_app',
        status ENUM('queued', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
        dedupeKey VARCHAR(255) NOT NULL,
        title VARCHAR(256) NOT NULL,
        body TEXT NOT NULL,
        actionUrl VARCHAR(512) NULL,
        scheduledFor TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sentAt TIMESTAMP NULL,
        failureReason TEXT NULL,
        attempts INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY inst_renew_notif_dedupe_uq (dedupeKey),
        KEY inst_renew_notif_status_idx (institutionalAccountId, status),
        KEY inst_renew_notif_sched_idx (status, scheduledFor)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query(`
      INSERT IGNORE INTO institutionRenewalNotificationPreferences (institutionalAccountId, productKey)
      SELECT id, productKey
      FROM institutionalAccounts
      CROSS JOIN (SELECT 'iers' AS productKey UNION ALL SELECT 'cpd_portal' AS productKey) products;
    `);
    const [payments] = await conn.query("SELECT COUNT(*) AS paymentCount FROM institutionSubscriptionPayments");
    const [preferences] = await conn.query("SELECT COUNT(*) AS preferenceCount FROM institutionRenewalNotificationPreferences");
    console.log(`[0105] Ready. Payments: ${payments[0]?.paymentCount ?? 0}; notification preferences: ${preferences[0]?.preferenceCount ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0105] Fatal error:", error);
  process.exit(1);
});
