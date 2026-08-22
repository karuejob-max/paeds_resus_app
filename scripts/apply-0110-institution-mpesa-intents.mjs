#!/usr/bin/env node
/**
 * Migration 0110 — institutional M-Pesa checkout intents.
 * Keeps checkout-request reconciliation separate from course-enrollment payments.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0110] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1 AS present FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    if (await tableExists(conn, "institutionSubscriptionPaymentIntents")) {
      console.log("[0110] institutionSubscriptionPaymentIntents already exists.");
    } else {
      await conn.query(`
        CREATE TABLE institutionSubscriptionPaymentIntents (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          institutionalAccountId INT NOT NULL,
          productId INT NOT NULL,
          planId INT NULL,
          renewsAt TIMESTAMP NOT NULL,
          expiresAt TIMESTAMP NULL,
          amountCents INT NOT NULL,
          phoneNumber VARCHAR(20) NOT NULL,
          accountReference VARCHAR(40) NOT NULL,
          checkoutRequestId VARCHAR(255) NOT NULL,
          merchantRequestId VARCHAR(255) NULL,
          idempotencyKey VARCHAR(255) NOT NULL,
          mpesaReceiptNumber VARCHAR(50) NULL,
          status ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
          resultCode INT NULL,
          failureReason TEXT NULL,
          createdByUserId INT NOT NULL,
          receivedAt TIMESTAMP NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY inst_sub_intent_checkout_uq (checkoutRequestId),
          UNIQUE KEY inst_sub_intent_idem_uq (idempotencyKey),
          UNIQUE KEY inst_sub_intent_receipt_uq (mpesaReceiptNumber),
          KEY inst_sub_intent_status_idx (institutionalAccountId, status)
        ) ENGINE=InnoDB;
      `);
      console.log("[0110] Created institutionSubscriptionPaymentIntents.");
    }
    const [rows] = await conn.query(`SELECT COUNT(*) AS intentCount FROM institutionSubscriptionPaymentIntents`);
    console.log(`[0110] Ready. Existing institutional payment intents: ${rows[0]?.intentCount ?? 0}.`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0110] Fatal error:", error);
  process.exit(1);
});
