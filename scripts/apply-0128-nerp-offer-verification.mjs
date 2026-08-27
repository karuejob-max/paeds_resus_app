/**
 * Migration 0128 — NERP ACLS offer, installment ownership, and external phase verification.
 *
 * Additive and idempotent. It does not create learner progress, attendance, or
 * certificate rows. Those remain owned by the existing course/credential flows.
 *
 * Run: pnpm run db:apply-0128
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0128] DATABASE_URL is required.");
  process.exit(1);
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function addColumnIfMissing(conn, table, column, definition) {
  if (await columnExists(conn, table, column)) {
    console.log(`[0128]   ✓ ${table}.${column} already exists -- skipping.`);
    return;
  }
  await conn.query(
    `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
  );
  console.log(`[0128]   + ${table}.${column} added.`);
}

async function main() {
  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log(
      "[0128] Preparing NERP offer and external verification schema..."
    );

    if (!(await tableExists(conn, "payments"))) {
      throw new Error(
        "payments table not found -- refusing to apply schema drift"
      );
    }
    await addColumnIfMissing(
      conn,
      "payments",
      "nerpOfferEnrollmentId",
      "INT NULL"
    );
    await addColumnIfMissing(conn, "payments", "installmentNumber", "INT NULL");
    await addColumnIfMissing(
      conn,
      "payments",
      "nerpLedgerAppliedAt",
      "TIMESTAMP NULL"
    );
    await conn.query(`
      CREATE TABLE IF NOT EXISTS nerp_offer_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        offer_key VARCHAR(64) NOT NULL,
        status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
        total_amount_kes DECIMAL(10,2) NOT NULL DEFAULT 15000.00,
        monthly_installment_kes DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
        installment_count INT NOT NULL DEFAULT 6,
        amount_paid_kes DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        next_installment_number INT NOT NULL DEFAULT 1,
        completed_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY nerp_offer_enrollments_user_offer_uq (user_id, offer_key),
        KEY nerp_offer_enrollments_user_status_idx (user_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS nerp_offer_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nerp_offer_enrollment_id INT NOT NULL,
        enrollment_id INT NOT NULL,
        program_type ENUM('bls', 'acls') NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY nerp_offer_courses_offer_program_uq (nerp_offer_enrollment_id, program_type),
        KEY nerp_offer_courses_enrollment_idx (enrollment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS nerp_offer_external_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nerp_offer_enrollment_id INT NOT NULL,
        phase ENUM('phase_2', 'phase_3') NOT NULL,
        status ENUM('verified', 'rejected', 'revoked') NOT NULL DEFAULT 'rejected',
        completed_at TIMESTAMP NULL,
        evidence_note TEXT,
        evidence_reference VARCHAR(512),
        verified_by_user_id INT,
        verified_at TIMESTAMP NULL,
        review_reason TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY nerp_offer_external_verifications_offer_phase_uq (nerp_offer_enrollment_id, phase),
        KEY nerp_offer_external_verifications_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS nerp_offer_audit_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nerp_offer_enrollment_id INT NOT NULL,
        action VARCHAR(96) NOT NULL,
        actor_user_id INT,
        details TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY nerp_offer_audit_events_offer_created_idx (nerp_offer_enrollment_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[0128] NERP offer and external verification schema is ready.");
  } finally {
    await conn.end();
  }
}

main().catch(error => {
  console.error("[0128] Fatal error:", error);
  process.exit(1);
});
