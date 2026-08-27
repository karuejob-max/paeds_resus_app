/*
 * Migration 0135 — Institutional Life Support Training + facility taxonomy.
 * Reservation: migration-reserved-0135
 *
 * Additive and idempotent. It does not create institution accounts, staff,
 * enrollments, payments, or certificates. Catalog content is created by the
 * idempotent application seeder.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0135] DATABASE_URL is required.");
  process.exit(1);
}

const courseProgramTypes = [
  "bls",
  "acls",
  "pals",
  "fellowship",
  "instructor",
  "fellowship_diploma",
  "heartsaver",
  "nrp",
  "paeds_resus_ils",
];
const enrollmentProgramTypes = courseProgramTypes;
const certificateProgramTypes = [
  ...courseProgramTypes,
  "bls_cognitive",
  "acls_cognitive",
  "pals_cognitive",
  "heartsaver_cognitive",
  "nrp_cognitive",
  "paeds_resus_phase2",
  "paeds_resus_bls_provider",
  "paeds_resus_acls_provider",
  "paeds_resus_pals_provider",
  "paeds_resus_nrp_provider",
];

function enumSql(values) {
  return values.map(value => `'${value}'`).join(", ");
}

async function hasColumn(conn, tableName, columnName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(conn, tableName, columnName, definition) {
  if (await hasColumn(conn, tableName, columnName)) return;
  await conn.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
  );
  console.log(`[0135] Added ${tableName}.${columnName}`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log(
      "[0135] Preparing Institutional Life Support and facility taxonomy schema..."
    );

    await conn.query(
      `ALTER TABLE \`courses\` MODIFY COLUMN \`programType\` ENUM(${enumSql(courseProgramTypes)}) NOT NULL`
    );
    await conn.query(
      `ALTER TABLE \`enrollments\` MODIFY COLUMN \`programType\` ENUM(${enumSql(enrollmentProgramTypes)}) NOT NULL`
    );
    await conn.query(
      `ALTER TABLE \`certificates\` MODIFY COLUMN \`programType\` ENUM(${enumSql(certificateProgramTypes)}) NOT NULL`
    );

    await addColumnIfMissing(
      conn,
      "institutionalAccounts",
      "organizationCategory",
      "VARCHAR(64) NULL AFTER `contactPhone`"
    );
    await addColumnIfMissing(
      conn,
      "institutionalAccounts",
      "facilityOwnership",
      "VARCHAR(64) NULL AFTER `organizationCategory`"
    );
    await addColumnIfMissing(
      conn,
      "institutionalAccounts",
      "facilityCareLevel",
      "VARCHAR(64) NULL AFTER `facilityOwnership`"
    );
    await addColumnIfMissing(
      conn,
      "institutionalAccounts",
      "facilityLocalLevel",
      "VARCHAR(128) NULL AFTER `facilityCareLevel`"
    );
    await addColumnIfMissing(
      conn,
      "payments",
      "institutionalTrainingOrderId",
      "INT NULL AFTER `transactionId`"
    );
    await addColumnIfMissing(
      conn,
      "payments",
      "ilsCredentialRequestId",
      "INT NULL AFTER `institutionalTrainingOrderId`"
    );

    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionalTrainingOrders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        programType ENUM('paeds_resus_ils') NOT NULL,
        providerCount INT NOT NULL,
        amountPerProviderKes INT NOT NULL,
        totalAmountKes INT NOT NULL,
        trainingDate TIMESTAMP NOT NULL,
        paymentStatus ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
        paymentId INT NULL,
        createdByUserId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY institutionalTrainingOrders_account_idx (institutionalAccountId),
        KEY institutionalTrainingOrders_payment_idx (paymentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionalTrainingOrderProviders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId INT NOT NULL,
        institutionalAccountId INT NOT NULL,
        staffMemberId INT NOT NULL,
        userId INT NOT NULL,
        enrollmentId INT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY institutionalTrainingOrderProviders_order_idx (orderId),
        KEY institutionalTrainingOrderProviders_institution_idx (institutionalAccountId),
        KEY institutionalTrainingOrderProviders_user_idx (userId),
        KEY institutionalTrainingOrderProviders_enrollment_idx (enrollmentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ilsCredentialRequests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        enrollmentId INT NOT NULL,
        userId INT NOT NULL,
        credentialType ENUM('bls', 'acls') NOT NULL,
        amountKes INT NOT NULL,
        credentialingDeadline TIMESTAMP NOT NULL,
        status ENUM('payment_pending', 'paid_pending_review', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'payment_pending',
        paymentId INT NULL,
        requestedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        paidAt TIMESTAMP NULL,
        reviewedAt TIMESTAMP NULL,
        reviewedByUserId INT NULL,
        reviewNotes TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY ilsCredentialRequests_enrollment_idx (enrollmentId),
        KEY ilsCredentialRequests_user_idx (userId),
        KEY ilsCredentialRequests_status_idx (status),
        KEY ilsCredentialRequests_payment_idx (paymentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log(
      "[0135] Institutional Life Support and facility taxonomy schema is ready."
    );
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0135] Fatal error:", error);
  process.exit(1);
});
