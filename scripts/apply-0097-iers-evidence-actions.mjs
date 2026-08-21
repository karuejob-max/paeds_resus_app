/**
 * Migration 0097 — IERS evidence and action-closure spine.
 *
 * Run: pnpm run db:apply-0097
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0097] DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_evidence_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        domain ENUM('leadership', 'workforce', 'activation', 'equipment', 'clinical_governance', 'quality_improvement', 'resusgps', 'training') NOT NULL,
        criterion_code VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        evidence_type ENUM('checklist', 'document', 'photo', 'drill', 'activation', 'audit', 'metric', 'attestation', 'external') NOT NULL,
        description TEXT NOT NULL,
        evidence_url TEXT NULL,
        observed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        submitted_by_user_id INT NOT NULL,
        status ENUM('draft', 'submitted', 'accepted', 'rejected', 'expired', 'superseded') NOT NULL DEFAULT 'submitted',
        reviewed_by_user_id INT NULL,
        reviewed_at TIMESTAMP NULL,
        review_note TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY iersEvidenceRecords_institution_domain_idx (institution_id, domain),
        KEY iersEvidenceRecords_institution_criterion_idx (institution_id, criterion_code),
        KEY iersEvidenceRecords_institution_status_idx (institution_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS iers_action_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        source_type ENUM('evidence', 'activation', 'equipment', 'care_signal', 'code_signal', 'incident', 'drill', 'manual') NOT NULL DEFAULT 'manual',
        source_id INT NULL,
        title VARCHAR(255) NOT NULL,
        gap_description TEXT NOT NULL,
        owner_user_id INT NULL,
        priority ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
        status ENUM('open', 'in_progress', 'blocked', 'awaiting_verification', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
        due_date DATE NULL,
        closure_note TEXT NULL,
        closure_evidence_id INT NULL,
        closed_by_user_id INT NULL,
        closed_at TIMESTAMP NULL,
        created_by_user_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY iersActionItems_institution_status_idx (institution_id, status),
        KEY iersActionItems_institution_owner_idx (institution_id, owner_user_id),
        KEY iersActionItems_institution_due_date_idx (institution_id, due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("[0097] IERS evidence and action tables are ready.");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[0097] Fatal error:", error);
  process.exit(1);
});
