/*
 * Migration 0131 — Intern Emergency Readiness Program (IERP) programme spine.
 * Reservation: migration-reserved-0131
 *
 * Run: pnpm run db:apply-0131
 *
 * Additive and idempotent. It creates no learner, payment, institutional,
 * clinical, or email records. Promotional email sending is not part of this
 * migration or any default application path.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0131] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0131] Preparing IERP programme schema...");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpProgramEnrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        programKey ENUM('ierp') NOT NULL DEFAULT 'ierp',
        designation ENUM('noi', 'coi_bsc', 'coi_diploma', 'moi') NOT NULL,
        cohortCode VARCHAR(128) NULL,
        cohortName VARCHAR(255) NULL,
        lifecycleStatus ENUM('active', 'completed', 'withdrawn') NOT NULL DEFAULT 'active',
        phaseStatus ENUM('phase_1', 'phase_2', 'phase_3', 'completed') NOT NULL DEFAULT 'phase_1',
        phase1Status ENUM('not_started', 'in_progress', 'submitted', 'verified', 'rejected') NOT NULL DEFAULT 'not_started',
        phase1VerifiedAt TIMESTAMP NULL,
        phase2CompletedAt TIMESTAMP NULL,
        phase3CompletedAt TIMESTAMP NULL,
        totalPaidAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        paymentStatus ENUM('not_required', 'pending', 'partial', 'paid_in_full', 'locked') NOT NULL DEFAULT 'pending',
        paymentLockoutAt TIMESTAMP NULL,
        enrolledAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ierp_program_enrollments_user_program_uq (userId, programKey),
        KEY ierp_program_enrollments_user_status_idx (userId, lifecycleStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpPhase1Evidence (
        id INT AUTO_INCREMENT PRIMARY KEY,
        programEnrollmentId INT NOT NULL,
        userId INT NOT NULL,
        documentType ENUM('video_prework', 'precourse_assessment') NOT NULL,
        storageKey VARCHAR(512) NOT NULL,
        fileName VARCHAR(255) NOT NULL,
        contentType VARCHAR(128) NOT NULL,
        fileSizeBytes INT NOT NULL,
        status ENUM('submitted', 'verified', 'rejected') NOT NULL DEFAULT 'submitted',
        submittedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewedByUserId INT NULL,
        reviewedAt TIMESTAMP NULL,
        reviewReason TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ierp_phase1_evidence_enrollment_document_uq (programEnrollmentId, documentType),
        KEY ierp_phase1_evidence_user_status_idx (userId, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpPayments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        programEnrollmentId INT NOT NULL,
        userId INT NOT NULL,
        amountKsh INT NOT NULL,
        phase ENUM('phase_1', 'phase_2', 'phase_3', 'general') NOT NULL DEFAULT 'general',
        paymentMethod ENUM('mpesa', 'bank_transfer', 'card') NOT NULL,
        checkoutRequestId VARCHAR(255) NULL,
        providerReference VARCHAR(255) NULL,
        idempotencyKey VARCHAR(255) NULL,
        mpesaReceiptNumber VARCHAR(50) NULL,
        phoneNumber VARCHAR(20) NULL,
        status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
        failureReason TEXT NULL,
        reconciledAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ierp_payments_checkout_uq (checkoutRequestId),
        UNIQUE KEY ierp_payments_idempotency_uq (idempotencyKey),
        UNIQUE KEY ierp_payments_receipt_uq (mpesaReceiptNumber),
        KEY ierp_payments_user_status_idx (userId, status),
        KEY ierp_payments_program_status_idx (programEnrollmentId, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpEmailCampaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        programKey ENUM('ierp') NOT NULL DEFAULT 'ierp',
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        templateVersion VARCHAR(64) NOT NULL,
        audienceFilterJson TEXT NOT NULL,
        scheduleState ENUM('draft', 'paused') NOT NULL DEFAULT 'draft',
        sendingEnabled BOOLEAN NOT NULL DEFAULT FALSE,
        createdByUserId INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpEmailPreferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        programKey ENUM('ierp') NOT NULL DEFAULT 'ierp',
        consentStatus ENUM('unknown', 'opted_in', 'opted_out') NOT NULL DEFAULT 'unknown',
        consentSource VARCHAR(128) NULL,
        consentedAt TIMESTAMP NULL,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY ierp_email_preferences_user_program_uq (userId, programKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpEmailSuppressions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(320) NOT NULL,
        reason ENUM('unsubscribe', 'hard_bounce', 'manual') NOT NULL,
        suppressedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdByUserId INT NULL,
        UNIQUE KEY ierp_email_suppression_email_uq (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpEmailAttributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaignId INT NOT NULL,
        userId INT NULL,
        eventType ENUM('previewed', 'clicked', 'registered', 'paid', 'completed') NOT NULL,
        attributionKey VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY ierp_email_attributions_key_uq (attributionKey),
        KEY ierp_email_attributions_campaign_event_idx (campaignId, eventType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ierpEmailAuditLog (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaignId INT NULL,
        actorUserId INT NOT NULL,
        action ENUM('created', 'updated', 'paused', 'previewed', 'send_blocked', 'consent_updated', 'suppressed') NOT NULL,
        detailJson TEXT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY ierp_email_audit_campaign_idx (campaignId, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[0131] IERP programme schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0131] Fatal error:", error);
  process.exit(1);
});
