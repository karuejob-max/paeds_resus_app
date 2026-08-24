import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0121] DATABASE_URL is required.");
  process.exit(1);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_activation_team_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      activation_event_id INT NOT NULL,
      team_id INT NOT NULL,
      team_version INT NOT NULL,
      institution_id INT NOT NULL,
      pole_id INT NOT NULL,
      department_id INT NOT NULL,
      provider_user_id INT NOT NULL,
      role_scope ENUM('utl','ertl','ert_member') NOT NULL,
      role_key VARCHAR(64) NOT NULL,
      assignment_status VARCHAR(32) NOT NULL,
      snapshotted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY iers_activation_team_snapshots_provider_unique (activation_event_id, provider_user_id, role_key),
      KEY iers_activation_team_snapshots_activation_idx (activation_event_id, team_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_targeted_role_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      activation_event_id INT NOT NULL,
      team_id INT NOT NULL,
      assignment_id INT NOT NULL,
      role_snapshot_id INT NOT NULL,
      institution_id INT NOT NULL,
      pole_id INT NOT NULL,
      department_id INT NOT NULL,
      provider_user_id INT NOT NULL,
      idempotency_key VARCHAR(128) NOT NULL,
      role_at_event VARCHAR(64) NOT NULL,
      report_phase ENUM('recognition','activation','response','stabilization','recovery_debrief') NOT NULL,
      observation_code VARCHAR(96) NOT NULL,
      timing_category VARCHAR(64) NULL,
      narrative VARCHAR(2000) NULL,
      no_patient_identifiers_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
      submission_state ENUM('submitted','accepted','returned','superseded') NOT NULL DEFAULT 'submitted',
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      superseded_by_report_id INT NULL,
      KEY iers_targeted_role_reports_activation_submitted_idx (activation_event_id, submitted_at),
      KEY iers_targeted_role_reports_provider_submitted_idx (provider_user_id, submitted_at),
      UNIQUE KEY iers_targeted_role_reports_idempotency_unique (provider_user_id, idempotency_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0121] Activation snapshots and targeted role reports are ready.");
} finally {
  await conn.end();
}
