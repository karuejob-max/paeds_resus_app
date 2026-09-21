import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0157] DATABASE_URL is required.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);

async function ensureColumn(table, name, sql) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [name]);
  if (!rows.length) {
    await connection.query(sql);
    console.log(`[0157] Added ${table}.${name}`);
  }
}

async function ensureTable(name, sql) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [name]);
  if (!rows.length) {
    await connection.query(sql);
    console.log(`[0157] Created ${name}`);
  }
}

try {
  const invoiceColumns = [
    ["provider", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN provider varchar(64) NULL"],
    ["providerPaymentReference", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN providerPaymentReference varchar(255) NULL"],
    ["paymentMethod", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN paymentMethod enum('mpesa','bank_transfer','card') NULL"],
    ["paymentAttemptCount", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN paymentAttemptCount int NOT NULL DEFAULT 0"],
    ["lastPaymentAttemptAt", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN lastPaymentAttemptAt timestamp NULL"],
    ["settledAt", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN settledAt timestamp NULL"],
    ["reconciliationStatus", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN reconciliationStatus enum('unreconciled','matched','mismatch','refunded','disputed') NOT NULL DEFAULT 'unreconciled'"],
    ["reconciliationNote", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN reconciliationNote text NULL"],
    ["refundedAmountCents", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN refundedAmountCents int NOT NULL DEFAULT 0"],
    ["refundedAt", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN refundedAt timestamp NULL"],
    ["refundReason", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN refundReason text NULL"],
    ["voidedAt", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN voidedAt timestamp NULL"],
    ["voidReason", "ALTER TABLE institutionalSubscriptionInvoices ADD COLUMN voidReason text NULL"],
  ];
  for (const [name, sql] of invoiceColumns) await ensureColumn("institutionalSubscriptionInvoices", name, sql);

  const providerEventColumns = [
    ["signatureVerified", "ALTER TABLE institutionalPaymentProviderEvents ADD COLUMN signatureVerified boolean NOT NULL DEFAULT false"],
    ["signatureAlgorithm", "ALTER TABLE institutionalPaymentProviderEvents ADD COLUMN signatureAlgorithm varchar(32) NULL"],
    ["processingAttempts", "ALTER TABLE institutionalPaymentProviderEvents ADD COLUMN processingAttempts int NOT NULL DEFAULT 0"],
    ["lastAttemptAt", "ALTER TABLE institutionalPaymentProviderEvents ADD COLUMN lastAttemptAt timestamp NULL"],
  ];
  for (const [name, sql] of providerEventColumns) await ensureColumn("institutionalPaymentProviderEvents", name, sql);

  await ensureTable("institutionalQiExportRequests", `CREATE TABLE institutionalQiExportRequests (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    requestedByUserId int NOT NULL,
    format enum('json','csv') NOT NULL DEFAULT 'json',
    confidentialityScope enum('institution_only','aggregate_only') NOT NULL DEFAULT 'institution_only',
    status enum('requested','completed','failed','expired') NOT NULL DEFAULT 'requested',
    filters json NULL,
    rowCount int NOT NULL DEFAULT 0,
    expiresAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completedAt timestamp NULL,
    PRIMARY KEY (id),
    KEY institutionalQiExportRequests_institution_created_idx (institutionalAccountId, createdAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalQiRetentionPolicies", `CREATE TABLE institutionalQiRetentionPolicies (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    retentionDays int NOT NULL DEFAULT 2555,
    autoDeleteEnabled boolean NOT NULL DEFAULT false,
    approvedByUserId int NOT NULL,
    lastReviewedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY institutionalQiRetentionPolicies_institution_uq (institutionalAccountId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await ensureTable("institutionalPaymentAttempts", `CREATE TABLE institutionalPaymentAttempts (
    id int NOT NULL AUTO_INCREMENT,
    institutionalAccountId int NOT NULL,
    invoiceId int NOT NULL,
    provider varchar(64) NOT NULL,
    paymentMethod enum('mpesa','bank_transfer','card') NOT NULL,
    idempotencyKey varchar(255) NOT NULL,
    providerPaymentReference varchar(255) NULL,
    amountCents int NOT NULL,
    currency varchar(3) NOT NULL,
    status enum('created','pending','succeeded','failed','refunded','disputed') NOT NULL DEFAULT 'created',
    failureReason text NULL,
    reconciliationStatus enum('unreconciled','matched','mismatch','refunded','disputed') NOT NULL DEFAULT 'unreconciled',
    reconciliationNote text NULL,
    initiatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settledAt timestamp NULL,
    refundedAt timestamp NULL,
    metadata json NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY institutionalPaymentAttempts_idempotency_uq (idempotencyKey),
    KEY institutionalPaymentAttempts_invoice_idx (invoiceId),
    KEY institutionalPaymentAttempts_reconciliation_idx (reconciliationStatus, createdAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  console.log("[0157] Institutional payment operations schema is ready.");
} finally {
  await connection.end();
}

export {};
