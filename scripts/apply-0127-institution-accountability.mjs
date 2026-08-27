/**
 * Migration 0127 — institution accountability, credentials, and Departmental Heads.
 *
 * Run: pnpm run db:apply-0127
 *
 * Additive and idempotent. No application or clinical data is created by this
 * migration; it only creates the tables required for later provider/admin flows.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0127] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0127] Preparing institution accountability schema...");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS professionalCredentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        credentialType ENUM(
          'regulatory_license',
          'paeds_resus_bls_cognitive',
          'paeds_resus_bls_simulation',
          'paeds_resus_bls_provider',
          'external_aha_bls',
          'external_aha_acls',
          'external_aha_pals',
          'external_aha_nrp',
          'external_aha_other'
        ) NOT NULL,
        sourceType ENUM('regulatory', 'paeds_resus', 'external_aha', 'legacy_import') NOT NULL,
        issuer VARCHAR(255) NOT NULL,
        jurisdiction VARCHAR(128),
        cadre VARCHAR(128),
        credentialNumber VARCHAR(255),
        issuedAt TIMESTAMP NULL,
        expiresAt TIMESTAMP NULL,
        status ENUM('pending', 'verified', 'rejected', 'revoked', 'superseded') NOT NULL DEFAULT 'pending',
        evidenceKey VARCHAR(512),
        evidenceFileName VARCHAR(255),
        evidenceContentType VARCHAR(128),
        evidenceSizeBytes INT,
        verifiedByUserId INT,
        verifiedAt TIMESTAMP NULL,
        reviewReason TEXT,
        sourceRecordType VARCHAR(128),
        sourceRecordId INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY professional_credentials_user_idx (userId, status),
        KEY professional_credentials_expiry_idx (status, expiresAt),
        KEY professional_credentials_source_idx (sourceType, sourceRecordType, sourceRecordId),
        UNIQUE KEY professional_credentials_source_record_uq (userId, credentialType, sourceRecordType, sourceRecordId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS professionalCredentialReminderEvents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        credentialId INT NOT NULL,
        userId INT NOT NULL,
        reminderStage ENUM('three_months', 'two_months', 'one_month', 'weekly_overdue') NOT NULL,
        duePeriod DATE NOT NULL,
        channel ENUM('in_app', 'email') NOT NULL,
        deliveryStatus ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
        sentAt TIMESTAMP NULL,
        errorMessage TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY professional_credential_reminder_dedupe_uq (credentialId, reminderStage, duePeriod, channel),
        KEY professional_credential_reminder_user_idx (userId, duePeriod)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionDepartmentHeads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        departmentId INT NOT NULL,
        userId INT NOT NULL,
        assignmentStatus ENUM('active', 'ended') NOT NULL DEFAULT 'active',
        activeAssignmentKey VARCHAR(128),
        assignedByUserId INT NOT NULL,
        assignedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        endedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY institution_department_heads_active_uq (activeAssignmentKey),
        KEY institution_department_heads_department_idx (institutionalAccountId, departmentId, assignmentStatus),
        KEY institution_department_heads_user_idx (institutionalAccountId, userId, assignmentStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS institutionDepartmentHeadEvents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institutionalAccountId INT NOT NULL,
        departmentId INT NOT NULL,
        assignmentId INT NOT NULL,
        eventType ENUM('assigned', 'reassigned', 'ended') NOT NULL,
        previousUserId INT,
        currentUserId INT,
        actorUserId INT NOT NULL,
        note VARCHAR(500),
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY institution_department_head_events_assignment_idx (assignmentId, createdAt),
        KEY institution_department_head_events_institution_idx (institutionalAccountId, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[0127] Institution accountability schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0127] Fatal error:", error);
  process.exit(1);
});
