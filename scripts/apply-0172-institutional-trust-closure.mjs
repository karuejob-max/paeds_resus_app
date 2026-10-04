import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = await createMysqlConnection(databaseUrl, mysql);
try {
  console.log("[0172] Applying institutional trust-closure schema...");
  await db.query(`CREATE TABLE IF NOT EXISTS institutionalQiReportEvents (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    institutionalAccountId INT NOT NULL,
    reportId INT NOT NULL,
    fromStatus VARCHAR(32) NULL,
    toStatus VARCHAR(32) NOT NULL,
    actorUserId INT NOT NULL,
    actorRole VARCHAR(64) NULL,
    reason TEXT NOT NULL,
    occurredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX institutionalQiReportEvents_report_occurred_idx (reportId, occurredAt),
    INDEX institutionalQiReportEvents_institution_occurred_idx (institutionalAccountId, occurredAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS institutionalCommercialContracts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    institutionalAccountId INT NOT NULL,
    productKey VARCHAR(64) NOT NULL,
    contractNumber VARCHAR(64) NOT NULL,
    pricingTier VARCHAR(32) NOT NULL,
    facilityLevel VARCHAR(32) NULL,
    verifiedStaffCount INT NULL,
    termYears INT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    amountCents INT NOT NULL,
    fxRateKesPerUsd DECIMAL(14,6) NULL,
    dataSharingStatus VARCHAR(32) NOT NULL,
    status ENUM('draft','approved','expired','cancelled') NOT NULL DEFAULT 'draft',
    approvedByUserId INT NULL,
    approvedAt TIMESTAMP NULL,
    startsAt TIMESTAMP NULL,
    endsAt TIMESTAMP NULL,
    notes TEXT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY institutionalCommercialContracts_number_uq (contractNumber),
    INDEX institutionalCommercialContracts_institution_status_idx (institutionalAccountId, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [invoiceColumns] = await db.query(`SHOW COLUMNS FROM institutionalSubscriptionInvoices`);
  if (!invoiceColumns.some((column) => column.Field === "commercialContractId")) {
    await db.query(`ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN commercialContractId INT NULL AFTER subscriptionId`);
  }

  await db.query(`ALTER TABLE institutionalSubscriptionInvoices MODIFY COLUMN status ENUM('draft','issued','payment_pending','payment_received','settlement_confirmed','reconciled','paid','disputed','refunded','void','overdue','cancelled') NOT NULL DEFAULT 'draft'`);
  await db.query(`ALTER TABLE institutionalPaymentAttempts MODIFY COLUMN status ENUM('created','pending','succeeded','settled','failed','refunded','disputed') NOT NULL DEFAULT 'created'`);
  console.log("[0172] Institutional trust-closure schema is ready.");
} finally {
  await db.end();
}
