import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

/**
 * Migration 0119 — versioned IERS shift teams and provider role decisions.
 *
 * This migration adds additive, tenant-scoped records for the planned ERT
 * team. Existing UTL/ERTL roster rows and acceptance state are unchanged;
 * later procedures can link them into a team snapshot deliberately.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0119] DATABASE_URL is required.");
  process.exit(1);
}

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_shift_teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institution_id INT NOT NULL,
      pole_id INT NOT NULL,
      shift_date DATE NOT NULL,
      shift_type ENUM('morning','evening','night') NOT NULL,
      shift_start_time TIME NOT NULL,
      shift_end_time TIME NOT NULL,
      shift_end_day_offset INT NOT NULL DEFAULT 0,
      team_version INT NOT NULL DEFAULT 1,
      status ENUM('draft','published','active','closed','superseded') NOT NULL DEFAULT 'draft',
      created_by_user_id INT NOT NULL,
      published_at TIMESTAMP NULL,
      closed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY iers_shift_teams_institution_shift_idx (institution_id, shift_date, shift_type),
      KEY iers_shift_teams_pole_shift_idx (pole_id, shift_date, shift_type, team_version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0119] iers_shift_teams is ready.");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_shift_role_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_id INT NOT NULL,
      institution_id INT NOT NULL,
      pole_id INT NOT NULL,
      department_id INT NULL,
      provider_user_id INT NOT NULL,
      shift_utl_roster_id INT NULL,
      role_scope ENUM('utl','ertl','ert_member') NOT NULL,
      role_key VARCHAR(64) NOT NULL,
      assignment_status ENUM('proposed','approved','pending_acceptance','accepted','declined','expired','superseded','ended') NOT NULL DEFAULT 'proposed',
      assignment_version INT NOT NULL DEFAULT 1,
      proposed_by_user_id INT NOT NULL,
      approved_by_user_id INT NULL,
      accepted_at TIMESTAMP NULL,
      declined_at TIMESTAMP NULL,
      decline_reason VARCHAR(500) NULL,
      superseded_at TIMESTAMP NULL,
      ended_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY iers_shift_role_assignments_team_provider_idx (team_id, provider_user_id),
      KEY iers_shift_role_assignments_institution_provider_idx (institution_id, provider_user_id, assignment_status),
      KEY iers_shift_role_assignments_team_role_idx (team_id, role_scope, role_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0119] iers_shift_role_assignments is ready.");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_shift_role_recommendations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id INT NOT NULL,
      team_id INT NOT NULL,
      institution_id INT NOT NULL,
      requested_by_user_id INT NOT NULL,
      requested_role_key VARCHAR(64) NOT NULL,
      reason VARCHAR(1000) NOT NULL,
      status ENUM('pending','approved','declined','withdrawn') NOT NULL DEFAULT 'pending',
      decided_by_user_id INT NULL,
      decision_note VARCHAR(1000) NULL,
      decided_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY iers_shift_role_recommendations_assignment_status_idx (assignment_id, status),
      KEY iers_shift_role_recommendations_team_status_idx (team_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0119] iers_shift_role_recommendations is ready.");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_shift_role_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id INT NOT NULL,
      team_id INT NOT NULL,
      institution_id INT NOT NULL,
      actor_user_id INT NULL,
      event_type VARCHAR(64) NOT NULL,
      from_status VARCHAR(64) NULL,
      to_status VARCHAR(64) NULL,
      from_role_key VARCHAR(64) NULL,
      to_role_key VARCHAR(64) NULL,
      reason TEXT NULL,
      metadata TEXT NULL,
      occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY iers_shift_role_events_assignment_occurred_idx (assignment_id, occurred_at),
      KEY iers_shift_role_events_institution_occurred_idx (institution_id, occurred_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0119] iers_shift_role_events is ready.");

  console.log("[0119] IERS shift-team role schema is ready.");
} finally {
  await conn.end();
}
