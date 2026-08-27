/*
 * Migration 0136 — NERP external verification and precise campaign controls.
 * Reservation: migration-reserved-0136
 *
 * Additive and idempotent. It does not create NERP offer ledgers, alter IERS
 * permissions, send email, or modify existing learner records.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0136] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0136] Preparing NERP external verification and campaign controls...");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_external_verification_cases\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`case_key\` VARCHAR(64) NOT NULL,
        \`institutional_account_id\` INT NULL,
        \`user_id\` INT NULL,
        \`candidate_name\` VARCHAR(255) NOT NULL,
        \`candidate_email\` VARCHAR(320) NULL,
        \`provider_name\` VARCHAR(255) NULL,
        \`certificate_reference\` VARCHAR(512) NULL,
        \`source_type\` ENUM('external_provider_certificate','employer_record','manual_admin_attestation','other') NOT NULL DEFAULT 'external_provider_certificate',
        \`status\` ENUM('open','partially_verified','complete','rejected','revoked') NOT NULL DEFAULT 'open',
        \`case_note\` TEXT NULL,
        \`created_by_user_id\` INT NOT NULL,
        \`updated_by_user_id\` INT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`nerp_external_verification_cases_case_key_uq\` (\`case_key\`),
        KEY \`nerp_external_cases_institution_status_idx\` (\`institutional_account_id\`, \`status\`),
        KEY \`nerp_external_cases_candidate_email_idx\` (\`candidate_email\`),
        KEY \`nerp_external_cases_user_idx\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_external_verification_phases\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`case_id\` INT NOT NULL,
        \`phase\` ENUM('phase_2','phase_3') NOT NULL,
        \`status\` ENUM('verified','rejected','revoked') NOT NULL DEFAULT 'rejected',
        \`completed_at\` TIMESTAMP NULL,
        \`evidence_note\` TEXT NULL,
        \`evidence_reference\` VARCHAR(512) NULL,
        \`verified_by_user_id\` INT NULL,
        \`verified_at\` TIMESTAMP NULL,
        \`review_reason\` TEXT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`nerp_external_verification_phases_case_phase_uq\` (\`case_id\`, \`phase\`),
        KEY \`nerp_external_verification_phases_status_idx\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_external_verification_audit_events\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`case_id\` INT NOT NULL,
        \`action\` VARCHAR(96) NOT NULL,
        \`actor_user_id\` INT NULL,
        \`details\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`nerp_external_verification_audit_case_created_idx\` (\`case_id\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_campaign_suppressions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`institutional_account_id\` INT NOT NULL,
        \`match_type\` ENUM('email','exact_name') NOT NULL,
        \`match_value\` VARCHAR(320) NOT NULL,
        \`reason_code\` ENUM('admin_nurse','external_completion','manual','not_registered','identity_correction') NOT NULL,
        \`note\` TEXT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_by_user_id\` INT NULL,
        \`updated_by_user_id\` INT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deactivated_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`nerp_campaign_suppressions_precise_match_uq\` (\`institutional_account_id\`, \`match_type\`, \`match_value\`),
        KEY \`nerp_campaign_suppressions_institution_active_idx\` (\`institutional_account_id\`, \`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`nerp_campaign_suppression_audit_events\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`suppression_id\` INT NOT NULL,
        \`action\` VARCHAR(64) NOT NULL,
        \`actor_user_id\` INT NULL,
        \`details\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`nerp_campaign_suppression_audit_created_idx\` (\`suppression_id\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const seedSuppressions = [
      [3, "email", "thrsmwaniki@yahoo.co.uk", "admin_nurse", "Named admin-nurse suppression requested by platform owner."],
      [3, "exact_name", "esther wairimu mwangi", "identity_correction", "Exact-name suppression. Do not match Esther Mwangi, the Paeds nurse."],
      [3, "exact_name", "annet muthoni kingori", "admin_nurse", "Named admin-nurse suppression requested by platform owner."],
      [3, "exact_name", "emma githaka", "not_registered", "Suppress until the person has a confirmed platform registration."],
    ];
    for (const [institutionId, matchType, matchValue, reasonCode, note] of seedSuppressions) {
      await conn.query(
        `INSERT INTO \`nerp_campaign_suppressions\`
          (\`institutional_account_id\`, \`match_type\`, \`match_value\`, \`reason_code\`, \`note\`, \`is_active\`)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           \`reason_code\` = VALUES(\`reason_code\`),
           \`note\` = VALUES(\`note\`),
           \`is_active\` = 1,
           \`deactivated_at\` = NULL,
           \`updated_at\` = CURRENT_TIMESTAMP`,
        [institutionId, matchType, matchValue, reasonCode, note]
      );
    }

    console.log("[0136] NERP external verification and campaign controls are ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0136] Fatal error:", error);
  process.exit(1);
});
